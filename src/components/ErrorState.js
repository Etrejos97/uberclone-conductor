import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import { colors, fonts } from '../theme';
import AppButton from './AppButton';

// Estado de error de una pantalla: el mensaje ya traducido y, si
// la pantalla puede volver a intentarlo, el botón Reintentar.
export default function ErrorState({ message, onRetry }) {
  const { t } = useSettings();
  return (
    <View style={styles.container}>
      <View style={styles.icon}>
        <Ionicons name="alert-circle-outline" size={34} color={colors.danger} />
      </View>
      <Text style={styles.message} accessibilityRole="alert">
        {message}
      </Text>
      {onRetry ? <AppButton title={t('common.retry')} onPress={onRetry} style={styles.button} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
    backgroundColor: colors.background,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: { color: colors.text, textAlign: 'center', fontSize: 16, lineHeight: 23, fontFamily: fonts.medium },
  button: { alignSelf: 'stretch' },
});