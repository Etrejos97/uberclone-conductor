import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MenuButton from '../components/MenuButton';
import { useSettings } from '../context/SettingsContext';
import { headerTitle } from '../theme';
import ProfileScreen from '../screens/profile/ProfileScreen';
import ProfileEditScreen, { EDIT_TITLES } from '../screens/profile/ProfileEditScreen';

const Stack = createNativeStackNavigator();

// Como el historial: el perfil lleva el botón del menú y la edición la flecha
// de volver. Si el conductor sale por el menú a mitad de una edición, al
// volver la encuentra donde la dejó.
export default function ProfileStack() {
  const { t } = useSettings();

  return (
    <Stack.Navigator screenOptions={{ headerTitleStyle: headerTitle }}>
      <Stack.Screen
        name="ProfileView"
        component={ProfileScreen}
        options={{ title: t('menu.profile'), headerLeft: ({ tintColor }) => <MenuButton tintColor={tintColor} /> }}
      />
      <Stack.Screen
        name="ProfileEdit"
        component={ProfileEditScreen}
        options={({ route }) => ({ title: t(EDIT_TITLES[route.params?.mode] ?? EDIT_TITLES.contact) })}
      />
    </Stack.Navigator>
  );
}