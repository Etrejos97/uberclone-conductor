import { Button } from 'react-native';
import ScreenPlaceholder from '../../components/ScreenPlaceholder';
import { useSettings } from '../../context/SettingsContext';

export default function TripInProgressScreen({ navigation }) {
  const { t } = useSettings();

  return (
    <ScreenPlaceholder>
      <Button title={t('trip.goToPayment')} onPress={() => navigation.navigate('Payment')} />
    </ScreenPlaceholder>
  );
}