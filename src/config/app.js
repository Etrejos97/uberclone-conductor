// Tiempos, intervalos y direcciones que usa toda la app.

export const LOCATION_INTERVAL_MS = 5000; // Cada 5 s como mínimo
export const LOCATION_DISTANCE_M = 10; // y solo si el conductor se movió 10 m

export const REQUEST_TIMEOUT_S = 15; // Tiempo para aceptar una solicitud
// Al abrir Inicio, una solicitud que no creó este teléfono vence después de 60 s
// según la hora del servidor (domain/requestExpiry.js).
export const STALE_REQUEST_S = 60;
export const ROUTE_TIMEOUT_MS = 8000; // OSRM: después de 8 s doy la ruta por fallida
export const OSRM_MIN_INTERVAL_MS = 1000; // El servidor público admite 1 solicitud por segundo

export const HISTORY_PAGE_SIZE = 20;

export const RATINGS = [1, 2, 3, 4, 5];

export const MIN_DRIVER_AGE = 18;
export const NAME_MAX_LENGTH = 50;
export const SHORT_TEXT_MAX_LENGTH = 30; // Marca y modelo
// Capacidad permitida por categoría.
export const CAPACITY_RANGE = {
  economy: { min: 4, max: 4 },
  xl: { min: 6, max: 8 },
  premium: { min: 4, max: 4 },
};
// Un carro particular hace la primera revisión técnico-mecánica a partir
// del quinto año de matriculado (Ley 769 de 2002, art. 52). Uso el año del modelo.
export const TECH_REVIEW_FROM_YEARS = 5;
export const MIN_VEHICLE_YEAR = 2010;
export const SOAT_VALIDITY_YEARS = 1;
// Perfil deja renovar un documento cuando ya venció o le faltan menos de estos
// días para vencer. Antes, la renovación está cerrada.
export const RENEWAL_WINDOW_DAYS = 7;

// Opciones de las listas desplegables. En Firestore quedan en
// inglés y la pantalla las traduce.
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

// Cliente simulado: métodos de pago y puntos fijos de Medellín para
// origen y destino. OSRM ajusta cada punto a la vía más cercana.
export const PAYMENT_METHODS = ['mercadopago', 'cash'];
export const SIMULATOR_PLACES = [
  { id: 'lleras', label: 'Parque Lleras', latitude: 6.2087, longitude: -75.5677 },
  { id: 'botero', label: 'Plaza Botero', latitude: 6.2524, longitude: -75.5686 },
  { id: 'nutibara', label: 'Pueblito Paisa', latitude: 6.2366, longitude: -75.579 },
  { id: 'olaya', label: 'Aeropuerto Olaya Herrera', latitude: 6.2201, longitude: -75.5904 },
  { id: 'atanasio', label: 'Estadio Atanasio Girardot', latitude: 6.2566, longitude: -75.5901 },
  { id: 'explora', label: 'Parque Explora', latitude: 6.2707, longitude: -75.5654 },
];

export const BACKEND_WAKE_TIMEOUT_MS = 60000; // Render tarda en despertar

export const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
export const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export const API_URL = process.env.EXPO_PUBLIC_API_URL;
export const OSRM_URL = process.env.EXPO_PUBLIC_OSRM_URL || 'https://router.project-osrm.org';