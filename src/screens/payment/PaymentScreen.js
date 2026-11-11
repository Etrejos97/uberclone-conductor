import { ActivityIndicator, Alert, Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FieldError from '../../components/FieldError';
import InfoRow from '../../components/InfoRow';
import StatusBadge from '../../components/StatusBadge';
import { colors, formStyles } from '../../components/formStyles';
import { RATINGS } from '../../config/app';
import { useSettings } from '../../context/SettingsContext';
import { amountToCharge, canSwitchToCash, paymentStatusKey } from '../../domain/payment';
import { TRIP_STATUS as S } from '../../domain/tripStateMachine';
import usePayment from '../../hooks/usePayment';
import { formatMoney } from '../../i18n/format';

const TONE = { approved: 'success', cash: 'success', pending: 'warning', rejected: 'danger' };

// Cobro. Todo lo que se ve sale de `trip`, en tiempo real. Conductor y
// pasajero comparten este teléfono: el pago con Mercado Pago y la calificación
// son del cliente simulado, y recibir el efectivo es del conductor.
export default function PaymentScreen({ trip }) {
  const { t, language } = useSettings();
  const insets = useSafeAreaInsets();
  const payment = usePayment(trip);

  const statusKey = paymentStatusKey(trip);
  const isPaid = trip.status === S.PAID;
  const isCash = trip.paymentMethod === 'cash';
  const busy = payment.pending !== null;
  const total = formatMoney(amountToCharge(trip), language);
  // El backend solo tarda cuando Render lo está despertando.
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
          <ActivityIndicator />
          <Text style={formStyles.hint}>{t('payment.connecting')}</Text>
        </View>
      ) : null}

      {!isPaid && isCash ? (
        <View style={styles.actions}>
          <Text style={formStyles.hint}>{t('payment.cashHint', { amount: total })}</Text>
          <Button
            title={t('payment.cashReceived')}
            onPress={() => confirmCash(payment.receiveCash)}
            disabled={busy}
          />
        </View>
      ) : null}

      {!isPaid && !isCash ? (
        <View style={styles.actions}>
          <Text style={styles.section}>{t('payment.client')}</Text>
          <Button
            title={t(statusKey === 'rejected' ? 'payment.payAgain' : 'payment.pay')}
            onPress={payment.pay}
            disabled={busy}
          />
          <Text style={formStyles.hint}>{t('payment.verifyHint')}</Text>
          <Button title={t('payment.verify')} onPress={payment.verify} disabled={busy} />
        </View>
      ) : null}

      {canSwitchToCash(trip) ? (
        <View style={styles.actions}>
          <Text style={styles.section}>{t('payment.driver')}</Text>
          <Text style={formStyles.hint}>{t('payment.cashInsteadHint', { amount: total })}</Text>
          <Button
            title={t('payment.cashInstead')}
            onPress={() => confirmCash(payment.receiveCashInstead)}
            disabled={busy}
          />
        </View>
      ) : null}

      {isPaid ? (
        <View style={styles.actions}>
          <Text style={styles.section}>{t('payment.client')}</Text>
          <Text style={formStyles.label}>{t('payment.rateTitle')}</Text>
          <View style={styles.ratings}>
            {RATINGS.map((value) => (
              <View key={value} style={styles.rating}>
                <Button
                  title={String(value)}
                  accessibilityLabel={t('payment.rateValue', { value })}
                  onPress={() => payment.rate(value)}
                  disabled={busy}
                />
              </View>
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
  content: { padding: 24, gap: 20 },
  status: { alignItems: 'center', gap: 8 },
  summary: { gap: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 16 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
  waiting: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actions: { gap: 12 },
  section: { fontSize: 16, fontWeight: '700', color: colors.text },
  ratings: { flexDirection: 'row', gap: 8 },
  rating: { flex: 1 },
  notice: { textAlign: 'center' },
});