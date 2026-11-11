import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ErrorState from '../../components/ErrorState';
import InfoRow from '../../components/InfoRow';
import LoadingState from '../../components/LoadingState';
import { colors, formStyles } from '../../components/formStyles';
import { useSession } from '../../context/SessionContext';
import { useSettings } from '../../context/SettingsContext';
import useEarnings from '../../hooks/useEarnings';
import { formatMoney } from '../../i18n/format';

const PERIODS = ['today', 'week', 'month'];

// Ganancias. El saldo y los resúmenes salen de los viajes pagados,
// que la app escucha en tiempo real.
export default function EarningsScreen() {
  const { t, language } = useSettings();
  const insets = useSafeAreaInsets();
  const { driverId } = useSession();
  const { earnings, loading, error, retry } = useEarnings(driverId);

  if (loading) return <LoadingState message={t('common.loading')} />;
  if (error) return <ErrorState message={t(error)} onRetry={retry} />;
  if (!earnings) return null;

  const money = (value) => formatMoney(value, language);
  const { balance } = earnings;

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.card}>
        <Text style={formStyles.label}>{t('earnings.balance')}</Text>
        <Text style={[styles.balance, balance < 0 && styles.negative]}>{money(balance)}</Text>
        <Text style={formStyles.hint}>{t(balance < 0 ? 'earnings.balanceNegative' : 'earnings.balanceHint')}</Text>
      </View>

      {PERIODS.map((period) => {
        const summary = earnings[period];
        return (
          <View key={period} style={styles.card}>
            <Text style={styles.title}>{t(`earnings.${period}`)}</Text>
            <InfoRow label={t('earnings.trips')} value={String(summary.trips)} />
            <InfoRow label={t('earnings.billed')} value={money(summary.billed)} />
            <InfoRow label={t('earnings.commissions')} value={money(summary.commissions)} />
            <InfoRow label={t('earnings.tips')} value={money(summary.tips)} />
            <InfoRow label={t('earnings.net')} value={money(summary.net)} strong />
            <InfoRow label={t('earnings.average')} value={money(summary.average)} />
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, gap: 16 },
  card: { gap: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 16 },
  title: { fontSize: 17, fontWeight: '700', color: colors.text },
  balance: { fontSize: 28, fontWeight: '700', color: colors.text },
  negative: { color: colors.error },
});