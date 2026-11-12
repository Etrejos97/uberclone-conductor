import { useMemo } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import AppButton from '../../components/AppButton';
import RouteMap from '../../components/RouteMap';
import FieldError from '../../components/FieldError';
import MapTray from '../../components/MapTray';
import StatusBadge from '../../components/StatusBadge';
import { formStyles } from '../../components/formStyles';
import { useSettings } from '../../context/SettingsContext';
import { canTransition, currentLeg, TRIP_STATUS as S } from '../../domain/tripStateMachine';
import useDriverLocation from '../../hooks/useDriverLocation';
import useTripProgress from '../../hooks/useTripProgress';
import { formatKm, formatMoney } from '../../i18n/format';
import { colors, fonts } from '../../theme';

const NO_ROUTE = [];

// Viaje en curso: el mapa con la ruta de la etapa y el botón que
// la cierra. Inicio no está montado durante el viaje, así que esta pantalla envía
// la ubicación del conductor. La etapa siempre sale de `trip`, que viene de Firestore.
export default function TripInProgressScreen({ trip }) {
  const { t, language } = useSettings();
  const location = useDriverLocation(true);
  const progress = useTripProgress(trip, location.position, location.positionReady);
  const { route, target } = currentLeg(trip);
  const isInProgress = trip.status === S.IN_PROGRESS;

  // La recogida con el centro oscuro y el destino en verde, como en la solicitud.
  // El useMemo mantiene el mismo arreglo mientras nada cambia, y RouteMap vuelve a
  // dibujar el mapa cada vez que `markers` es otro. El aviso del lint dice que el compilador
  // de React no podría optimizar este componente; el proyecto no lo activa en app.config.js.
  /* eslint-disable react-hooks/preserve-manual-memoization */
  const markers = useMemo(() => {
    const list = [
      isInProgress
        ? { id: 'target', ...target, color: colors.primary, borderColor: colors.primary }
        : { id: 'target', ...target, color: colors.background },
    ];
    if (location.position) {
      list.push({ id: 'driver', ...location.position, label: t('home.you'), color: colors.primary });
    }
    return list;
  }, [target, isInProgress, location.position, t]);
  /* eslint-enable react-hooks/preserve-manual-memoization */

  // El diálogo lo dibuja Android con el tema oscuro de la app; el color de sus
  // botones no se puede cambiar.
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
      <View style={styles.map}>
        <RouteMap center={location.position} markers={markers} route={route?.coordinates ?? NO_ROUTE} />
      </View>
      <MapTray>
        <StatusBadge label={t(`trip.stage.${trip.status}`)} tone="success" style={styles.stage} />
        <Text style={styles.place} accessibilityRole="header">
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
            <ActivityIndicator color={colors.primary} />
            <Text style={formStyles.hint}>{t('trip.preparingRoute')}</Text>
          </View>
        ) : null}
        {progress.routeError ? (
          <>
            <FieldError error={progress.routeError} />
            <AppButton title={t('common.retry')} onPress={progress.retryRoute} variant="secondary" />
          </>
        ) : null}
        {locationBlocked ? (
          <>
            <Text style={formStyles.hint}>{t(`trip.reason.${location.status}`)}</Text>
            <AppButton title={t(fixLabel)} onPress={location.fix} variant="secondary" />
          </>
        ) : null}
        <FieldError error={location.error} />
        {waitingRoute && noPosition ? (
          <AppButton title={t('common.retry')} onPress={location.fix} variant="secondary" />
        ) : null}
        {/* Separado del de ubicación: con mala señal, si Finalizar falla el conductor tiene que verlo. */}
        <FieldError error={progress.actionError} />

        {trip.status === S.DRIVER_ARRIVING ? (
          <AppButton title={t('trip.boardPassenger')} onPress={progress.boardPassenger} disabled={progress.busy} />
        ) : null}
        {isInProgress ? <AppButton title={t('trip.finish')} onPress={progress.finish} disabled={progress.busy} /> : null}
        {/* HU-05: en in_progress la máquina de estados ya no deja cancelar. */}
        {canTransition(trip.status, S.CANCELLED) ? (
          <AppButton title={t('trip.cancel')} onPress={confirmCancel} disabled={progress.busy} variant="danger" />
        ) : null}
      </MapTray>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  map: { flex: 1 },
  stage: { alignSelf: 'flex-start' },
  place: { fontSize: 21, fontFamily: fonts.bold, color: colors.text, letterSpacing: -0.2 },
  detail: { fontSize: 15, fontFamily: fonts.bold, color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});