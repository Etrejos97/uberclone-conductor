// Números para mostrar en pantalla. En español el separador de miles es el
// punto y el decimal la coma; en inglés, al revés. Lo hago a mano para no
// depender del soporte de Intl de cada teléfono.

function groupThousands(integer, separator) {
  return String(integer).replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

// Pesos colombianos, sin decimales: $19.200 o $19,200.
export function formatMoney(value, language) {
  const digits = groupThousands(Math.round(Math.abs(value)), language === 'es' ? '.' : ',');
  return `${value < 0 ? '-' : ''}$${digits}`;
}

// Kilómetros con un decimal: 8,5 km o 8.5 km.
export function formatKm(value, language) {
  const text = (Math.round(value * 10) / 10).toFixed(1);
  return `${language === 'es' ? text.replace('.', ',') : text} km`;
}

function twoDigits(value) {
  return String(value).padStart(2, '0');
}

// Fecha y hora del viaje en la hora del teléfono. En español día/mes y
// reloj de 24 horas (05/11/2026 15:04); en inglés mes/día y AM/PM (11/05/2026 3:04 PM).
export function formatDateTime(date, language) {
  const day = twoDigits(date.getDate());
  const month = twoDigits(date.getMonth() + 1);
  const minutes = twoDigits(date.getMinutes());
  if (language === 'es') {
    return `${day}/${month}/${date.getFullYear()} ${twoDigits(date.getHours())}:${minutes}`;
  }
  const hours = date.getHours() % 12 || 12;
  const suffix = date.getHours() < 12 ? 'AM' : 'PM';
  return `${month}/${day}/${date.getFullYear()} ${hours}:${minutes} ${suffix}`;
}