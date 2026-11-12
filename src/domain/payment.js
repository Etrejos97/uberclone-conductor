import { RATINGS } from '../config/app';
import { TRIP_STATUS } from './tripStateMachine';

const PAYMENT_STATUSES = ['approved', 'pending', 'rejected', 'cash'];

// Los códigos del contrato del backend que tienen un mensaje propio en la app.
const KNOWN_API_ERRORS = [
  'TRIP_NOT_FOUND',
  'TRIP_NOT_COMPLETED',
  'TRIP_ALREADY_PAID',
  'TRIP_NOT_MERCADOPAGO',
  'AMOUNT_MISMATCH',
  'PAYMENT_IN_PROCESS',
];

// Lo que paga el pasajero. La propina va completa al conductor.
export function amountToCharge(trip) {
  return trip.fare + trip.tip;
}

// El estado que muestra Cobro. Un viaje sin cobrar todavía está pendiente.
export function paymentStatusKey(trip) {
  return PAYMENT_STATUSES.includes(trip.paymentStatus) ? trip.paymentStatus : 'pending';
}

// Si Mercado Pago rechazó el pago, el pasajero puede pagar en efectivo. Con un
// pago pendiente no, porque el checkout sigue abierto y se podría cobrar dos veces.
export function canSwitchToCash(trip) {
  return (
    trip.status === TRIP_STATUS.COMPLETED &&
    trip.paymentMethod === 'mercadopago' &&
    trip.paymentStatus === 'rejected'
  );
}

// Un 4xx se traduce por su código. Un 5xx, la red o un código
// que la app no conoce terminan en el mismo mensaje general.
export function apiErrorKey(error) {
  return KNOWN_API_ERRORS.includes(error?.code) ? `errors.api.${error.code}` : 'errors.apiFailed';
}

export function isValidRating(value) {
  return RATINGS.includes(value);
}