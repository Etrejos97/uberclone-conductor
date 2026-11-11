import { useCallback, useEffect, useState } from 'react';
import { getTrip } from '../services/tripService';

// Un viaje del historial, leído una vez. Un viaje pagado ya no cambia.
export default function useTrip(tripId) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);
  const key = tripId ? `${tripId}:${attempt}` : null;

  useEffect(() => {
    if (!tripId) return undefined;
    let active = true;
    getTrip(tripId).then(
      (trip) => {
        if (active) setResult({ key, trip, error: trip ? null : 'errors.tripNotFound' });
      },
      (reason) => {
        console.warn('Falló la carga del viaje:', reason?.code ?? reason?.message);
        if (active) setResult({ key, trip: null, error: 'errors.tripLoadFailed' });
      }
    );
    return () => {
      active = false;
    };
  }, [tripId, key]);

  const retry = useCallback(() => setAttempt((current) => current + 1), []);

  const current = result?.key === key ? result : null;
  return {
    trip: current?.trip ?? null,
    loading: Boolean(tripId) && !current,
    error: current?.error ?? null,
    retry,
  };
}