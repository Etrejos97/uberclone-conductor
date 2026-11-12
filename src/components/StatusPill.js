import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../theme';

// La píldora que flota sobre el mapa de Inicio con el estado del conductor:
// punto verde si está disponible, gris si no.
export default function StatusPill({ label, on }) {
  return (
    <View style={styles.pill} accessibilityRole="text" accessibilityLabel={label}>
      <View style={[styles.dot, on && styles.dotOn]} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.faint },
  dotOn: { backgroundColor: colors.primary, boxShadow: `0px 0px 0px 4px ${colors.primarySoft}` },
  text: { color: colors.text, fontSize: 13, fontFamily: fonts.semibold },
});