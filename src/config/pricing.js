// RN-04: valores de la tarifa, en pesos colombianos enteros.

export const BASE_FARE = 3500;
export const PER_KM = 1200;
export const PER_MIN = 250;
export const MINIMUM_FARE = 6000;

export const CATEGORY_MULTIPLIER = {
  economy: 1.0,
  xl: 1.4,
  premium: 1.8,
};

export const COMMISSION_RATE = 0.2;

export const CATEGORIES = Object.keys(CATEGORY_MULTIPLIER);