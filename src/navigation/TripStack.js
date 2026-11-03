import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSettings } from '../context/SettingsContext';
import TripInProgressScreen from '../screens/trip/TripInProgressScreen';
import PaymentScreen from '../screens/payment/PaymentScreen';

const Stack = createNativeStackNavigator();

// Se abre sobre el menú mientras hay un viaje activo.
export default function TripStack() {
  const { t } = useSettings();

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="TripInProgress"
        component={TripInProgressScreen}
        options={{ title: t('trip.inProgress') }}
      />
      <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: t('payment.title') }} />
    </Stack.Navigator>
  );
}