import { useMemo } from 'react';
import { ActivityIndicator, Alert, Button, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RouteMap from '../../components/RouteMap';
import FieldError from '../../components/FieldError';
import { colors, formStyles } from '../../components/formStyles';
import { useSettings } from '../../context/SettingsContext';
import { canTransition, currentLeg, TRIP_STATUS as S } from '../../domain/tripStateMachine';
import useDriverLocation from '../../hooks/useDriverLocation';
import useTripProgress from '../../hooks/useTripProgress';
import { formatKm, formatMoney } from '../../i18n/format';

const NO_ROUTE = [];

// Viaje en curso: el mapa con la ruta de la etapa y el botón que
// la cierra. Inicio no está montado durante el viaje, así que esta pantalla envía
// la ubicación del conductor. La etapa siempre sale de `trip`, que viene de Firestore.
export default function TripInProgressScreen({ trip }) {
  const { t, language } = useSettings();
  const insets = useSafeAreaInsets();
  const location = useDriverLocation(true);
  const progress = useTripProgress(trip, location.position, location.positionReady);
  const { route, target } = currentLeg(trip);
  const isInProgress = trip.status === S.IN_PROGRESS;

  // El useMemo mantiene el mismo arreglo mientras nada cambia, y RouteMap vuelve a
  // dibujar el mapa cada vez que `markers` es otro. El aviso del lint dice que el compilador
  // de React no podría optimizar este componente; el proyecto no lo activa en app.config.js.
  /* eslint-disable react-hooks/preserve-manual-memoization */
  const markers = useMemo(() => {
    const list = [{ id: 'target', ...target, color: isInProgress ? '#B00020' : '#1A73E8' }];
    if (location.position) {
      list.push({ id: 'driver', ...location.position, label: t('home.you'), color: '#1E8E3E' });
    }
    return list;
  }, [target, isInProgress, location.position, t]);
  /* eslint-enable react-hooks/preserve-manual-memoization */

  function confirmCancel() {
    Alert.alert(t('trip.cancelTitle'), t('trip.cancelMessage'), [
      { text: t('trip.keep'), style: 'cancel' },
      { text: t('trip.cancelConfirm'), style: 'destructive', onPress: progress.cancel },
    ]);
  }

  const locationBlocked = ['denied', 'servicesOff', 'error'].includes(location.status);
  let fixLabel = 'common.retry';
  if (location.status === 'denied') fixLabel = location.canAskAgain ? 'home.allowLocation' : 'home.openSettings';
  // Ya pasó la lectura de la ubicación y no hay ninguna (pasa bajo techo): sin
  // posición no hay ruta, así que en vez de esperar ofrezco leerla otra vez.
  const noPosition = location.positionReady && !location.position;
  const waitingRoute = trip.status === S.ACCEPTED && !progress.routeError && !locationBlocked;
  const isPreparingRoute = waitingRoute && !noPosition;

  return (
    <View style={styles.container}>
      <RouteMap center={location.position} markers={markers} route={route?.coordinates ?? NO_ROUTE} />
      <View style={[styles.panel, { paddingBottom: 16 + insets.bottom }]}>
        <Text style={styles.stage} accessibilityRole="header">
          {t(`trip.stage.${trip.status}`)}
        </Text>
        <Text style={styles.place}>
          {t(isInProgress ? 'trip.destination' : 'trip.pickup')}: {target.label}
        </Text>
        <Text style={formStyles.hint}>
          {t(`category.${trip.category}`)} · {t(`paymentMethod.${trip.paymentMethod}`)}
          {trip.tip > 0 ? ` · ${t('request.tip')} ${formatMoney(trip.tip, language)}` : ''}
        </Text>
        {route ? (
          <Text style={styles.detail}>
            {formatKm(route.distanceKm, language)} · {route.durationMin} min
          </Text>
        ) : null}

        {isPreparingRoute ? (
          <View style={styles.row}>
            <ActivityIndicator />
            <Text style={formStyles.hint}>{t('trip.preparingRoute')}</Text>
          </View>
        ) : null}
        {progress.routeError ? (
          <>
            <FieldError error={progress.routeError} />
            {progress.canRetryRoute ? <Button title={t('common.retry')} onPress={progress.retryRoute} /> : null}
          </>
        ) : null}
        {locationBlocked ? (
          <>
            <Text style={formStyles.hint}>{t(`trip.reason.${location.status}`)}</Text>
            <Button title={t(fixLabel)} onPress={location.fix} />
          </>
        ) : null}
        <FieldError error={location.error} />
        {waitingRoute && noPosition ? <Button title={t('common.retry')} onPress={location.fix} /> : null}
        {/* Separado del de ubicación: con mala señal, si Finalizar falla el conductor tiene que verlo. */}
        <FieldError error={progress.actionError} />

        {trip.status === S.DRIVER_ARRIVING ? (
          <Button title={t('trip.boardPassenger')} onPress={progress.boardPassenger} disabled={progress.busy} />
        ) : null}
        {isInProgress ? (
          <Button title={t('trip.finish')} onPress={progress.finish} disabled={progress.busy} />
        ) : null}
        {/* En in_progress la máquina de estados ya no deja cancelar. */}
        {canTransition(trip.status, S.CANCELLED) ? (
          <Button title={t('trip.cancel')} onPress={confirmCancel} disabled={progress.busy} color="#B00020" />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  panel: { padding: 16, gap: 10, borderTopWidth: 1, borderTopColor: '#E0E0E0', backgroundColor: '#FFFFFF' },
  stage: { fontSize: 20, fontWeight: '600', color: colors.text },
  place: { fontSize: 16, color: colors.text },
  detail: { fontSize: 15, color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});