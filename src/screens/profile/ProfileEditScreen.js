import { useEffect, useState } from 'react';
import { ActivityIndicator, Button, Keyboard, StyleSheet, Text, View } from 'react-native';
import { usePreventRemove } from '@react-navigation/native';
import FieldError from '../../components/FieldError';
import FormScrollView from '../../components/FormScrollView';
import LoadingState from '../../components/LoadingState';
import {
  ContactFields,
  DocumentsFields,
  ExpiringDocumentFields,
  PersonalDataFields,
  VehicleFields,
} from '../../components/DriverFormFields';
import { colors, formStyles } from '../../components/formStyles';
import useProfileEdit from '../../hooks/useProfileEdit';
import { useSession } from '../../context/SessionContext';
import { useSettings } from '../../context/SettingsContext';

// El título de cada forma de editar el perfil (useProfileEdit explica cada una).
export const EDIT_TITLES = {
  contact: 'profile.editContact',
  renewal: 'profile.renew',
  full: 'profile.edit',
};

// Editar contacto, Renovar documentos o, con la cuenta sin
// aprobar, Editar perfil completo. Perfil y Inicio dicen cuál en `mode`.
export default function ProfileEditScreen({ navigation, route }) {
  const { t } = useSettings();
  const { driverId, driver } = useSession();

  // useProfileEdit arranca con el documento del conductor, así que espero a tenerlo.
  if (!driver) return <LoadingState message={t('common.loading')} />;
  // El modo sale solo de la navegación, nunca del estado de la cuenta: al
  // renovar, la escucha del conductor ve 'pending' antes de que termine el
  // guardado, y el formulario no puede cambiar en ese momento. Sin modo válido
  // abro el contacto, que las reglas aceptan en cualquier estado.
  const mode = Object.keys(EDIT_TITLES).includes(route.params?.mode) ? route.params.mode : 'contact';
  // Con otro `mode` el formulario arranca de nuevo, con los campos de esa forma.
  return <ProfileEditForm key={mode} mode={mode} driverId={driverId} driver={driver} navigation={navigation} />;
}

function ProfileEditForm({ mode, driverId, driver, navigation }) {
  const { t } = useSettings();
  const { field, values, isComplete, dirty, save, saving, saveError, documents } = useProfileEdit(
    driverId,
    driver,
    mode
  );
  const [saved, setSaved] = useState(false);
  // Mientras guardo, la flecha y el botón atrás de Android no cierran la
  // pantalla: al terminar, save decide si vuelvo al perfil o muestro el error.
  usePreventRemove(saving, () => {});

  // Vuelvo al perfil en un efecto, después del render en que `saving` ya es
  // false: si lo hiciera apenas termina save, el bloqueo de arriba lo frenaría.
  useEffect(() => {
    if (saved) navigation.goBack();
  }, [saved, navigation]);

  async function handleSave() {
    Keyboard.dismiss();
    if (await save()) setSaved(true);
  }

  // Inicio o un Perfil abierto desde antes pueden llegar aquí cuando ya no hay nada por renovar.
  if (mode === 'renewal' && documents.length === 0) {
    return (
      <View style={styles.content}>
        <Text style={formStyles.hint}>{t('profile.nothingToRenew')}</Text>
      </View>
    );
  }

  return (
    <FormScrollView contentContainerStyle={styles.content}>
      {/* Bloqueo los campos mientras guardo: save usa lo que había al tocar el botón. */}
      <View pointerEvents={saving ? 'none' : 'auto'} style={styles.fields}>
        {mode === 'contact' ? <ContactFields field={field} /> : null}

        {mode === 'renewal' ? (
          <>
            <Text style={formStyles.hint}>{t('profile.renewalHint')}</Text>
            {documents.map((name) => (
              <ExpiringDocumentFields key={name} name={name} field={field} renewing />
            ))}
          </>
        ) : null}

        {mode === 'full' ? (
          <>
            <Text style={formStyles.hint}>{t('profile.reviewHint')}</Text>
            <Text style={styles.section}>{t('registration.personal')}</Text>
            <PersonalDataFields field={field} withPhoto={false} />
            <Text style={styles.section}>{t('registration.vehicle')}</Text>
            <VehicleFields field={field} />
            <Text style={styles.section}>{t('registration.documents')}</Text>
            <DocumentsFields field={field} values={values} />
          </>
        ) : null}
      </View>

      <View style={styles.submit}>
        {saving ? (
          <View style={styles.row}>
            <ActivityIndicator />
            <Text style={formStyles.hint}>{t('profile.saving')}</Text>
          </View>
        ) : (
          <Button
            title={mode === 'contact' ? t('profile.save') : t('profile.submit')}
            onPress={handleSave}
            disabled={!isComplete || !dirty}
            color={colors.primary}
          />
        )}
        {!isComplete ? (
          <Text style={formStyles.hint}>
            {mode === 'renewal' ? t('profile.renewalIncomplete') : t('profile.fixErrors')}
          </Text>
        ) : null}
        <FieldError error={saveError} />
      </View>
    </FormScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 18, paddingBottom: 40 },
  fields: { gap: 18 },
  section: { fontSize: 17, fontWeight: '700', color: colors.text, marginTop: 8 },
  submit: { marginTop: 8, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});