import {
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  startAfter,
  where,
} from 'firebase/firestore';
import { HISTORY_PAGE_SIZE } from '../config/app';
import { db } from '../config/firebase';
import { canSwitchToCash, isValidRating } from '../domain/payment';
import { canTransition, OPEN_STATUSES, TRIP_STATUS } from '../domain/tripStateMachine';
import { withTimeout } from './withTimeout';

const trips = collection(db, 'trips');

// La marca de tiempo que escribe cada transición (sección 6 del diseño).
const TIMESTAMP_FIELD = {
  accepted: 'acceptedAt',
  rejected: 'rejectedAt',
  in_progress: 'startedAt',
  completed: 'completedAt',
  paid: 'paidAt',
  cancelled: 'cancelledAt',
};

function toTrip(snapshot) {
  // Con 'estimate', un createdAt que todavía no confirma el servidor trae la
  // hora del teléfono en vez de null.
  const data = snapshot.data({ serverTimestamps: 'estimate' });
  return {
    id: snapshot.id,
    ...data,
    createdAt: data.createdAt?.toDate() ?? null,
    completedAt: data.completedAt?.toDate() ?? null,
  };
}

// El id del viaje se genera en el teléfono antes de escribir, igual que el del
// conductor: un reintento escribe el mismo documento en vez de crear otro.
export function newTripId() {
  return doc(trips).id;
}

// Hora del teléfono en que este teléfono creó cada viaje. Inicio la usa en vez
// del createdAt del servidor para saber si una solicitud ya venció: si el reloj
// del teléfono va adelantado, compararlo con la hora del servidor rechazaría
// solicitudes recién creadas.
const createdHere = new Map();

export function createdHereAt(tripId) {
  return createdHere.get(tripId) ?? null;
}

// El cliente simulado crea la solicitud. Todos los campos que se llenan
// después van en null desde ahora, para que el documento tenga siempre la forma
// del modelo de datos.
export async function createTrip(tripId, { driverId, origin, destination, category, paymentMethod, tip }) {
  const ref = doc(trips, tripId);
  if (!createdHere.has(tripId)) createdHere.set(tripId, Date.now());
  await withTimeout(
    setDoc(ref, {
      driverId,
      status: TRIP_STATUS.REQUESTED,
      source: 'simulator',
      origin,
      destination,
      category,
      paymentMethod,
      tip,
      route: null,
      pickupRoute: null,
      estimate: null,
      fare: null,
      commission: null,
      driverEarnings: null,
      commissionRate: null,
      // La regla de creación compara paymentStatus con null: si el campo no
      // existe, la regla falla y Firestore niega la escritura.
      paymentStatus: null,
      rating: null,
      createdAt: serverTimestamp(),
    })
  );
}

// Estado del viaje según el servidor, no la caché, o null si no existe. Sirve
// después de un tiempo límite: la escritura pudo llegar aunque la promesa no
// respondiera a tiempo.
export async function getTripStatusFromServer(tripId) {
  const snapshot = await withTimeout(getDocFromServer(doc(trips, tripId)));
  return snapshot.exists() ? snapshot.data().status : null;
}

// Solicitudes pendientes del conductor, de la más antigua a la más nueva. La
// consulta solo usa igualdades y no necesita índice; ordeno aquí.
export function subscribeToRequests(driverId, onChange, onError) {
  const requests = query(trips, where('driverId', '==', driverId), where('status', '==', TRIP_STATUS.REQUESTED));
  return onSnapshot(
    requests,
    (snapshot) => {
      const list = snapshot.docs.map(toTrip);
      list.sort((a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0));
      onChange(list);
    },
    onError
  );
}

// Viajes abiertos del conductor, del más antiguo al más nuevo: si dos quedaron
// aceptados, atiende primero el que aceptó antes. Un viaje sale de aquí cuando
// lo califican, y antes de pagarse `rating` siempre es null. Igualdades más `in`:
// la consulta no necesita índice compuesto.
export function subscribeToActiveTrips(driverId, onChange, onError) {
  const active = query(
    trips,
    where('driverId', '==', driverId),
    where('status', 'in', OPEN_STATUSES),
    where('rating', '==', null)
  );
  return onSnapshot(
    active,
    (snapshot) => {
      const list = snapshot.docs.map(toTrip);
      list.sort((a, b) => (a.acceptedAt?.toMillis() ?? 0) - (b.acceptedAt?.toMillis() ?? 0));
      onChange(list);
    },
    onError
  );
}

// Guarda la ruta y la tarifa estimada solo si el viaje sigue esperando y nadie
// la guardó antes. Devuelve false si no escribió.
export async function saveEstimate(tripId, route, estimate) {
  const ref = doc(trips, tripId);
  return withTimeout(
    runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists()) return false;
      const trip = snapshot.data();
      if (trip.status !== TRIP_STATUS.REQUESTED || trip.estimate) return false;
      transaction.update(ref, { route, estimate });
      return true;
    })
  );
}

// `current` es el estado en que estaba el viaje, o null si no existe.
function conflict(message, current) {
  const error = new Error(message);
  error.code = 'TRIP_STATE_CONFLICT';
  error.current = current;
  return error;
}

