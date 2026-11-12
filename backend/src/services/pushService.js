const firebaseAdmin = require('./firebaseAdmin');

// El canal de Android que crea la app (notificationService.js).
const REQUESTS_CHANNEL = 'requests';
// La solicitud vence a los 15 s. Si el teléfono está apagado más tiempo, FCM
// descarta la notificación en vez de entregar una solicitud vencida.
const REQUEST_TTL_MS = 15000;
// FCM responde esto cuando el token ya no sirve: la app se desinstaló o el
// conductor borró sus datos.
const STALE_TOKEN = new Set(['messaging/registration-token-not-registered', 'messaging/invalid-registration-token']);

function requestMessage(token, tripId, origin, destination) {
  return {
    token,
    notification: { title: 'Nueva solicitud de viaje', body: `${origin.label} → ${destination.label}` },
    data: { tripId },
    android: { priority: 'high', ttl: REQUEST_TTL_MS, notification: { channelId: REQUESTS_CHANNEL } },
  };
}

// Borro el token solo si sigue siendo el mismo: la app pudo guardar uno nuevo
// mientras FCM respondía.
async function forgetToken(driverRef, token) {
  await firebaseAdmin.getDb().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(driverRef);
    if (snapshot.exists && snapshot.data().fcmToken === token) {
      transaction.update(driverRef, { fcmToken: null, updatedAt: firebaseAdmin.FieldValue.serverTimestamp() });
    }
  });
}

// Aviso al conductor solo si está Disponible, porque solo entonces Inicio
// muestra la solicitud. Dos conductores en el mismo teléfono comparten el token, y
// así no le llega al que no está trabajando. Si el envío falla, el viaje ya existe:
// devuelvo false en vez de fallar la solicitud.
async function notifyDriver(driverRef, driver, tripId, origin, destination) {
  if (driver.isAvailable !== true || !driver.fcmToken) return false;
  try {
    await firebaseAdmin.getMessaging().send(requestMessage(driver.fcmToken, tripId, origin, destination));
    return true;
  } catch (error) {
    console.error('No se pudo enviar la notificación:', error?.code ?? error?.message);
    if (STALE_TOKEN.has(error?.code)) {
      await forgetToken(driverRef, driver.fcmToken).catch((reason) => {
        console.error('No se pudo borrar el token vencido:', reason?.message);
      });
    }
    return false;
  }
}

module.exports = { REQUEST_TTL_MS, notifyDriver };