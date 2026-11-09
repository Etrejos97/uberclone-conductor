import FormField from '../../components/FormField';
import SelectField from '../../components/SelectField';
import DateField from '../../components/DateField';
import PhotoPicker from '../../components/PhotoPicker';
import { GENDERS, NAME_MAX_LENGTH } from '../../config/app';
import { useRegistration } from '../../context/RegistrationContext';
import { useSettings } from '../../context/SettingsContext';
import RegistrationLayout from './RegistrationLayout';

export default function PersonalDataScreen() {
  const { t, language, setLanguage } = useSettings();
  const { field } = useRegistration();
  const today = new Date();

  return (
    <RegistrationLayout>
      <PhotoPicker label={t('registration.profilePhoto')} {...field('profilePhoto')} />
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
      <FormField
        label={t('registration.phone')}
        keyboardType="phone-pad"
        maxLength={10}
        {...field('phone')}
      />
      <DateField
        label={t('registration.birthDate')}
        maximumDate={today}
        initialDate={new Date(today.getFullYear() - 25, 0, 1)}
        {...field('birthDate')}
      />
      <SelectField
        label={t('registration.gender')}
        placeholder={t('common.select')}
        options={GENDERS.map((value) => ({ value, label: t(`gender.${value}`) }))}
        {...field('gender')}
      />
      <FormField
        label={t('registration.email')}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        {...field('email')}
      />
      {/* El idioma es una preferencia del teléfono, no va a Firestore. */}
      <SelectField
        label={t('settings.language')}
        placeholder={t('common.select')}
        value={language}
        options={[
          { value: 'es', label: t('settings.spanish') },
          { value: 'en', label: t('settings.english') },
        ]}
        onChange={(value) => value && setLanguage(value)}
      />
    </RegistrationLayout>
  );
}