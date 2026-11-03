import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSession } from '../context/SessionContext';
import { useSettings } from '../context/SettingsContext';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import RegistrationTabs from './RegistrationTabs';
import MainDrawer from './MainDrawer';
import TripStack from './TripStack';

const Stack = createNativeStackNavigator();

// Sin sesión, solo existe el registro; con sesión, el menú y el viaje.
// Mientras lee el teléfono muestra la carga, para no enseñar el registro
// un instante a un conductor que ya tiene sesión.
export default function RootNavigator() {
  const { driverId, loading: sessionLoading, loadError, reloadSession } = useSession();
  const { loading: settingsLoading, t } = useSettings();

  if (sessionLoading || settingsLoading) {
    return <LoadingState message={t('common.loading')} />;
  }
  if (loadError) {
    return <ErrorState message={t(loadError)} onRetry={reloadSession} />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {driverId ? (
        <>
          <Stack.Screen name="Main" component={MainDrawer} />
          <Stack.Screen name="Trip" component={TripStack} />
        </>
      ) : (
        <Stack.Screen name="Registration" component={RegistrationTabs} />
      )}
    </Stack.Navigator>
  );
}