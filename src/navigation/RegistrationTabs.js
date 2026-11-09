import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSettings } from '../context/SettingsContext';
import { RegistrationProvider } from '../context/RegistrationContext';
import PersonalDataScreen from '../screens/registration/PersonalDataScreen';
import VehicleScreen from '../screens/registration/VehicleScreen';
import DocumentsScreen from '../screens/registration/DocumentsScreen';

const Tab = createBottomTabNavigator();

// El registro en tres pestañas. El proveedor envuelve las tres para
// que compartan el formulario y nada se pierda al cambiar de pestaña.
// En Android la app va de borde a borde y la ventana no se achica con el
// teclado, así que el teclado tapa la barra de pestañas. Por eso la escondo
// mientras el teclado está abierto, y vuelve al cerrarlo.
export default function RegistrationTabs() {
  const { t } = useSettings();

  return (
    <RegistrationProvider>
      <Tab.Navigator
        screenOptions={{
          tabBarIcon: () => null,
          tabBarLabelStyle: { fontSize: 13 },
          tabBarHideOnKeyboard: true,
        }}
      >
        <Tab.Screen
          name="PersonalData"
          component={PersonalDataScreen}
          options={{ title: t('registration.personal') }}
        />
        <Tab.Screen
          name="Vehicle"
          component={VehicleScreen}
          options={{ title: t('registration.vehicle') }}
        />
        <Tab.Screen
          name="Documents"
          component={DocumentsScreen}
          options={{ title: t('registration.documents') }}
        />
      </Tab.Navigator>
    </RegistrationProvider>
  );
}