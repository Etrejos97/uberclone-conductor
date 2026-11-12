import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';

// Una fila de rótulo y valor, como las de Cobro, Ganancias y el detalle del viaje.
// La fila `strong` es el total: su valor va en verde y más grande.
export default function InfoRow({ label, value, strong = false, valueColor }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.label, strong && styles.strongLabel]}>{label}</Text>
      <Text style={[styles.value, strong && styles.strongValue, valueColor && { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  label: { flexShrink: 1, fontSize: 15, fontFamily: fonts.regular, color: colors.muted },
  value: { flexShrink: 1, fontSize: 15, fontFamily: fonts.semibold, color: colors.text, textAlign: 'right' },
  strongLabel: { fontFamily: fonts.bold, color: colors.text },
  strongValue: { fontSize: 18, fontFamily: fonts.extrabold, color: colors.primary },
});