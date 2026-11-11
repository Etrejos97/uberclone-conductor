const { cert, getApps, initializeApp } = require('firebase-admin/app');
const { FieldValue, getFirestore } = require('firebase-admin/firestore');

let db = null;

function readServiceAccount() {
  try {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch {
    // El error de JSON.parse copia un pedazo del texto, y aquí ese texto es la llave
    // privada. Por eso lo cambio por uno que no lo repite.
    throw new Error('FIREBASE_SERVICE_ACCOUNT no es un JSON válido');
  }
}

// El arranque la llama para que un JSON mal pegado haga fallar el despliegue de una vez,
// en lugar de descubrirse en el primer cobro. No inicializa Firebase.
function checkServiceAccount() {
  readServiceAccount();
}

// Inicializo en el primer uso: así /health responde aunque Firestore tenga un problema.
// Si un intento anterior dejó la app creada, la reuso en vez de crearla otra vez.
function getDb() {
  if (!db) {
    if (getApps().length === 0) initializeApp({ credential: cert(readServiceAccount()) });
    db = getFirestore();
  }
  return db;
}

module.exports = { FieldValue, checkServiceAccount, getDb };