import {
  MAX_PHOTO_MB,
  MIN_DRIVER_AGE,
  NAME_MAX_LENGTH,
  SHORT_TEXT_MAX_LENGTH,
  XL_MIN_CAPACITY,
} from '../config/app';

// Valores que muestran algunos mensajes de error. Salen de la configuración
// para que el texto cambie solo si cambia la regla.
export const ERROR_PARAMS = {
  minAge: MIN_DRIVER_AGE,
  maxName: NAME_MAX_LENGTH,
  maxText: SHORT_TEXT_MAX_LENGTH,
  xlMin: XL_MIN_CAPACITY,
  maxPhotoMb: MAX_PHOTO_MB,
};