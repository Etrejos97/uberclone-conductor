import { Pressable, StyleSheet, Text, View } from 'react-native';
import Checkbox from 'expo-checkbox';
import FieldError from './FieldError';
import { colors, formStyles } from './formStyles';

// Casilla con texto. Tocar el texto también la marca, para no tener que
// atinarle al cuadro pequeño.
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
        {/* El lector de pantalla anuncia solo la fila; la casilla interna sería un segundo control. */}
        <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <Checkbox value={value} onValueChange={toggle} color={value ? colors.primary : undefined} />
        </View>
        <Text style={styles.text}>{label}</Text>
      </Pressable>
      <FieldError error={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  text: { flex: 1, fontSize: 15, color: colors.text },
});