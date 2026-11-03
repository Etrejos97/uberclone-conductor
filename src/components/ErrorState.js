import { Button, StyleSheet, Text, View } from 'react-native';
import { useSettings } from '../context/SettingsContext';

// Estado de error de una pantalla: el mensaje ya traducido y, si
// la pantalla puede volver a intentarlo, el botón Reintentar.
export default function ErrorState({ message, onRetry }) {
  const { t } = useSettings();
  return (
    <View style={styles.container}>
      <Text style={styles.message} accessibilityRole="alert">
        {message}
      </Text>
      {onRetry ? <Button title={t('common.retry')} onPress={onRetry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  message: { color: '#B00020', textAlign: 'center', fontSize: 16 },
});