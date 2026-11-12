import { Text } from 'react-native';
import FormField from './FormField';
import SelectField from './SelectField';
import DateField from './DateField';
import PhotoPicker from './PhotoPicker';
import { formStyles } from './formStyles';
import {
  GENDERS,
  NAME_MAX_LENGTH,
  SHORT_TEXT_MAX_LENGTH,
  TECH_REVIEW_FROM_YEARS,
  VEHICLE_COLORS,
} from '../config/app';
import { CATEGORIES } from '../config/pricing';
import { maxSoatExpiry, requiresTechInspection, validateYear } from '../domain/validators';
import { useSettings } from '../context/SettingsContext';

// Los campos del conductor, agrupados como las pestañas del registro. El
// registro pone cada grupo en su pestaña; Perfil usa los grupos que el
// conductor puede cambiar según el estado de su cuenta.
// `field(name)` viene de useDriverForm.

function PhoneField({ field }) {
  const { t } = useSettings();
  return (
    <FormField label={t('registration.phone')} keyboardType="phone-pad" maxLength={10} {...field('phone')} />
  );
}

function GenderField({ field }) {
  const { t } = useSettings();
  return (
    <SelectField
      label={t('registration.gender')}
      placeholder={t('common.select')}
      options={GENDERS.map((value) => ({ value, label: t(`gender.${value}`) }))}
      {...field('gender')}
    />
  );
}

function EmailField({ field, name, label }) {
  return (
    <FormField label={label} keyboardType="email-address" autoCapitalize="none" autoComplete="email" {...field(name)} />
  );
}

// VA-01 a VA-07. Perfil no muestra la foto: después del registro queda fija.
export function PersonalDataFields({ field, withPhoto = true }) {
  const { t } = useSettings();
  const today = new Date();

  return (
    <>
      {withPhoto ? (
        <PhotoPicker
          label={t('registration.profilePhoto')}
          shape="profile"
          hint={t('photo.profileHint')}
          {...field('profilePhoto')}
        />
      ) : null}
      <FormField
        label={t('registration.fullName')}
        autoCapitalize="words"
        maxLength={NAME_MAX_LENGTH}
        {...field('fullName')}
      />
      <FormField
        label={t('registration.documentNumber')}
        keyboardType="number-pad"
        maxLength={10}
        {...field('documentNumber')}
      />
      <PhoneField field={field} />
      <DateField
        label={t('registration.birthDate')}
        maximumDate={today}
        initialDate={new Date(today.getFullYear() - 25, 0, 1)}
        {...field('birthDate')}
      />
      <GenderField field={field} />
      <EmailField field={field} name="email" label={t('registration.email')} />
    </>
  );
}

// Editar contacto: lo que un conductor aprobado cambia sin volver a revisión.
export function ContactFields({ field }) {
  const { t } = useSettings();

  return (
    <>
      <PhoneField field={field} />
      <GenderField field={field} />
      <EmailField field={field} name="email" label={t('registration.email')} />
      <EmailField field={field} name="mercadoPagoEmail" label={t('registration.mercadoPagoEmail')} />
    </>
  );
}

// VA-09 a VA-15.
export function VehicleFields({ field }) {
  const { t } = useSettings();

  return (
    <>
      <SelectField
        label={t('registration.category')}
        placeholder={t('common.select')}
        options={CATEGORIES.map((value) => ({ value, label: t(`category.${value}`) }))}
        {...field('category')}
      />
      <FormField
        label={t('registration.plate')}
        autoCapitalize="characters"
        maxLength={6}
        {...field('plate')}
      />
      <FormField label={t('registration.brand')} maxLength={SHORT_TEXT_MAX_LENGTH} {...field('brand')} />
      <FormField label={t('registration.model')} maxLength={SHORT_TEXT_MAX_LENGTH} {...field('model')} />
      <FormField
        label={t('registration.year')}
        keyboardType="number-pad"
        maxLength={4}
        {...field('year')}
      />
      <SelectField
        label={t('registration.color')}
        placeholder={t('common.select')}
        options={VEHICLE_COLORS.map((value) => ({ value, label: t(`color.${value}`) }))}
        {...field('color')}
      />
      <FormField
        label={t('registration.capacity')}
        keyboardType="number-pad"
        maxLength={1}
        {...field('capacity')}
      />
      <PhotoPicker
        label={t('registration.vehiclePhoto')}
        shape="vehicle"
        hint={t('registration.vehiclePhotoHint')}
        {...field('vehiclePhoto')}
      />
    </>
  );
}

// La foto y el vencimiento de un documento: 'license', 'soat' o
// 'techInspection'. Los usan el registro y Renovar documentos.
export function ExpiringDocumentFields({ name, field }) {
  const { t } = useSettings();
  const today = new Date();
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  return (
    <>
      <PhotoPicker
        label={t(`registration.${name}Photo`)}
        shape="document"
        frameText={t(`registration.${name}Frame`)}
        {...field(`${name}Photo`)}
      />
      <DateField
        label={t(`registration.${name}ExpiresAt`)}
        minimumDate={tomorrow}
        maximumDate={name === 'soat' ? maxSoatExpiry(today) : undefined}
        initialDate={tomorrow}
        {...field(`${name}ExpiresAt`)}
      />
    </>
  );
}

// VA-16 a VA-19. Los términos (VA-20) solo se aceptan al registrarse, así que
// la casilla la pone la pestaña de Documentos del registro.
export function DocumentsFields({ field, values }) {
  const { t } = useSettings();
  const today = new Date();
  const yearKnown = validateYear(values.year, today) === null;
  const withTechInspection = requiresTechInspection(values, today);

  return (
    <>
      <FormField
        label={t('registration.licenseNumber')}
        keyboardType="number-pad"
        maxLength={10}
        {...field('licenseNumber')}
      />
      <ExpiringDocumentFields name="license" field={field} />
      <ExpiringDocumentFields name="soat" field={field} />

      {withTechInspection ? (
        <ExpiringDocumentFields name="techInspection" field={field} />
      ) : (
        <Text style={formStyles.hint}>
          {yearKnown
            ? t('registration.techInspectionNotNeeded', { years: TECH_REVIEW_FROM_YEARS })
            : t('registration.techInspectionNeedsYear')}
        </Text>
      )}

      <EmailField field={field} name="mercadoPagoEmail" label={t('registration.mercadoPagoEmail')} />
    </>
  );
}