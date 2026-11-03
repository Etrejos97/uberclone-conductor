import { Button, StyleSheet, Text, View } from 'react-native';
import { useSession } from '../../context/SessionContext';
import { useSettings } from '../../context/SettingsContext';

// cambiar el idioma sin reiniciar. cerrar sesión y volver al registro.
export default function SettingsScreen() {
  const { language, setLanguage, t } = useSettings();
  const { endSession } = useSession();

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
        <Button title={t('settings.logout')} color="#B00020" onPress={endSession} />
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