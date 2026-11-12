import { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import AppButton from '../../components/AppButton';
import FieldError from '../../components/FieldError';
import { formStyles } from '../../components/formStyles';
import { isConnectionError } from '../../hooks/useDriverForm';
import { isTripConflict, subscribeToRequests, withdrawRequest } from '../../services/tripService';
import { useSettings } from '../../context/SettingsContext';
import { card, colors, fonts, radius } from '../../theme';

function routeOf(trip) {
  return `${trip.origin?.label ?? '?'} → ${trip.destination?.label ?? '?'}`;
}

// Las solicitudes de este conductor que nadie ha respondido, con la
// opción de retirarlas como lo haría el pasajero. Es la misma consulta que usa
// Inicio, así que una solicitud retirada sale de las dos pantallas.
export default function PendingRequests({ driverId, onWithdrawn }) {
  const { t } = useSettings();
  const [requests, setRequests] = useState([]);
  const [loadError, setLoadError] = useState(null);
  // Firestore cierra la escucha después de un error; cambiar `attempt` la abre otra vez.
  const [attempt, setAttempt] = useState(0);
  const [withdrawing, setWithdrawing] = useState(null);
  const [withdrawError, setWithdrawError] = useState(null);
  const [withdrawn, setWithdrawn] = useState(null);
  // Marcado antes del primer await: un doble toque no retira dos veces.
  const withdrawingNow = useRef(false);

  useEffect(() => {
    if (!driverId) return undefined;
    return subscribeToRequests(
      driverId,
      (list) => {
        setLoadError(null);
        // La más nueva arriba: es la que el usuario acaba de crear.
        setRequests([...list].reverse());
      },
      (reason) => {
        console.warn('Falló la escucha de solicitudes del simulador:', reason?.code ?? reason?.message);
        setLoadError('errors.requestsLoadFailed');
      }
    );
  }, [driverId, attempt]);

  function retry() {
    setLoadError(null);
    setAttempt((current) => current + 1);
  }

  function confirmWithdraw(trip) {
    Alert.alert(t('simulator.withdrawTitle'), t('simulator.withdrawMessage', { route: routeOf(trip) }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('simulator.withdrawConfirm'), style: 'destructive', onPress: () => withdraw(trip) },
    ]);
  }

  async function withdraw(trip) {
    if (withdrawingNow.current) return;
    withdrawingNow.current = true;
    setWithdrawing(trip.id);
    setWithdrawError(null);
    setWithdrawn(null);
    try {
      await withdrawRequest(trip.id);
      setWithdrawn(routeOf(trip));
      onWithdrawn?.(trip.id);
    } catch (error) {
      console.warn('No se pudo retirar la solicitud:', error?.code ?? error?.message);
      if (isTripConflict(error)) setWithdrawError('errors.withdrawTaken');
      else setWithdrawError(isConnectionError(error) ? 'errors.withdrawConnection' : 'errors.withdrawFailed');
    } finally {
      withdrawingNow.current = false;
      setWithdrawing(null);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('simulator.pending')}</Text>
      {withdrawn ? (
        <Text style={styles.notice} accessibilityLiveRegion="polite">
          {t('simulator.withdrawn', { route: withdrawn })}
        </Text>
      ) : null}
      {requests.length === 0 && !loadError ? <Text style={formStyles.hint}>{t('simulator.noPending')}</Text> : null}
      {requests.map((trip) => (
        <View key={trip.id} style={styles.row}>
          <View style={styles.text}>
            <Text style={styles.route}>{routeOf(trip)}</Text>
            <Text style={formStyles.hint}>
              {t(`category.${trip.category}`)} · {t(`paymentMethod.${trip.paymentMethod}`)}
            </Text>
          </View>
          <AppButton
            title={t(withdrawing === trip.id ? 'simulator.withdrawing' : 'simulator.withdraw')}
            accessibilityLabel={t('simulator.withdrawLabel', { route: routeOf(trip) })}
            variant="danger"
            compact
            onPress={() => confirmWithdraw(trip)}
            disabled={withdrawing !== null}
          />
        </View>
      ))}
      <FieldError error={loadError ?? withdrawError} />
      {loadError ? <AppButton title={t('common.retry')} variant="secondary" compact onPress={retry} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  title: { color: colors.text, fontSize: 16, fontFamily: fonts.bold },
  row: { ...card, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 14 },
  text: { flex: 1, gap: 2 },
  route: { color: colors.text, fontSize: 15, fontFamily: fonts.bold },
  notice: {
    color: colors.primary,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.input,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.medium,
  },
});