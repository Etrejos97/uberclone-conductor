import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../theme';

// Lo que se ve cuando una lista no tiene nada que mostrar, en vez de una
// pantalla en blanco. El mensaje llega ya traducido.
export default function EmptyState({ message, icon = 'file-tray-outline' }) {
  return (
    <View style={styles.container}>
      <View style={styles.icon}>
        <Ionicons name={icon} size={30} color={colors.faint} />
      </View>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: { color: colors.muted, textAlign: 'center', fontSize: 16, lineHeight: 23, fontFamily: fonts.medium },
});