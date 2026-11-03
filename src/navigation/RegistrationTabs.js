import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSettings } from '../context/SettingsContext';
import PersonalDataScreen from '../screens/registration/PersonalDataScreen';
import VehicleScreen from '../screens/registration/VehicleScreen';
import DocumentsScreen from '../screens/registration/DocumentsScreen';

const Tab = createBottomTabNavigator();

// el registro en tres pestañas. En el paso 3 cada una tiene su formulario.
export default function RegistrationTabs() {
  const { t } = useSettings();

  return (
    <Tab.Navigator screenOptions={{ tabBarIcon: () => null, tabBarLabelStyle: { fontSize: 13 } }}>
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
  );
}