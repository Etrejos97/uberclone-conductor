import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { REQUEST_TIMEOUT_S } from '../config/app';
import { useSettings } from '../context/SettingsContext';
import { formatKm, formatMoney } from '../i18n/format';
import { colors, fonts, radius } from '../theme';
import AppButton from './AppButton';
import FieldError from './FieldError';
import { formStyles } from './formStyles';

// Lo que el conductor necesita para decidir. Sin tarifa estimada no deja
// aceptar (sección 12 del diseño): mientras calcula la ruta muestra que espera,
// y si falla, el motivo, con Reintentar cuando reintentar puede servir. Con el
// reloj en cero tampoco deja aceptar: la solicitud venció y solo queda en la
// lista si no se pudo rechazar. Tocar la tarjeta la selecciona y el mapa dibuja
// su ruta.
//
// Lo primero que se lee es la ganancia, en verde y grande; Rechazar va con
// borde rojo para que no compita con Aceptar.
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
  const progress = Math.max(0, Math.min(1, remaining / REQUEST_TIMEOUT_S));

  return (
    // accessible={false}: el lector de pantalla recorre los textos y los botones
    // de la tarjeta uno por uno; seleccionarla solo cambia el mapa.
    <Pressable style={[styles.card, selected && styles.selected]} onPress={onSelect} accessible={false}>
      {/* La barra se vacía con el reloj; el número lo lee el lector de pantalla. */}
      <View style={styles.timer} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <View style={[styles.timerFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.between}>
        <View style={styles.chip}>
          <Text style={styles.chipText} accessibilityRole="header">
            {t('request.title').toUpperCase()}
          </Text>
        </View>
        <Text style={styles.countdown} accessibilityLabel={t('request.secondsLeft', { seconds: remaining })}>
          {t('request.remaining', { seconds: remaining })}
        </Text>
      </View>

      {estimate && route ? (
        <View style={styles.between}>
          <View>
            <Text style={formStyles.hint}>{t('request.earnings')}</Text>
            <Text style={styles.money}>{formatMoney(estimate.driverEarnings, language)}</Text>
          </View>
          <View style={styles.right}>
            <Text style={formStyles.hint}>{t('request.fare')}</Text>
            <Text style={styles.fare}>{formatMoney(estimate.fare, language)}</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.timeline}>
        <View style={styles.line}>
          <View style={styles.from} />
          <View style={styles.bar} />
          <View style={styles.to} />
        </View>
        <View style={styles.places}>
          <Text style={styles.place}>{trip.origin.label}</Text>
          <Text style={styles.place}>{trip.destination.label}</Text>
        </View>
      </View>

      <Text style={formStyles.hint}>
        {t(`category.${trip.category}`)} · {t(`paymentMethod.${trip.paymentMethod}`)}
        {estimate && route ? ` · ${formatKm(route.distanceKm, language)} · ${route.durationMin} min` : ''}
        {trip.tip > 0 ? ` · ${t('request.tip')} ${formatMoney(trip.tip, language)}` : ''}
      </Text>

      {!estimate && !quoteError ? (
        <View style={styles.row}>
          <ActivityIndicator color={colors.primary} />
          <Text style={formStyles.hint}>{t('request.calculating')}</Text>
        </View>
      ) : null}
      {!estimate && quoteError ? (
        <>
          <FieldError error={quoteError.message} />
          {quoteError.canRetry ? (
            <AppButton title={t('common.retry')} onPress={onRetryQuote} variant="secondary" compact />
          ) : null}
        </>
      ) : null}

      <View style={styles.actions}>
        <AppButton
          title={t('request.reject')}
          onPress={onReject}
          disabled={busy}
          variant="danger"
          style={styles.action}
        />
        <AppButton
          title={t('request.accept')}
          onPress={onAccept}
          disabled={busy || !estimate || remaining <= 0}
          style={styles.action}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    padding: 16,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
  },
  selected: { borderColor: colors.primary },
  timer: { height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden' },
  timerFill: { height: '100%', backgroundColor: colors.primary },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  chip: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: { color: colors.primary, fontSize: 11, fontFamily: fonts.bold, letterSpacing: 0.7 },
  countdown: { fontSize: 14, fontFamily: fonts.semibold, color: colors.muted },
  money: { fontSize: 28, fontFamily: fonts.extrabold, color: colors.primary, letterSpacing: -0.5 },
  right: { alignItems: 'flex-end' },
  fare: { fontSize: 17, fontFamily: fonts.bold, color: colors.text },
  timeline: { flexDirection: 'row', gap: 12 },
  line: { alignItems: 'center', paddingTop: 5, paddingBottom: 5 },
  from: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: colors.text },
  bar: { width: 2, flex: 1, minHeight: 14, backgroundColor: colors.border, marginVertical: 3 },
  to: { width: 10, height: 10, backgroundColor: colors.primary },
  places: { flex: 1, gap: 14 },
  place: { fontSize: 15, fontFamily: fonts.semibold, color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actions: { flexDirection: 'row', gap: 10 },
  action: { flex: 1 },
});