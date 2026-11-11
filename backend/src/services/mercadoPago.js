const { ApiError } = require('../middleware/errorHandler');

const BASE_URL = 'https://api.mercadopago.com';
const TIMEOUT_MS = 15000;

function providerFailed() {
  return new ApiError(502, 'PAYMENT_PROVIDER_FAILED', 'Mercado Pago no respondió bien.');
}

// `allowNotFound` devuelve null en un 404: un webhook de prueba trae un pago que no
// existe, y volver a intentarlo no lo va a hacer aparecer.
async function request(path, { allowNotFound = false, ...options } = {}) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (reason) {
    console.error('Mercado Pago no respondió:', reason.name);
    throw providerFailed();
  }
  if (allowNotFound && response.status === 404) return null;
  if (!response.ok) {
    // El cuerpo del error dice qué campo rechazó. Va solo al log, cortado, y nunca a la app.
    const detail = (await response.text().catch(() => '')).slice(0, 300);
    console.error(
      `Mercado Pago respondió ${response.status} a ${options.method ?? 'GET'} ${path.split('?')[0]}: ${detail}`
    );
    throw providerFailed();
  }
  return response.json();
}

// Mercado Pago no acepta localhost como dirección de retorno. Con el backend en mi
// PC no mando direcciones, y el pago se confirma con "Verificar pago".
function publicUrls(baseUrl) {
  if (!baseUrl?.startsWith('https://')) return {};
  const clean = baseUrl.replace(/\/+$/, '');
  const returnUrl = `${clean}/payments/return`;
  return {
    back_urls: { success: returnUrl, pending: returnUrl, failure: returnUrl },
    auto_return: 'approved',
    notification_url: `${clean}/payments/webhook`,
  };
}

function preferenceBody(tripId, amount, baseUrl) {
  return {
    items: [{ id: tripId, title: 'Viaje UberClone', quantity: 1, currency_id: 'COP', unit_price: amount }],
    external_reference: tripId,
    ...publicUrls(baseUrl),
  };
}

// Las credenciales de prueba de hoy empiezan por APP_USR, igual que las de producción,
// y abren init_point. Una credencial que empiece por TEST- abre el checkout de pruebas.
function checkoutUrl(preference, accessToken) {
  return accessToken?.startsWith('TEST-') ? preference.sandbox_init_point : preference.init_point;
}

async function createPreference(tripId, amount) {
  const preference = await request('/checkout/preferences', {
    method: 'POST',
    body: JSON.stringify(preferenceBody(tripId, amount, process.env.PUBLIC_BASE_URL)),
  });
  const url = checkoutUrl(preference, process.env.MP_ACCESS_TOKEN);
  if (!preference.id || !url) {
    console.error('Mercado Pago creó una preferencia sin id o sin URL de pago');
    throw providerFailed();
  }
  return { preferenceId: preference.id, checkoutUrl: url };
}

function getPayment(paymentId) {
  return request(`/v1/payments/${encodeURIComponent(paymentId)}`, { allowNotFound: true });
}

// Los pagos de un viaje, del más nuevo al más viejo.
async function searchPayments(tripId) {
  const query = new URLSearchParams({ external_reference: tripId, sort: 'date_created', criteria: 'desc' });
  const found = await request(`/v1/payments/search?${query}`);
  return found.results ?? [];
}

module.exports = { checkoutUrl, createPreference, getPayment, preferenceBody, searchPayments };