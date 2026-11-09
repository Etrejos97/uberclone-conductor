// Reglas de negocio y constantes que usa toda la app.

export const MIN_DRIVER_AGE = 18; // VA-05
export const NAME_MAX_LENGTH = 50; // VA-02
export const SHORT_TEXT_MAX_LENGTH = 30; // VA-11: marca y modelo
// Capacidad permitida por categoría.
export const CAPACITY_RANGE = {
  economy: { min: 4, max: 4 },
  xl: { min: 6, max: 8 },
  premium: { min: 4, max: 4 },
};
// Un carro particular hace la primera revisión técnico-mecánica a partir
// del quinto año de matriculado (Ley 769 de 2002, art. 52). Uso el año del modelo.
export const TECH_REVIEW_FROM_YEARS = 5;
export const MIN_VEHICLE_YEAR = 2010; // VA-12
export const SOAT_VALIDITY_YEARS = 1; // VA-17

// Opciones de las listas desplegables. En Firestore quedan en
// inglés y la pantalla las traduce (RNF-14).
export const GENDERS = ['female', 'male', 'other', 'undisclosed'];
export const VEHICLE_COLORS = ['white', 'black', 'gray', 'silver', 'red', 'blue', 'green', 'other'];

// Fotos del registro. Cloudinary no limita el tamaño desde el preset, así que
// la app comprime al elegir la foto y rechaza las que pasan del máximo.
export const PHOTO_QUALITY = 0.6;
export const MAX_PHOTO_MB = 5;
export const UPLOAD_TIMEOUT_MS = 30000;
// Sin red, Firestore deja la escritura en cola y no responde: después de este
// tiempo le digo al conductor que revise la conexión.
export const SAVE_TIMEOUT_MS = 15000;

export const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
export const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;