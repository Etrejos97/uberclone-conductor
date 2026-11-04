import { StyleSheet } from 'react-native';

// Estilos que comparten todos los campos del formulario.
export const colors = {
  text: '#1A1A1A',
  muted: '#666666',
  border: '#C7C7CC',
  error: '#B00020',
  primary: '#111111',
  background: '#FFFFFF',
};

export const formStyles = StyleSheet.create({
  field: { gap: 6 },
  label: { fontSize: 15, fontWeight: '600', color: colors.text },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
  },
  inputError: { borderColor: colors.error },
  error: { color: colors.error, fontSize: 13 },
  hint: { color: colors.muted, fontSize: 13 },
});