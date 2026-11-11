import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SettingsProvider } from './src/context/SettingsContext';
import { SessionProvider } from './src/context/SessionContext';
import RootNavigator from './src/navigation/RootNavigator';
import { wakeBackend } from './src/services/apiService';

export default function App() {
  useEffect(() => {
    wakeBackend();
  }, []);

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