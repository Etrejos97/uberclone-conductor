import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import AppButton from '../../components/AppButton';
import RouteMap from '../../components/RouteMap';
import ErrorState from '../../components/ErrorState';
import LoadingState from '../../components/LoadingState';
import FieldError from '../../components/FieldError';
import MapTray from '../../components/MapTray';
import RequestCard from '../../components/RequestCard';
import StatusBadge, { APPROVAL_TONES } from '../../components/StatusBadge';
import StatusPill from '../../components/StatusPill';
import { formStyles } from '../../components/formStyles';
import useDriverLocation from '../../hooks/useDriverLocation';
import useTripRequests from '../../hooks/useTripRequests';
import useCountdown from '../../hooks/useCountdown';
import usePushNotifications from '../../hooks/usePushNotifications';
import { REQUEST_TIMEOUT_S } from '../../config/app';
import { approvalTextKey, toFormValues } from '../../domain/driverProfile';
import { expiredDocuments } from '../../domain/validators';
import { setAvailability } from '../../services/driverService';
import { useSession } from '../../context/SessionContext';
import { useSettings } from '../../context/SettingsContext';
import { colors, fonts, radius } from '../../theme';

const NO_ROUTE = [];

// Inicio: el mapa con la ubicación actual, el botón para ponerse disponible o
// desconectarse (RF-05, RF-07 a RF-10) y la solicitud que esté llegando (RF-12 a
// RF-14). El estado del botón es el `isAvailable` del conductor en Firestore, y
// la píldora sobre el mapa lo repite para verlo de un vistazo.
export default function HomeScreen({ navigation }) {
  const { t, lastAvailability, setLastAvailability } = useSettings();
  const { driverId, driver, driverError, retryDriver } = useSession();
  const isFocused = useIsFocused();
  const isAvailable = driver?.isAvailable === true;
  // RF-09: el menú lateral no desmonta Inicio, así que pauso el envío mientras
  // el conductor está en otra pantalla y lo retomo al volver.
  const location = useDriverLocation(isAvailable && isFocused);
  // Las solicitudes también se escuchan solo con Inicio a la vista: al volver,
  // las que vencieron mientras tanto se rechazan solas.
  const requests = useTripRequests(isAvailable && isFocused);
  const remaining = useCountdown(requests.deadlines, REQUEST_TIMEOUT_S, requests.expire);
  // RF-15: Inicio queda montado mientras exista el menú, así que aquí vive el
  // token de FCM y el toque en la notificación.
  usePushNotifications(navigation);
  // El mapa dibuja la solicitud que el conductor tocó; si no tocó ninguna, o la
  // que tocó ya no está, la más antigua.
  const [selectedId, setSelectedId] = useState(null);
  const request = requests.requests.find((trip) => trip.id === selectedId) ?? requests.requests[0] ?? null;
  const { height } = useWindowDimensions();
  const [availabilityError, setAvailabilityError] = useState(null);
  const restored = useRef(false);

  const hasDriver = driver !== null;
  const isApproved = driver?.approvalStatus === 'approved';
  // Un documento vencido también cierra la disponibilidad, hasta que el
  // conductor lo renueve en Perfil y el aprobador vuelva a aprobar la cuenta.
  const expired = useMemo(() => (driver ? expiredDocuments(toFormValues(driver)) : []), [driver]);
  const canBeAvailable = isApproved && expired.length === 0 && location.status === 'ready';

  const changeAvailability = useCallback(
    async (value) => {
      setAvailabilityError(null);
      setLastAvailability(value);
      try {
        await setAvailability(driverId, value);
      } catch (error) {
        console.warn('No se pudo cambiar la disponibilidad:', error?.code ?? error?.message);
        setAvailabilityError('errors.availabilityFailed');
      }
    },
    [driverId, setLastAvailability]
  );

  // RF-10: al abrir la app vuelvo al último estado guardado en el teléfono.
  // Después, si la cuenta deja de estar aprobada o se pierde el permiso de
  // ubicación, paso a No disponible sin esperar al conductor.
  useEffect(() => {
    if (!hasDriver || location.status === 'checking') return;
    const wanted = restored.current ? isAvailable : lastAvailability;
    restored.current = true;
    const next = wanted && canBeAvailable;
    if (next !== isAvailable) changeAvailability(next);
  }, [hasDriver, location.status, isAvailable, lastAvailability, canBeAvailable, changeAvailability]);

  // El conductor en verde cuando está disponible; la recogida con el centro
  // oscuro y el destino en verde, como en la tarjeta de la solicitud.
  const markers = useMemo(() => {
    const list = [];
    if (request) {
      list.push({ id: 'origin', ...request.origin, color: colors.background });
      list.push({ id: 'destination', ...request.destination, color: colors.primary, borderColor: colors.primary });
    }
    if (location.position) {
      list.push({
        id: 'driver',
        ...location.position,
        label: t('home.you'),
        color: isAvailable ? colors.primary : colors.faint,
      });
    }
    return list;
  }, [location.position, isAvailable, request, t]);

  if (driverError) return <ErrorState message={t(driverError)} onRetry={retryDriver} />;
  if (!driver) return <LoadingState message={t('common.loading')} />;

  const approval = approvalTextKey(driver.approvalStatus);
  const hasExpired = isApproved && expired.length > 0;
  const locationBlocked = ['denied', 'servicesOff', 'error'].includes(location.status);
  let fixLabel = 'common.retry';
  if (location.status === 'denied') fixLabel = location.canAskAgain ? 'home.allowLocation' : 'home.openSettings';

  let headline = null;
  if (!isApproved) headline = t(`home.headline.${approval}`);
  else if (!hasExpired && !request) headline = t(isAvailable ? 'home.waiting' : 'home.headline.offline');

  return (
    <View style={styles.container}>
      <View style={styles.map}>
        <RouteMap
          center={location.position}
          markers={markers}
          route={request?.route?.coordinates ?? NO_ROUTE}
        />
        <StatusPill label={t(isAvailable ? 'home.available' : 'home.unavailable')} on={isAvailable} />
      </View>

      <MapTray>
        <View style={styles.between}>
          <Text style={styles.name} numberOfLines={1}>
            {driver.fullName}
          </Text>
          <StatusBadge label={t(`approval.${approval}`)} tone={APPROVAL_TONES[approval]} />
        </View>

        {headline ? (
          <Text style={styles.headline} accessibilityRole="header">
            {headline}
          </Text>
        ) : null}

        {/* HU-02: con la cuenta sin aprobar el botón no se activa y digo por qué. */}
        {!isApproved ? <Text style={formStyles.hint}>{t(`home.reason.${approval}`)}</Text> : null}
        {isAvailable && !request && !requests.error ? (
          <Text style={formStyles.hint}>{t('home.waitingHint')}</Text>
        ) : null}
        {hasExpired ? (
          <>
            <View style={styles.warning}>
              <Text style={styles.warningText}>
                {t('home.reason.expired', { documents: expired.map((name) => t(`document.${name}`)).join(', ') })}
              </Text>
            </View>
            {/* initial: false deja el Perfil debajo, así la flecha de volver lleva ahí. */}
            <AppButton
              title={t('profile.renew')}
              onPress={() =>
                navigation.navigate('Profile', { screen: 'ProfileEdit', params: { mode: 'renewal' }, initial: false })
              }
            />
          </>
        ) : null}
        {locationBlocked ? (
          <>
            <Text style={formStyles.hint}>{t(`home.reason.${location.status}`)}</Text>
            <AppButton title={t(fixLabel)} onPress={location.fix} />
          </>
        ) : null}
        <FieldError error={availabilityError || location.error} />
        {requests.error ? (
          <>
            <FieldError error={requests.error} />
            <AppButton title={t('common.retry')} onPress={requests.retry} variant="secondary" />
          </>
        ) : null}
        {requests.actionError ? <FieldError error={requests.actionError} /> : null}

        {request ? (
          <>
            {requests.requests.length > 1 ? (
              <Text style={styles.listTitle}>{t('home.requests', { count: requests.requests.length })}</Text>
            ) : null}
            {/* La lista no pasa de la mitad de la pantalla, para que el mapa se siga viendo. */}
            <ScrollView style={{ maxHeight: height * 0.5 }} contentContainerStyle={styles.listContent}>
              {requests.requests.map((trip) => (
                <RequestCard
                  key={trip.id}
                  trip={trip}
                  remaining={remaining[trip.id] ?? REQUEST_TIMEOUT_S}
                  selected={trip.id === request.id}
                  onSelect={() => setSelectedId(trip.id)}
                  quoteError={requests.quoteErrors[trip.id] ?? null}
                  onRetryQuote={() => requests.retryQuote(trip.id)}
                  onAccept={() => requests.accept(trip)}
                  onReject={() => requests.reject(trip.id)}
                  busy={requests.busy}
                />
              ))}
            </ScrollView>
          </>
        ) : null}

        {isAvailable ? (
          <AppButton
            title={t('home.goOffline')}
            onPress={() => changeAvailability(false)}
            variant="secondary"
            compact={Boolean(request)}
          />
        ) : (
          <AppButton
            title={t('home.goOnline')}
            onPress={() => changeAvailability(true)}
            disabled={!canBeAvailable}
          />
        )}
      </MapTray>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  map: { flex: 1 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  name: { flexShrink: 1, fontSize: 14, fontFamily: fonts.medium, color: colors.muted },
  headline: { fontSize: 22, fontFamily: fonts.bold, color: colors.text, letterSpacing: -0.2 },
  warning: {
    backgroundColor: colors.warningSoft,
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: radius.input,
    padding: 12,
  },
  warningText: { color: colors.warning, fontSize: 14, lineHeight: 20, fontFamily: fonts.medium },
  listTitle: { fontSize: 15, fontFamily: fonts.semibold, color: colors.text },
  listContent: { gap: 12 },
});