import { useRef, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppButton from '../../components/AppButton';
import FieldError from '../../components/FieldError';
import FormField from '../../components/FormField';
import FormScrollView from '../../components/FormScrollView';
import { validateIdNumber } from '../../domain/validators';
import { isConnectionError } from '../../hooks/useDriverForm';
import { findDriverIdByDocument } from '../../services/driverService';
import { useSession } from '../../context/SessionContext';
import { useSettings } from '../../context/SettingsContext';
import { card, colors, fonts, radius } from '../../theme';

// Ingreso con la cédula. Sin contraseña: quien sepa una cédula entra como ese
// conductor (riesgo aceptado en el diseño, §11). Si la cédula no existe,
// ofrece el registro con la cédula ya escrita.
export default function LoginScreen({ navigation }) {
  const { t } = useSettings();
  const { startSession, endedReason, endedNotice } = useSession();
  const insets = useSafeAreaInsets();
  const [documentNumber, setDocumentNumber] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  // La cédula que busqué y no existe. Es la que paso al registro.
  const [notFound, setNotFound] = useState(null);
  // Frena un doble toque que llega antes de que React pinte `searching`.
  const searchingNow = useRef(false);
  // Por qué se cerró la sesión anterior. Deja de verse cuando el conductor escribe.
  const [typed, setTyped] = useState(false);

  const cleaned = documentNumber.trim();
  const valid = validateIdNumber(cleaned) === null;

  function change(value) {
    setDocumentNumber(value);
    setTyped(true);
    setError(null);
    setNotFound(null);
  }

  async function login() {
    if (!valid || searchingNow.current) return;
    searchingNow.current = true;
    setSearching(true);
    setError(null);
    try {
      const driverId = await findDriverIdByDocument(cleaned);
      // Con la sesión iniciada, RootNavigator cambia esta pantalla por Inicio.
      if (driverId) await startSession(driverId);
      else setNotFound(cleaned);
    } catch (searchError) {
      console.warn('No pude buscar la cédula:', searchError?.code ?? searchError?.message);
      setError(isConnectionError(searchError) ? 'errors.loginConnection' : 'errors.loginFailed');
    } finally {
      searchingNow.current = false;
      setSearching(false);
    }
  }

  function register(prefill) {
    navigation.navigate('Registration', prefill ? { documentNumber: prefill } : undefined);
  }

  return (
    <FormScrollView
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
    >
      <View style={styles.brand}>
        <Image source={require('../../../assets/logo.png')} style={styles.logo} accessibilityIgnoresInvertColors />
        <Text style={styles.name}>UberClone</Text>
        <Text style={styles.role}>{t('menu.driver')}</Text>
      </View>

      {notFound ? null : <Text style={styles.welcome}>{t('login.welcome')}</Text>}
      {endedNotice && !typed ? (
        <Text style={styles.notice} accessibilityLiveRegion="polite">
          {t(endedNotice)}
        </Text>
      ) : null}
      <FieldError error={typed ? null : endedReason} />

      <FormField
        label={t('login.documentNumber')}
        value={documentNumber}
        onChange={change}
        error={notFound ? 'login.notFound' : null}
        placeholder={t('login.placeholder')}
        keyboardType="number-pad"
        maxLength={10}
        editable={!searching}
        onSubmitEditing={login}
      />

      {notFound ? (
        <>
          <View style={styles.box}>
            <Text style={styles.boxText}>{t('login.newHint')}</Text>
            <AppButton title={t('login.register')} onPress={() => register(notFound)} />
          </View>
          <AppButton title={t('login.otherDocument')} variant="secondary" onPress={() => change('')} />
        </>
      ) : (
        <>
          {/* Igual que el envío del registro: mientras busca, el botón cede su lugar a la carga. */}
          {searching ? (
            <View style={styles.searching}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.searchingText}>{t('login.searching')}</Text>
            </View>
          ) : (
            <AppButton title={t('login.submit')} onPress={login} disabled={!valid} />
          )}
          <FieldError error={error} />
          <View style={styles.or}>
            <View style={styles.line} />
            <Text style={styles.orText}>{t('login.firstTime')}</Text>
            <View style={styles.line} />
          </View>
          <AppButton
            title={t('login.register')}
            variant="secondary"
            onPress={() => register(null)}
            disabled={searching}
          />
        </>
      )}
    </FormScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, gap: 14 },
  brand: { alignItems: 'center', gap: 8, marginTop: 40, marginBottom: 20 },
  logo: { width: 96, height: 96, borderRadius: 24 },
  name: { color: colors.text, fontSize: 28, fontFamily: fonts.extrabold },
  role: { color: colors.muted, fontSize: 15, fontFamily: fonts.medium, marginTop: -4 },
  welcome: { color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: 'center', fontFamily: fonts.regular },
  box: { ...card, padding: 14, gap: 12 },
  notice: {
    color: colors.primary,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.input,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.medium,
  },
  boxText: { color: colors.muted, fontSize: 15, lineHeight: 22, fontFamily: fonts.regular },
  searching: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, minHeight: 54 },
  searchingText: { color: colors.muted, fontSize: 15, fontFamily: fonts.medium },
  or: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  orText: { color: colors.faint, fontSize: 13, fontFamily: fonts.medium },
});