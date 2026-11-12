import { useCallback, useMemo, useRef, useState } from 'react';
import { uploadImage } from '../services/uploadService';

// Mensaje para cada código de falla de uploadService. Sin código conocido, la causa es la red.
const UPLOAD_ERRORS = {
  timeout: 'errors.uploadTimeout',
  fileMissing: 'errors.photoMissing',
  rejected: 'errors.uploadRejected',
  config: 'errors.uploadConfig',
};

// Fallas del guardado que se arreglan con conexión: el tiempo límite de
// withTimeout y el `unavailable` que lanza Firestore cuando no hay red.
export function isConnectionError(error) {
  return ['timeout', 'unavailable'].includes(error?.code);
}

// El formulario del conductor que comparten el registro y Perfil: valores,
// errores de validación, cuándo mostrarlos y la subida de fotos a Cloudinary.
// `savedPhotos` son las URL de las fotos que ya están guardadas, por campo.
// Con `showErrorsNow` los errores se ven sin esperar a que el conductor pase
// por el campo: Perfil arranca lleno y un documento vencido tiene que verse.
export default function useDriverForm(initialValues, validate, { savedPhotos = {}, showErrorsNow = false } = {}) {
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState({});
  const [uploadErrors, setUploadErrors] = useState({});
  const [dirty, setDirty] = useState(false);
  // Fotos que ya están en Cloudinary: las guardadas y las que subieron en un
  // intento anterior. No vuelvo a subir una mientras el conductor no la cambie.
  const uploaded = useRef(null);
  if (uploaded.current === null) {
    uploaded.current = Object.fromEntries(
      Object.entries(savedPhotos).map(([name, url]) => [name, { uri: url, url }])
    );
  }

  const errors = useMemo(() => validate(values), [validate, values]);
  const isComplete = Object.keys(errors).length === 0;

  const setField = useCallback((name, value) => {
    setValues((current) => ({ ...current, [name]: value }));
    setDirty(true);
    setUploadErrors((current) => {
      if (!current[name]) return current;
      const { [name]: _removed, ...rest } = current;
      return rest;
    });
  }, []);

  const touch = useCallback((name) => {
    setTouched((current) => (current[name] ? current : { ...current, [name]: true }));
  }, []);

  // El error de un campo aparece cuando el conductor ya pasó por él.
  const field = useCallback(
    (name) => ({
      value: values[name],
      error: uploadErrors[name] || (showErrorsNow || touched[name] ? errors[name] : null),
      onChange: (value) => setField(name, value),
      onBlur: () => touch(name),
    }),
    [values, uploadErrors, showErrorsNow, touched, errors, setField, touch]
  );

  // Sube las fotos de `photoFields` que todavía no están en Cloudinary.
  // Devuelve sus URL por campo, o null si alguna falló. Cada foto que falló
  // muestra qué hacer; el detalle técnico queda en la terminal de Expo.
  const uploadPhotos = useCallback(async (formValues, photoFields) => {
    setUploadErrors({});
    const results = await Promise.allSettled(
      photoFields.map(async (name) => {
        const photo = formValues[name];
        const previous = uploaded.current[name];
        if (previous && previous.uri === photo.uri) return previous.url;
        const url = await uploadImage(photo);
        uploaded.current[name] = { uri: photo.uri, url };
        return url;
      })
    );

    const failed = {};
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') return;
      const name = photoFields[index];
      console.warn(`No subió ${name}:`, result.reason?.message);
      failed[name] = UPLOAD_ERRORS[result.reason?.code] ?? 'errors.uploadFailed';
    });
    if (Object.keys(failed).length > 0) {
      setUploadErrors(failed);
      return null;
    }
    return Object.fromEntries(photoFields.map((name, index) => [name, results[index].value]));
  }, []);

  return { values, errors, isComplete, uploadErrors, field, dirty, uploadPhotos };
}