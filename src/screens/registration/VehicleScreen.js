import { VehicleFields } from '../../components/DriverFormFields';
import { useRegistration } from '../../context/RegistrationContext';
import RegistrationLayout from './RegistrationLayout';

// VA-09 a VA-15.
export default function VehicleScreen() {
  const { field } = useRegistration();

  return (
    <RegistrationLayout>
      <VehicleFields field={field} />
    </RegistrationLayout>
  );
}