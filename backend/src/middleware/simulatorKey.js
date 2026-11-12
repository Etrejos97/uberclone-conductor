const { createHash, timingSafeEqual } = require('node:crypto');
const { ApiError } = require('./errorHandler');

// Comparo los hashes y no los textos: timingSafeEqual exige dos valores del mismo
// largo, y así no revelo el largo de la llave ni dónde deja de coincidir.
function hash(text) {
  return createHash('sha256').update(text).digest();
}

// La URL de Render es pública. Sin esta cabecera cualquiera podría crear viajes en
// Firestore con firebase-admin, que no pasa por las reglas.
function requireSimulatorKey(req, res, next) {
  const expected = process.env.SIMULATOR_KEY;
  const given = req.get('X-Simulator-Key');
  if (!expected || typeof given !== 'string' || !timingSafeEqual(hash(given), hash(expected))) {
    next(new ApiError(401, 'INVALID_SIMULATOR_KEY', 'Falta la llave del simulador o no es válida.'));
    return;
  }
  next();
}

module.exports = { requireSimulatorKey };