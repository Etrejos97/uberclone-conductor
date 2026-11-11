import { API_URL, BACKEND_WAKE_TIMEOUT_MS } from '../config/app';

// Sección 12 del diseño: toda llamada al backend devuelve el JSON o lanza este error.
// Las pantallas nunca leen response.status.
export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request(path, options = {}) {
  // Render apaga el servicio sin tráfico y tarda en despertar, así que la espera
  // es larga. Pasado ese tiempo lo doy por caído.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), BACKEND_WAKE_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      throw new ApiError(response.status, body?.error?.code ?? 'UNKNOWN', body?.error?.message ?? 'Sin detalle');
    }
    return body;
  } catch (reason) {
    if (reason instanceof ApiError) throw reason;
    throw new ApiError(0, 'NETWORK', reason?.message ?? 'Sin conexión con el backend');
  } finally {
    clearTimeout(timer);
  }
}

// La app llama aquí al abrirse para que el backend esté despierto cuando el
// conductor cobre. Si falla no le digo nada: el cobro volverá a esperar lo que haga falta.
export async function wakeBackend() {
  try {
    await request('/health');
  } catch (reason) {
    console.warn('El backend no respondió al abrir la app:', reason.code);
  }
}

export function createPreference(tripId, amount) {
  return request('/payments/preference', { method: 'POST', body: JSON.stringify({ tripId, amount }) });
}

export function syncPayment(tripId) {
  return request('/payments/sync', { method: 'POST', body: JSON.stringify({ tripId }) });
}