import CheckboxField from '../../components/CheckboxField';
import { DocumentsFields } from '../../components/DriverFormFields';
import { COMMISSION_RATE } from '../../config/pricing';
import { useRegistration } from '../../context/RegistrationContext';
import { useSettings } from '../../context/SettingsContext';
import RegistrationLayout from './RegistrationLayout';

// Los términos solo se aceptan aquí: Editar perfil no los vuelve a pedir.
export default function DocumentsScreen() {
  const { t, language } = useSettings();
  const { field, values } = useRegistration();
  // En español el porcentaje lleva espacio antes del signo; en inglés no.
  const percent = Math.round(COMMISSION_RATE * 100);
  const commission = language === 'es' ? `${percent} %` : `${percent}%`;

  return (
    <RegistrationLayout>
      <DocumentsFields field={field} values={values} />
      <CheckboxField
        label={t('registration.terms', { commission })}
        {...field('termsAccepted')}
      />
    </RegistrationLayout>
  );
}