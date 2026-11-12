import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { PHOTO_QUALITY } from '../config/app';
import { useSettings } from '../context/SettingsContext';
import { colors, fonts, radius } from '../theme';
import AppButton from './AppButton';
import FieldError from './FieldError';
import { formStyles } from './formStyles';

// La placa de ejemplo que se ve en el marco del vehículo antes de tomar la foto.
const SAMPLE_PLATE = 'ABC 123';

// RF-06: la foto se toma con la cámara o se elige de la galería. Aquí solo se
// elige; la subida a Cloudinary pasa al enviar el registro.
//
// El marco toma la forma de lo que se fotografía, así el conductor sabe qué
// encuadrar antes de tocar la cámara:
//   profile:  un círculo, como se ve la foto en Perfil. Es la única que se
//             recorta al tomarla, cuadrada.
//   vehicle:  4:3, con la silueta de un carro y una placa.
//   document: la proporción de una tarjeta (la licencia mide 85,6 × 54 mm)
//             con esquinas verdes de guía. `frameText` dice qué documento va.
// En Android el recorte respeta la proporción; en iOS siempre es cuadrado.
export default function PhotoPicker({
  label,
  value,
  onChange,
  onBlur,
  error,
  hint,
  shape = 'document',
  frameText,
}) {
  const { t } = useSettings();
  const [permissionError, setPermissionError] = useState(null);
  const hasPhoto = Boolean(value?.uri);
  const shownError = permissionError || error;

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
      if (shape === 'profile') {
        options.allowsEditing = true;
        options.aspect = [1, 1];
      }
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(options)
          : await ImagePicker.launchImageLibraryAsync(options);
      onBlur?.();
      if (result.canceled) return;

      const asset = result.assets[0];
      onChange({ uri: asset.uri, fileSize: asset.fileSize });
    } catch (pickError) {
      // Un emulador sin cámara o la galería cerrada por el sistema llegan aquí.
      console.warn('No se pudo abrir la cámara o la galería:', pickError?.message);
      setPermissionError('errors.photoPickFailed');
      onBlur?.();
    }
  }

  const cameraTitle = hasPhoto ? t('photo.retake') : t('photo.camera');
  const galleryTitle = hasPhoto ? t('photo.pickAnother') : t('photo.gallery');

  return (
    <View style={formStyles.field}>
      <Text style={formStyles.label}>{label}</Text>
      {hint && shape !== 'profile' ? <Text style={formStyles.hint}>{hint}</Text> : null}

      {shape === 'profile' ? (
        <ProfileFrame uri={value?.uri} label={label} error={shownError} />
      ) : (
        <View
          style={[
            styles.frame,
            shape === 'vehicle' ? styles.vehicle : styles.document,
            !hasPhoto && shape === 'vehicle' && styles.dashed,
            shownError && !hasPhoto && formStyles.inputError,
          ]}
        >
          {hasPhoto ? (
            <>
              <Image source={{ uri: value.uri }} style={StyleSheet.absoluteFill} accessibilityLabel={label} />
              <View style={styles.chosen}>
                <Ionicons name="checkmark" size={14} color={colors.primary} />
                <Text style={styles.chosenText}>{t('photo.chosen')}</Text>
              </View>
            </>
          ) : shape === 'vehicle' ? (
            <VehicleGuide text={t('photo.vehicleFrame')} />
          ) : (
            <DocumentGuide text={frameText} />
          )}
        </View>
      )}

      {hint && shape === 'profile' ? <Text style={[formStyles.hint, styles.center]}>{hint}</Text> : null}

      <View style={styles.buttons}>
        <AppButton
          title={cameraTitle}
          onPress={() => pick('camera')}
          variant="secondary"
          compact
          style={styles.button}
          accessibilityLabel={`${label}: ${cameraTitle}`}
        />
        <AppButton
          title={galleryTitle}
          onPress={() => pick('gallery')}
          variant="secondary"
          compact
          style={styles.button}
          accessibilityLabel={`${label}: ${galleryTitle}`}
        />
      </View>
      <FieldError error={shownError} />
    </View>
  );
}

// El círculo de la foto de perfil: borde punteado mientras está vacío, verde
// cuando ya hay foto y rojo si falta.
function ProfileFrame({ uri, label, error }) {
  return (
    <View style={[styles.avatar, uri ? styles.avatarDone : styles.dashed, error && !uri && formStyles.inputError]}>
      {uri ? (
        <Image source={{ uri }} style={styles.avatarImage} accessibilityLabel={label} />
      ) : (
        <Ionicons name="person" size={60} color={colors.faint} />
      )}
    </View>
  );
}

function VehicleGuide({ text }) {
  return (
    <View style={styles.guide}>
      <Ionicons name="car-sport-outline" size={76} color={colors.faint} />
      <View style={styles.plate}>
        <Text style={styles.plateText}>{SAMPLE_PLATE}</Text>
      </View>
      <Text style={formStyles.hint}>{text}</Text>
    </View>
  );
}

function DocumentGuide({ text }) {
  return (
    <>
      <View style={[styles.corner, styles.topLeft]} />
      <View style={[styles.corner, styles.topRight]} />
      <View style={[styles.corner, styles.bottomLeft]} />
      <View style={[styles.corner, styles.bottomRight]} />
      <View style={styles.guide}>
        <Ionicons name="card-outline" size={52} color={colors.faint} />
        {text ? <Text style={formStyles.hint}>{text}</Text> : null}
      </View>
    </>
  );
}

const AVATAR_SIZE = 128;
const CORNER = 22;

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicle: { aspectRatio: 4 / 3, borderWidth: 1, borderColor: colors.border },
  document: { aspectRatio: 1.586, borderRadius: radius.input },
  dashed: { borderWidth: 2, borderStyle: 'dashed', borderColor: colors.border },
  guide: { alignItems: 'center', gap: 8, padding: 16 },
  plate: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 1,
  },
  plateText: { color: colors.primary, fontSize: 11, fontFamily: fonts.extrabold, letterSpacing: 1.2 },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: colors.primary },
  topLeft: { left: 10, top: 10, borderLeftWidth: 3, borderTopWidth: 3, borderTopLeftRadius: 6 },
  topRight: { right: 10, top: 10, borderRightWidth: 3, borderTopWidth: 3, borderTopRightRadius: 6 },
  bottomLeft: { left: 10, bottom: 10, borderLeftWidth: 3, borderBottomWidth: 3, borderBottomLeftRadius: 6 },
  bottomRight: { right: 10, bottom: 10, borderRightWidth: 3, borderBottomWidth: 3, borderBottomRightRadius: 6 },
  chosen: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.overlay,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chosenText: { color: colors.text, fontSize: 12, fontFamily: fonts.bold },
  avatar: {
    alignSelf: 'center',
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginVertical: 4,
  },
  avatarDone: { borderWidth: 3, borderColor: colors.primary },
  avatarImage: { width: '100%', height: '100%' },
  center: { textAlign: 'center' },
  buttons: { flexDirection: 'row', gap: 10 },
  button: { flex: 1 },
});