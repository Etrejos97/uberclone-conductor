import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SettingsProvider } from './src/context/SettingsContext';
import { SessionProvider } from './src/context/SessionContext';
import RootNavigator from './src/navigation/RootNavigator';
import { db } from './src/config/firebase';

console.log('Firebase conectado al proyecto', db.app.options.projectId);

export default function App() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <SessionProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
          <StatusBar style="auto" />
        </SessionProvider>
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
