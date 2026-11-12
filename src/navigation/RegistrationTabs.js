import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { usePreventRemove } from '@react-navigation/native';
import { useSettings } from '../context/SettingsContext';
import { RegistrationProvider, useRegistration } from '../context/RegistrationContext';
import { colors, fonts } from '../theme';
import PersonalDataScreen from '../screens/registration/PersonalDataScreen';
import VehicleScreen from '../screens/registration/VehicleScreen';
import DocumentsScreen from '../screens/registration/DocumentsScreen';

const Tab = createBottomTabNavigator();

// Mientras envío el registro, la flecha y el botón atrás de Android no vuelven
// al ingreso: el envío terminaría con la pantalla cerrada y su error no se vería.
function BlockExitWhileSending() {
  const { submitting } = useRegistration();
  usePreventRemove(submitting, () => {});
  return null;
}

// El registro en tres pestañas. El proveedor envuelve las tres para
// que compartan el formulario y nada se pierda al cambiar de pestaña.
// En Android la app va de borde a borde y la ventana no se achica con el
// teclado, así que el teclado tapa la barra de pestañas. Por eso la escondo
// mientras el teclado está abierto, y vuelve al cerrarlo.
// Las pestañas no llevan ícono: el texto basta y la activa va en verde.
// El título «Registro» y la flecha para volver al ingreso los pone el stack de
// RootNavigator, así que las pestañas no llevan encabezado propio. Si el
// conductor llega desde una cédula que no existe, la cédula viene escrita.
export default function RegistrationTabs({ route }) {
  const { t } = useSettings();

  return (
    <RegistrationProvider documentNumber={route.params?.documentNumber}>
      <BlockExitWhileSending />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarIcon: () => null,
          tabBarIconStyle: { display: 'none' },
          tabBarLabelStyle: { fontSize: 13, fontFamily: fonts.semibold },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.faint,
          tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
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