import {
  CAPACITY_RANGE,
  MAX_PHOTO_MB,
  MIN_DRIVER_AGE,
  MIN_VEHICLE_YEAR,
  NAME_MAX_LENGTH,
  SHORT_TEXT_MAX_LENGTH,
} from '../config/app';

// Valores que muestran algunos mensajes de error. Salen de la configuración
// para que el texto cambie solo si cambia la regla.
export const ERROR_PARAMS = {
  minAge: MIN_DRIVER_AGE,
  maxName: NAME_MAX_LENGTH,
  maxText: SHORT_TEXT_MAX_LENGTH,
  minYear: MIN_VEHICLE_YEAR,
  economyMax: CAPACITY_RANGE.economy.max,
  xlMin: CAPACITY_RANGE.xl.min,
  xlMax: CAPACITY_RANGE.xl.max,
  premiumMax: CAPACITY_RANGE.premium.max,
  maxPhotoMb: MAX_PHOTO_MB,
};