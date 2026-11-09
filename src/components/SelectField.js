import { Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import FieldError from './FieldError';
import { colors, formStyles } from './formStyles';

// Lista desplegable. `options` es [{ value, label }]; el valor vacío es "sin elegir"
// y su texto es el `placeholder` que la pantalla pasa ya traducido (p. ej. t('common.select')).
// No importo SettingsContext para que el componente sirva fuera del registro y
// no dependa del árbol de contexto.
export default function SelectField({ label, value, options, onChange, onBlur, error, placeholder = 'Seleccionar...' }) {
  return (
    <View style={formStyles.field}>
      <Text style={formStyles.label}>{label}</Text>
      <View style={[formStyles.input, { paddingVertical: 0 }, error && formStyles.inputError]}>
        <Picker
          selectedValue={value}
          onValueChange={(newValue) => {
            onChange(newValue);
            onBlur?.();
          }}
          mode="dropdown"
          accessibilityLabel={label}
        >
          <Picker.Item label={placeholder} value="" color={colors.muted} />
          {options.map((option) => (
            <Picker.Item key={option.value} label={option.label} value={option.value} />
          ))}
        </Picker>
      </View>
      <FieldError error={error} />
    </View>
  );
}