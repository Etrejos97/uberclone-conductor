const { cert, initializeApp } = require('firebase-admin/app');
const { FieldValue, getFirestore } = require('firebase-admin/firestore');
const { getMessaging: messagingOf } = require('firebase-admin/messaging');

let app = null;
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

// Inicializo en el primer uso: así /health responde aunque Firestore tenga un problema.
// Firestore y las notificaciones comparten la misma app: inicializarla dos veces falla.
function getApp() {
  if (!app) app = initializeApp({ credential: cert(readServiceAccount()) });
  return app;
}

function getDb() {
  if (!db) db = getFirestore(getApp());
  return db;
}

// Firebase Cloud Messaging, con la misma cuenta de servicio.
function getMessaging() {
  return messagingOf(getApp());
}

module.exports = { FieldValue, getDb, getMessaging };