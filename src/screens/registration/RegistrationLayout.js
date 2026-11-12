import { ActivityIndicator, Keyboard, StyleSheet, Text, View } from 'react-native';
import AppButton from '../../components/AppButton';
import FieldError from '../../components/FieldError';
import FormScrollView from '../../components/FormScrollView';
import { formStyles } from '../../components/formStyles';
import { useRegistration } from '../../context/RegistrationContext';
import { useSession } from '../../context/SessionContext';
import { useSettings } from '../../context/SettingsContext';
import { colors } from '../../theme';

const TAB_LABELS = {
  PersonalData: 'registration.personal',
  Vehicle: 'registration.vehicle',
  Documents: 'registration.documents',
};

// Marco de las tres pestañas: los campos con scroll y, al final, el botón
// "Enviar registro", que está en las tres.
export default function RegistrationLayout({ children }) {
  const { t } = useSettings();
  const { isComplete, incompleteTabs, failedUploadTabs, submit, submitting, submitError } = useRegistration();
  // Por qué la app volvió al registro, si la sesión anterior se cerró sola.
  const { endedReason } = useSession();

  const tabNames = (tabs) => tabs.map((tab) => t(TAB_LABELS[tab])).join(', ');

  function handleSubmit() {
    Keyboard.dismiss();
    submit();
  }

  return (
    <FormScrollView contentContainerStyle={styles.content}>
      <FieldError error={endedReason} />
      {/* Bloqueo los campos mientras se envía: submit guarda lo que había al tocar el botón. */}
      <View pointerEvents={submitting ? 'none' : 'auto'} style={styles.fields}>
        {children}
      </View>

      <View style={styles.submit}>
        {submitting ? (
          <View style={styles.row}>
            <ActivityIndicator color={colors.primary} />
            <Text style={formStyles.hint}>{t('registration.submitting')}</Text>
          </View>
        ) : (
          <AppButton title={t('registration.submit')} onPress={handleSubmit} disabled={!isComplete} />
        )}
        {!isComplete ? (
          <Text style={[formStyles.hint, styles.center]}>
            {t('registration.missingIn')} {tabNames(incompleteTabs)}
          </Text>
        ) : null}
        {failedUploadTabs.length > 0 ? (
          <Text style={[formStyles.hint, styles.center]}>
            {t('registration.uploadFailedIn')} {tabNames(failedUploadTabs)}
          </Text>
        ) : null}
        <FieldError error={submitError} />
      </View>
    </FormScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 18, paddingBottom: 40 },
  fields: { gap: 18 },
  submit: { marginTop: 8, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, minHeight: 54 },
  center: { textAlign: 'center' },
});