import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { validateRegistration } from '../domain/validators';
import { photoFieldsFor, toDriverProfile } from '../domain/driverProfile';
import { createDriver, driverExists, findDriverIdByDocument, newDriverId } from '../services/driverService';
import useDriverForm, { isConnectionError } from '../hooks/useDriverForm';
import { useSession } from './SessionContext';

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

// Estado del formulario de las tres pestañas. Las pestañas solo leen
// y escriben aquí. Los valores, los errores y la subida de fotos son de
// useDriverForm, que también usa Perfil; crear el conductor pasa en este archivo.
// `documentNumber` es la cédula que el conductor buscó en el ingreso y no existía.
export function RegistrationProvider({ children, documentNumber = '' }) {
  const { startSession } = useSession();
  const { values, errors, isComplete, uploadErrors, field, uploadPhotos } = useDriverForm(
    { ...INITIAL_VALUES, documentNumber },
    validateRegistration
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  // Frena un doble toque que llega antes de que React pinte `submitting`.
  const sending = useRef(false);
  // Id del conductor de este registro: se genera en el primer intento de
  // guardarlo y se reusa en los reintentos, así nunca quedan dos conductores.
  const driverIdRef = useRef(null);

  const incompleteTabs = useMemo(
    () => Object.keys(TAB_FIELDS).filter((tab) => TAB_FIELDS[tab].some((name) => errors[name])),
    [errors]
  );

  // Pestañas con fotos que no subieron, porque el error puede estar en otra pestaña.
  const failedUploadTabs = useMemo(
    () => Object.keys(TAB_FIELDS).filter((tab) => TAB_FIELDS[tab].some((name) => uploadErrors[name])),
    [uploadErrors]
  );

  // Subo todas las fotos y, solo si todas subieron, creo el conductor.
  const submit = useCallback(async () => {
    if (!isComplete || sending.current) return;
    sending.current = true;
    setSubmitting(true);
    setSubmitError(null);

    try {
      // El ingreso busca al conductor por la cédula, así que no puede haber dos
      // con la misma. Lo reviso antes de subir las fotos, también en un
      // reintento: ahí la cédula puede ser la del conductor que guardé antes, y
      // solo la rechazo si es de otro.
      const owner = await findDriverIdByDocument(values.documentNumber.trim());
      if (owner && owner !== driverIdRef.current) {
        setSubmitError('errors.documentTaken');
        return;
      }

      const photoUrls = await uploadPhotos(values, photoFieldsFor(values));
      if (!photoUrls) {
        setSubmitError('errors.uploadFailedSummary');
        return;
      }

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
      setSubmitError(isConnectionError(error) ? 'errors.saveConnection' : 'errors.saveFailed');
    } finally {
      sending.current = false;
      setSubmitting(false);
    }
  }, [isComplete, values, uploadPhotos, startSession]);

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