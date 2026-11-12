import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { REQUEST_TIMEOUT_S } from '../config/app';
import { calculateFare } from '../domain/fare';
import { expiredBeforeArrival } from '../domain/requestExpiry';
import { TRIP_STATUS } from '../domain/tripStateMachine';
import { getRoute } from '../services/routeService';
import {
  createdHereAt,
  getTripStatusFromServer,
  isTripConflict as isConflict,
  saveEstimate,
  subscribeToRequests,
  transition,
} from '../services/tripService';
import { useSession } from '../context/SessionContext';

const S = TRIP_STATUS;

// El mensaje de la tarjeta según la parte de la cotización que falló, y si
// Reintentar puede servir. Sin camino entre los dos puntos, o con una tarifa
// imposible de calcular (una categoría desconocida), reintentar no cambia nada.
function quoteError(phase, reason) {
  if (phase === 'route') {
    return reason?.code === 'noRoute'
      ? { message: 'errors.noRoute', canRetry: false }
      : { message: 'errors.routeFailed', canRetry: true };
  }
  if (phase === 'fare') return { message: 'errors.fareFailed', canRetry: false };
  return { message: 'errors.estimateSaveFailed', canRetry: true };
}

// Aceptar pudo quedar escrito aunque la app no lo supiera: la transacción pasó
// del tiempo límite y se confirmó después, o un intento anterior ya la había
// confirmado. Esta consulta solo trae viajes de este conductor, así que un
// viaje en accepted lo aceptó él.
async function acceptedAnyway(tripId, reason) {
  if (isConflict(reason)) return reason.current === S.ACCEPTED;
  try {
    return (await getTripStatusFromServer(tripId)) === S.ACCEPTED;
  } catch {
    return false;
  }
}

