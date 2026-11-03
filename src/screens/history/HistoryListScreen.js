import { Button } from 'react-native';
import ScreenPlaceholder from '../../components/ScreenPlaceholder';
import { useSettings } from '../../context/SettingsContext';

export default function HistoryListScreen({ navigation }) {
  const { t } = useSettings();

  return (
    <ScreenPlaceholder>
      <Button
        title={t('history.openDetail')}
        onPress={() => navigation.navigate('HistoryDetail')}
      />
    </ScreenPlaceholder>
  );
}