import SelectField from '../../components/SelectField';
import { PersonalDataFields } from '../../components/DriverFormFields';
import { useRegistration } from '../../context/RegistrationContext';
import { useSettings } from '../../context/SettingsContext';
import RegistrationLayout from './RegistrationLayout';

export default function PersonalDataScreen() {
  const { t, language, setLanguage } = useSettings();
  const { field } = useRegistration();

  return (
    <RegistrationLayout>
      <PersonalDataFields field={field} />
      {/* El idioma es una preferencia del teléfono, no va a Firestore.
          Después del registro se cambia en Configuración. */}
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