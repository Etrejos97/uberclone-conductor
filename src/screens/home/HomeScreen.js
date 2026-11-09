import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, StyleSheet, Switch, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import RouteMap from '../../components/RouteMap';
import ErrorState from '../../components/ErrorState';
import LoadingState from '../../components/LoadingState';
import FieldError from '../../components/FieldError';
import { colors, formStyles } from '../../components/formStyles';
import useDriverLocation from '../../hooks/useDriverLocation';
import { approvalTextKey } from '../../domain/driverProfile';
import { setAvailability } from '../../services/driverService';
import { useSession } from '../../context/SessionContext';
import { useSettings } from '../../context/SettingsContext';

// Inicio: el mapa con la ubicación actual y el interruptor Disponible / No
// disponible (RF-05, RF-07 a RF-10). El valor del interruptor es el
// `isAvailable` del conductor en Firestore.
export default function HomeScreen() {
  const { t, lastAvailability, setLastAvailability } = useSettings();
  const { driverId, driver, driverError, retryDriver } = useSession();
  const isFocused = useIsFocused();
  const isAvailable = driver?.isAvailable === true;
  // El menú lateral no desmonta Inicio, así que pauso el envío mientras
  // el conductor está en otra pantalla y lo retomo al volver.
  const location = useDriverLocation(isAvailable && isFocused);
  const [availabilityError, setAvailabilityError] = useState(null);
  const restored = useRef(false);

  const hasDriver = driver !== null;
  const isApproved = driver?.approvalStatus === 'approved';
  const canBeAvailable = isApproved && location.status === 'ready';

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
    return list;
  }, [location.position, isAvailable, t]);

  if (driverError) return <ErrorState message={t(driverError)} onRetry={retryDriver} />;
  if (!driver) return <LoadingState message={t('common.loading')} />;

  const locationBlocked = ['denied', 'servicesOff', 'error'].includes(location.status);
  let fixLabel = 'common.retry';
  if (location.status === 'denied') fixLabel = location.canAskAgain ? 'home.allowLocation' : 'home.openSettings';

  return (
    <View style={styles.container}>
      <RouteMap center={location.position} markers={markers} />
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
        {locationBlocked ? (
          <>
            <Text style={formStyles.hint}>{t(`home.reason.${location.status}`)}</Text>
            <Button title={t(fixLabel)} onPress={location.fix} />
          </>
        ) : null}
        <FieldError error={availabilityError || location.error} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  panel: { padding: 16, gap: 10, borderTopWidth: 1, borderTopColor: '#E0E0E0', backgroundColor: '#FFFFFF' },
  name: { fontSize: 15, color: colors.muted },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  status: { fontSize: 20, fontWeight: '600', color: colors.text },
});