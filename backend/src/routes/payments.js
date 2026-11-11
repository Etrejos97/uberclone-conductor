const { Router } = require('express');
const { ApiError } = require('../middleware/errorHandler');
const { isPaymentId, requireAmount, requireTripId } = require('../middleware/validate');
const firebaseAdmin = require('../services/firebaseAdmin');
const mercadoPago = require('../services/mercadoPago');
const paymentConfirmation = require('../services/paymentConfirmation');

const router = Router();

function tripNotFound() {
  return new ApiError(404, 'TRIP_NOT_FOUND', 'El viaje no existe.');
}

// La app manda el monto, pero el backend no le cree: lo compara con el viaje guardado
// para detectar que la app y Firestore no están de acuerdo antes de cobrar.
function assertPayable(trip, amount) {
  if (trip.status === 'paid') {
    throw new ApiError(409, 'TRIP_ALREADY_PAID', 'Este viaje ya está pagado.');
  }
  if (trip.status !== 'completed') {
    throw new ApiError(409, 'TRIP_NOT_COMPLETED', 'El viaje todavía no ha terminado.');
  }
  if (trip.paymentMethod !== 'mercadopago') {
    throw new ApiError(409, 'TRIP_NOT_MERCADOPAGO', 'Este viaje se cobra en efectivo.');
  }
  if (amount !== trip.fare + (trip.tip ?? 0)) {
    throw new ApiError(409, 'AMOUNT_MISMATCH', 'El monto no coincide con el viaje.');
  }
}

router.post('/preference', async (req, res) => {
  const tripId = requireTripId(req.body);
  const amount = requireAmount(req.body);
  const db = firebaseAdmin.getDb();
  const tripRef = db.collection('trips').doc(tripId);

  const snapshot = await tripRef.get();
  if (!snapshot.exists) throw tripNotFound();
  const trip = snapshot.data();
  assertPayable(trip, amount);

  // Con un cobro ya intentado, el pasajero pudo haber pagado sin que el backend
  // se enterara: el retorno y el webhook no llegan a mi PC, y un checkout
  // rechazado sigue abierto para otro intento. Antes de abrir otro checkout
  // pregunto a Mercado Pago, para no cobrarle dos veces el mismo viaje.
  if (trip.paymentStatus) {
    const found = await paymentConfirmation.inspectTrip(tripId);
    if (found.paymentStatus === 'approved') throw new ApiError(409, 'TRIP_ALREADY_PAID', 'Este viaje ya está pagado.');
    if (found.inProgress) throw new ApiError(409, 'PAYMENT_IN_PROCESS', 'Hay un pago en proceso para este viaje.');
  }

  const { preferenceId, checkoutUrl } = await mercadoPago.createPreference(tripId, amount);

  // Vuelvo a leer dentro de una transacción: si llegó un pago mientras Mercado Pago
  // respondía, no lo piso ni devuelvo un checkout para cobrar otra vez.
  await db.runTransaction(async (transaction) => {
    const current = await transaction.get(tripRef);
    if (!current.exists) throw tripNotFound();
    assertPayable(current.data(), amount);
    transaction.update(tripRef, { paymentStatus: 'pending', preferenceId });
  });

  res.status(201).json({ preferenceId, checkoutUrl });
});

// El texto no repite nada de la URL: cualquiera puede abrirla con lo que quiera.
function returnPage(message) {
  return `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>UberClone</title></head>
<body style="font-family: sans-serif; text-align: center; padding: 48px 24px;"><h1>${message}</h1></body>
</html>`;
}

const RECEIVED = 'Pago recibido, vuelve a la app.';
const REJECTED = 'El pago fue rechazado. Vuelve a la app para intentar otro.';
const TO_VERIFY = 'El pago quedó pendiente de verificar. Vuelve a la app y toca Verificar pago.';
// Mercado Pago vuelve aquí también cuando el pago falla: el texto sale del estado
// con que quedó el viaje, no de que la página se haya abierto.
const RETURN_MESSAGE = { approved: RECEIVED, rejected: REJECTED };

router.get('/return', async (req, res) => {
  let message = TO_VERIFY;
  if (isPaymentId(req.query.payment_id)) {
    try {
      const paymentStatus = await paymentConfirmation.confirm(req.query.payment_id);
      message = RETURN_MESSAGE[paymentStatus] ?? TO_VERIFY;
    } catch (reason) {
      console.error('No se pudo confirmar el pago al volver:', reason.message);
    }
  }
  res.type('html').send(returnPage(message));
});

// El cuerpo trae `type` y `data.id`. Las notificaciones viejas los traen en la URL.
router.post('/webhook', async (req, res) => {
  const type = req.body?.type ?? req.query.type ?? req.query.topic;
  const paymentId = req.body?.data?.id ?? req.query['data.id'] ?? req.query.id;
  if (type === 'payment' && isPaymentId(paymentId)) {
    // AD-07: solo uso el id. El estado lo consulto con mi llave.
    try {
      await paymentConfirmation.confirm(String(paymentId));
    } catch (reason) {
      // Cualquier fallo aquí responde 500: así Mercado Pago vuelve a intentar.
      throw new Error(`No se pudo confirmar el pago ${paymentId}: ${reason.message}`);
    }
  }
  res.json({ received: true });
});

router.post('/sync', async (req, res) => {
  const tripId = requireTripId(req.body);
  const snapshot = await firebaseAdmin.getDb().collection('trips').doc(tripId).get();
  if (!snapshot.exists) throw tripNotFound();
  const trip = snapshot.data();
  if (trip.status === 'paid') {
    res.json({ paymentStatus: trip.paymentStatus });
    return;
  }
  const paymentStatus = await paymentConfirmation.syncTrip(tripId);
  res.json({ paymentStatus: paymentStatus ?? trip.paymentStatus ?? null });
});

module.exports = router;