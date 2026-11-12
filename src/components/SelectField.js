import { Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { colors, fonts } from '../theme';
import FieldError from './FieldError';
import { formStyles } from './formStyles';

// Lista desplegable. `options` es [{ value, label }]; el valor vacío es "sin elegir"
// y su texto es el `placeholder` que la pantalla pasa ya traducido (p. ej. t('common.select')).
// No importo SettingsContext para que el componente sirva fuera del registro y
// no dependa del árbol de contexto.
// La lista que se abre la dibuja Android. Le pongo el fondo y el color de cada
// opción para que se vea oscura aunque el teléfono esté en modo claro.
const ITEM_STYLE = { backgroundColor: colors.surfaceRaised, color: colors.text };

export default function SelectField({ label, value, options, onChange, onBlur, error, placeholder = 'Seleccionar...' }) {
  return (
    <View style={formStyles.field}>
      <Text style={formStyles.label}>{label}</Text>
      <View style={[formStyles.input, { paddingVertical: 0, paddingHorizontal: 4 }, error && formStyles.inputError]}>
        <Picker
          selectedValue={value}
          onValueChange={(newValue) => {
            onChange(newValue);
            onBlur?.();
          }}
          mode="dropdown"
          style={{ color: value ? colors.text : colors.faint }}
          dropdownIconColor={colors.muted}
          accessibilityLabel={label}
        >
          <Picker.Item
            label={placeholder}
            value=""
            color={colors.faint}
            fontFamily={fonts.medium}
            style={{ ...ITEM_STYLE, color: colors.faint }}
          />
          {options.map((option) => (
            <Picker.Item
              key={option.value}
              label={option.label}
              value={option.value}
              color={colors.text}
              fontFamily={fonts.medium}
              style={ITEM_STYLE}
            />
          ))}
        </Picker>
      </View>
      <FieldError error={error} />
    </View>
  );
}