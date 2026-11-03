// Reglas de negocio y constantes que usa toda la app.

export const MIN_DRIVER_AGE = 18; 
export const NAME_MAX_LENGTH = 50; 
export const SHORT_TEXT_MAX_LENGTH = 30; 
export const XL_MIN_CAPACITY = 6; // VA-14
// VA-18: un carro particular hace la primera revisión técnico-mecánica a partir
// del quinto año de matriculado (Ley 769 de 2002, art. 52). Uso el año del modelo.
export const TECH_REVIEW_FROM_YEARS = 5;

// VA-06 y VA-13: opciones de las listas desplegables. En Firestore quedan en
// inglés y la pantalla las traduce (RNF-14).
export const GENDERS = ['female', 'male', 'other', 'undisclosed'];
export const VEHICLE_COLORS = ['white', 'black', 'gray', 'silver', 'red', 'blue', 'green', 'other'];

// Fotos del registro. Cloudinary no limita el tamaño desde el preset, así que
// la app comprime al elegir la foto y rechaza las que pasan del máximo (AD-08).
export const PHOTO_QUALITY = 0.6;
export const MAX_PHOTO_MB = 5;
export const UPLOAD_TIMEOUT_MS = 30000;
// Sin red, Firestore deja la escritura en cola y no responde: después de este
// tiempo le digo al conductor que revise la conexión.
export const SAVE_TIMEOUT_MS = 15000;

export const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
export const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;