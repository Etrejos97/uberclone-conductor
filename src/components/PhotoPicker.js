import { useState } from 'react';
import { Button, Image, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { PHOTO_QUALITY } from '../config/app';
import { useSettings } from '../context/SettingsContext';
import FieldError from './FieldError';
import { colors, formStyles } from './formStyles';

// la foto se toma con la cámara o se elige de la galería. Aquí solo se
// elige; la subida a Cloudinary pasa al enviar el registro (flujo 10.4).
export default function PhotoPicker({ label, value, onChange, onBlur, error, hint }) {
  const { t } = useSettings();
  const [permissionError, setPermissionError] = useState(null);

  async function pick(source) {
    setPermissionError(null);
    try {
      if (source === 'camera') {
        const { granted } = await ImagePicker.requestCameraPermissionsAsync();
        if (!granted) {
          setPermissionError('errors.cameraDenied');
          onBlur?.();
          return;
        }
      }

      const options = { mediaTypes: ['images'], quality: PHOTO_QUALITY };
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(options)
          : await ImagePicker.launchImageLibraryAsync(options);
      onBlur?.();
      if (result.canceled) return;

      const asset = result.assets[0];
      onChange({ uri: asset.uri, fileSize: asset.fileSize });
    } catch (error) {
      // Un emulador sin cámara o la galería cerrada por el sistema llegan aquí.
      console.warn('No se pudo abrir la cámara o la galería:', error?.message);
      setPermissionError('errors.photoPickFailed');
      onBlur?.();
    }
  }

  return (
    <View style={formStyles.field}>
      <Text style={formStyles.label}>{label}</Text>
      {hint ? <Text style={formStyles.hint}>{hint}</Text> : null}
      {value?.uri ? (
        <Image source={{ uri: value.uri }} style={styles.preview} accessibilityLabel={label} />
      ) : (
        <View style={[styles.preview, styles.empty, error && formStyles.inputError]}>
          <Text style={formStyles.hint}>{t('photo.none')}</Text>
        </View>
      )}
      <View style={styles.buttons}>
        <Button
          title={t('photo.camera')}
          onPress={() => pick('camera')}
          accessibilityLabel={`${label}: ${t('photo.camera')}`}
        />
        <Button
          title={t('photo.gallery')}
          onPress={() => pick('gallery')}
          accessibilityLabel={`${label}: ${t('photo.gallery')}`}
        />
      </View>
      <FieldError error={permissionError || error} />
    </View>
  );
}

const styles = StyleSheet.create({
  preview: { width: '100%', height: 160, borderRadius: 8, backgroundColor: '#F2F2F2' },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  buttons: { flexDirection: 'row', gap: 12 },
});