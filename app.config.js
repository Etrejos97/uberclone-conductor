// Extiende app.json con el package de Android y los plugins nativos.
// El mapa es Leaflet dentro de un WebView, así que no hay llave de Google.
export default ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    package: 'com.edison.uberconductor',
  },
  plugins: [
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'La app usa tu ubicación para mostrarte en el mapa y recibir viajes cercanos.',
      },
    ],
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