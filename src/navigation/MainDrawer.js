import { Image, StyleSheet, Text, View } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import MenuButton from '../components/MenuButton';
import { useSettings } from '../context/SettingsContext';
import { colors, fonts, headerTitle, radius } from '../theme';
import HomeScreen from '../screens/home/HomeScreen';
import HistoryStack from './HistoryStack';
import EarningsScreen from '../screens/earnings/EarningsScreen';
import ProfileStack from './ProfileStack';
import SettingsScreen from '../screens/settings/SettingsScreen';
import SimulatorScreen from '../screens/simulator/SimulatorScreen';

const Drawer = createDrawerNavigator();

// El ícono de cada opción del menú. El ícono lleno marca la pantalla abierta.
function icon(name) {
  function DrawerIcon({ color, size, focused }) {
    return <Ionicons name={focused ? name : `${name}-outline`} size={size - 2} color={color} />;
  }
  return DrawerIcon;
}

// El encabezado del menú: el logo y el nombre de la app sobre la lista.
function DrawerContent(props) {
  const { t } = useSettings();
  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.brand}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} accessibilityIgnoresInvertColors />
        <View>
          <Text style={styles.appName}>UberClone</Text>
          <Text style={styles.role}>{t('menu.driver')}</Text>
        </View>
      </View>
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
}

export default function MainDrawer() {
  const { t } = useSettings();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        drawerStyle: { backgroundColor: colors.surface, borderRightWidth: 1, borderRightColor: colors.border },
        drawerActiveTintColor: colors.primary,
        drawerActiveBackgroundColor: colors.primarySoft,
        drawerInactiveTintColor: colors.muted,
        drawerItemStyle: { borderRadius: radius.input },
        drawerLabelStyle: { fontFamily: fonts.semibold, fontSize: 15 },
        overlayColor: colors.overlay,
        headerTitleStyle: headerTitle,
        headerLeft: ({ tintColor }) => <MenuButton tintColor={tintColor} />,
      }}
    >
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: t('menu.home'), drawerIcon: icon('home') }}
      />
      <Drawer.Screen
        name="History"
        component={HistoryStack}
        options={{ title: t('menu.history'), headerShown: false, drawerIcon: icon('time') }}
      />
      <Drawer.Screen
        name="Earnings"
        component={EarningsScreen}
        options={{ title: t('menu.earnings'), drawerIcon: icon('wallet') }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileStack}
        options={{ title: t('menu.profile'), headerShown: false, drawerIcon: icon('person') }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: t('menu.settings'), drawerIcon: icon('settings') }}
      />
      <Drawer.Screen
        name="Simulator"
        component={SimulatorScreen}
        options={{ title: t('menu.simulator'), drawerIcon: icon('flask') }}
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 18,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logo: { width: 46, height: 46, borderRadius: 12 },
  appName: { color: colors.text, fontSize: 17, fontFamily: fonts.extrabold },
  role: { color: colors.faint, fontSize: 13, fontFamily: fonts.medium },
});