import { StyleSheet, Text, View } from 'react-native';
import { useSettings } from '../context/SettingsContext';

// Relleno de las pantallas que todavía no se construyen. Cada paso lo reemplaza
// por la pantalla real; los botones que recibe en children sirven para navegar.
export default function ScreenPlaceholder({ children }) {
  const { t } = useSettings();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{t('common.comingSoon')}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  text: { color: '#555555', textAlign: 'center' },
});