export function isTripConflict(error) {
  return error?.code === 'TRIP_STATE_CONFLICT';
}

// y sección 7 del diseño: cada cambio de estado lee el viaje dentro de una
// transacción y solo escribe si sigue en `from`. Si el temporizador rechaza y el
// conductor acepta en el mismo segundo, la segunda transacción falla sin escribir.
export async function transition(tripId, from, to, changes = {}) {
  if (!canTransition(from, to)) throw new Error(`Transición no permitida: ${from} → ${to}`);
  const ref = doc(trips, tripId);
  return withTimeout(
    runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists()) throw conflict(`El viaje ${tripId} no existe`, null);
      const current = snapshot.data().status;
      if (current !== from) throw conflict(`El viaje está en ${current}, no en ${from}`, current);
      const update = { ...changes, status: to };
      if (TIMESTAMP_FIELD[to]) update[TIMESTAMP_FIELD[to]] = serverTimestamp();
      transaction.update(ref, update);
    })
  );
}

// El pasajero pagó en la mano. El viaje queda pagado con
// paymentStatus 'cash', y el saldo de Ganancias resta su comisión (computeBalance).
export function markCashPaid(tripId) {
  return payInCash(tripId, (trip) => trip.paymentMethod === 'cash', 'Este viaje no se cobra en efectivo');
}

// Mercado Pago rechazó el pago y el pasajero paga en la mano. El viaje pasa a
// efectivo en la misma escritura que lo deja pagado, porque las reglas solo dejan
// escribir paymentStatus 'cash'.
export function switchToCashPaid(tripId) {
  return payInCash(tripId, canSwitchToCash, 'El pago con Mercado Pago no está rechazado');
}

async function payInCash(tripId, allowed, notAllowedMessage) {
  const ref = doc(trips, tripId);
  return withTimeout(
    runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists()) throw conflict(`El viaje ${tripId} no existe`, null);
      const trip = snapshot.data();
      if (trip.status !== TRIP_STATUS.COMPLETED) {
        throw conflict(`El viaje está en ${trip.status}, no en ${TRIP_STATUS.COMPLETED}`, trip.status);
      }
      if (!allowed(trip)) throw conflict(notAllowedMessage, trip.status);
      transaction.update(ref, {
        status: TRIP_STATUS.PAID,
        paymentMethod: 'cash',
        paymentStatus: 'cash',
        [TIMESTAMP_FIELD.paid]: serverTimestamp(),
      });
    })
  );
}

// El pasajero califica una sola vez, y solo después de pagar.
export async function rateTrip(tripId, rating) {
  if (!isValidRating(rating)) throw new Error(`Calificación no válida: ${rating}`);
  const ref = doc(trips, tripId);
  return withTimeout(
    runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists()) throw conflict(`El viaje ${tripId} no existe`, null);
      const trip = snapshot.data();
      if (trip.status !== TRIP_STATUS.PAID) throw conflict(`El viaje está en ${trip.status}`, trip.status);
      // Un intento anterior pasó del tiempo límite y sí llegó: no lo vuelvo a escribir.
      if (trip.rating !== null) return;
      transaction.update(ref, { rating });
    })
  );
}

// Todos los viajes pagados del conductor, en tiempo real. De ellos
// salen los resúmenes y el saldo, así que borrar o corregir un viaje en la consola
// cambia Ganancias al instante. Solo usa igualdades: no necesita índice compuesto.
export function subscribeToPaidTrips(driverId, onChange, onError) {
  const paid = query(trips, where('driverId', '==', driverId), where('status', '==', TRIP_STATUS.PAID));
  return onSnapshot(paid, (snapshot) => onChange(snapshot.docs.map(toTrip)), onError);
}

// Una página del historial, del viaje más reciente al más antiguo.
// `range` es { start, end } con end exclusivo y `paymentMethod` 'cash' o
// 'mercadopago'; los dos son opcionales. `after` es el último documento de la
// página anterior. Si la página llegó llena, puede haber más.
export async function getHistoryPage(driverId, { range = null, paymentMethod = null, after = null } = {}) {
  const constraints = [where('driverId', '==', driverId), where('status', '==', TRIP_STATUS.PAID)];
  if (paymentMethod) constraints.push(where('paymentMethod', '==', paymentMethod));
  if (range) constraints.push(where('completedAt', '>=', range.start), where('completedAt', '<', range.end));
  constraints.push(orderBy('completedAt', 'desc'));
  if (after) constraints.push(startAfter(after));
  constraints.push(limit(HISTORY_PAGE_SIZE));

  const snapshot = await withTimeout(getDocs(query(trips, ...constraints)));
  return {
    trips: snapshot.docs.map(toTrip),
    last: snapshot.docs[snapshot.docs.length - 1] ?? null,
    hasMore: snapshot.docs.length === HISTORY_PAGE_SIZE,
  };
}

// Un viaje del historial, o null si no existe.
export async function getTrip(tripId) {
  const snapshot = await withTimeout(getDoc(doc(trips, tripId)));
  return snapshot.exists() ? toTrip(snapshot) : null;
}