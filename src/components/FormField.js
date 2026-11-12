import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { colors } from '../theme';
import FieldError from './FieldError';
import { formStyles } from './formStyles';

// Campo de texto con rótulo y error. Valida al perder el foco (onBlur). El
// borde se pone verde mientras se escribe y rojo si hay un error.
export default function FormField({ label, value, onChange, onBlur, error, ...inputProps }) {
  const [focused, setFocused] = useState(false);

  function handleBlur() {
    setFocused(false);
    onBlur?.();
  }

  return (
    <View style={formStyles.field}>
      <Text style={formStyles.label}>{label}</Text>
      <TextInput
        style={[formStyles.input, focused && formStyles.inputFocused, error && formStyles.inputError]}
        value={value}
        onChangeText={onChange}
        onFocus={() => setFocused(true)}
        onBlur={handleBlur}
        placeholderTextColor={colors.faint}
        selectionColor={colors.primary}
        cursorColor={colors.primary}
        accessibilityLabel={label}
        {...inputProps}
      />
      <FieldError error={error} />
    </View>
  );
}