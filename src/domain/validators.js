import { CATEGORIES } from '../config/pricing';
import {
  CAPACITY_RANGE,
  GENDERS,
  MAX_PHOTO_MB,
  MIN_DRIVER_AGE,
  MIN_VEHICLE_YEAR,
  NAME_MAX_LENGTH,
  PAYMENT_METHODS,
  RENEWAL_WINDOW_DAYS,
  SHORT_TEXT_MAX_LENGTH,
  SIMULATOR_PLACES,
  SOAT_VALIDITY_YEARS,
  TECH_REVIEW_FROM_YEARS,
  VEHICLE_COLORS,
} from '../config/app';

// Cada función devuelve null si el valor es válido, o una clave
// de error que la pantalla traduce con t(), así el mensaje cambia con el idioma.
// Las que dependen de la fecha reciben `today` para poder probarlas con un día fijo.

const NAME_PATTERN = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PLATE_PATTERN = /^[A-Z]{3}\d{3}$/;

function isBlank(value) {
  return value === null || value === undefined || String(value).trim() === '';
}

function dayOnly(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isValidDate(value) {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

// Devuelve solo los campos con error, así `Object.keys(errors).length === 0`
// significa que el formulario está listo.
function withoutNulls(errors) {
  return Object.fromEntries(Object.entries(errors).filter(([, error]) => error !== null));
}

// La foto de documentos: basta con que haya una imagen elegida.
export function validatePhoto(uri) {
  return isBlank(uri) ? 'errors.photoRequired' : null;
}

// La foto elegida llega como { uri, fileSize }. Si el teléfono no informa el
// tamaño no puedo validarlo y la dejo pasar.
export function validatePhotoFile(photo) {
  const missing = validatePhoto(photo?.uri);
  if (missing) return missing;
  return photo.fileSize > MAX_PHOTO_MB * 1024 * 1024 ? 'errors.photoTooLarge' : null;
}

export function validateFullName(name) {
  if (isBlank(name)) return 'errors.required';
  const trimmed = name.trim();
  if (trimmed.length > NAME_MAX_LENGTH) return 'errors.nameTooLong';
  if (!NAME_PATTERN.test(trimmed)) return 'errors.nameInvalid';
  return null;
}

export function validateIdNumber(value) {
  if (isBlank(value)) return 'errors.required';
  return /^\d{6,10}$/.test(String(value).trim()) ? null : 'errors.idNumberInvalid';
}

export function validatePhone(value) {
  if (isBlank(value)) return 'errors.required';
  return /^\d{10}$/.test(String(value).trim()) ? null : 'errors.phoneInvalid';
}

export function validateBirthDate(birthDate, today = new Date()) {
  if (!isValidDate(birthDate)) return 'errors.required';
  let age = today.getFullYear() - birthDate.getFullYear();
  const birthdayPending =
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate());
  if (birthdayPending) age -= 1;
  return age >= MIN_DRIVER_AGE ? null : 'errors.underage';
}

// El valor debe ser una de las opciones de la lista.
export function validateOption(value, options) {
  if (isBlank(value)) return 'errors.required';
  return options.includes(value) ? null : 'errors.optionInvalid';
}

export function validateCategory(value) {
  return validateOption(value, CATEGORIES);
}

export function validateEmail(value) {
  if (isBlank(value)) return 'errors.required';
  return EMAIL_PATTERN.test(value.trim()) ? null : 'errors.emailInvalid';
}

// La placa se guarda en mayúsculas.
export function normalizePlate(value) {
  return isBlank(value) ? '' : value.trim().toUpperCase();
}

export function validatePlate(value) {
  if (isBlank(value)) return 'errors.required';
  return PLATE_PATTERN.test(normalizePlate(value)) ? null : 'errors.plateInvalid';
}

// Marca y modelo.
export function validateShortText(value) {
  if (isBlank(value)) return 'errors.required';
  return value.trim().length > SHORT_TEXT_MAX_LENGTH ? 'errors.textTooLong' : null;
}

export function validateYear(value, today = new Date()) {
  if (isBlank(value)) return 'errors.required';
  if (!/^\d{4}$/.test(String(value).trim())) return 'errors.yearInvalid';
  const year = Number(value);
  if (year < MIN_VEHICLE_YEAR) return 'errors.yearTooOld';
  return year > today.getFullYear() ? 'errors.yearInFuture' : null;
}

export function validateCapacity(value, category) {
  if (isBlank(value)) return 'errors.required';
  const capacity = Number(value);
  if (!Number.isInteger(capacity) || capacity < 1) return 'errors.capacityInvalid';
  const range = CAPACITY_RANGE[category];
  if (range && (capacity < range.min || capacity > range.max)) return `errors.${category}Capacity`;
  return null;
}

// El documento vence después de hoy.
export function validateExpiryDate(expiryDate, today = new Date()) {
  if (!isValidDate(expiryDate)) return 'errors.required';
  return dayOnly(expiryDate) > dayOnly(today) ? null : 'errors.expired';
}

// Un SOAT comprado hoy dura un año, hasta el día anterior a hoy del año
// siguiente. Ese es el vencimiento más lejano que acepto.
export function maxSoatExpiry(today = new Date()) {
  return new Date(today.getFullYear() + SOAT_VALIDITY_YEARS, today.getMonth(), today.getDate() - 1);
}

export function validateSoatExpiry(expiryDate, today = new Date()) {
  const error = validateExpiryDate(expiryDate, today);
  if (error) return error;
  return dayOnly(expiryDate) > maxSoatExpiry(today) ? 'errors.soatTooFar' : null;
}

// La revisión técnico-mecánica solo se pide desde cierta edad del vehículo.
export function needsTechnicalReview(vehicleYear, today = new Date()) {
  return today.getFullYear() - Number(vehicleYear) >= TECH_REVIEW_FROM_YEARS;
}

export function validateTerms(accepted) {
  return accepted === true ? null : 'errors.termsRequired';
}

// Aplicado al formulario: sin un año válido todavía no sé si se pide.
export function requiresTechInspection(values, today = new Date()) {
  return validateYear(values.year, today) === null && needsTechnicalReview(values.year, today);
}

// Los documentos que vencen. La revisión técnico-mecánica entra cuando el
// vehículo ya la necesita (VA-18), aunque no se haya cargado al registrarse.
export function expiringDocuments(values, today = new Date()) {
  return requiresTechInspection(values, today) ? ['license', 'soat', 'techInspection'] : ['license', 'soat'];
}

// Un documento sin fecha cuenta como vencido: es la revisión técnico-mecánica
// que el vehículo empezó a necesitar después del registro.
function isExpired(expiryDate, today) {
  return validateExpiryDate(expiryDate, today) !== null;
}

// Vencido, o con menos de RENEWAL_WINDOW_DAYS días por delante.
function isDueForRenewal(expiryDate, today) {
  if (!isValidDate(expiryDate)) return true;
  const limit = new Date(today.getFullYear(), today.getMonth(), today.getDate() + RENEWAL_WINDOW_DAYS);
  return dayOnly(expiryDate) < limit;
}

// Los documentos que el conductor puede renovar hoy en Perfil.
export function documentsDueForRenewal(values, today = new Date()) {
  return expiringDocuments(values, today).filter((name) => isDueForRenewal(values[`${name}ExpiresAt`], today));
}

// Con uno de estos vencido, el conductor no puede ponerse disponible.
export function expiredDocuments(values, today = new Date()) {
  return expiringDocuments(values, today).filter((name) => isExpired(values[`${name}ExpiresAt`], today));
}

// Renovar: la foto y el vencimiento de cada documento de `documents`, con las
// reglas del registro. Una fecha que vuelve a caer en la ventana de renovación
// no es la de un documento nuevo.
export function validateRenewal(values, documents, today = new Date()) {
  const errors = {};
  documents.forEach((name) => {
    const expiry = values[`${name}ExpiresAt`];
    const dateError = name === 'soat' ? validateSoatExpiry(expiry, today) : validateExpiryDate(expiry, today);
    errors[`${name}Photo`] = validatePhotoFile(values[`${name}Photo`]);
    errors[`${name}ExpiresAt`] = dateError ?? (isDueForRenewal(expiry, today) ? 'errors.renewalStillDue' : null);
  });
  return withoutNulls(errors);
}

// El contacto, lo único que un conductor aprobado
// cambia sin volver a revisión.
function contactChecks(values) {
  return {
    phone: validatePhone(values.phone),
    gender: validateOption(values.gender, GENDERS),
    email: validateEmail(values.email),
    mercadoPagoEmail: validateEmail(values.mercadoPagoEmail),
  };
}

export function validateContact(values) {
  return withoutNulls(contactChecks(values));
}

// Los datos del conductor, con las mismas reglas del registro.
export function validateProfile(values, today = new Date()) {
  const errors = {
    profilePhoto: validatePhotoFile(values.profilePhoto),
    fullName: validateFullName(values.fullName),
    documentNumber: validateIdNumber(values.documentNumber),
    birthDate: validateBirthDate(values.birthDate, today),
    ...contactChecks(values),

    category: validateCategory(values.category),
    plate: validatePlate(values.plate),
    brand: validateShortText(values.brand),
    model: validateShortText(values.model),
    year: validateYear(values.year, today),
    color: validateOption(values.color, VEHICLE_COLORS),
    capacity: validateCapacity(values.capacity, values.category),
    vehiclePhoto: validatePhotoFile(values.vehiclePhoto),

    // En Colombia el número de la licencia es el de la cédula del conductor.
    licenseNumber: validateIdNumber(values.licenseNumber),
    licensePhoto: validatePhotoFile(values.licensePhoto),
    licenseExpiresAt: validateExpiryDate(values.licenseExpiresAt, today),
    soatPhoto: validatePhotoFile(values.soatPhoto),
    soatExpiresAt: validateSoatExpiry(values.soatExpiresAt, today),
  };

  if (requiresTechInspection(values, today)) {
    errors.techInspectionPhoto = validatePhotoFile(values.techInspectionPhoto);
    errors.techInspectionExpiresAt = validateExpiryDate(values.techInspectionExpiresAt, today);
  }

  return withoutNulls(errors);
}

// El registro de las tres pestañas es el perfil más la aceptación de
// los términos (VA-20), que solo se pide al registrarse.
export function validateRegistration(values, today = new Date()) {
  const errors = validateProfile(values, today);
  const terms = validateTerms(values.termsAccepted);
  return terms ? { ...errors, termsAccepted: terms } : errors;
}

// Cliente simulado. La propina es opcional: vacía cuenta como 0, y si la
// escriben debe ser un número entero de pesos.
export function validateTip(value) {
  if (isBlank(value)) return null;
  const text = String(value).trim();
  if (!/^\d+$/.test(text)) return 'errors.tipInvalid';
  // La especificación no fija un máximo. Este es el límite de JavaScript: por
  // encima, Number() redondea y la propina guardada no sería la escrita.
  return Number.isSafeInteger(Number(text)) ? null : 'errors.tipTooLarge';
}

// vehicleCategory es la categoría del vehículo del conductor. Una solicitud de
// otra categoría no tiene a quién llegar, así que el simulador no la crea.
export function validateSimulatedTrip(values, vehicleCategory) {
  const placeIds = SIMULATOR_PLACES.map((place) => place.id);
  const errors = {
    origin: validateOption(values.origin, placeIds),
    destination: validateOption(values.destination, placeIds),
    category: validateCategory(values.category),
    paymentMethod: validateOption(values.paymentMethod, PAYMENT_METHODS),
    tip: validateTip(values.tip),
  };
  if (!errors.origin && !errors.destination && values.origin === values.destination) {
    errors.destination = 'errors.sameDestination';
  }
  if (!errors.category && vehicleCategory && values.category !== vehicleCategory) {
    errors.category = 'errors.noDriverForCategory';
  }
  return Object.fromEntries(Object.entries(errors).filter(([, error]) => error !== null));
}