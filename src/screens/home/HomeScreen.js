import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, ScrollView, StyleSheet, Switch, Text, useWindowDimensions, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import RouteMap from '../../components/RouteMap';
import ErrorState from '../../components/ErrorState';
import LoadingState from '../../components/LoadingState';
import FieldError from '../../components/FieldError';
import RequestCard from '../../components/RequestCard';
import { colors, formStyles } from '../../components/formStyles';
import useDriverLocation from '../../hooks/useDriverLocation';
import useTripRequests from '../../hooks/useTripRequests';
import useCountdown from '../../hooks/useCountdown';
import { REQUEST_TIMEOUT_S } from '../../config/app';
import { approvalTextKey, toFormValues } from '../../domain/driverProfile';
import { expiredDocuments } from '../../domain/validators';
import { setAvailability } from '../../services/driverService';
import { useSession } from '../../context/SessionContext';
import { useSettings } from '../../context/SettingsContext';

const NO_ROUTE = [];

// Inicio: el mapa con la ubicación actual, el interruptor Disponible / No
// disponible (RF-05, RF-07 a RF-10) y la solicitud que esté llegando. El valor del interruptor es el `isAvailable` del conductor en Firestore.
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
  // Lo calculo en cada render, sin useMemo: un vencimiento que llega con la app
  // abierta se nota al volver a Inicio, que se vuelve a pintar al enfocarse.
  const expired = driver ? expiredDocuments(toFormValues(driver)) : [];
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

  // Al abrir la app vuelvo al último estado guardado en el teléfono.
  // Después, si la cuenta deja de estar aprobada o se pierde el permiso de
  // ubicación, paso a No disponible sin esperar al conductor.
  useEffect(() => {
    if (!hasDriver || location.status === 'checking') return;
    const wanted = restored.current ? isAvailable : lastAvailability;
    restored.current = true;
    const next = wanted && canBeAvailable;
    if (next !== isAvailable) changeAvailability(next);
  }, [hasDriver, location.status, isAvailable, lastAvailability, canBeAvailable, changeAvailability]);

  const markers = useMemo(() => {
    const list = [];
    if (location.position) {
      list.push({
        id: 'driver',
        ...location.position,
        label: t('home.you'),
        color: isAvailable ? '#1E8E3E' : '#5F6368',
      });
    }
    if (request) {
      list.push({ id: 'origin', ...request.origin, color: '#1A73E8' });
      list.push({ id: 'destination', ...request.destination, color: '#B00020' });
    }
    return list;
  }, [location.position, isAvailable, request, t]);

  if (driverError) return <ErrorState message={t(driverError)} onRetry={retryDriver} />;
  if (!driver) return <LoadingState message={t('common.loading')} />;

  const locationBlocked = ['denied', 'servicesOff', 'error'].includes(location.status);
  let fixLabel = 'common.retry';
  if (location.status === 'denied') fixLabel = location.canAskAgain ? 'home.allowLocation' : 'home.openSettings';

  return (
    <View style={styles.container}>
      <RouteMap
        center={location.position}
        markers={markers}
        route={request?.route?.coordinates ?? NO_ROUTE}
      />
      <View style={styles.panel}>
        <Text style={styles.name}>
          {driver.fullName} · {t(`approval.${approvalTextKey(driver.approvalStatus)}`)}
        </Text>
        <View style={styles.row}>
          <Text style={styles.status}>{t(isAvailable ? 'home.available' : 'home.unavailable')}</Text>
          <Switch
            value={isAvailable}
            onValueChange={changeAvailability}
            disabled={!canBeAvailable && !isAvailable}
            accessibilityLabel={t('home.availability')}
          />
        </View>
        {/* Con la cuenta sin aprobar el interruptor no cambia y digo por qué. */}
        {!isApproved ? <Text style={formStyles.hint}>{t(`home.reason.${approvalTextKey(driver.approvalStatus)}`)}</Text> : null}
        {isApproved && expired.length > 0 ? (
          <>
            <Text style={formStyles.hint}>
              {t('home.reason.expired', { documents: expired.map((name) => t(`document.${name}`)).join(', ') })}
            </Text>
            {/* initial: false deja el Perfil debajo, así la flecha de volver lleva ahí. */}
            <Button
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
            <Button title={t(fixLabel)} onPress={location.fix} />
          </>
        ) : null}
        <FieldError error={availabilityError || location.error} />
        {requests.error ? (
          <>
            <FieldError error={requests.error} />
            <Button title={t('common.retry')} onPress={requests.retry} />
          </>
        ) : null}
        <FieldError error={requests.actionError} />
        {isAvailable && !request && !requests.error ? (
          <Text style={formStyles.hint}>{t('home.waiting')}</Text>
        ) : null}
        {request ? (
          <Text style={styles.listTitle}>{t('home.requests', { count: requests.requests.length })}</Text>
        ) : null}
      </View>
      {request ? (
        // La lista no pasa de la mitad de la pantalla, para que el mapa se siga viendo.
        <ScrollView style={[styles.list, { maxHeight: height * 0.5 }]} contentContainerStyle={styles.listContent}>
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
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  panel: { padding: 16, gap: 10, borderTopWidth: 1, borderTopColor: '#E0E0E0', backgroundColor: '#FFFFFF' },
  name: { fontSize: 15, color: colors.muted },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  status: { fontSize: 20, fontWeight: '600', color: colors.text },
  listTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  list: { flexGrow: 0, backgroundColor: '#F5F5F5' },
  listContent: { padding: 12, gap: 12 },
});