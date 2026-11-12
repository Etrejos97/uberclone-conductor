import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AppButton from '../../components/AppButton';
import ErrorState from '../../components/ErrorState';
import InfoRow from '../../components/InfoRow';
import LoadingState from '../../components/LoadingState';
import StatusBadge, { APPROVAL_TONES } from '../../components/StatusBadge';
import { formStyles } from '../../components/formStyles';
import { RENEWAL_WINDOW_DAYS } from '../../config/app';
import { approvalTextKey, editsWholeProfile, toFormValues } from '../../domain/driverProfile';
import { documentsDueForRenewal, expiredDocuments, requiresTechInspection } from '../../domain/validators';
import { formatDate } from '../../i18n/format';
import { useSession } from '../../context/SessionContext';
import { useSettings } from '../../context/SettingsContext';
import { card, colors, fonts, radius } from '../../theme';

// Los datos del conductor como están en Firestore. Lee el documento en
// tiempo real de SessionContext, así que al guardar una edición, o si el
// aprobador cambia el estado, la pantalla se actualiza sola.
export default function ProfileScreen({ navigation }) {
  const { t, language } = useSettings();
  const { driver, driverError, retryDriver } = useSession();
  const insets = useSafeAreaInsets();

  if (driverError) return <ErrorState message={t(driverError)} onRetry={retryDriver} />;
  if (!driver) return <LoadingState message={t('common.loading')} />;

  const approval = approvalTextKey(driver.approvalStatus);
  // Los mismos valores con que arranca la edición: fechas como Date y el año como texto.
  const values = toFormValues(driver);
  const vehicle = driver.vehicle ?? {};
  const due = documentsDueForRenewal(values);
  const expired = expiredDocuments(values);
  const edit = (mode) => navigation.navigate('ProfileEdit', { mode });

  // El vencimiento de un documento y, si toca renovarlo, por qué: en rojo si
  // venció y en ámbar si vence pronto.
  const expiry = (name) => {
    const date = values[`${name}ExpiresAt`];
    const text = date ? formatDate(date, language) : t('profile.missing');
    if (expired.includes(name)) return { value: `${text} · ${t('profile.expired')}`, valueColor: colors.danger };
    if (due.includes(name)) return { value: `${text} · ${t('profile.dueSoon')}`, valueColor: colors.warning };
    return { value: text };
  };

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
      <View style={styles.header}>
        {driver.photoUrl ? (
          <Image
            source={{ uri: driver.photoUrl }}
            style={styles.avatar}
            accessibilityLabel={t('registration.profilePhoto')}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarEmpty]}>
            <Ionicons name="person" size={44} color={colors.faint} />
          </View>
        )}
        <Text style={styles.name} accessibilityRole="header">
          {driver.fullName}
        </Text>
        <StatusBadge label={t(`approval.${approval}`)} tone={APPROVAL_TONES[approval]} />
      </View>

      {editsWholeProfile(driver.approvalStatus) ? (
        <View style={styles.actions}>
          <AppButton title={t('profile.edit')} onPress={() => edit('full')} />
          <Text style={[formStyles.hint, styles.center]}>{t('profile.reviewHint')}</Text>
        </View>
      ) : (
        <View style={styles.actions}>
          <AppButton title={t('profile.editContact')} onPress={() => edit('contact')} />
          {/* La renovación se abre solo con un documento vencido o a menos de RENEWAL_WINDOW_DAYS días de vencer. */}
          <AppButton
            title={t('profile.renew')}
            onPress={() => edit('renewal')}
            disabled={due.length === 0}
            variant="secondary"
          />
          <Text style={[formStyles.hint, styles.center]}>
            {due.length === 0 ? t('profile.renewClosed', { days: RENEWAL_WINDOW_DAYS }) : t('profile.renewOpen')}
          </Text>
        </View>
      )}

      <Section title={t('registration.personal')}>
        <InfoRow label={t('registration.documentNumber')} value={driver.documentNumber} />
        <InfoRow label={t('registration.phone')} value={driver.phone} />
        <InfoRow
          label={t('registration.birthDate')}
          value={values.birthDate ? formatDate(values.birthDate, language) : ''}
        />
        <InfoRow label={t('registration.gender')} value={t(`gender.${driver.gender}`)} />
        <InfoRow label={t('registration.email')} value={driver.email} />
      </Section>

      <Section title={t('registration.vehicle')}>
        {vehicle.photoUrl ? (
          <Image
            source={{ uri: vehicle.photoUrl }}
            style={styles.vehiclePhoto}
            accessibilityLabel={t('registration.vehiclePhoto')}
          />
        ) : null}
        <InfoRow label={t('registration.category')} value={t(`category.${vehicle.category}`)} />
        <InfoRow label={t('registration.plate')} value={vehicle.plate} />
        <InfoRow label={t('registration.brand')} value={vehicle.brand} />
        <InfoRow label={t('registration.model')} value={vehicle.model} />
        <InfoRow label={t('registration.year')} value={values.year} />
        <InfoRow label={t('registration.color')} value={t(`color.${vehicle.color}`)} />
        <InfoRow label={t('registration.capacity')} value={values.capacity} />
      </Section>

      <Section title={t('registration.documents')}>
        <InfoRow label={t('registration.licenseNumber')} value={values.licenseNumber} />
        <InfoRow label={t('registration.licenseExpiresAt')} {...expiry('license')} />
        <InfoRow label={t('registration.soatExpiresAt')} {...expiry('soat')} />
        {requiresTechInspection(values) ? (
          <InfoRow label={t('registration.techInspectionExpiresAt')} {...expiry('techInspection')} />
        ) : (
          <InfoRow label={t('registration.techInspectionExpiresAt')} value={t('profile.notRequired')} />
        )}
        <InfoRow label={t('registration.mercadoPagoEmail')} value={driver.mercadoPagoEmail} />
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

const AVATAR_SIZE = 104;

const styles = StyleSheet.create({
  content: { padding: 20, gap: 18 },
  header: { alignItems: 'center', gap: 10 },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 3,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  avatarEmpty: { borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 22, fontFamily: fonts.bold, color: colors.text, textAlign: 'center' },
  actions: { gap: 10 },
  center: { textAlign: 'center' },
  section: { ...card, gap: 10, padding: 16 },
  sectionTitle: { fontSize: 16, fontFamily: fonts.bold, color: colors.text },
  vehiclePhoto: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.input, backgroundColor: colors.surfaceRaised },
});