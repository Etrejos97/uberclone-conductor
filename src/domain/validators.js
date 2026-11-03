import { CATEGORIES } from '../config/pricing.js';
import {
  GENDERS,
  MAX_PHOTO_MB,
  MIN_DRIVER_AGE,
  NAME_MAX_LENGTH,
  SHORT_TEXT_MAX_LENGTH,
  TECH_REVIEW_FROM_YEARS,
  VEHICLE_COLORS,
  XL_MIN_CAPACITY,
} from '../config/app.js';

// VA-01 a VA-20. Cada función devuelve null si el valor es válido, o una clave
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

// VA-01, VA-15 y las fotos de documentos: basta con que haya una imagen elegida.
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

// VA-02
export function validateFullName(name) {
  if (isBlank(name)) return 'errors.required';
  const trimmed = name.trim();
  if (trimmed.length > NAME_MAX_LENGTH) return 'errors.nameTooLong';
  if (!NAME_PATTERN.test(trimmed)) return 'errors.nameInvalid';
  return null;
}

// VA-03
export function validateIdNumber(value) {
  if (isBlank(value)) return 'errors.required';
  return /^\d{6,10}$/.test(String(value).trim()) ? null : 'errors.idNumberInvalid';
}

// VA-04
export function validatePhone(value) {
  if (isBlank(value)) return 'errors.required';
  return /^\d{10}$/.test(String(value).trim()) ? null : 'errors.phoneInvalid';
}

// VA-05
export function validateBirthDate(birthDate, today = new Date()) {
  if (!isValidDate(birthDate)) return 'errors.required';
  let age = today.getFullYear() - birthDate.getFullYear();
  const birthdayPending =
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate());
  if (birthdayPending) age -= 1;
  return age >= MIN_DRIVER_AGE ? null : 'errors.underage';
}

// VA-06, VA-08, VA-09, VA-13: el valor debe ser una de las opciones de la lista.
export function validateOption(value, options) {
  if (isBlank(value)) return 'errors.required';
  return options.includes(value) ? null : 'errors.optionInvalid';
}

export function validateCategory(value) {
  return validateOption(value, CATEGORIES);
}

// VA-07 y VA-19
export function validateEmail(value) {
  if (isBlank(value)) return 'errors.required';
  return EMAIL_PATTERN.test(value.trim()) ? null : 'errors.emailInvalid';
}

// VA-10: la placa se guarda en mayúsculas.
export function normalizePlate(value) {
  return isBlank(value) ? '' : value.trim().toUpperCase();
}

export function validatePlate(value) {
  if (isBlank(value)) return 'errors.required';
  return PLATE_PATTERN.test(normalizePlate(value)) ? null : 'errors.plateInvalid';
}

// VA-11: marca y modelo.
export function validateShortText(value) {
  if (isBlank(value)) return 'errors.required';
  return value.trim().length > SHORT_TEXT_MAX_LENGTH ? 'errors.textTooLong' : null;
}

// VA-12
export function validateYear(value, today = new Date()) {
  if (isBlank(value)) return 'errors.required';
  if (!/^\d{4}$/.test(String(value).trim())) return 'errors.yearInvalid';
  return Number(value) > today.getFullYear() ? 'errors.yearInFuture' : null;
}

// VA-14
export function validateCapacity(value, category) {
  if (isBlank(value)) return 'errors.required';
  const capacity = Number(value);
  if (!Number.isInteger(capacity) || capacity < 1) return 'errors.capacityInvalid';
  if (category === 'xl' && capacity < XL_MIN_CAPACITY) return 'errors.xlCapacity';
  return null;
}

// VA-16, VA-17, VA-18: el documento vence después de hoy.
export function validateExpiryDate(expiryDate, today = new Date()) {
  if (!isValidDate(expiryDate)) return 'errors.required';
  return dayOnly(expiryDate) > dayOnly(today) ? null : 'errors.expired';
}

// VA-18: la revisión técnico-mecánica solo se pide desde cierta edad del vehículo.
export function needsTechnicalReview(vehicleYear, today = new Date()) {
  return today.getFullYear() - Number(vehicleYear) >= TECH_REVIEW_FROM_YEARS;
}

// VA-20
export function validateTerms(accepted) {
  return accepted === true ? null : 'errors.termsRequired';
}

// VA-18 aplicado al formulario: sin un año válido todavía no sé si se pide.
export function requiresTechInspection(values, today = new Date()) {
  return validateYear(values.year, today) === null && needsTechnicalReview(values.year, today);
}

// RF-03: valida el formulario completo de las tres pestañas. Devuelve solo los
// campos con error, así `Object.keys(errors).length === 0` significa que está listo.
export function validateRegistration(values, today = new Date()) {
  const errors = {
    profilePhoto: validatePhotoFile(values.profilePhoto),
    fullName: validateFullName(values.fullName),
    documentNumber: validateIdNumber(values.documentNumber),
    phone: validatePhone(values.phone),
    birthDate: validateBirthDate(values.birthDate, today),
    gender: validateOption(values.gender, GENDERS),
    email: validateEmail(values.email),

    category: validateCategory(values.category),
    plate: validatePlate(values.plate),
    brand: validateShortText(values.brand),
    model: validateShortText(values.model),
    year: validateYear(values.year, today),
    color: validateOption(values.color, VEHICLE_COLORS),
    capacity: validateCapacity(values.capacity, values.category),
    vehiclePhoto: validatePhotoFile(values.vehiclePhoto),

    // VA-16: en Colombia el número de la licencia es el de la cédula del conductor.
    licenseNumber: validateIdNumber(values.licenseNumber),
    licensePhoto: validatePhotoFile(values.licensePhoto),
    licenseExpiresAt: validateExpiryDate(values.licenseExpiresAt, today),
    soatPhoto: validatePhotoFile(values.soatPhoto),
    soatExpiresAt: validateExpiryDate(values.soatExpiresAt, today),
    mercadoPagoEmail: validateEmail(values.mercadoPagoEmail),
    termsAccepted: validateTerms(values.termsAccepted),
  };

  if (requiresTechInspection(values, today)) {
    errors.techInspectionPhoto = validatePhotoFile(values.techInspectionPhoto);
    errors.techInspectionExpiresAt = validateExpiryDate(values.techInspectionExpiresAt, today);
  }

  return Object.fromEntries(Object.entries(errors).filter(([, error]) => error !== null));
}