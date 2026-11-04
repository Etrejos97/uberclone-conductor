import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSettings } from '../context/SettingsContext';
import FieldError from './FieldError';
import { colors, formStyles } from './formStyles';

// Selector de fecha. El calendario se abre al tocar el campo; guardo el día a
// las 00:00 para que la hora del teléfono no mueva la fecha. En Android es un
// diálogo; en iOS va debajo del campo y tocar el campo otra vez lo cierra.
export default function DateField({ label, value, onChange, onBlur, error, initialDate, minimumDate, maximumDate }) {
  const { t, language } = useSettings();
  const [open, setOpen] = useState(false);

  function handleValueChange(event, selected) {
    setOpen(false);
    onChange(new Date(selected.getFullYear(), selected.getMonth(), selected.getDate()));
    onBlur?.();
  }

  function handleDismiss() {
    setOpen(false);
    onBlur?.();
  }

  const text = value
    ? value.toLocaleDateString(language === 'es' ? 'es-CO' : 'en-US')
    : t('common.chooseDate');

  return (
    <View style={formStyles.field}>
      <Text style={formStyles.label}>{label}</Text>
      <Pressable
        style={[formStyles.input, error && formStyles.inputError]}
        onPress={() => setOpen((current) => !current)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${text}`}
      >
        <Text style={{ fontSize: 16, color: value ? colors.text : colors.muted }}>{text}</Text>
      </Pressable>
      {open ? (
        <DateTimePicker
          value={value || initialDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={handleValueChange}
          onDismiss={handleDismiss}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      ) : null}
      <FieldError error={error} />
    </View>
  );
}