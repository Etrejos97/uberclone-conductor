import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts, glow, radius } from '../theme';

// El botón de toda la app. El Button de React Native no deja cambiar su forma
// ni su fuente, así que este usa Pressable.
//   primary:   la acción principal de la pantalla, en verde. Una por pantalla.
//   secondary: las demás acciones, en gris con borde.
//   danger:    lo que no se deshace (rechazar, cancelar, cerrar sesión), con borde rojo.
// Deshabilitado se ve gris, nunca verde apagado, para que no parezca tocable.
export default function AppButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  compact = false,
  accessibilityLabel,
  style,
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.base,
        compact && styles.compact,
        disabled ? styles.disabled : styles[variant],
        pressed && !disabled && pressedStyles[variant],
        style,
      ]}
    >
      <Text
        style={[styles.text, compact && styles.compactText, disabled ? styles.disabledText : textStyles[variant]]}
        numberOfLines={2}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    borderRadius: radius.pill,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compact: { minHeight: 46, paddingHorizontal: 12 },
  primary: { backgroundColor: colors.primary, boxShadow: glow },
  secondary: { backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border },
  danger: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.danger },
  disabled: { backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border },
  text: { fontSize: 16, fontFamily: fonts.bold, textAlign: 'center', letterSpacing: 0.2 },
  compactText: { fontSize: 15 },
  disabledText: { color: colors.faint },
});

const textStyles = StyleSheet.create({
  primary: { color: colors.onPrimary },
  secondary: { color: colors.text },
  danger: { color: colors.danger },
});

const pressedStyles = StyleSheet.create({
  primary: { backgroundColor: colors.primaryPressed },
  secondary: { backgroundColor: colors.border },
  danger: { backgroundColor: colors.dangerSoft },
});