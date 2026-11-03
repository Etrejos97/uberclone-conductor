// Rangos para Ganancias e Historial, en la hora local del teléfono.
// Cada rango es { start, end } con end exclusivo: un viaje entra si start <= completedAt < end.

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function todayRange(now = new Date()) {
  const start = startOfDay(now);
  return { start, end: addDays(start, 1) };
}

// La semana va de lunes a domingo. getDay() da 0 al domingo, por eso el ajuste.
export function weekRange(now = new Date()) {
  const daysSinceMonday = (now.getDay() + 6) % 7;
  const start = addDays(startOfDay(now), -daysSinceMonday);
  return { start, end: addDays(start, 7) };
}

export function monthRange(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return { start, end: new Date(now.getFullYear(), now.getMonth() + 1, 1) };
}

// Rango elegido por el conductor: incluye el día final completo.
export function customRange(from, to) {
  const start = startOfDay(from);
  const end = addDays(startOfDay(to), 1);
  if (end <= start) {
    throw new Error('La fecha inicial es posterior a la final');
  }
  return { start, end };
}