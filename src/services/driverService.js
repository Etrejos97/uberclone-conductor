import {
  collection,
  doc,
  getDocFromServer,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
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
      approvalStatus: 'pending', 
      isAvailable: false,
      location: null,
      fcmToken: null,
      commissionRateAccepted: COMMISSION_RATE, // El porcentaje que vio al aceptar
      termsAcceptedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
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
// en Firestore sin nadie detrás.
export async function setUnavailableBeforeLogout(driverId) {
  await withTimeout(setAvailability(driverId, false));
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