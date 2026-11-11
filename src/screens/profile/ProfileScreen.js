import { Button, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import ErrorState from '../../components/ErrorState';
import InfoRow from '../../components/InfoRow';
import LoadingState from '../../components/LoadingState';
import StatusBadge from '../../components/StatusBadge';
import { colors, formStyles } from '../../components/formStyles';
import { RENEWAL_WINDOW_DAYS } from '../../config/app';
import { approvalTextKey, editsWholeProfile, toFormValues } from '../../domain/driverProfile';
import { documentsDueForRenewal, expiredDocuments, requiresTechInspection } from '../../domain/validators';
import { formatDate } from '../../i18n/format';
import { useSession } from '../../context/SessionContext';
import { useSettings } from '../../context/SettingsContext';

const APPROVAL_TONES = { approved: 'success', pending: 'warning', rejected: 'danger', unknown: 'neutral' };

// Los datos del conductor como están en Firestore. Lee el documento en
// tiempo real de SessionContext, así que al guardar una edición, o si el
// aprobador cambia el estado, la pantalla se actualiza sola.
export default function ProfileScreen({ navigation }) {
  const { t, language } = useSettings();
  const { driver, driverError, retryDriver } = useSession();

  if (driverError) return <ErrorState message={t(driverError)} onRetry={retryDriver} />;
  if (!driver) return <LoadingState message={t('common.loading')} />;

  const approval = approvalTextKey(driver.approvalStatus);
  // Los mismos valores con que arranca la edición: fechas como Date y el año como texto.
  const values = toFormValues(driver);
  const vehicle = driver.vehicle ?? {};
  const due = documentsDueForRenewal(values);
  const expired = expiredDocuments(values);
  const edit = (mode) => navigation.navigate('ProfileEdit', { mode });

  // El vencimiento de un documento y, si toca renovarlo, por qué.
  const expiry = (name) => {
    const date = values[`${name}ExpiresAt`];
    // Sin fecha, "Falta" ya lo dice todo: no le agrego "Vencido".
    if (!date) return t('profile.missing');
    const text = formatDate(date, language);
    if (expired.includes(name)) return `${text} · ${t('profile.expired')}`;
    if (due.includes(name)) return `${text} · ${t('profile.dueSoon')}`;
    return text;
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        {driver.photoUrl ? (
          <Image
            source={{ uri: driver.photoUrl }}
            style={styles.avatar}
            accessibilityLabel={t('registration.profilePhoto')}
          />
        ) : null}
        <Text style={styles.name}>{driver.fullName}</Text>
        <StatusBadge label={t(`approval.${approval}`)} tone={APPROVAL_TONES[approval]} />
      </View>

      {editsWholeProfile(driver.approvalStatus) ? (
        <View style={styles.actions}>
          <Button title={t('profile.edit')} onPress={() => edit('full')} color={colors.primary} />
          <Text style={formStyles.hint}>{t('profile.reviewHint')}</Text>
        </View>
      ) : (
        <View style={styles.actions}>
          <Button title={t('profile.editContact')} onPress={() => edit('contact')} color={colors.primary} />
          {/* La renovación se abre solo con un documento vencido o a menos de RENEWAL_WINDOW_DAYS días de vencer. */}
          <Button
            title={t('profile.renew')}
            onPress={() => edit('renewal')}
            disabled={due.length === 0}
            color={colors.primary}
          />
          <Text style={formStyles.hint}>
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
        <InfoRow label={t('registration.licenseExpiresAt')} value={expiry('license')} />
        <InfoRow label={t('registration.soatExpiresAt')} value={expiry('soat')} />
        <InfoRow
          label={t('registration.techInspectionExpiresAt')}
          value={requiresTechInspection(values) ? expiry('techInspection') : t('profile.notRequired')}
        />
        <InfoRow label={t('registration.mercadoPagoEmail')} value={driver.mercadoPagoEmail} />
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 20, paddingBottom: 40 },
  header: { alignItems: 'center', gap: 10 },
  avatar: { width: 112, height: 112, borderRadius: 56, backgroundColor: '#F2F2F2' },
  name: { fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'center' },
  actions: { gap: 10 },
  section: { gap: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  vehiclePhoto: { width: '100%', height: 160, borderRadius: 8, backgroundColor: '#F2F2F2' },
});