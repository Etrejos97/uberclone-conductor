import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSettings } from '../context/SettingsContext';
import { TRIP_STATUS } from '../domain/tripStateMachine';
import { headerTitle } from '../theme';
import TripInProgressScreen from '../screens/trip/TripInProgressScreen';
import PaymentScreen from '../screens/payment/PaymentScreen';

const Stack = createNativeStackNavigator();

// Reemplaza al menú mientras hay un viaje abierto. La pantalla sale del estado del
// viaje: con `completed` o `paid` muestra el cobro y antes, el viaje en curso. La
// llave reinicia la pantalla si después de este viaje sigue otro.
export default function TripStack({ trip }) {
  const { t } = useSettings();

  return (
    <Stack.Navigator screenOptions={{ headerTitleStyle: headerTitle }}>
      {trip.status === TRIP_STATUS.COMPLETED || trip.status === TRIP_STATUS.PAID ? (
        <Stack.Screen name="Payment" options={{ title: t('payment.title') }}>
          {() => <PaymentScreen key={trip.id} trip={trip} />}
        </Stack.Screen>
      ) : (
        <Stack.Screen name="TripInProgress" options={{ title: t('trip.inProgress') }}>
          {() => <TripInProgressScreen key={trip.id} trip={trip} />}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
}