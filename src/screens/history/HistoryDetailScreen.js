import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import InfoRow from '../../components/InfoRow';
import LoadingState from '../../components/LoadingState';
import RouteMap from '../../components/RouteMap';
import StatusBadge from '../../components/StatusBadge';
import { useSettings } from '../../context/SettingsContext';
import useTrip from '../../hooks/useTrip';
import { METHOD_TONE } from './HistoryListScreen';
import { formatDateTime, formatKm, formatMoney } from '../../i18n/format';
import { card, colors, fonts, radius } from '../../theme';

const NO_ROUTE = [];

// Detalle de un viaje del historial: la ruta guardada de origen a destino
// y los valores con que se cerró. La duración y la distancia son las de esa ruta,
// las mismas con que se calculó la tarifa.
export default function HistoryDetailScreen({ route }) {
  const { t, language } = useSettings();
  const insets = useSafeAreaInsets();
  const { trip, loading, error, retry } = useTrip(route.params?.tripId);

  // La recogida con el centro oscuro y el destino en verde, como en la solicitud.
  const markers = useMemo(() => {
    if (!trip) return [];
    return [
      { id: 'origin', ...trip.origin, color: colors.background },
      { id: 'destination', ...trip.destination, color: colors.primary, borderColor: colors.primary },
    ];
  }, [trip]);

  if (loading) return <LoadingState message={t('common.loading')} />;
  if (error) return <ErrorState message={t(error)} onRetry={retry} />;
  // Sin tripId en los parámetros no hay nada que cargar ni que reintentar.
  if (!trip) return <EmptyState message={t('errors.tripNotFound')} />;

  const money = (value) => formatMoney(value, language);

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.map}>
        <RouteMap center={trip.origin} markers={markers} route={trip.route?.coordinates ?? NO_ROUTE} />
      </View>

      <View style={styles.header}>
        <Text style={styles.places} accessibilityRole="header">
          {trip.origin?.label} → {trip.destination?.label}
        </Text>
        <StatusBadge label={t(`history.method.${trip.paymentMethod}`)} tone={METHOD_TONE[trip.paymentMethod]} />
      </View>

      <View style={styles.card}>
        <InfoRow label={t('history.date')} value={trip.completedAt ? formatDateTime(trip.completedAt, language) : ''} />
        <InfoRow label={t('history.category')} value={t(`category.${trip.category}`)} />
        <InfoRow label={t('history.paymentMethod')} value={t(`paymentMethod.${trip.paymentMethod}`)} />
        <InfoRow label={t('history.duration')} value={t('history.minutes', { minutes: trip.route?.durationMin ?? 0 })} />
        <InfoRow label={t('history.distance')} value={formatKm(trip.route?.distanceKm ?? 0, language)} />
      </View>

      <View style={styles.card}>
        <InfoRow label={t('history.fare')} value={money(trip.fare)} />
        <InfoRow label={t('payment.commission')} value={money(trip.commission)} />
        <InfoRow label={t('request.tip')} value={money(trip.tip)} />
        <InfoRow label={t('payment.earnings')} value={money(trip.driverEarnings)} strong />
        <InfoRow
          label={t('history.rating')}
          value={trip.rating ? t('history.ratingValue', { rating: trip.rating }) : t('history.notRated')}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16 },
  map: { height: 220, borderRadius: radius.card, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  places: { flex: 1, fontSize: 17, fontFamily: fonts.bold, color: colors.text },
  card: { ...card, gap: 10, padding: 16 },
});