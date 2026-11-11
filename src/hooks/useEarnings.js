import { useCallback, useEffect, useState } from 'react';
import { monthRange, todayRange, weekRange } from '../domain/dateRanges';
import { computeBalance, summarizeEarnings } from '../domain/earnings';
import { subscribeToPaidTrips } from '../services/tripService';

// El saldo y el resumen de hoy, la semana y el mes, en tiempo real.
// Una sola escucha trae los viajes pagados del conductor, y cada resumen se
// calcula con la hora en que llegaron los datos.
function summarize(trips) {
  const now = new Date();
  return {
    balance: computeBalance(trips),
    today: summarizeEarnings(trips, todayRange(now)),
    week: summarizeEarnings(trips, weekRange(now)),
    month: summarizeEarnings(trips, monthRange(now)),
  };
}

export default function useEarnings(driverId) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);
  // Igual que en useActiveTrip: el resultado vale solo para este conductor y este intento.
  const key = driverId ? `${driverId}:${attempt}` : null;

  useEffect(() => {
    if (!driverId) return undefined;
    return subscribeToPaidTrips(
      driverId,
      (trips) => setResult({ key, earnings: summarize(trips), error: null }),
      (reason) => {
        console.warn('Falló la escucha de ganancias:', reason?.code ?? reason?.message);
        setResult({ key, earnings: null, error: 'errors.earningsLoadFailed' });
      }
    );
  }, [driverId, key]);

  const retry = useCallback(() => setAttempt((current) => current + 1), []);

  const current = result?.key === key ? result : null;
  return {
    earnings: current?.earnings ?? null,
    loading: Boolean(driverId) && !current,
    error: current?.error ?? null,
    retry,
  };
}