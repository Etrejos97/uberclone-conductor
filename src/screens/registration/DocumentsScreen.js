import { Text } from 'react-native';
import FormField from '../../components/FormField';
import DateField from '../../components/DateField';
import PhotoPicker from '../../components/PhotoPicker';
import CheckboxField from '../../components/CheckboxField';
import { formStyles } from '../../components/formStyles';
import { TECH_REVIEW_FROM_YEARS } from '../../config/app';
import { COMMISSION_RATE } from '../../config/pricing';
import { requiresTechInspection, validateYear } from '../../domain/validators';
import { useRegistration } from '../../context/RegistrationContext';
import { useSettings } from '../../context/SettingsContext';
import RegistrationLayout from './RegistrationLayout';

export default function DocumentsScreen() {
  const { t, language } = useSettings();
  const { field, values } = useRegistration();
  const today = new Date();
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const yearKnown = validateYear(values.year, today) === null;
  const withTechInspection = requiresTechInspection(values, today);
  // En español el porcentaje lleva espacio antes del signo; en inglés no.
  const percent = Math.round(COMMISSION_RATE * 100);
  const commission = language === 'es' ? `${percent} %` : `${percent}%`;

  return (
    <RegistrationLayout>
      <FormField
        label={t('registration.licenseNumber')}
        keyboardType="number-pad"
        maxLength={10}
        {...field('licenseNumber')}
      />
      <PhotoPicker label={t('registration.licensePhoto')} {...field('licensePhoto')} />
      <DateField
        label={t('registration.licenseExpiresAt')}
        minimumDate={tomorrow}
        initialDate={tomorrow}
        {...field('licenseExpiresAt')}
      />

      <PhotoPicker label={t('registration.soatPhoto')} {...field('soatPhoto')} />
      <DateField
        label={t('registration.soatExpiresAt')}
        minimumDate={tomorrow}
        initialDate={tomorrow}
        {...field('soatExpiresAt')}
      />

      {withTechInspection ? (
        <>
          <PhotoPicker label={t('registration.techInspectionPhoto')} {...field('techInspectionPhoto')} />
          <DateField
            label={t('registration.techInspectionExpiresAt')}
            minimumDate={tomorrow}
            initialDate={tomorrow}
            {...field('techInspectionExpiresAt')}
          />
        </>
      ) : (
        <Text style={formStyles.hint}>
          {yearKnown
            ? t('registration.techInspectionNotNeeded', { years: TECH_REVIEW_FROM_YEARS })
            : t('registration.techInspectionNeedsYear')}
        </Text>
      )}

      <FormField
        label={t('registration.mercadoPagoEmail')}
        keyboardType="email-address"
        autoCapitalize="none"
        {...field('mercadoPagoEmail')}
      />
      <CheckboxField
        label={t('registration.terms', { commission })}
        {...field('termsAccepted')}
      />
    </RegistrationLayout>
  );
}