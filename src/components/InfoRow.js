import { StyleSheet, Text, View } from 'react-native';
import { colors } from './formStyles';

// Una fila de rótulo y valor, como las de Cobro, Ganancias y el detalle del viaje.
export default function InfoRow({ label, value, strong = false, valueColor }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.label, strong && styles.strong]}>{label}</Text>
      <Text style={[styles.value, strong && styles.strong, valueColor && { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  label: { flexShrink: 1, fontSize: 15, color: colors.muted },
  value: { flexShrink: 1, fontSize: 15, color: colors.text, textAlign: 'right' },
  strong: { fontWeight: '700', color: colors.text },
});