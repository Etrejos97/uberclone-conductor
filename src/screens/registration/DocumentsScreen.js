import { Button } from 'react-native';
import ScreenPlaceholder from '../../components/ScreenPlaceholder';
import { useSession } from '../../context/SessionContext';
import { useSettings } from '../../context/SettingsContext';

// Provisional: abre una sesión con un id de prueba para recorrer el menú.
// En el paso 3 esta pantalla pasa a ser la tercera pestaña del registro.
export default function DocumentsScreen() {
  const { t } = useSettings();
  const { startSession } = useSession();

  function enterDemo() {
    startSession('demo-driver').catch((error) => {
      console.warn('No pude guardar la sesión de prueba:', error?.message);
    });
  }

  return (
    <ScreenPlaceholder>
      <Button title={t('registration.demoDriver')} onPress={enterDemo} />
    </ScreenPlaceholder>
  );
}