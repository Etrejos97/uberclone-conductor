// Extiende app.json con el package de Android y los plugins nativos.
// El mapa es Leaflet dentro de un WebView, así que no hay llave de Google.
// La pantalla de carga usa el fondo del tema oscuro (#0D0D0E, el background de
// src/theme.js) con el logo al centro.
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
    'expo-font',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 200,
        backgroundColor: '#0D0D0E',
      },
    ],
  ],
});