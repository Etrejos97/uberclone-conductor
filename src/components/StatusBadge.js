import { StyleSheet, Text, View } from 'react-native';

const TONES = {
  success: { backgroundColor: '#E6F4EA', color: '#1E8E3E' },
  warning: { backgroundColor: '#FEF7E0', color: '#8A6100' },
  danger: { backgroundColor: '#FCE8E6', color: '#B00020' },
  info: { backgroundColor: '#E8F0FE', color: '#1967D2' },
  neutral: { backgroundColor: '#F1F3F4', color: '#444444' },
};

// El estado se lee en el texto: el color solo lo refuerza.
export default function StatusBadge({ label, tone = 'neutral' }) {
  const { backgroundColor, color } = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'center', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  text: { fontSize: 15, fontWeight: '700' },
});