import FormField from '../../components/FormField';
import SelectField from '../../components/SelectField';
import PhotoPicker from '../../components/PhotoPicker';
import { SHORT_TEXT_MAX_LENGTH, VEHICLE_COLORS } from '../../config/app';
import { CATEGORIES } from '../../config/pricing';
import { useRegistration } from '../../context/RegistrationContext';
import { useSettings } from '../../context/SettingsContext';
import RegistrationLayout from './RegistrationLayout';

export default function VehicleScreen() {
  const { t } = useSettings();
  const { field } = useRegistration();

  return (
    <RegistrationLayout>
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
        hint={t('registration.vehiclePhotoHint')}
        {...field('vehiclePhoto')}
      />
    </RegistrationLayout>
  );
}