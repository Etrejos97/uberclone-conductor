import { useEffect } from 'react';
import { AccessibilityInfo, Platform, Text } from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { ERROR_PARAMS } from '../i18n/errorParams';
import { formStyles } from './formStyles';

// El error va debajo del campo, nunca en un Alert. Recibe la clave y la traduce.
// Android lee el texto nuevo por la region viva; iOS no la tiene, asi que lo anuncio.
// El espacio esta SIEMPRE reservado (aunque no haya error) para que el formulario
// no salte cuando aparece o desaparece el mensaje.
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
