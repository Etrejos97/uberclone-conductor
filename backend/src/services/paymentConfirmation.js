const firebaseAdmin = require('./firebaseAdmin');
const mercadoPago = require('./mercadoPago');
const { isTripId } = require('../middleware/validate');

// Estados de Mercado Pago de un pago que todavía puede terminar aprobado.
const IN_PROGRESS = ['pending', 'in_process', 'authorized'];

// La decisión, sin red ni base de datos. Recibe el viaje leído dentro de la
// transacción y el pago que respondió Mercado Pago (AD-07).
function decide(trip, payment) {
  // El retorno, el webhook y "Verificar pago" llegan en cualquier orden y cualquier
  // número de veces. El primero aplica el pago y los demás terminan aquí.
  if (!trip || trip.status !== 'completed') return 'none';
  // El monto solo se compara con un pago aprobado. Un viaje sin propina (por ejemplo,
  // creado desde Postman) se cobra solo por la tarifa.
  if (payment.status === 'approved') {
    return payment.transaction_amount === trip.fare + (trip.tip ?? 0) ? 'pay' : 'mismatch';
  }
  // Un pago en proceso todavía puede aprobarse: no lo juzgo hasta que termine. Uno
  // rechazado, cancelado o devuelto ya no cobra el viaje: el pasajero puede volver a
  // pagar o pagar en efectivo.
  if (IN_PROGRESS.includes(payment.status)) return 'none';
  return 'reject';
}

// Aplica un pago al viaje y devuelve el paymentStatus con que queda, o null si el
// pago no corresponde a ningún viaje.
async function applyPayment(payment) {
  const tripId = payment.external_reference;
  if (!isTripId(tripId)) {
    console.warn(`El pago ${payment.id} no trae un viaje válido`);
    return null;
  }
  const db = firebaseAdmin.getDb();
  const tripRef = db.collection('trips').doc(tripId);

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(tripRef);
    const trip = snapshot.exists ? snapshot.data() : null;
    const decision = decide(trip, payment);

    if (decision === 'pay') {
      transaction.update(tripRef, {
        status: 'paid',
        paymentStatus: 'approved',
        paymentId: String(payment.id),
        paidAt: firebaseAdmin.FieldValue.serverTimestamp(),
      });
      return 'approved';
    }
    if (decision === 'mismatch' || decision === 'reject') {
      if (decision === 'mismatch') {
        console.error(`El pago ${payment.id} no coincide con el viaje ${tripId}: ${payment.transaction_amount}`);
      }
      transaction.update(tripRef, { paymentStatus: 'rejected' });
      return 'rejected';
    }
    // Un pago aprobado sobre un viaje que ya se cobró de otra forma (en efectivo o con
    // otro checkout) no se aplica, pero el pasajero pagó dos veces: lo dejo en el log.
    if (trip?.status === 'paid' && payment.status === 'approved' && String(payment.id) !== trip.paymentId) {
      console.warn(
        `El pago ${payment.id} está aprobado, pero el viaje ${tripId} ya estaba pagado (${trip.paymentStatus}). Revisa si hay que devolverlo.`
      );
    }
    return trip?.paymentStatus ?? null;
  });
}

// Lo usan el retorno y el webhook, que traen el id del pago.
async function confirm(paymentId) {
  const payment = await mercadoPago.getPayment(paymentId);
  if (!payment) {
    console.warn(`Mercado Pago no conoce el pago ${paymentId}`);
    return null;
  }
  return applyPayment(payment);
}

// "Verificar pago": sirve cuando el pasajero cerró el navegador antes del retorno o
// cuando el backend corre en mi PC, donde Mercado Pago no puede llamar el webhook.
// Un viaje puede tener un pago rechazado y después uno aprobado: gana el aprobado.
// Un pago que Mercado Pago todavía procesa se reporta como pendiente, aunque el último
// esté rechazado, para que la app no lo cobre también en efectivo.
// `inProgress` dice si hay un pago que todavía puede aprobarse: con él, la
// preferencia no abre otro checkout.
async function inspectTrip(tripId) {
  const payments = await mercadoPago.searchPayments(tripId);
  const approved = payments.find((item) => item.status === 'approved');
  if (approved) return { paymentStatus: await applyPayment(approved), inProgress: false };
  if (payments.some((item) => IN_PROGRESS.includes(item.status))) return { paymentStatus: 'pending', inProgress: true };
  return { paymentStatus: payments[0] ? await applyPayment(payments[0]) : null, inProgress: false };
}

async function syncTrip(tripId) {
  return (await inspectTrip(tripId)).paymentStatus;
}

module.exports = { applyPayment, confirm, decide, inspectTrip, syncTrip };