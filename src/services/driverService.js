import {
  collection,
  doc,
  getDocFromServer,
  getDocsFromServer,
  limit,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { COMMISSION_RATE } from '../config/pricing';
import { withTimeout } from './withTimeout';

const drivers = collection(db, 'drivers');

// El id del conductor se genera en el teléfono antes de escribir y se conserva
// entre reintentos. Antes de reintentar uso driverExists: si el conductor ya
// existe, no llamo otra vez a createDriver, porque escribir de nuevo el mismo
// id es una actualización que cambia createdAt y las reglas la rechazan.
export function newDriverId() {
  return doc(drivers).id;
}

// Ingreso con la cédula: el id del conductor con ese documento, o null. Le
// pregunto al servidor y no a la caché, para no responder «no existe» solo
// porque este teléfono nunca lo descargó. Una sola igualdad: no pide índice.
export async function findDriverIdByDocument(documentNumber) {
  const found = await withTimeout(
    getDocsFromServer(query(drivers, where('documentNumber', '==', documentNumber), limit(1)))
  );
  return found.empty ? null : found.docs[0].id;
}

// Crea el conductor en estado pendiente. Su id pasa a ser la sesión
// del teléfono.
// `profile` es el documento ya armado con lo que escribió el conductor:
// fullName, documentNumber, phone, email, gender, birthDate, photoUrl, vehicle,
// documents y mercadoPagoEmail (Diseño, sección 6). Las fotos van como URL de
// Cloudinary, no como la ruta local del teléfono. Los campos del sistema los
// pongo aquí, después del spread, para que `profile` no los pise: las reglas
// exigen approvalStatus 'pending' al crear. El saldo no se guarda: Ganancias lo
// calcula con los viajes pagados.
export async function createDriver(driverId, profile) {
  await withTimeout(
    setDoc(doc(drivers, driverId), {
      ...profile,
      approvalStatus: 'pending', // RF-04
      isAvailable: false,
      location: null,
      fcmToken: null,
      commissionRateAccepted: COMMISSION_RATE, // VA-20: el porcentaje que vio al aceptar
      termsAcceptedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  );
}

// Editar contacto. `changes` son solo los campos de toContactUpdate:
// las reglas de Firestore no dejan que un conductor aprobado cambie otros sin
// volver a revisión. Repetirlo escribe lo mismo, así que después de un tiempo
// límite el conductor puede volver a guardar sin riesgo.
export async function updateDriverProfile(driverId, changes) {
  await withTimeout(updateDoc(doc(drivers, driverId), { ...changes, updatedAt: serverTimestamp() }));
}

// Renovar documentos, o corregir un registro sin aprobar, devuelve la cuenta a
// revisión: queda pendiente y No disponible hasta que el aprobador la revise.
// Es la única escritura de la app que toca approvalStatus, y las reglas solo la
// dejan pasar a 'pending'.
export async function submitForReview(driverId, changes) {
  await withTimeout(
    updateDoc(doc(drivers, driverId), {
      ...changes,
      approvalStatus: 'pending',
      isAvailable: false,
      updatedAt: serverTimestamp(),
    })
  );
}

// Pregunta al servidor, no a la caché, si el conductor ya quedó guardado. Sirve
// en un reintento: una escritura que pasó del tiempo límite pudo llegar después.
// También la uso si createDriver falla con permission-denied después de un
// timeout: el conductor probablemente ya existe. Si esta función lanza un error
// (también el 'timeout'), no sé si existe y no lo tomo como "no existe".
export async function driverExists(driverId) {
  const snapshot = await withTimeout(getDocFromServer(doc(drivers, driverId)));
  return snapshot.exists();
}

// Estas dos escrituras no llevan tiempo límite: sin red, el SDK
// las deja en cola y las manda al volver la conexión, y la pantalla ya muestra
// el valor nuevo porque la escucha del conductor lee la caché.
export async function setAvailability(driverId, isAvailable) {
  await updateDoc(doc(drivers, driverId), { isAvailable, updatedAt: serverTimestamp() });
}

// Al cerrar sesión sí espero la respuesta: si la app se cierra antes de que
// vuelva la red, la escritura en cola se pierde y el conductor queda Disponible
// en Firestore sin nadie detrás. En la misma escritura suelto el token de FCM:
// otro conductor puede ingresar en este teléfono, y las notificaciones de este ya
// no son para él.
export async function setUnavailableBeforeLogout(driverId) {
  await withTimeout(
    updateDoc(doc(drivers, driverId), { isAvailable: false, fcmToken: null, updatedAt: serverTimestamp() })
  );
}

// El token de FCM al que el backend manda las solicitudes. Sin tiempo
// límite, igual que la disponibilidad: sin red, la escritura queda en cola. Si
// otro conductor ingresa en el mismo teléfono, los dos guardan el mismo token;
// el backend solo avisa al que está Disponible, y cerrar sesión borra el token.
// null también lo borra, cuando el conductor quita el permiso.
export async function saveFcmToken(driverId, fcmToken) {
  await updateDoc(doc(drivers, driverId), { fcmToken, updatedAt: serverTimestamp() });
}

// CRUD, borrar: el conductor elimina su cuenta. Solo estando No disponible,
// igual que en la regla de Firestore. Si ya no existe, un intento anterior la
// borró después del tiempo límite. Sus viajes y sus fotos de Cloudinary quedan
// (riesgo aceptado en el diseño, §11).
export async function deleteDriver(driverId) {
  const ref = doc(drivers, driverId);
  await withTimeout(
    runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists()) return;
      if (snapshot.data().isAvailable) {
        const error = new Error('El conductor está Disponible');
        error.code = 'DRIVER_AVAILABLE';
        throw error;
      }
      transaction.delete(ref);
    })
  );
}

export async function updateLocation(driverId, { latitude, longitude }) {
  await updateDoc(doc(drivers, driverId), {
    location: { latitude, longitude, updatedAt: serverTimestamp() },
  });
}

// Escucha el documento del conductor en tiempo real. `onChange` recibe el
// conductor (o null si no existe) y si el dato viene de la caché del teléfono.
// Devuelve la función que corta la escucha, para el return del useEffect.
export function subscribeToDriver(driverId, onChange, onError) {
  return onSnapshot(
    doc(drivers, driverId),
    (snapshot) => {
      const driver = snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
      onChange(driver, snapshot.metadata.fromCache);
    },
    onError
  );
}