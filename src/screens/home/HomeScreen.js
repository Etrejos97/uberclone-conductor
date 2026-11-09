import { StyleSheet, Text, View } from 'react-native';
import ErrorState from '../../components/ErrorState';
import LoadingState from '../../components/LoadingState';
import { useSession } from '../../context/SessionContext';
import { useSettings } from '../../context/SettingsContext';
import { approvalTextKey } from '../../domain/driverProfile';

// El conductor ve si su cuenta está pendiente, aprobada o rechazada.
// El documento llega en tiempo real desde SessionContext: si el aprobador
// cambia approvalStatus en la consola, esta pantalla cambia sola.
// Más adelante llegan aquí el mapa y la disponibilidad.
export default function HomeScreen() {
  const { t } = useSettings();
  const { driver, driverError, retryDriver } = useSession();

  if (driverError) return <ErrorState message={t(driverError)} onRetry={retryDriver} />;
  if (!driver) return <LoadingState message={t('common.loading')} />;

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{driver.fullName}</Text>
      <Text style={styles.label}>{t('home.accountStatus')}</Text>
      <Text style={styles.status}>{t(`approval.${approvalTextKey(driver.approvalStatus)}`)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 8 },
  name: { fontSize: 22, fontWeight: '700' },
  label: { marginTop: 16, color: '#555555' },
  status: { fontSize: 18, fontWeight: '600' },
});