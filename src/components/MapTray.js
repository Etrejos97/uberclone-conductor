import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '../theme';

// La bandeja que sube sobre el mapa en Inicio y en Viaje en curso. Se monta
// 20 px encima del mapa para que las esquinas redondeadas lo tapen, y deja
// abajo el espacio de la barra de gestos del teléfono.
export default function MapTray({ children }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.tray, { paddingBottom: 20 + insets.bottom }]}>
      <View style={styles.grab} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  tray: {
    marginTop: -20,
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.border,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
  },
  grab: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
});