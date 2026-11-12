import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';

export default function LoadingState({ message }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: 24,
    backgroundColor: colors.background,
  },
  message: { color: colors.muted, fontSize: 15, fontFamily: fonts.medium },
});