import { Text, TextInput, View } from 'react-native';
import FieldError from './FieldError';
import { formStyles } from './formStyles';

// Campo de texto con rótulo y error. Valida al perder el foco (onBlur).
export default function FormField({ label, value, onChange, onBlur, error, ...inputProps }) {
  return (
    <View style={formStyles.field}>
      <Text style={formStyles.label}>{label}</Text>
      <TextInput
        style={[formStyles.input, error && formStyles.inputError]}
        value={value}
        onChangeText={onChange}
        onBlur={onBlur}
        accessibilityLabel={label}
        {...inputProps}
      />
      <FieldError error={error} />
    </View>
  );
}