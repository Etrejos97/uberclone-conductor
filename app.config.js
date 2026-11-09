// Extiende app.json con el package de Android y los plugins nativos.
export default ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    package: 'com.edison.uberconductor',
  },
  plugins: [
    [
      'expo-image-picker',
      {
        cameraPermission: 'La app usa la cámara para tomar tu foto, la del vehículo y la de tus documentos.',
        photosPermission: 'La app accede a tu galería para elegir las fotos del vehículo y tus documentos.',
      },
    ],
    '@react-native-community/datetimepicker',
  ],
});