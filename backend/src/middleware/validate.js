const { ApiError } = require('./errorHandler');

// Estos valores terminan en una ruta de Firestore o en la URL de Mercado Pago, así
// que solo acepto los caracteres que esos identificadores usan de verdad.
function isDocumentId(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
}

function isTripId(value) {
  return isDocumentId(value);
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

// RN-05: todo el dinero son pesos enteros.
function requireAmount(body) {
  if (!Number.isInteger(body?.amount) || body.amount <= 0) {
    throw new ApiError(400, 'INVALID_REQUEST', 'El monto debe ser un número entero de pesos.');
  }
  return body.amount;
}

// Los mismos valores que ofrece el formulario del Cliente simulado.
const CATEGORIES = ['economy', 'xl', 'premium'];
const PAYMENT_METHODS = ['mercadopago', 'cash'];

function invalid(message) {
  return new ApiError(400, 'INVALID_REQUEST', message);
}

function isBetween(value, min, max) {
  return Number.isFinite(value) && value >= min && value <= max;
}

// Copio solo los tres campos: con firebase-admin, lo que venga de más en el cuerpo
// terminaría guardado en el viaje.
function requirePlace(place, name) {
  const valid =
    isBetween(place?.latitude, -90, 90) &&
    isBetween(place?.longitude, -180, 180) &&
    typeof place.label === 'string' &&
    place.label.trim().length > 0 &&
    place.label.length <= 120;
  if (!valid) throw invalid(`El ${name} debe traer latitude, longitude y label.`);
  return { latitude: place.latitude, longitude: place.longitude, label: place.label.trim() };
}

// El cuerpo de POST /trips/simulate, con las reglas del formulario del
// Cliente simulado (validateSimulatedTrip en la app).
function requireSimulatedTrip(body) {
  if (!isDocumentId(body?.driverId)) throw invalid('Falta el conductor o no es válido.');
  const origin = requirePlace(body.origin, 'origen');
  const destination = requirePlace(body.destination, 'destino');
  if (origin.latitude === destination.latitude && origin.longitude === destination.longitude) {
    throw invalid('El destino debe ser distinto al origen.');
  }
  if (!CATEGORIES.includes(body.category)) throw invalid('La categoría no es válida.');
  if (!PAYMENT_METHODS.includes(body.paymentMethod)) throw invalid('El método de pago no es válido.');
  // RN-05: pesos enteros. Sin propina, 0.
  if (!Number.isSafeInteger(body.tip) || body.tip < 0) throw invalid('La propina debe ser un número entero de pesos.');
  return {
    driverId: body.driverId,
    origin,
    destination,
    category: body.category,
    paymentMethod: body.paymentMethod,
    tip: body.tip,
  };
}

module.exports = { isPaymentId, isTripId, requireAmount, requireSimulatedTrip, requireTripId };