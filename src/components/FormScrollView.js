import { KeyboardAvoidingView, ScrollView, StyleSheet } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';

// Contenedor de todo formulario con scroll: deja espacio para el teclado, así
// el campo que se está escribiendo no queda tapado. KeyboardAvoidingView mide
// su posición respecto a la pantalla de la navegación, no a la del teléfono,
// así que le sumo la altura del encabezado.
export default function FormScrollView({ children, contentContainerStyle }) {
  const headerHeight = useHeaderHeight();

  return (
    <KeyboardAvoidingView style={styles.flex} behavior="padding" keyboardVerticalOffset={headerHeight}>
      <ScrollView contentContainerStyle={contentContainerStyle} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});