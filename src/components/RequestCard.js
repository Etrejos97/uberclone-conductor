import { ActivityIndicator, Button, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { formatKm, formatMoney } from '../i18n/format';
import FieldError from './FieldError';
import { colors, formStyles } from './formStyles';

// Lo que el conductor necesita para decidir. Sin tarifa estimada no deja
// aceptar: mientras calcula la ruta muestra que espera,
// y si falla, el motivo, con Reintentar cuando reintentar puede servir. Con el
// reloj en cero tampoco deja aceptar: la solicitud venció y solo queda en la
// lista si no se pudo rechazar. Tocar la tarjeta la selecciona y el mapa dibuja
// su ruta.
export default function RequestCard({
  trip,
  remaining,
  selected,
  onSelect,
  quoteError,
  onRetryQuote,
  onAccept,
  onReject,
  busy,
}) {
  const { t, language } = useSettings();
  const { route, estimate } = trip;

  return (
    // accessible={false}: el lector de pantalla recorre los textos y los botones
    // de la tarjeta uno por uno; seleccionarla solo cambia el mapa.
    <Pressable style={[styles.card, selected && styles.selected]} onPress={onSelect} accessible={false}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          {t('request.title')}
        </Text>
        <Text style={styles.countdown} accessibilityLabel={t('request.secondsLeft', { seconds: remaining })}>
          {remaining} s
        </Text>
      </View>

      <Text style={styles.place}>
        {trip.origin.label} → {trip.destination.label}
      </Text>
      <Text style={formStyles.hint}>
        {t(`category.${trip.category}`)} · {t(`paymentMethod.${trip.paymentMethod}`)}
        {trip.tip > 0 ? ` · ${t('request.tip')} ${formatMoney(trip.tip, language)}` : ''}
      </Text>

      {estimate && route ? (
        <View style={styles.numbers}>
          <Text style={styles.detail}>
            {formatKm(route.distanceKm, language)} · {route.durationMin} min
          </Text>
          <Text style={styles.detail}>
            {t('request.fare')}: {formatMoney(estimate.fare, language)}
          </Text>
          <Text style={styles.earnings}>
            {t('request.earnings')}: {formatMoney(estimate.driverEarnings, language)}
          </Text>
        </View>
      ) : null}

      {!estimate && !quoteError ? (
        <View style={styles.row}>
          <ActivityIndicator />
          <Text style={formStyles.hint}>{t('request.calculating')}</Text>
        </View>
      ) : null}
      {!estimate && quoteError ? (
        <>
          <FieldError error={quoteError.message} />
          {quoteError.canRetry ? <Button title={t('common.retry')} onPress={onRetryQuote} /> : null}
        </>
      ) : null}

      <View style={styles.actions}>
        <View style={styles.action}>
          <Button title={t('request.reject')} onPress={onReject} disabled={busy} color="#B00020" />
        </View>
        <View style={styles.action}>
          <Button title={t('request.accept')} onPress={onAccept} disabled={busy || !estimate || remaining <= 0} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: 8, padding: 16, borderRadius: 12, borderWidth: 2, borderColor: '#E0E0E0', backgroundColor: '#FFFFFF' },
  selected: { borderColor: '#1A73E8' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  countdown: { fontSize: 18, fontWeight: '700', color: '#B00020' },
  place: { fontSize: 16, color: colors.text },
  numbers: { gap: 2 },
  detail: { fontSize: 15, color: colors.text },
  earnings: { fontSize: 17, fontWeight: '700', color: '#1E8E3E' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actions: { flexDirection: 'row', gap: 12 },
  action: { flex: 1 },
});