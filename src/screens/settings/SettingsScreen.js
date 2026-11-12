import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppButton from '../../components/AppButton';
import FieldError from '../../components/FieldError';
import { formStyles } from '../../components/formStyles';
import { isConnectionError } from '../../hooks/useDriverForm';
import { setUnavailableBeforeLogout } from '../../services/driverService';
import { useSession } from '../../context/SessionContext';
import { useSettings } from '../../context/SettingsContext';
import { colors, fonts, radius } from '../../theme';

const LANGUAGES = [
  { value: 'es', label: 'settings.spanish' },
  { value: 'en', label: 'settings.english' },
];

// Cambiar el idioma sin reiniciar. RF-35: cerrar sesión y volver al
// ingreso. RF-41: eliminar la cuenta.
export default function SettingsScreen() {
  const { language, setLanguage, t } = useSettings();
  const { driverId, driver, endSession, deleteAccount } = useSession();
  const insets = useSafeAreaInsets();
  const [leaving, setLeaving] = useState(false);
  const [logoutError, setLogoutError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  // Disponible no se puede eliminar la cuenta: la regla de Firestore exige lo mismo.
  const isAvailable = driver?.isAvailable !== false;

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
    endSession();
  }

  // El diálogo lo dibuja el sistema, igual que el de cancelar un viaje.
  function confirmDelete() {
    Alert.alert(t('settings.deleteTitle'), t('settings.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('settings.deleteConfirm'), style: 'destructive', onPress: removeAccount },
    ]);
  }

  // Si sale bien, la sesión termina y la app vuelve al ingreso con el aviso.
  async function removeAccount() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount();
    } catch (error) {
      console.warn('No se pudo eliminar la cuenta:', error?.code ?? error?.message);
      if (error?.code === 'DRIVER_AVAILABLE') setDeleteError('settings.deleteNeedsOffline');
      else setDeleteError(isConnectionError(error) ? 'errors.deleteAccountConnection' : 'errors.deleteAccountFailed');
      setDeleting(false);
    }
  }

  return (
    <View style={[styles.container, { paddingBottom: 24 + insets.bottom }]}>
      <Text style={formStyles.label}>{t('settings.language')}</Text>
      {/* Dos opciones que se excluyen: el idioma activo queda en verde. */}
      <View style={styles.segmented} accessibilityRole="radiogroup">
        {LANGUAGES.map((option) => {
          const selected = language === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => setLanguage(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              style={[styles.option, selected && styles.optionOn]}
            >
              <Text style={[styles.optionText, selected && styles.optionTextOn]}>{t(option.label)}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.logout}>
        <AppButton
          title={t(leaving ? 'settings.loggingOut' : 'settings.logout')}
          variant="danger"
          onPress={() => logout(false)}
          disabled={leaving || deleting}
        />
        <FieldError error={logoutError} />
        {logoutError ? (
          <AppButton title={t('settings.logoutAnyway')} onPress={() => logout(true)} variant="secondary" />
        ) : null}

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>{t('settings.account')}</Text>
          <View style={styles.line} />
        </View>
        <AppButton
          title={t(deleting ? 'settings.deleting' : 'settings.deleteAccount')}
          variant="dangerText"
          onPress={confirmDelete}
          disabled={isAvailable || leaving || deleting}
        />
        {isAvailable && driver && !deleteError ? (
          <Text style={[formStyles.hint, styles.center]}>{t('settings.deleteNeedsOffline')}</Text>
        ) : null}
        <FieldError error={deleteError} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 12, backgroundColor: colors.background },
  segmented: {
    flexDirection: 'row',
    padding: 4,
    gap: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
  },
  option: { flex: 1, minHeight: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  optionOn: { backgroundColor: colors.primary },
  optionText: { fontSize: 15, fontFamily: fonts.bold, color: colors.muted },
  optionTextOn: { color: colors.onPrimary },
  logout: { marginTop: 'auto', gap: 12 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.faint, fontSize: 13, fontFamily: fonts.medium },
  center: { textAlign: 'center' },
});