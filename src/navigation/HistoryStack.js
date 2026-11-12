import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MenuButton from '../components/MenuButton';
import { useSettings } from '../context/SettingsContext';
import { headerTitle } from '../theme';
import HistoryListScreen from '../screens/history/HistoryListScreen';
import HistoryDetailScreen from '../screens/history/HistoryDetailScreen';

const Stack = createNativeStackNavigator();

// La lista lleva el botón del menú y el detalle la flecha de volver,
// así el historial no muestra dos barras de título una encima de otra.
export default function HistoryStack() {
  const { t } = useSettings();

  return (
    <Stack.Navigator screenOptions={{ headerTitleStyle: headerTitle }}>
      <Stack.Screen
        name="HistoryList"
        component={HistoryListScreen}
        options={{ title: t('history.list'), headerLeft: ({ tintColor }) => <MenuButton tintColor={tintColor} /> }}
      />
      <Stack.Screen
        name="HistoryDetail"
        component={HistoryDetailScreen}
        options={{ title: t('history.detail') }}
      />
    </Stack.Navigator>
  );
}