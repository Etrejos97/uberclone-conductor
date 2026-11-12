import { StyleSheet } from 'react-native';
import { colors, fonts, radius } from '../theme';

// Estilos que comparten todos los campos del formulario.
export const formStyles = StyleSheet.create({
  field: { gap: 6 },
  label: { fontSize: 14, fontFamily: fonts.semibold, color: colors.muted },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text,
    backgroundColor: colors.surfaceRaised,
  },
  inputFocused: { borderColor: colors.primary },
  inputError: { borderColor: colors.danger },
  error: { color: colors.danger, fontSize: 13, fontFamily: fonts.medium },
  hint: { color: colors.muted, fontSize: 13, lineHeight: 19, fontFamily: fonts.regular },
});