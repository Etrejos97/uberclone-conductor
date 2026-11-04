import { File } from 'expo-file-system';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET, UPLOAD_TIMEOUT_MS } from '../config/app';

// Cada falla lleva un `code` para que el registro le diga al conductor qué
// hacer: reintentar no sirve si la foto ya no existe o si Cloudinary la rechazó.
function uploadError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

// Sube una foto a Cloudinary con el preset sin firma y devuelve su URL.
// `photo.uri` es la ruta local que entrega expo-image-picker. El fetch de Expo
// solo acepta un Blob dentro de FormData; File de expo-file-system lo es.
export async function uploadImage(photo) {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw uploadError('config', 'Falta configuración de Cloudinary en .env');
  }

  // El sistema puede borrar la copia temporal que deja el selector de fotos.
  const file = new File(photo.uri);
  if (!file.exists) {
    throw uploadError('fileMissing', `La foto ya no existe en ${photo.uri}`);
  }

  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: form,
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw uploadError('timeout', `La subida pasó de ${UPLOAD_TIMEOUT_MS / 1000} s`);
    }
    throw uploadError('network', error.message);
  } finally {
    clearTimeout(timer);
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    // Un 4xx es un rechazo (preset, formato); un 5xx es de Cloudinary y puede pasar al reintentar.
    const code = response.status < 500 ? 'rejected' : 'network';
    throw uploadError(code, `Cloudinary respondió ${response.status}: ${body?.error?.message ?? 'sin detalle'}`);
  }
  if (!body?.secure_url) {
    throw uploadError('rejected', 'Cloudinary no devolvió la URL de la foto');
  }
  return body.secure_url;
}