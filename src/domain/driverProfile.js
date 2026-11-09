import { normalizePlate, requiresTechInspection } from './validators';

// Arma los datos del conductor que van a drivers/{driverId} a partir del
// formulario ya validado y de las URL de Cloudinary. Solo trae lo que escribió
// el conductor. Los campos del sistema (approvalStatus, isAvailable, location...)
// y las fechas de creación los pone driverService, así reutilizar esto para
// editar el perfil no reinicia la aprobación.
// El aprobador escribe approvalStatus a mano en la consola de Firebase. Un valor
// que no es uno de estos no aprueba la cuenta, y la pantalla lo dice con un texto
// propio en vez de buscar una traducción que no existe.
const APPROVAL_STATUSES = ['pending', 'approved', 'rejected'];

export function approvalTextKey(approvalStatus) {
  return APPROVAL_STATUSES.includes(approvalStatus) ? approvalStatus : 'unknown';
}

export function toDriverProfile(values, photoUrls, today = new Date()) {
  const withTechInspection = requiresTechInspection(values, today);

  return {
    fullName: values.fullName.trim(),
    documentNumber: values.documentNumber.trim(),
    phone: values.phone.trim(),
    email: values.email.trim().toLowerCase(),
    birthDate: values.birthDate,
    gender: values.gender,
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
    mercadoPagoEmail: values.mercadoPagoEmail.trim().toLowerCase(),
  };
}

// Las fotos que hay que subir para este formulario. La de la revisión
// técnico-mecánica solo cuando aplica.
export function photoFieldsFor(values, today = new Date()) {
  const fields = ['profilePhoto', 'vehiclePhoto', 'licensePhoto', 'soatPhoto'];
  if (requiresTechInspection(values, today)) fields.push('techInspectionPhoto');
  return fields;
}