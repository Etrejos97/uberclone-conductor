import { DarkTheme } from '@react-navigation/native';

// Los colores, las fuentes y las medidas de toda la app salen de aquí. Ninguna
// pantalla escribe un color a mano: si cambio uno aquí, cambia en toda la app.
//
// El verde queda para lo principal de cada pantalla: el botón de la acción, el
// dinero, la ruta y el estado Disponible. Lo demás va en grises.
export const colors = {
  background: '#0D0D0E',
  surface: '#141416',
  surfaceRaised: '#1C1D21',
  border: '#2D3139',
  text: '#FFFFFF',
  muted: '#B4BAC5',
  faint: '#7E8695',
  primary: '#00FF75',
  primaryPressed: '#00D664',
  onPrimary: '#0D0D0E',
  primarySoft: 'rgba(0, 255, 117, 0.12)',
  danger: '#FF6B6B',
  dangerSoft: 'rgba(255, 107, 107, 0.13)',
  warning: '#FFB547',
  warningSoft: 'rgba(255, 181, 71, 0.13)',
  info: '#6CB6FF',
  infoSoft: 'rgba(108, 182, 255, 0.13)',
  neutralSoft: '#1F2127',
  // Lo que oscurece el fondo detrás de un aviso sobre el mapa.
  overlay: 'rgba(13, 13, 14, 0.92)',
  // El borde blanco de los puntos del mapa, para que se vean sobre las calles.
  markerBorder: '#FFFFFF',
  // Los botones del calendario de Android. El diálogo puede salir claro u oscuro
  // según el teléfono, y este verde se lee sobre los dos; el neón no se lee sobre blanco.
  dialogAccent: '#00A150',
};

// Plus Jakarta Sans. Cada peso es una familia aparte (así la carga App.js con
// useFonts), por eso los estilos usan fontFamily y nunca fontWeight: en Android,
// un fontWeight encima de una familia ya gruesa la engrosa otra vez.
export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
};

export const radius = { input: 14, card: 16, sheet: 22, pill: 999 };

// El título de todos los encabezados: el menú, los stacks y el registro.
export const headerTitle = { fontFamily: fonts.bold, fontSize: 18 };

// La tarjeta que usan Cobro, Ganancias, Perfil y el historial.
export const card = {
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: radius.card,
};

// El brillo verde del botón principal. boxShadow necesita la nueva arquitectura
// (la única en el SDK 58) y Android 9 o superior; en versiones anteriores el
// botón se ve igual, sin el brillo.
export const glow = '0px 8px 24px -8px rgba(0, 255, 117, 0.45)';

// El tema de React Navigation: encabezados, menú lateral y pestañas toman de
// aquí el fondo, el texto y la fuente.
export const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.background,
    text: colors.text,
    border: colors.border,
    notification: colors.danger,
  },
  fonts: {
    regular: { fontFamily: fonts.regular, fontWeight: 'normal' },
    medium: { fontFamily: fonts.medium, fontWeight: 'normal' },
    bold: { fontFamily: fonts.bold, fontWeight: 'normal' },
    heavy: { fontFamily: fonts.extrabold, fontWeight: 'normal' },
  },
};