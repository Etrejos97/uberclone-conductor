import { OSRM_MIN_INTERVAL_MS, OSRM_URL, ROUTE_TIMEOUT_MS } from '../config/app';

// Error con un código que la pantalla traduce: 'timeout', 'network' o 'noRoute'.
function routeError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

// El servidor público de OSRM admite 1 solicitud por segundo. Cada
// llamada reserva su turno al entrar, así que dos llamadas seguidas (la
// cotización y la ruta de recogida) salen con al menos un segundo de diferencia.
let nextSlot = 0;

function reserveSlot() {
  const now = Date.now();
  const at = Math.max(now, nextSlot);
  nextSlot = at + OSRM_MIN_INTERVAL_MS;
  return at - now;
}

// Distancia, duración y trazado de la ruta en carro entre dos puntos.
// OSRM recibe longitud antes que latitud y responde en metros y segundos; aquí
// los paso a km (un decimal) y minutos enteros, que es lo que pide calculateFare.
// RNF-08: solo la llaman la cotización de una solicitud y la ruta de recogida.
export async function getRoute(from, to) {
  const wait = reserveSlot();
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  const points = `${from.longitude},${from.latitude};${to.longitude},${to.latitude}`;
  const url = `${OSRM_URL}/route/v1/driving/${points}?overview=simplified&geometries=geojson`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ROUTE_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(url, { signal: controller.signal });
  } catch (error) {
    throw controller.signal.aborted
      ? routeError('timeout', `OSRM no respondió en ${ROUTE_TIMEOUT_MS / 1000} s`)
      : routeError('network', error?.message ?? 'Falló la conexión con OSRM');
  } finally {
    clearTimeout(timer);
  }

  // OSRM responde 400 con code 'NoRoute' o 'InvalidQuery' cuando no hay camino.
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.code !== 'Ok' || !body.routes?.length) {
    if (response.status === 400 || body?.code) {
      throw routeError('noRoute', `OSRM respondió ${response.status} ${body?.code ?? ''}`.trim());
    }
    throw routeError('network', `OSRM respondió ${response.status}`);
  }

  const [route] = body.routes;
  return {
    distanceKm: Math.round(route.distance / 100) / 10,
    durationMin: Math.round(route.duration / 60),
    // GeoJSON trae [longitud, latitud]. Firestore no guarda arreglos dentro de
    // arreglos, así que lo dejo como lista de { latitude, longitude }.
    coordinates: route.geometry.coordinates.map(([longitude, latitude]) => ({ latitude, longitude })),
  };
}