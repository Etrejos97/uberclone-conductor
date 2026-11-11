import { useCallback, useEffect, useRef, useState } from 'react';
import { customRange, monthRange, todayRange, weekRange } from '../domain/dateRanges';
import { getHistoryPage } from '../services/tripService';

const RANGES = { today: todayRange, week: weekRange, month: monthRange };

// El rango del filtro, o null para "Todos". Lo calculo al pedir la página y no al
// pintar, para que "Hoy" sea el día en que el conductor consulta.
function rangeFor(period, fromTime, toTime) {
  if (period === 'range') return customRange(new Date(fromTime), new Date(toTime));
  return RANGES[period]?.() ?? null;
}

// El historial por páginas de 20. `filters` es { period, from, to,
// paymentMethod } o null mientras el rango elegido no esté completo; con null no
// consulto nada. Cada pedido lleva un número: si el conductor cambió el filtro
// mientras llegaba una respuesta, esa respuesta ya no se muestra.
export default function useTripHistory(driverId, filters) {
  const { period = '', from = null, to = null, paymentMethod = '' } = filters ?? {};
  const fromTime = from?.getTime() ?? null;
  const toTime = to?.getTime() ?? null;
  const key = driverId && filters ? [driverId, period, fromTime, toTime, paymentMethod].join('|') : null;

  const [list, setList] = useState(null); // { key, trips, last, hasMore, error }
  const [busy, setBusy] = useState(null); // { kind: 'more' | 'refresh', key }
  const [moreError, setMoreError] = useState(null); // { key, error }
  const latestRequest = useRef(0);
  // onEndReached puede llamar dos veces antes de que React pinte el estado nuevo.
  const busyRef = useRef(null);

  const query = useCallback(
    (after) =>
      getHistoryPage(driverId, {
        range: rangeFor(period, fromTime, toTime),
        paymentMethod: paymentMethod || null,
        after,
      }),
    [driverId, period, fromTime, toTime, paymentMethod]
  );

  const loadFirst = useCallback(() => {
    const request = ++latestRequest.current;
    return query(null).then(
      (page) => {
        if (request === latestRequest.current) setList({ key, ...page, error: null, refreshError: null });
      },
      (reason) => {
        console.warn('Falló la carga del historial:', reason?.code ?? reason?.message);
        if (request !== latestRequest.current) return;
        // Si ya había una lista de este filtro, un refresco fallido no la borra:
        // el conductor sigue viendo lo cargado y recibe el aviso aparte.
        setList((previous) =>
          previous?.key === key && !previous.error
            ? { ...previous, refreshError: 'errors.historyLoadFailed' }
            : { key, trips: [], last: null, hasMore: false, error: 'errors.historyLoadFailed', refreshError: null }
        );
      }
    );
  }, [key, query]);

  useEffect(() => {
    if (!key) {
      // Descarta la respuesta que venía en camino para el filtro anterior.
      latestRequest.current += 1;
      return;
    }
    loadFirst();
  }, [key, loadFirst]);

  // Corre `work` marcando la lista como ocupada. La marca la quita solo quien la puso.
  const runBusy = useCallback(
    (kind, work) => {
      const token = { kind, key };
      busyRef.current = token;
      setBusy(token);
      work().finally(() => {
        if (busyRef.current === token) busyRef.current = null;
        setBusy((currentBusy) => (currentBusy === token ? null : currentBusy));
      });
    },
    [key]
  );

  const current = list?.key === key ? list : null;

  const refresh = useCallback(() => {
    if (!key) return;
    setMoreError(null);
    runBusy('refresh', loadFirst);
  }, [key, loadFirst, runBusy]);

  // Pide la página siguiente. La usan el botón Reintentar y, a través de
  // loadMore, el fin de la lista.
  const fetchMore = useCallback(() => {
    if (!current?.hasMore || current.error || busyRef.current) return;
    const request = ++latestRequest.current;
    setMoreError(null);
    runBusy('more', () =>
      query(current.last).then(
        (page) => {
          if (request !== latestRequest.current) return;
          setList((previous) => ({
            ...previous,
            trips: [...previous.trips, ...page.trips],
            last: page.last ?? previous.last,
            hasMore: page.hasMore,
            refreshError: null,
          }));
        },
        (reason) => {
          console.warn('Falló la siguiente página del historial:', reason?.code ?? reason?.message);
          if (request === latestRequest.current) setMoreError({ key, error: 'errors.historyMoreFailed' });
        }
      )
    );
  }, [current, key, query, runBusy]);

  // El fin de la lista no repite una página que ya falló: el pie con el error
  // cambia el alto del contenido y volvería a disparar onEndReached sin parar.
  // Reintentar (retryMore) o refrescar sí lo vuelven a pedir.
  const failedMore = moreError?.key === key;
  const loadMore = useCallback(() => {
    if (failedMore) return;
    fetchMore();
  }, [failedMore, fetchMore]);

  return {
    trips: current?.trips ?? [],
    loading: Boolean(key) && !current,
    error: current?.error ?? null,
    hasMore: current?.hasMore ?? false,
    loadingMore: busy?.kind === 'more' && busy.key === key,
    moreError: moreError?.key === key ? moreError.error : null,
    refreshing: busy?.kind === 'refresh' && busy.key === key,
    refreshError: current?.refreshError ?? null,
    loadMore,
    retryMore: fetchMore,
    refresh,
  };
}