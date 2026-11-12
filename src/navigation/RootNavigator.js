import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSession } from '../context/SessionContext';
import { useSettings } from '../context/SettingsContext';
import useActiveTrip from '../hooks/useActiveTrip';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import LoginScreen from '../screens/login/LoginScreen';
import RegistrationTabs from './RegistrationTabs';
import MainDrawer from './MainDrawer';
import TripStack from './TripStack';
import { headerTitle } from '../theme';

const Stack = createNativeStackNavigator();

// Sin sesión, el ingreso con la cédula y, desde ahí, el registro. Con sesión,
// el menú o, si hay un viaje activo, el viaje. Mientras lee el teléfono y busca
// el viaje muestra la carga, para no enseñar otra pantalla un instante.
export default function RootNavigator() {
  const { driverId, loading: sessionLoading, loadError, reloadSession } = useSession();
  const { loading: settingsLoading, t } = useSettings();
  const active = useActiveTrip(driverId);

  if (sessionLoading || settingsLoading || active.loading) {
    return <LoadingState message={t('common.loading')} />;
  }
  if (loadError) {
    return <ErrorState message={t(loadError)} onRetry={reloadSession} />;
  }
  if (active.error) {
    return <ErrorState message={t(active.error)} onRetry={active.retry} />;
  }

  let screen = (
    <>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen
        name="Registration"
        component={RegistrationTabs}
        options={{ headerShown: true, title: t('registration.title'), headerTitleStyle: headerTitle }}
      />
    </>
  );
  if (driverId && active.trip) {
    screen = <Stack.Screen name="Trip">{() => <TripStack trip={active.trip} />}</Stack.Screen>;
  } else if (driverId) {
    screen = <Stack.Screen name="Main" component={MainDrawer} />;
  }

  return <Stack.Navigator screenOptions={{ headerShown: false }}>{screen}</Stack.Navigator>;
}