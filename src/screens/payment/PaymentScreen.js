import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AppButton from '../../components/AppButton';
import FieldError from '../../components/FieldError';
import InfoRow from '../../components/InfoRow';
import StatusBadge from '../../components/StatusBadge';
import { formStyles } from '../../components/formStyles';
import { RATINGS } from '../../config/app';
import { useSettings } from '../../context/SettingsContext';
import { amountToCharge, canSwitchToCash, paymentStatusKey } from '../../domain/payment';
import { TRIP_STATUS as S } from '../../domain/tripStateMachine';
import usePayment from '../../hooks/usePayment';
import { formatMoney } from '../../i18n/format';
import { card, colors, fonts, radius } from '../../theme';

// El efectivo va en gris: es un método de pago, no un pago aprobado.
const TONE = { approved: 'success', cash: 'neutral', pending: 'warning', rejected: 'danger' };

// Cobro. Todo lo que se ve sale de `trip`, en tiempo real. Conductor y
// pasajero comparten este teléfono (D-01): el pago con Mercado Pago y la calificación
// son del cliente simulado, y recibir el efectivo es del conductor.
// Un solo botón verde por pantalla: el que cierra el paso.
export default function PaymentScreen({ trip }) {
  const { t, language } = useSettings();
  const insets = useSafeAreaInsets();
  const payment = usePayment(trip);

  const statusKey = paymentStatusKey(trip);
  const isPaid = trip.status === S.PAID;
  const isCash = trip.paymentMethod === 'cash';
  const busy = payment.pending !== null;
  const total = formatMoney(amountToCharge(trip), language);
  // El backend solo tarda cuando Render lo está despertando (R-02).
  const waitingBackend = ['checkout', 'verify', 'cashInstead'].includes(payment.pending);

  function confirmCash(onConfirm) {
    Alert.alert(t('payment.cashTitle'), t('payment.cashMessage', { amount: total }), [
      { text: t('payment.cashNotYet'), style: 'cancel' },
      { text: t('payment.cashConfirm'), onPress: onConfirm },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.status}>
        <Text style={formStyles.label}>{t('payment.status')}</Text>
        <StatusBadge label={t(`payment.status.${statusKey}`)} tone={TONE[statusKey]} />
      </View>

      <View style={styles.summary}>
        <InfoRow label={t('payment.fare')} value={formatMoney(trip.fare, language)} />
        <InfoRow label={t('request.tip')} value={formatMoney(trip.tip, language)} />
        <InfoRow label={t('payment.total')} value={total} strong />
        <View style={styles.divider} />
        <InfoRow label={t('payment.commission')} value={formatMoney(trip.commission, language)} />
        <InfoRow label={t('payment.earnings')} value={formatMoney(trip.driverEarnings, language)} strong />
      </View>

      {waitingBackend ? (
        <View style={styles.waiting}>
          <ActivityIndicator color={colors.primary} />
          <Text style={formStyles.hint}>{t('payment.connecting')}</Text>
        </View>
      ) : null}

      {!isPaid && isCash ? (
        <View style={styles.actions}>
          <Text style={formStyles.hint}>{t('payment.cashHint', { amount: total })}</Text>
          <AppButton
            title={t('payment.cashReceived')}
            onPress={() => confirmCash(payment.receiveCash)}
            disabled={busy}
          />
        </View>
      ) : null}

      {!isPaid && !isCash ? (
        <View style={styles.actions}>
          <Text style={styles.section}>{t('payment.client')}</Text>
          <AppButton
            title={t(statusKey === 'rejected' ? 'payment.payAgain' : 'payment.pay')}
            onPress={payment.pay}
            disabled={busy}
          />
          <Text style={formStyles.hint}>{t('payment.verifyHint')}</Text>
          <AppButton title={t('payment.verify')} onPress={payment.verify} disabled={busy} variant="secondary" />
        </View>
      ) : null}

      {canSwitchToCash(trip) ? (
        <View style={styles.actions}>
          <Text style={styles.section}>{t('payment.driver')}</Text>
          <Text style={formStyles.hint}>{t('payment.cashInsteadHint', { amount: total })}</Text>
          <AppButton
            title={t('payment.cashInstead')}
            onPress={() => confirmCash(payment.receiveCashInstead)}
            disabled={busy}
            variant="secondary"
          />
        </View>
      ) : null}

      {isPaid ? (
        <View style={styles.actions}>
          <Text style={styles.section}>{t('payment.client')}</Text>
          <Text style={formStyles.label}>{t('payment.rateTitle')}</Text>
          <View style={styles.ratings}>
            {RATINGS.map((value) => (
              <Pressable
                key={value}
                onPress={() => payment.rate(value)}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel={t('payment.rateValue', { value })}
                accessibilityState={{ disabled: busy }}
                style={({ pressed }) => [styles.rating, pressed && styles.ratingPressed, busy && styles.ratingBusy]}
              >
                <Text style={styles.ratingText}>{value}</Text>
                <Ionicons name="star" size={14} color={colors.primary} />
              </Pressable>
            ))}
          </View>
          <Text style={formStyles.hint}>{t('payment.rateHint')}</Text>
        </View>
      ) : null}

      {payment.notice ? <Text style={[formStyles.hint, styles.notice]}>{t(payment.notice)}</Text> : null}
      <FieldError error={payment.error} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 20 },
  status: { alignItems: 'center', gap: 8 },
  summary: { ...card, gap: 10, padding: 16 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 2 },
  waiting: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actions: { gap: 12 },
  section: { fontSize: 16, fontFamily: fonts.bold, color: colors.text },
  ratings: { flexDirection: 'row', gap: 8 },
  rating: {
    flex: 1,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
  },
  ratingPressed: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  ratingBusy: { opacity: 0.5 },
  ratingText: { color: colors.text, fontSize: 16, fontFamily: fonts.bold },
  notice: { textAlign: 'center' },
});