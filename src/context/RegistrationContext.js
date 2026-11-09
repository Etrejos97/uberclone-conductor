import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { validateRegistration } from '../domain/validators';
import { photoFieldsFor, toDriverProfile } from '../domain/driverProfile';
import { uploadImage } from '../services/uploadService';
import { createDriver, driverExists, newDriverId } from '../services/driverService';
import { useSession } from './SessionContext';

// Mensaje para cada código de falla de uploadService. Sin código conocido, la causa es la red.
const UPLOAD_ERRORS = {
  timeout: 'errors.uploadTimeout',
  fileMissing: 'errors.photoMissing',
  rejected: 'errors.uploadRejected',
  config: 'errors.uploadConfig',
};

// Fallas del guardado que se arreglan con conexión: el tiempo límite de
// withTimeout y el `unavailable` que lanza Firestore cuando no hay red.
const CONNECTION_CODES = ['timeout', 'unavailable'];

const INITIAL_VALUES = {
  profilePhoto: null,
  fullName: '',
  documentNumber: '',
  phone: '',
  birthDate: null,
  gender: '',
  email: '',
  category: '',
  plate: '',
  brand: '',
  model: '',
  year: '',
  color: '',
  capacity: '',
  vehiclePhoto: null,
  licenseNumber: '',
  licensePhoto: null,
  licenseExpiresAt: null,
  soatPhoto: null,
  soatExpiresAt: null,
  techInspectionPhoto: null,
  techInspectionExpiresAt: null,
  mercadoPagoEmail: '',
  termsAccepted: false,
};

// Qué campos pertenecen a cada pestaña, para decirle al conductor dónde le falta algo.
export const TAB_FIELDS = {
  PersonalData: ['profilePhoto', 'fullName', 'documentNumber', 'phone', 'birthDate', 'gender', 'email'],
  Vehicle: ['category', 'plate', 'brand', 'model', 'year', 'color', 'capacity', 'vehiclePhoto'],
  Documents: [
    'licenseNumber',
    'licensePhoto',
    'licenseExpiresAt',
    'soatPhoto',
    'soatExpiresAt',
    'techInspectionPhoto',
    'techInspectionExpiresAt',
    'mercadoPagoEmail',
    'termsAccepted',
  ],
};

const RegistrationContext = createContext(null);

// Estado del formulario de las tres pestañas (AD-09). Las pestañas solo leen
// y escriben aquí; validar, subir fotos y crear el conductor pasa en este archivo.
export function RegistrationProvider({ children }) {
  const { startSession } = useSession();
  const [values, setValues] = useState(INITIAL_VALUES);
  const [touched, setTouched] = useState({});
  const [uploadErrors, setUploadErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  // Fotos que ya subieron en un intento anterior: si el envío falla y se
  // reintenta, no las vuelvo a subir mientras el conductor no las cambie.
  const uploaded = useRef({});
  // Frena un doble toque que llega antes de que React pinte `submitting`.
  const sending = useRef(false);
  // Id del conductor de este registro: se genera en el primer intento de
  // guardarlo y se reusa en los reintentos, así nunca quedan dos conductores.
  const driverIdRef = useRef(null);

  const errors = useMemo(() => validateRegistration(values), [values]);
  const isComplete = Object.keys(errors).length === 0;

  const incompleteTabs = useMemo(
    () => Object.keys(TAB_FIELDS).filter((tab) => TAB_FIELDS[tab].some((name) => errors[name])),
    [errors]
  );

  // Pestañas con fotos que no subieron, porque el error puede estar en otra pestaña.
  const failedUploadTabs = useMemo(
    () => Object.keys(TAB_FIELDS).filter((tab) => TAB_FIELDS[tab].some((name) => uploadErrors[name])),
    [uploadErrors]
  );

  const setField = useCallback((name, value) => {
    setValues((current) => ({ ...current, [name]: value }));
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
      error: uploadErrors[name] || (touched[name] ? errors[name] : null),
      onChange: (value) => setField(name, value),
      onBlur: () => touch(name),
    }),
    [values, uploadErrors, touched, errors, setField, touch]
  );

  // Subo todas las fotos y, solo si todas subieron, creo el conductor.
  const submit = useCallback(async () => {
    if (!isComplete || sending.current) return;
    sending.current = true;
    setSubmitting(true);
    setSubmitError(null);
    setUploadErrors({});

    try {
      const photoFields = photoFieldsFor(values);
      const results = await Promise.allSettled(
        photoFields.map(async (name) => {
          const photo = values[name];
          const previous = uploaded.current[name];
          if (previous && previous.uri === photo.uri) return previous.url;
          const url = await uploadImage(photo);
          uploaded.current[name] = { uri: photo.uri, url };
          return url;
        })
      );

      // Cada foto que falló muestra qué hacer; el detalle técnico queda en la terminal de Expo.
      const failed = {};
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') return;
        const name = photoFields[index];
        console.warn(`No subió ${name}:`, result.reason?.message);
        failed[name] = UPLOAD_ERRORS[result.reason?.code] ?? 'errors.uploadFailed';
      });
      if (Object.keys(failed).length > 0) {
        setUploadErrors(failed);
        setSubmitError('errors.uploadFailedSummary');
        return;
      }

      const photoUrls = Object.fromEntries(photoFields.map((name, index) => [name, results[index].value]));
      // En un reintento, el conductor pudo quedar guardado aunque el intento
      // anterior pasó del tiempo límite o falló al guardar la sesión.
      const isRetry = driverIdRef.current !== null;
      if (!isRetry) driverIdRef.current = newDriverId();
      const driverId = driverIdRef.current;
      try {
        if (!isRetry || !(await driverExists(driverId))) {
          await createDriver(driverId, toDriverProfile(values, photoUrls));
        }
      } catch (error) {
        // Si el intento anterior pasó del tiempo límite, su escritura pudo llegar
        // después. Mi reintento es entonces una segunda escritura sobre un
        // conductor que ya existe, y las reglas la rechazan. Si existe, sigo.
        const alreadySaved =
          isRetry && error?.code === 'permission-denied' && (await driverExists(driverId));
        if (!alreadySaved) throw error;
      }
      await startSession(driverId);
    } catch (error) {
      console.warn('No se pudo guardar el conductor:', error?.code, error?.message);
      setSubmitError(CONNECTION_CODES.includes(error?.code) ? 'errors.saveConnection' : 'errors.saveFailed');
    } finally {
      sending.current = false;
      setSubmitting(false);
    }
  }, [isComplete, values, startSession]);

  const value = useMemo(
    () => ({ values, field, isComplete, incompleteTabs, failedUploadTabs, submit, submitting, submitError }),
    [values, field, isComplete, incompleteTabs, failedUploadTabs, submit, submitting, submitError]
  );

  return <RegistrationContext.Provider value={value}>{children}</RegistrationContext.Provider>;
}

export function useRegistration() {
  const context = useContext(RegistrationContext);
  if (!context) throw new Error('useRegistration debe usarse dentro de RegistrationProvider');
  return context;
}