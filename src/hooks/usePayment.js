import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { amountToCharge, apiErrorKey } from '../domain/payment';
import { TRIP_STATUS } from '../domain/tripStateMachine';
import { ApiError, createPreference, syncPayment } from '../services/apiService';
import { isTripConflict, markCashPaid, rateTrip, switchToCashPaid } from '../services/tripService';

const cashErrorKey = (reason) => (isTripConflict(reason) ? 'errors.tripChanged' : 'errors.tripActionFailed');

// Si el viaje ya está pagado, un intento anterior pasó del tiempo límite y sí
// llegó, o Mercado Pago aprobó la tarjeta primero. En los dos casos no hay nada
// que escribir; el aviso de la tarjeta lo decide usePayment con el viaje.
async function payOnce(write, tripId) {
  try {
    await write(tripId);
  } catch (reason) {
    if (isTripConflict(reason) && reason.current === TRIP_STATUS.PAID) return;
    throw reason;
  }
}

// Lo que se hace en Cobro. El estado que pinta la pantalla viene de
// `trip`, que llega de Firestore: cuando el backend confirma un pago, la pantalla lo
// muestra sola. Este hook solo pide los cambios.
export default function usePayment(trip) {
  // Qué acción está en curso: 'checkout', 'verify', 'cash', 'cashInstead' o 'rating'.
  const [pending, setPending] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  // Marco antes del primer await para que un segundo toque lo vea aunque la pantalla
  // todavía no se haya vuelto a pintar: dos toques crearían dos cobros.
  const acting = useRef(false);
  // Se abrió el checkout desde aquí y falta verificar al volver a la app.
  const awaitingReturn = useRef(false);
  // El conductor confirmó que recibió el efectivo. Si después el viaje aparece
  // pagado con tarjeta, el efectivo no quedó registrado y tiene que devolverlo.
  const [cashConfirmed, setCashConfirmed] = useState(false);

  const tripId = trip.id;
  const amount = amountToCharge(trip);
  const status = trip.status;
  const paymentStatus = trip.paymentStatus;

  const run = useCallback(async (name, action, errorKeyOf) => {
    if (acting.current) return;
    acting.current = true;
    setPending(name);
    setError(null);
    setNotice(null);
    try {
      await action();
    } catch (reason) {
      console.warn(`Falló ${name} en Cobro:`, reason?.code ?? reason?.message);
      setError(errorKeyOf(reason));
    } finally {
      acting.current = false;
      setPending(null);
    }
  }, []);

  // Un aviso del estado anterior ya no aplica en el nuevo. Lo limpio al pintar y no en
  // un efecto, para que no haya un render con el aviso viejo.
  const stage = `${status}:${paymentStatus}`;
  const [seenStage, setSeenStage] = useState(stage);
  if (seenStage !== stage) {
    setSeenStage(stage);
    setError(null);
    setNotice(null);
  }

  // El aviso de devolver el efectivo sale del viaje que llega de Firestore y no de un
  // estado: así aparece en cualquier orden de la carrera, también si la escritura del
  // efectivo pasó del tiempo límite.
  const cardWon = cashConfirmed && status === TRIP_STATUS.PAID && paymentStatus === 'approved';

  // El pasajero cerró el navegador o Mercado Pago no pudo avisar al backend.
  const verify = useCallback(
    () =>
      run(
        'verify',
        async () => {
          const result = await syncPayment(tripId);
          // Un rechazo que ya se veía no cambia la pantalla: sin aviso, el toque
          // parecería no hacer nada.
          if (result.paymentStatus === 'rejected') setNotice('payment.stillRejected');
          else if (result.paymentStatus !== 'approved') setNotice('payment.stillPending');
        },
        apiErrorKey
      ),
    [run, tripId]
  );

  // El backend vuelve a comparar el monto contra el viaje guardado. Android responde
  // 'opened' apenas abre el navegador y el regreso lo marca AppState. iOS responde
  // cuando el pasajero cierra el navegador y AppState no cambia (el navegador es un
  // modal sobre la app), así que ahí verifico al cerrarse.
  const pay = useCallback(async () => {
    let closed = false;
    await run(
      'checkout',
      async () => {
        const { checkoutUrl } = await createPreference(tripId, amount);
        awaitingReturn.current = true;
        try {
          const result = await WebBrowser.openBrowserAsync(checkoutUrl);
          if (result.type !== 'opened') {
            awaitingReturn.current = false;
            closed = true;
          }
        } catch (reason) {
          // Si el navegador no abrió, no hay regreso que esperar.
          awaitingReturn.current = false;
          throw reason;
        }
      },
      apiErrorKey
    );
    if (closed) verify();
  }, [run, verify, tripId, amount]);

  // Al volver del checkout, la app verifica sola. Con el backend en Render, el webhook
  // suele confirmar antes; "Verificar pago" queda de respaldo.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active' || !awaitingReturn.current) return;
      awaitingReturn.current = false;
      verify();
    });
    return () => subscription.remove();
  }, [verify]);

  const receiveCash = useCallback(
    () =>
      run(
        'cash',
        async () => {
          setCashConfirmed(true);
          await payOnce(markCashPaid, tripId);
        },
        cashErrorKey
      ),
    [run, tripId]
  );

  // Con un pago rechazado. Antes de cobrar en efectivo le pregunto a Mercado Pago:
  // si el pasajero alcanzó a pagar con tarjeta, ese pago gana y el viaje queda aprobado.
  // Si hay un pago en proceso, espero, para no cobrarle dos veces.
  const receiveCashInstead = useCallback(
    () =>
      run(
        'cashInstead',
        async () => {
          setCashConfirmed(true);
          const { paymentStatus: found } = await syncPayment(tripId);
          // Aprobado con tarjeta, o ya cobrado en efectivo desde otro teléfono.
          if (found === 'approved' || found === 'cash') return;
          if (found !== 'rejected') {
            setNotice('payment.cashInsteadWait');
            return;
          }
          await payOnce(switchToCashPaid, tripId);
        },
        (reason) => (reason instanceof ApiError ? apiErrorKey(reason) : cashErrorKey(reason))
      ),
    [run, tripId]
  );

  // Al guardarse, el viaje deja de estar abierto y la app vuelve a Inicio.
  const rate = useCallback(
    (rating) =>
      run(
        'rating',
        async () => {
          await rateTrip(tripId, rating);
        },
        () => 'errors.ratingFailed'
      ),
    [run, tripId]
  );

  return {
    pay,
    verify,
    receiveCash,
    receiveCashInstead,
    rate,
    pending,
    error,
    notice: cardWon ? 'payment.cardWonReturnCash' : notice,
  };
}