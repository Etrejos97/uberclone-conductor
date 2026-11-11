import { useCallback, useRef, useState } from 'react';
import { documentsDueForRenewal, validateContact, validateProfile, validateRenewal } from '../domain/validators';
import {
  clearDocuments,
  photoFieldsFor,
  savedPhotoUrls,
  toContactUpdate,
  toDriverProfile,
  toFormValues,
  toRenewalUpdate,
} from '../domain/driverProfile';
import { submitForReview, updateDriverProfile } from '../services/driverService';
import useDriverForm, { isConnectionError } from './useDriverForm';

// Perfil se edita de tres formas, según `mode`:
// - 'contact': el conductor aprobado cambia teléfono, género, correo y correo
//   de Mercado Pago. La cuenta sigue aprobada.
// - 'renewal': el conductor aprobado renueva los documentos vencidos o por
//   vencer. Solo esos se muestran, y la cuenta vuelve a revisión.
// - 'full': el conductor pendiente o rechazado corrige su registro, menos la
//   foto de perfil, y la cuenta queda en revisión.
// Cada modo valida y escribe solo sus campos; las reglas de Firestore
// rechazan los demás.
function setupFor(mode, driver) {
  const saved = toFormValues(driver);
  const photos = savedPhotoUrls(driver);
  if (mode === 'contact') {
    return { values: saved, photos, validate: validateContact, documents: [], showErrorsNow: true };
  }
  if (mode === 'renewal') {
    const documents = documentsDueForRenewal(saved);
    return {
      values: clearDocuments(saved, documents),
      photos,
      validate: (values) => validateRenewal(values, documents),
      documents,
      // Arranca vacío: los errores aparecen cuando el conductor pasa por cada campo.
      showErrorsNow: false,
    };
  }
  // Llega lleno y un documento puede haber vencido después del registro: el error tiene que verse.
  return { values: saved, photos, validate: validateProfile, documents: [], showErrorsNow: true };
}

export default function useProfileEdit(driverId, driver, mode) {
  // Tomo los datos una sola vez: si el documento cambia mientras edito, no pisa lo que escribí.
  const [setup] = useState(() => setupFor(mode, driver));
  const form = useDriverForm(setup.values, setup.validate, {
    savedPhotos: setup.photos,
    showErrorsNow: setup.showErrorsNow,
  });
  const { values, isComplete, uploadPhotos } = form;
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  // Frena un doble toque que llega antes de que React pinte `saving`.
  const busy = useRef(false);

  // Devuelve true si guardó, para que la pantalla vuelva al perfil.
  const save = useCallback(async () => {
    if (!isComplete || busy.current) return false;
    busy.current = true;
    setSaving(true);
    setSaveError(null);
    try {
      let photoFields = [];
      if (mode === 'renewal') photoFields = setup.documents.map((name) => `${name}Photo`);
      if (mode === 'full') photoFields = photoFieldsFor(values).filter((name) => name !== 'profilePhoto');
      const photoUrls = await uploadPhotos(values, photoFields);
      if (!photoUrls) {
        setSaveError('errors.profileUploadFailed');
        return false;
      }

      if (mode === 'contact') {
        await updateDriverProfile(driverId, toContactUpdate(values));
      } else if (mode === 'renewal') {
        await submitForReview(driverId, toRenewalUpdate(values, photoUrls, setup.documents));
      } else {
        // La foto de perfil queda fija: escribo la que ya estaba.
        await submitForReview(driverId, toDriverProfile(values, { ...photoUrls, profilePhoto: setup.photos.profilePhoto }));
      }
      return true;
    } catch (error) {
      // Guardar es una actualización con los mismos datos: reintentar no duplica nada.
      console.warn('No se pudo guardar el perfil:', error?.code, error?.message);
      // Las reglas rechazan lo que la cuenta ya no permite: el aprobador cambió
      // su estado mientras editaba. Reintentar no sirve; hay que abrir el perfil de nuevo.
      if (error?.code === 'permission-denied') setSaveError('errors.profileAccountChanged');
      else setSaveError(isConnectionError(error) ? 'errors.profileSaveConnection' : 'errors.profileSaveFailed');
      return false;
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }, [isComplete, values, uploadPhotos, driverId, mode, setup]);

  return { ...form, save, saving, saveError, documents: setup.documents };
}