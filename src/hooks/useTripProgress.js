import { useCallback, useEffect, useRef, useState } from 'react';
import { finalCharges } from '../domain/fare';
import { TRIP_STATUS } from '../domain/tripStateMachine';
import { getRoute } from '../services/routeService';
import { isTripConflict, transition } from '../services/tripService';

const S = TRIP_STATUS;

// Lo que el conductor hace durante el viaje: la ruta de recogida
// y los cambios de etapa. El estado que pinta la pantalla viene de `trip`, que
// llega de Firestore; este hook solo pide los cambios.
export default function useTripProgress(trip, position, positionReady) {
  const [routeError, setRouteError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);
  // Marco antes del primer await para que un segundo toque lo vea aunque la
  // pantalla todavía no se haya vuelto a pintar.
  const acting = useRef(false);
  const routing = useRef(false);
  // La ruta que ya respondió OSRM. Si falla guardarla, el reintento la reusa.
  const fetchedRoute = useRef(null);

  const needsPickupRoute = trip.status === S.ACCEPTED;
  const tripId = trip.id;
  const origin = trip.origin;

  // Al aceptar pido la ruta desde donde está el conductor hasta la recogida
  // y paso a driver_arriving. Si falla, el viaje sigue en accepted hasta que el
  // conductor toque Reintentar. La posición cambia seguido, pero `routing` y
  // `routeError` dejan una sola llamada por intento.
  useEffect(() => {
    if (!needsPickupRoute || !position || !positionReady || routing.current || routeError) return;
    routing.current = true;
    (async () => {
      try {
        if (!fetchedRoute.current) fetchedRoute.current = await getRoute(position, origin);
        await transition(tripId, S.ACCEPTED, S.DRIVER_ARRIVING, { pickupRoute: fetchedRoute.current });
      } catch (reason) {
        // El viaje ya no está en accepted (lo cancelaron o ya avanzó): la pantalla
        // lo muestra con el siguiente onSnapshot y aquí no hay nada que avisar.
        if (isTripConflict(reason)) return;
        console.warn('No se pudo preparar la ruta de recogida:', reason?.code ?? reason?.message);
        // Con la ruta ya calculada, lo que falló fue guardarla en el viaje.
        if (fetchedRoute.current) setRouteError('errors.tripActionFailed');
        else setRouteError(reason?.code === 'noRoute' ? 'errors.noRoute' : 'errors.routeFailed');
      } finally {
        routing.current = false;
      }
    })();
  }, [needsPickupRoute, position, positionReady, routeError, tripId, origin]);

  // Un guardado que pasó del tiempo límite puede llegar después: si el viaje ya salió
  // de accepted, el aviso de la ruta ya no aplica. Lo limpio al pintar y no en un efecto.
  if (!needsPickupRoute && routeError) setRouteError(null);

  const retryRoute = useCallback(() => {
    setRouteError(null);
  }, []);

  const status = trip.status;
  // El diálogo de Cancelar guarda la función de cuando se abrió. Si mientras tanto el
  // viaje pasó de accepted a driver_arriving, cancelar tiene que partir del estado de ahora.
  const latestStatus = useRef(status);
  useEffect(() => {
    latestStatus.current = status;
  }, [status]);

  const advance = useCallback(
    async (to, changes, from = status) => {
      if (acting.current) return;
      acting.current = true;
      setBusy(true);
      setActionError(null);
      try {
        await transition(tripId, from, to, changes);
      } catch (reason) {
        // Un intento anterior pasó del tiempo límite y sí llegó: ya está hecho.
        if (isTripConflict(reason) && reason.current === to) return;
        console.warn('No se pudo cambiar el viaje:', reason?.code ?? reason?.message);
        setActionError(isTripConflict(reason) ? 'errors.tripChanged' : 'errors.tripActionFailed');
      } finally {
        acting.current = false;
        setBusy(false);
      }
    },
    [tripId, status]
  );

  // Un aviso de la etapa anterior ya no aplica en la nueva.
  const [errorStatus, setErrorStatus] = useState(status);
  if (errorStatus !== status) {
    setErrorStatus(status);
    setActionError(null);
  }

  // RF-18
  const boardPassenger = useCallback(() => advance(S.IN_PROGRESS), [advance]);

  // RF-20
  const cancel = useCallback(() => advance(S.CANCELLED, undefined, latestStatus.current), [advance]);

  // Si la tarifa no se puede calcular, el viaje no cambia de estado.
  const finish = useCallback(() => {
    let charges;
    try {
      charges = finalCharges(trip);
    } catch (reason) {
      console.error('No se pudo calcular la tarifa final:', reason?.message);
      setActionError('errors.finalFareFailed');
      return undefined;
    }
    return advance(S.COMPLETED, charges);
  }, [trip, advance]);

  // Sin camino entre los dos puntos, volver a pedir la ruta da lo mismo y gasta una
  // llamada de OSRM (RNF-08). Al conductor solo le queda cancelar.
  const canRetryRoute = routeError !== 'errors.noRoute';

  return { routeError, canRetryRoute, retryRoute, boardPassenger, finish, cancel, busy, actionError };
}