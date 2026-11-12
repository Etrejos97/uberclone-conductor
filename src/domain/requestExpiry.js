import { REQUEST_TIMEOUT_S, STALE_REQUEST_S } from '../config/app';

// Al empezar a escuchar: decide si una solicitud que ya estaba esperando
// venció antes de que Inicio la viera. Recibe milisegundos.
// - createdHereAt: la hora en que este teléfono la creó, o null si vino de otro
//   lado (el backend u otro teléfono).
// - createdAt: la hora del servidor, o null mientras Firestore no la confirma.
// Si la creó este teléfono, comparo con su propio reloj y le doy los 15 s. Si no,
// la hora es del servidor y el reloj del teléfono puede estar corrido; además,
// abrir la app desde la notificación toma unos segundos. Por eso le doy más
// margen: una solicitud que pasa esta revisión igual tiene 15 s desde que aparece.
export function expiredBeforeArrival({ createdHereAt, createdAt, now }) {
  if (createdHereAt != null) return now - createdHereAt > REQUEST_TIMEOUT_S * 1000;
  if (createdAt == null) return false;
  return now - createdAt > STALE_REQUEST_S * 1000;
}