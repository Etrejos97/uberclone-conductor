import { StyleSheet, Text, View } from 'react-native';

// Lo que se ve cuando una lista no tiene nada que mostrar, en vez de una
// pantalla en blanco. El mensaje llega ya traducido.
export default function EmptyState({ message }) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  message: { color: '#555555', textAlign: 'center', fontSize: 16 },
});