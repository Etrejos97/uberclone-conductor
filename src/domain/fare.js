import {
  BASE_FARE,
  CATEGORY_MULTIPLIER,
  COMMISSION_RATE,
  MINIMUM_FARE,
  PER_KM,
  PER_MIN,
} from '../config/pricing.js';

// La misma función calcula la estimación y el cierre del viaje.
// Con una entrada inválida lanza un error: una tarifa NaN guardada es peor que un error visible.
export function calculateFare({ distanceKm, durationMin, category, tip = 0 } = {}) {
  if (!Number.isFinite(distanceKm) || distanceKm < 0) {
    throw new Error('distanceKm inválido: ' + distanceKm);
  }
  if (!Number.isFinite(durationMin) || durationMin < 0) {
    throw new Error('durationMin inválido: ' + durationMin);
  }
  if (!category || !Object.hasOwn(CATEGORY_MULTIPLIER, category)) {
    throw new Error('Categoría desconocida: ' + category);
  }
  if (!Number.isSafeInteger(tip) || tip < 0) {
    throw new Error('tip inválido: ' + tip);
  }

  const raw = (BASE_FARE + distanceKm * PER_KM + durationMin * PER_MIN) * CATEGORY_MULTIPLIER[category];
  const fare = Math.max(MINIMUM_FARE, Math.round(raw / 100) * 100);
  const commission = Math.round(fare * COMMISSION_RATE);
  const driverEarnings = fare - commission + tip;

  return { fare, commission, driverEarnings };
}