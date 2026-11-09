import { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import FieldError from '../../components/FieldError';
import { setUnavailableBeforeLogout } from '../../services/driverService';
import { useSession } from '../../context/SessionContext';
import { useSettings } from '../../context/SettingsContext';

// Cambiar el idioma sin reiniciar. Cerrar sesión y volver al registro.
export default function SettingsScreen() {
  const { language, setLanguage, setLastAvailability, t } = useSettings();
  const { driverId, driver, endSession } = useSession();
  const [leaving, setLeaving] = useState(false);
  const [logoutError, setLogoutError] = useState(null);

  // Un conductor que cierra sesión no puede quedar Disponible en Firestore.
  // Espero la confirmación; sin red, aviso y dejo salir de todos modos. En ese
  // caso la escritura sigue en cola y llega si la app sigue abierta.
  async function logout(anyway) {
    if (driver?.isAvailable && !anyway) {
      setLeaving(true);
      setLogoutError(null);
      try {
        await setUnavailableBeforeLogout(driverId);
      } catch (error) {
        console.warn('No se pudo pasar a No disponible al salir:', error?.code ?? error?.message);
        setLogoutError('errors.logoutUnavailableFailed');
        setLeaving(false);
        return;
      }
    }
    setLastAvailability(false);
    endSession();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('settings.language')}</Text>
      <View style={styles.row}>
        <Button
          title={t('settings.spanish')}
          onPress={() => setLanguage('es')}
          disabled={language === 'es'}
        />
        <Button
          title={t('settings.english')}
          onPress={() => setLanguage('en')}
          disabled={language === 'en'}
        />
      </View>
      <View style={styles.logout}>
        <Button
          title={t(leaving ? 'settings.loggingOut' : 'settings.logout')}
          color="#B00020"
          onPress={() => logout(false)}
          disabled={leaving}
        />
        <FieldError error={logoutError} />
        {logoutError ? <Button title={t('settings.logoutAnyway')} onPress={() => logout(true)} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12 },
  label: { fontSize: 16, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 12 },
  logout: { marginTop: 32, gap: 12 },
});