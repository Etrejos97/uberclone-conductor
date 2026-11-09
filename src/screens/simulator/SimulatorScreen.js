import { useRef, useState } from 'react';
import { Button, StyleSheet, Text } from 'react-native';
import FormField from '../../components/FormField';
import FormScrollView from '../../components/FormScrollView';
import SelectField from '../../components/SelectField';
import FieldError from '../../components/FieldError';
import { formStyles } from '../../components/formStyles';
import { PAYMENT_METHODS, SIMULATOR_PLACES } from '../../config/app';
import { CATEGORIES } from '../../config/pricing';
import { validateSimulatedTrip } from '../../domain/validators';
import { createTrip, getTripStatusFromServer, newTripId } from '../../services/tripService';
import { useSession } from '../../context/SessionContext';
import { useSettings } from '../../context/SettingsContext';

const PLACE_OPTIONS = SIMULATOR_PLACES.map((place) => ({ value: place.id, label: place.label }));

function toPlace(id) {
  const { latitude, longitude, label } = SIMULATOR_PLACES.find((place) => place.id === id);
  return { latitude, longitude, label };
}

// Cliente simulado: crea una solicitud para el conductor de este
// teléfono, como lo haría la app del pasajero.
export default function SimulatorScreen({ navigation }) {
  const { t } = useSettings();
  const { driverId, driver } = useSession();
  const [values, setValues] = useState(() => ({
    origin: '',
    destination: '',
    category: driver?.vehicle?.category ?? '',
    paymentMethod: '',
    tip: '',
  }));
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  // El id de la solicitud que estoy enviando. Si el envío pasa del tiempo límite
  // y el usuario reenvía, uso el mismo id para no crear dos viajes.
  const tripId = useRef(null);
  // Marcado antes del primer await: un doble toque no envía dos veces.
  const sendingNow = useRef(false);

  const errors = validateSimulatedTrip(values);
  const shown = submitted ? errors : {};

  function set(name) {
    return (value) => setValues((current) => ({ ...current, [name]: value }));
  }

  async function send() {
    setSubmitted(true);
    setSendError(null);
    if (sendingNow.current || Object.keys(errors).length > 0) return;
    sendingNow.current = true;
    setSending(true);
    try {
      // En un reintento, la solicitud pudo quedar creada aunque el intento
      // anterior pasó del tiempo límite.
      const isRetry = tripId.current !== null;
      if (!isRetry) tripId.current = newTripId();
      if (!isRetry || (await getTripStatusFromServer(tripId.current)) === null) {
        await createTrip(tripId.current, {
          driverId,
          origin: toPlace(values.origin),
          destination: toPlace(values.destination),
          category: values.category,
          paymentMethod: values.paymentMethod,
          tip: values.tip.trim() === '' ? 0 : Number(values.tip.trim()),
        });
      }
      tripId.current = null;
      setValues((current) => ({ ...current, origin: '', destination: '', tip: '' }));
      setSubmitted(false);
      navigation.navigate('Home');
    } catch (error) {
      console.warn('No se pudo crear la solicitud:', error?.code ?? error?.message);
      setSendError('errors.tripCreateFailed');
    } finally {
      sendingNow.current = false;
      setSending(false);
    }
  }

  return (
    <FormScrollView contentContainerStyle={styles.container}>
      <Text style={formStyles.hint}>{t('simulator.intro')}</Text>
      {/* La solicitud se crea igual, pero solo llega a Inicio si el conductor está Disponible. */}
      {!driver?.isAvailable ? <Text style={styles.warning}>{t('simulator.notAvailable')}</Text> : null}

      <SelectField
        label={t('simulator.origin')}
        placeholder={t('common.select')}
        value={values.origin}
        options={PLACE_OPTIONS}
        onChange={set('origin')}
        error={shown.origin}
      />
      <SelectField
        label={t('simulator.destination')}
        placeholder={t('common.select')}
        value={values.destination}
        options={PLACE_OPTIONS}
        onChange={set('destination')}
        error={shown.destination}
      />
      <SelectField
        label={t('registration.category')}
        placeholder={t('common.select')}
        value={values.category}
        options={CATEGORIES.map((category) => ({ value: category, label: t(`category.${category}`) }))}
        onChange={set('category')}
        error={shown.category}
      />
      <SelectField
        label={t('simulator.paymentMethod')}
        placeholder={t('common.select')}
        value={values.paymentMethod}
        options={PAYMENT_METHODS.map((method) => ({ value: method, label: t(`paymentMethod.${method}`) }))}
        onChange={set('paymentMethod')}
        error={shown.paymentMethod}
      />
      <FormField
        label={t('simulator.tip')}
        value={values.tip}
        onChange={set('tip')}
        error={shown.tip}
        keyboardType="number-pad"
        placeholder="0"
      />

      <FieldError error={sendError} />
      <Button
        title={t(sending ? 'simulator.sending' : 'simulator.send')}
        onPress={send}
        disabled={sending}
      />
    </FormScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  warning: { color: '#8A5A00', fontSize: 14 },
});