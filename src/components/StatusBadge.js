import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius } from '../theme';

const TONES = {
  success: { backgroundColor: colors.primarySoft, color: colors.primary },
  warning: { backgroundColor: colors.warningSoft, color: colors.warning },
  danger: { backgroundColor: colors.dangerSoft, color: colors.danger },
  info: { backgroundColor: colors.infoSoft, color: colors.info },
  neutral: { backgroundColor: colors.neutralSoft, color: colors.muted },
};

// El tono de cada estado de la cuenta (la clave que da approvalTextKey). Lo usan
// Inicio y Perfil.
export const APPROVAL_TONES = { approved: 'success', pending: 'warning', rejected: 'danger', unknown: 'neutral' };

// El estado se lee en el texto: el color solo lo refuerza.
export default function StatusBadge({ label, tone = 'neutral', style }) {
  const { backgroundColor, color } = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor }, style]}>
      <Text style={[styles.text, { color }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'center', borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 5 },
  text: { fontSize: 12, fontFamily: fonts.bold, letterSpacing: 0.8 },
});