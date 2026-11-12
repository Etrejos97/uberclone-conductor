const { Router } = require('express');
const { ApiError } = require('../middleware/errorHandler');
const { requireSimulatorKey } = require('../middleware/simulatorKey');
const { requireSimulatedTrip } = require('../middleware/validate');
const firebaseAdmin = require('../services/firebaseAdmin');
const { notifyDriver } = require('../services/pushService');

const router = Router();

// Los estados en que la app muestra el viaje en curso en vez de Inicio
// (OPEN_STATUSES en tripStateMachine.js). El pagado cuenta hasta que lo califican.
const OPEN_STATUSES = ['accepted', 'driver_arriving', 'in_progress', 'completed', 'paid'];

// La misma consulta de subscribeToActiveTrips en la app.
async function hasOpenTrip(db, driverId) {
  const open = await db
    .collection('trips')
    .where('driverId', '==', driverId)
    .where('status', 'in', OPEN_STATUSES)
    .where('rating', '==', null)
    .limit(1)
    .get();
  return !open.empty;
}

// Crea una solicitud como lo hace el Cliente simulado de la app, pero desde
// Postman, para probar la notificación con la app en segundo plano.
router.post('/simulate', requireSimulatorKey, async (req, res) => {
  const request = requireSimulatedTrip(req.body);
  const db = firebaseAdmin.getDb();
  const driverRef = db.collection('drivers').doc(request.driverId);

  const snapshot = await driverRef.get();
  if (!snapshot.exists) throw new ApiError(404, 'DRIVER_NOT_FOUND', 'El conductor no existe.');
  const driver = snapshot.data();
  // La regla de Firestore exige lo mismo, pero firebase-admin no pasa por ella.
  if (driver.vehicle?.category !== request.category) {
    throw new ApiError(400, 'CATEGORY_MISMATCH', 'La categoría no es la del vehículo del conductor.');
  }
  // Con un viaje abierto Inicio no está montado: nadie vería la solicitud ni la
  // vencería, y la notificación sonaría en pleno viaje.
  if (await hasOpenTrip(db, request.driverId)) {
    throw new ApiError(409, 'DRIVER_BUSY', 'El conductor tiene un viaje en curso.');
  }

  // Los mismos campos que escribe createTrip en la app.
  const tripRef = db.collection('trips').doc();
  await tripRef.set({
    ...request,
    status: 'requested',
    source: 'backend',
    route: null,
    pickupRoute: null,
    estimate: null,
    fare: null,
    commission: null,
    driverEarnings: null,
    commissionRate: null,
    paymentStatus: null,
    rating: null,
    createdAt: firebaseAdmin.FieldValue.serverTimestamp(),
  });

  const notified = await notifyDriver(driverRef, driver, tripRef.id, request.origin, request.destination);
  res.status(201).json({ tripId: tripRef.id, notified });
});

module.exports = router;