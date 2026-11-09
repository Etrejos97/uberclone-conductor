import { useEffect } from 'react';
import { AccessibilityInfo, Platform, Text } from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { ERROR_PARAMS } from '../i18n/errorParams';
import { formStyles } from './formStyles';

// El error va debajo del campo, nunca en un Alert. Recibe la clave y la traduce.
// Android lee el texto nuevo por la región viva; iOS no la tiene, así que lo anuncio.
// El espacio está siempre reservado, haya error o no, para que el formulario
// no salte cuando el mensaje aparece o desaparece.
export default function FieldError({ error }) {
  const { t } = useSettings();
  const message = error ? t(error, ERROR_PARAMS) : null;

  useEffect(() => {
    if (message && Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(message);
  }, [message]);

  return (
    <Text style={formStyles.error} accessibilityLiveRegion="polite">
      {message ?? ''}
    </Text>
  );
}