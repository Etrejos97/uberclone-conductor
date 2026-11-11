import { useEffect, useState } from 'react';
import { ActivityIndicator, Button, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateField from '../../components/DateField';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import FieldError from '../../components/FieldError';
import LoadingState from '../../components/LoadingState';
import SelectField from '../../components/SelectField';
import StatusBadge from '../../components/StatusBadge';
import { colors, formStyles } from '../../components/formStyles';
import { PAYMENT_METHODS } from '../../config/app';
import { useSession } from '../../context/SessionContext';
import { useSettings } from '../../context/SettingsContext';
import useTripHistory from '../../hooks/useTripHistory';
import { formatDateTime, formatMoney } from '../../i18n/format';

const PERIODS = ['today', 'week', 'month', 'range'];
// Todo el historial está pagado: la etiqueta dice con qué se pagó.
export const METHOD_TONE = { cash: 'success', mercadopago: 'info' };

// Historial. El valor vacío de cada lista es "todos".
export default function HistoryListScreen({ navigation }) {
  const { t } = useSettings();
  const insets = useSafeAreaInsets();
  const { driverId } = useSession();
  const [period, setPeriod] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [today] = useState(() => new Date());

  const isRange = period === 'range';
  const rangeInvalid = isRange && from && to && from > to;
  const rangeReady = !isRange || (from && to && !rangeInvalid);
  const history = useTripHistory(driverId, rangeReady ? { period, from, to, paymentMethod } : null);

  // La pantalla sigue montada al ir a otra opción del menú. Al volver al
  // historial lo recargo para que aparezcan los viajes pagados mientras tanto.
  // Volver del detalle no lo recarga: el conductor no pierde las páginas que bajó.
  const { refresh } = history;
  useEffect(() => navigation.getParent()?.addListener('focus', refresh), [navigation, refresh]);

  const filters = (
    <View style={styles.filters}>
      <SelectField
        label={t('history.period')}
        value={period}
        options={PERIODS.map((value) => ({ value, label: t(`history.period.${value}`) }))}
        onChange={setPeriod}
        placeholder={t('history.allDates')}
      />
      {isRange ? (
        <View style={styles.range}>
          <View style={styles.rangeField}>
            <DateField label={t('history.from')} value={from} onChange={setFrom} maximumDate={today} />
          </View>
          <View style={styles.rangeField}>
            <DateField
              label={t('history.to')}
              value={to}
              onChange={setTo}
              maximumDate={today}
              error={rangeInvalid ? 'errors.historyRangeInvalid' : null}
            />
          </View>
        </View>
      ) : null}
      <SelectField
        label={t('history.paymentMethod')}
        value={paymentMethod}
        options={PAYMENT_METHODS.map((value) => ({ value, label: t(`paymentMethod.${value}`) }))}
        onChange={setPaymentMethod}
        placeholder={t('history.allMethods')}
      />
    </View>
  );

  let body;
  if (!rangeReady) {
    body = rangeInvalid ? null : <EmptyState message={t('history.rangeHint')} />;
  } else if (history.loading || (history.error && history.refreshing)) {
    body = <LoadingState message={t('common.loading')} />;
  } else if (history.error) {
    body = <ErrorState message={t(history.error)} onRetry={history.refresh} />;
  } else {
    body = (
      <FlatList
        data={history.trips}
        keyExtractor={(trip) => trip.id}
        renderItem={({ item }) => (
          <TripItem trip={item} onPress={() => navigation.navigate('HistoryDetail', { tripId: item.id })} />
        )}
        onEndReached={history.loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={history.refreshing} onRefresh={history.refresh} />}
        ListEmptyComponent={<EmptyState message={t('history.empty')} />}
        ListHeaderComponent={history.refreshError ? <FieldError error={history.refreshError} /> : null}
        ListFooterComponent={
          <Footer loading={history.loadingMore} error={history.moreError} onRetry={history.retryMore} />
        }
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
      />
    );
  }

  return (
    <View style={styles.container}>
      {filters}
      {body}
    </View>
  );
}

// Fecha y hora, origen → destino, categoría, tarifa, ganancia neta y método del pago.
function TripItem({ trip, onPress }) {
  const { t, language } = useSettings();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.item, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityHint={t('history.openDetail')}
    >
      <View style={styles.itemHeader}>
        <Text style={styles.date}>{trip.completedAt ? formatDateTime(trip.completedAt, language) : ''}</Text>
        <StatusBadge label={t(`history.method.${trip.paymentMethod}`)} tone={METHOD_TONE[trip.paymentMethod]} />
      </View>
      <Text style={styles.places}>
        {trip.origin?.label} → {trip.destination?.label}
      </Text>
      <Text style={formStyles.hint}>{t(`category.${trip.category}`)}</Text>
      <View style={styles.amounts}>
        <Text style={styles.amount}>
          {t('history.fare')}: {formatMoney(trip.fare, language)}
        </Text>
        <Text style={[styles.amount, styles.net]}>
          {t('payment.earnings')}: {formatMoney(trip.driverEarnings, language)}
        </Text>
      </View>
    </Pressable>
  );
}

// Pie de la lista: la página siguiente cargando, o su error con el botón para reintentar.
function Footer({ loading, error, onRetry }) {
  const { t } = useSettings();
  if (loading) return <ActivityIndicator style={styles.footer} />;
  if (!error) return null;
  return (
    <View style={[styles.footer, styles.footerError]}>
      <FieldError error={error} />
      <Button title={t('common.retry')} onPress={onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  filters: { gap: 12, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  range: { flexDirection: 'row', gap: 12 },
  rangeField: { flex: 1 },
  list: { flexGrow: 1, gap: 12, paddingHorizontal: 16, paddingTop: 8 },
  item: { gap: 6, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 14 },
  pressed: { backgroundColor: '#F5F5F5' },
  itemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  date: { fontSize: 15, fontWeight: '600', color: colors.text },
  places: { fontSize: 16, color: colors.text },
  amounts: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  amount: { fontSize: 15, color: colors.text },
  net: { fontWeight: '700' },
  footer: { paddingVertical: 16 },
  footerError: { gap: 8, alignItems: 'center' },
});