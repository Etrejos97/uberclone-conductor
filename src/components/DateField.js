import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../context/SettingsContext';
import { colors, fonts } from '../theme';
import FieldError from './FieldError';
import { formStyles } from './formStyles';

// Selector de fecha. El calendario se abre al tocar el campo; guardo el día a
// las 00:00 para que la hora del teléfono no mueva la fecha. En Android es un
// diálogo; en iOS va debajo del campo y tocar el campo otra vez lo cierra.
// Del diálogo de Android solo puedo cambiar el texto y el color de sus dos
// botones; el color del día elegido lo pone el teléfono.
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
        style={[formStyles.input, styles.row, open && formStyles.inputFocused, error && formStyles.inputError]}
        onPress={() => setOpen((current) => !current)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${text}`}
      >
        <Text style={[styles.text, !value && styles.placeholder]}>{text}</Text>
        <Ionicons name="calendar-outline" size={20} color={colors.muted} />
      </Pressable>
      {open ? (
        <DateTimePicker
          value={value || initialDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onValueChange={handleValueChange}
          onDismiss={handleDismiss}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          themeVariant="dark"
          accentColor={colors.primary}
          positiveButton={{ label: t('common.accept'), textColor: colors.dialogAccent }}
          negativeButton={{ label: t('common.cancel'), textColor: colors.dialogAccent }}
        />
      ) : null}
      <FieldError error={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  text: { flex: 1, fontSize: 16, fontFamily: fonts.medium, color: colors.text },
  placeholder: { color: colors.faint },
});