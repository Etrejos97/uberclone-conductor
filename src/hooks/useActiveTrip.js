import { useCallback, useEffect, useState } from 'react';
import { subscribeToActiveTrips } from '../services/tripService';

// El viaje abierto del conductor, en tiempo real. La navegación sale de aquí y
// no de la memoria: si la app se cierra a mitad de un viaje, al abrirla vuelve a
// él, y una aceptación que el servidor confirmó tarde también abre el viaje.
export default function useActiveTrip(driverId) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);
  // El resultado vale solo para este conductor y este intento. Comparar la llave
  // evita mostrar el menú un instante, antes de saber si hay un viaje abierto.
  const key = driverId ? `${driverId}:${attempt}` : null;

  useEffect(() => {
    if (!driverId) return undefined;
    // La escucha se corta al cerrar sesión o al reintentar.
    return subscribeToActiveTrips(
      driverId,
      (trips) => setResult({ key, trip: trips[0] ?? null, error: null }),
      (reason) => {
        console.warn('Falló la escucha del viaje activo:', reason?.code ?? reason?.message);
        setResult({ key, trip: null, error: 'errors.activeTripLoadFailed' });
      }
    );
  }, [driverId, key]);

  const retry = useCallback(() => setAttempt((current) => current + 1), []);

  const current = result?.key === key ? result : null;
  return {
    trip: current?.trip ?? null,
    loading: Boolean(driverId) && !current,
    error: current?.error ?? null,
    retry,
  };
}