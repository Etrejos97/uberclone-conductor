import { DrawerToggleButton } from '@react-navigation/drawer';
import { useSettings } from '../context/SettingsContext';

// El botón que abre el menú lateral en los encabezados. El ícono viene negro:
// sin el tintColor del encabezado no se ve sobre el fondo oscuro. El lector de
// pantalla lo anuncia en el idioma de la app, no con el texto en inglés de la librería.
export default function MenuButton({ tintColor }) {
  const { t } = useSettings();
  return <DrawerToggleButton tintColor={tintColor} accessibilityLabel={t('menu.open')} />;
}