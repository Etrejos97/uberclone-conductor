import { createDrawerNavigator } from '@react-navigation/drawer';
import { useSettings } from '../context/SettingsContext';
import HomeScreen from '../screens/home/HomeScreen';
import HistoryStack from './HistoryStack';
import EarningsScreen from '../screens/earnings/EarningsScreen';
import ProfileStack from './ProfileStack';
import SettingsScreen from '../screens/settings/SettingsScreen';
import SimulatorScreen from '../screens/simulator/SimulatorScreen';

const Drawer = createDrawerNavigator();

export default function MainDrawer() {
  const { t } = useSettings();

  return (
    <Drawer.Navigator>
      <Drawer.Screen name="Home" component={HomeScreen} options={{ title: t('menu.home') }} />
      <Drawer.Screen
        name="History"
        component={HistoryStack}
        options={{ title: t('menu.history'), headerShown: false }}
      />
      <Drawer.Screen
        name="Earnings"
        component={EarningsScreen}
        options={{ title: t('menu.earnings') }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileStack}
        options={{ title: t('menu.profile'), headerShown: false }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: t('menu.settings') }}
      />
      <Drawer.Screen
        name="Simulator"
        component={SimulatorScreen}
        options={{ title: t('menu.simulator') }}
      />
    </Drawer.Navigator>
  );
}