// Solicitudes del conductor en tiempo real. Solo escucha
// mientras `isListening` es true. Devuelve todas las pendientes, de la más
// antigua a la más nueva, y la hora límite de cada una (15 s desde que llegó
// a este teléfono).
export default function useTripRequests(isListening) {
  const { driverId } = useSession();
  const [all, setAll] = useState([]);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  // Cuándo vi cada solicitud por primera vez: de ahí cuenta su reloj.
  const [arrivals, setArrivals] = useState({});
  // Solicitudes que ya decidí en este teléfono. Las transacciones no cambian la
  // caché local hasta que responde el servidor, así que las escondo yo.
  const [dismissed, setDismissed] = useState(() => new Set());
  const [quoteErrors, setQuoteErrors] = useState({});
  const [quoteAttempt, setQuoteAttempt] = useState(0);
  // El viaje que estoy cotizando ahora: una cotización a la vez. El intervalo
  // mínimo entre rutas de OSRM (RNF-08) lo pone routeService.
  const [quoting, setQuoting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);
  // Viajes cuya cotización ya empecé (en curso, guardada o fallida): una sola
  // vez por viaje, salvo que el conductor toque Reintentar.
  const quoted = useRef(new Set());
  // La ruta de un viaje cuya tarifa no se pudo guardar. Al reintentar la reuso
  // en vez de pedírsela otra vez a OSRM.
  const routes = useRef(new Map());
  // El viaje que estoy aceptando. Lo marco antes del primer await para que un
  // segundo toque lo vea aunque la pantalla todavía no se haya vuelto a pintar.
  const accepting = useRef(null);
  // Si el reloj vence mientras acepto, rechazo la solicitud solo si aceptar falla.
  const expiredWhileAccepting = useRef(null);

  const dismiss = useCallback((tripId) => {
    setDismissed((previous) => new Set(previous).add(tripId));
  }, []);

  const undismiss = useCallback((tripId) => {
    setDismissed((previous) => {
      const next = new Set(previous);
      next.delete(tripId);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!isListening || !driverId) return undefined;
    let first = true;
    setError(null);

    const unsubscribe = subscribeToRequests(
      driverId,
      (list) => {
        setError(null);
        if (first) {
          // Al empezar a escuchar, rechazo lo que venció mientras nadie miraba.
          // Si el viaje lo creó este teléfono, comparo con la hora en que lo creó
          // y no con la del servidor: un reloj adelantado lo daría por vencido.
          first = false;
          const now = Date.now();
          for (const trip of list) {
            const createdAt = trip.createdAt?.getTime() ?? null;
            if (expiredBeforeArrival({ createdHereAt: createdHereAt(trip.id), createdAt, now })) {
              dismiss(trip.id);
              transition(trip.id, S.REQUESTED, S.REJECTED).catch((reason) => {
                if (!isConflict(reason)) {
                  console.warn('No se pudo rechazar una solicitud vencida:', reason?.code ?? reason?.message);
                }
              });
            }
          }
        }
        const seenAt = Date.now();
        setArrivals((previous) => {
          const news = list.filter((trip) => !(trip.id in previous));
          if (news.length === 0) return previous;
          return { ...previous, ...Object.fromEntries(news.map((trip) => [trip.id, seenAt])) };
        });
        setAll(list);
      },
      (reason) => {
        console.warn('Falló la escucha de solicitudes:', reason?.code ?? reason?.message);
        setError('errors.requestsLoadFailed');
      }
    );

    // Al pasar a No disponible o salir de Inicio dejo de escuchar, y los
    // avisos de esta escucha dejan de valer.
    return () => {
      unsubscribe();
      setAll([]);
      setError(null);
      setActionError(null);
    };
  }, [isListening, driverId, attempt, dismiss]);

  const requests = useMemo(
    () => all.filter((trip) => !dismissed.has(trip.id) && trip.id in arrivals),
    [all, dismissed, arrivals]
  );

  const deadlines = useMemo(
    () => Object.fromEntries(requests.map((trip) => [trip.id, arrivals[trip.id] + REQUEST_TIMEOUT_S * 1000])),
    [requests, arrivals]
  );

  // La tarifa estimada se calcula en este teléfono y se guarda en el viaje,
  // solo si todavía no la tiene (sección 10.1 del diseño). Cotizo de la más
  // antigua a la más nueva, una a la vez.
  useEffect(() => {
    if (quoting) return;
    const trip = requests.find((item) => !item.estimate && !quoted.current.has(item.id));
    if (!trip) return;
    quoted.current.add(trip.id);
    setQuoting(trip.id);
    setQuoteErrors((previous) => ({ ...previous, [trip.id]: null }));

    (async () => {
      let phase = 'route';
      try {
        let route = routes.current.get(trip.id);
        if (!route) {
          route = await getRoute(trip.origin, trip.destination);
          routes.current.set(trip.id, route);
        }
        phase = 'fare';
        const estimate = calculateFare({
          distanceKm: route.distanceKm,
          durationMin: route.durationMin,
          category: trip.category,
          tip: trip.tip,
        });
        phase = 'save';
        await saveEstimate(trip.id, route, estimate);
        routes.current.delete(trip.id);
      } catch (reason) {
        // Una tarifa imposible es un defecto del viaje, no un problema de red.
        if (phase === 'fare') console.error('No se pudo calcular la tarifa:', reason?.message);
        else console.warn('No se pudo cotizar la solicitud:', reason?.code ?? reason?.message);
        setQuoteErrors((previous) => ({ ...previous, [trip.id]: quoteError(phase, reason) }));
      } finally {
        setQuoting(null);
      }
    })();
  }, [requests, quoting, quoteAttempt]);

  const retryQuote = useCallback((tripId) => {
    quoted.current.delete(tripId);
    setQuoteAttempt((current) => current + 1);
  }, []);

  const retry = useCallback(() => setAttempt((current) => current + 1), []);

  const rejectTrip = useCallback(
    async (tripId) => {
      dismiss(tripId);
      try {
        await transition(tripId, S.REQUESTED, S.REJECTED);
      } catch (reason) {
        // Si el servidor ya tiene otro estado (el conductor aceptó un instante
        // antes), no hay nada que avisar.
        if (isConflict(reason)) return;
        console.warn('No se pudo rechazar la solicitud:', reason?.code ?? reason?.message);
        // En Firestore sigue esperando: la devuelvo a la lista para que el
        // conductor pueda rechazarla otra vez.
        undismiss(tripId);
        setActionError('errors.rejectFailed');
      }
    },
    [dismiss, undismiss]
  );

  // Botón Rechazar. Un toque del conductor reemplaza el aviso anterior.
  const reject = useCallback(
    (tripId) => {
      setActionError(null);
      return rejectTrip(tripId);
    },
    [rejectTrip]
  );

  // El reloj de la solicitud llegó a cero. No corta una aceptación en curso.
  const expire = useCallback(
    (tripId) => {
      if (accepting.current === tripId) {
        expiredWhileAccepting.current = tripId;
        return;
      }
      rejectTrip(tripId);
    },
    [rejectTrip]
  );

  // Con el viaje en accepted, useActiveTrip lo ve en su escucha y abre la
  // pantalla del viaje, y esa pantalla pide la ruta de recogida. También pasa si
  // la transacción se confirma después de que aquí se dio por fallida.
  const accept = useCallback(
    async (trip) => {
      if (accepting.current) return;
      accepting.current = trip.id;
      setBusy(true);
      setActionError(null);
      let accepted = false;
      try {
        await transition(trip.id, S.REQUESTED, S.ACCEPTED);
        accepted = true;
      } catch (reason) {
        accepted = await acceptedAnyway(trip.id, reason);
        if (!accepted) {
          console.warn('No se pudo aceptar la solicitud:', reason?.code ?? reason?.message);
          if (isConflict(reason)) dismiss(trip.id);
          setActionError(isConflict(reason) ? 'errors.tripTaken' : 'errors.acceptFailed');
        }
      } finally {
        accepting.current = null;
        setBusy(false);
      }

      const expired = expiredWhileAccepting.current === trip.id;
      expiredWhileAccepting.current = null;
      if (accepted) dismiss(trip.id);
      else if (expired) rejectTrip(trip.id);
    },
    [dismiss, rejectTrip]
  );

  return {
    requests,
    deadlines,
    quoteErrors,
    retryQuote,
    error,
    retry,
    accept,
    reject,
    expire,
    busy,
    actionError,
  };
}