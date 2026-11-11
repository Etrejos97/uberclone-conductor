import { normalizePlate, requiresTechInspection } from './validators';

// Arma los datos del conductor que van a drivers/{driverId} a partir del
// formulario ya validado y de las URL de Cloudinary. Solo trae lo que escribió
// el conductor. Los campos del sistema (approvalStatus, isAvailable, location...)
// y las fechas de creación los pone driverService.
// El aprobador escribe approvalStatus a mano en la consola de Firebase. Un valor
// que no es uno de estos no aprueba la cuenta, y la pantalla lo dice con un texto
// propio en vez de buscar una traducción que no existe.
const APPROVAL_STATUSES = ['pending', 'approved', 'rejected'];

export function approvalTextKey(approvalStatus) {
  return APPROVAL_STATUSES.includes(approvalStatus) ? approvalStatus : 'unknown';
}

// Mientras nadie aprueba la cuenta, o si la rechazaron, el conductor corrige
// sus datos y vuelve a revisión. Con la cuenta aprobada solo cambia el contacto
// y renueva documentos. Un estado que no reconozco no abre la edición completa.
export function editsWholeProfile(approvalStatus) {
  return approvalStatus === 'pending' || approvalStatus === 'rejected';
}

// Editar contacto escribe solo esto, limpio como en el registro.
export function toContactUpdate(values) {
  return {
    phone: values.phone.trim(),
    email: values.email.trim().toLowerCase(),
    gender: values.gender,
    mercadoPagoEmail: values.mercadoPagoEmail.trim().toLowerCase(),
  };
}

export function toDriverProfile(values, photoUrls, today = new Date()) {
  const withTechInspection = requiresTechInspection(values, today);

  return {
    fullName: values.fullName.trim(),
    documentNumber: values.documentNumber.trim(),
    ...toContactUpdate(values),
    birthDate: values.birthDate,
    photoUrl: photoUrls.profilePhoto,
    vehicle: {
      category: values.category,
      plate: normalizePlate(values.plate),
      brand: values.brand.trim(),
      model: values.model.trim(),
      year: Number(values.year),
      color: values.color,
      capacity: Number(values.capacity),
      photoUrl: photoUrls.vehiclePhoto,
    },
    documents: {
      licenseNumber: values.licenseNumber.trim(),
      licensePhotoUrl: photoUrls.licensePhoto,
      licenseExpiresAt: values.licenseExpiresAt,
      soatPhotoUrl: photoUrls.soatPhoto,
      soatExpiresAt: values.soatExpiresAt,
      techInspectionPhotoUrl: withTechInspection ? photoUrls.techInspectionPhoto : null,
      techInspectionExpiresAt: withTechInspection ? values.techInspectionExpiresAt : null,
    },
  };
}

// Renovar documentos escribe la foto y el vencimiento de los renovados, cada
// uno con su ruta dentro de `documents`: el resto del mapa no cambia.
export function toRenewalUpdate(values, photoUrls, documents) {
  return Object.fromEntries(
    documents.flatMap((name) => [
      [`documents.${name}PhotoUrl`, photoUrls[`${name}Photo`]],
      [`documents.${name}ExpiresAt`, values[`${name}ExpiresAt`]],
    ])
  );
}

// El formulario de Renovar arranca con la foto y la fecha de cada documento
// por renovar vacías: el conductor carga las del documento nuevo.
export function clearDocuments(values, documents) {
  const cleared = { ...values };
  documents.forEach((name) => {
    cleared[`${name}Photo`] = null;
    cleared[`${name}ExpiresAt`] = null;
  });
  return cleared;
}

// Firestore devuelve las fechas como Timestamp; el formulario usa Date.
function toDate(value) {
  if (!value) return null;
  return typeof value.toDate === 'function' ? value.toDate() : value;
}

// Una foto ya subida entra al formulario con su URL de Cloudinary como `uri`.
// Sin `fileSize`, validatePhotoFile no la frena por peso: ya pasó al registrarse.
function savedPhoto(url) {
  return url ? { uri: url } : null;
}

function asText(value) {
  return value === null || value === undefined ? '' : String(value);
}

// El formulario de Editar perfil arranca con lo guardado en Firestore.
// Es el camino inverso de toDriverProfile: el año y la capacidad vuelven a
// texto, como los escribe el conductor.
export function toFormValues(driver) {
  const vehicle = driver.vehicle ?? {};
  const documents = driver.documents ?? {};
  return {
    profilePhoto: savedPhoto(driver.photoUrl),
    fullName: driver.fullName ?? '',
    documentNumber: driver.documentNumber ?? '',
    phone: driver.phone ?? '',
    birthDate: toDate(driver.birthDate),
    gender: driver.gender ?? '',
    email: driver.email ?? '',
    category: vehicle.category ?? '',
    plate: vehicle.plate ?? '',
    brand: vehicle.brand ?? '',
    model: vehicle.model ?? '',
    year: asText(vehicle.year),
    color: vehicle.color ?? '',
    capacity: asText(vehicle.capacity),
    vehiclePhoto: savedPhoto(vehicle.photoUrl),
    licenseNumber: documents.licenseNumber ?? '',
    licensePhoto: savedPhoto(documents.licensePhotoUrl),
    licenseExpiresAt: toDate(documents.licenseExpiresAt),
    soatPhoto: savedPhoto(documents.soatPhotoUrl),
    soatExpiresAt: toDate(documents.soatExpiresAt),
    techInspectionPhoto: savedPhoto(documents.techInspectionPhotoUrl),
    techInspectionExpiresAt: toDate(documents.techInspectionExpiresAt),
    mercadoPagoEmail: driver.mercadoPagoEmail ?? '',
  };
}

// Las URL de las fotos que ya están en Cloudinary, por campo del formulario.
// Al guardar el perfil, una foto que no cambió no se vuelve a subir.
export function savedPhotoUrls(driver) {
  const urls = {
    profilePhoto: driver.photoUrl,
    vehiclePhoto: driver.vehicle?.photoUrl,
    licensePhoto: driver.documents?.licensePhotoUrl,
    soatPhoto: driver.documents?.soatPhotoUrl,
    techInspectionPhoto: driver.documents?.techInspectionPhotoUrl,
  };
  return Object.fromEntries(Object.entries(urls).filter(([, url]) => url));
}

// Las fotos que hay que subir para este formulario. La de la revisión
// técnico-mecánica solo cuando aplica.
export function photoFieldsFor(values, today = new Date()) {
  const fields = ['profilePhoto', 'vehiclePhoto', 'licensePhoto', 'soatPhoto'];
  if (requiresTechInspection(values, today)) fields.push('techInspectionPhoto');
  return fields;
}