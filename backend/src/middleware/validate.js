const { ApiError } = require('./errorHandler');

// Estos valores terminan en una ruta de Firestore o en la URL de Mercado Pago, así
// que solo acepto los caracteres que esos identificadores usan de verdad.
function isTripId(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
}

function isPaymentId(value) {
  return /^\d{1,30}$/.test(String(value ?? ''));
}

function requireTripId(body) {
  if (!isTripId(body?.tripId)) {
    throw new ApiError(400, 'INVALID_REQUEST', 'Falta el viaje o no es válido.');
  }
  return body.tripId;
}

// Todo el dinero son pesos enteros.
function requireAmount(body) {
  if (!Number.isInteger(body?.amount) || body.amount <= 0) {
    throw new ApiError(400, 'INVALID_REQUEST', 'El monto debe ser un número entero de pesos.');
  }
  return body.amount;
}

module.exports = { isPaymentId, isTripId, requireAmount, requireTripId };