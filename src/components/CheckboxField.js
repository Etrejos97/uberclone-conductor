import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../theme';
import FieldError from './FieldError';
import { formStyles } from './formStyles';

// Casilla con texto. Tocar el texto también la marca, para no tener que
// atinarle al cuadro pequeño. La dibujo con un ícono porque la de
// expo-checkbox pone el visto en blanco, que casi no se lee sobre el verde.
export default function CheckboxField({ label, value, onChange, onBlur, error }) {
  function toggle() {
    onChange(!value);
    onBlur?.();
  }

  return (
    <View style={formStyles.field}>
      <Pressable
        style={styles.row}
        onPress={toggle}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: value }}
        accessibilityLabel={label}
      >
        <View style={[styles.box, value && styles.boxChecked, error && !value && styles.boxError]}>
          {value ? <Ionicons name="checkmark" size={18} color={colors.onPrimary} /> : null}
        </View>
        <Text style={styles.text}>{label}</Text>
      </Pressable>
      <FieldError error={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  box: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.faint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  boxError: { borderColor: colors.danger },
  text: { flex: 1, fontSize: 15, lineHeight: 21, fontFamily: fonts.medium, color: colors.text },
});