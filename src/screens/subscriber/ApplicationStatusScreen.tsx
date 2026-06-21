import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radii, spacing, typography } from '../../theme';
import type { ProfileStackParamList } from '../../navigation/ProfileNavigator';
import { getLatestUserApplication, type SubscriberApplication } from '../../lib/applicationService';

const formatStatusLabel = (status?: string | null) => {
  const normalized = String(status ?? 'pending').replace(/_/g, ' ').trim();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const getSuccessTone = () => {
  return {
    bg: '#DCFCE7',
    border: '#86EFAC',
    text: '#166534',
    icon: 'check-circle' as const,
  };
};

const formatDate = (value?: string | null) => {
  if (!value) return 'Recently submitted';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently submitted';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export default function ApplicationStatusScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [application, setApplication] = useState<SubscriberApplication | null>(null);

  const loadApplication = useCallback(async () => {
    const result = await getLatestUserApplication();
    const app = result.success ? (result.data ?? null) : null;
    setApplication(app);
    return app;
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function run() {
        setLoading(true);
        const app = await loadApplication();
        if (isActive) {
          setLoading(false);
        }
      }

      run();

      return () => {
        isActive = false;
      };
    }, [loadApplication]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadApplication();
    setRefreshing(false);
  };

  const statusTone = getSuccessTone();
  const tradingName = application?.company_details?.tradingName || application?.company_details?.registeredBusinessName || 'Your application';
  const packageName = application?.subscription_tier ? application.subscription_tier.replace(/_/g, ' ') : 'Not available';
  const statusLabel = formatStatusLabel(application?.status);

  const handleGoToListerPortfolio = () => {
    navigation.navigate('ListerPortfolio');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.textPrimary} />}
      >
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('AccountMain')}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}
          >
            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
            <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>
              Back to My Account
            </Text>
          </TouchableOpacity>

          {loading ? (
            <View style={{ paddingVertical: spacing.xxl, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={colors.textPrimary} />
              <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.sm }}>
                Loading application status...
              </Text>
            </View>
          ) : !application ? (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: radii.lg,
                padding: spacing.lg,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
              }}
            >
              <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.sm }}>
                No application found
              </Text>
              <Text style={{ ...typography.body, color: colors.textMuted, marginBottom: spacing.lg }}>
                We could not find a submitted application for your account yet.
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('PortfolioType')}
                style={{
                  alignSelf: 'flex-start',
                  backgroundColor: colors.textPrimary,
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.md,
                  borderRadius: radii.md,
                }}
              >
                <Text style={{ ...typography.body, color: '#FFFFFF', fontWeight: '600' }}>
                  Start Application
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={{ marginBottom: spacing.lg, alignItems: 'center' }}>
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: spacing.lg,
                  }}
                >
                  <MaterialIcons name="check" size={40} color={colors.primaryForeground} />
                </View>
                <Text style={{ ...typography.displayMedium, color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.sm }}>
                  Congratulations!
                </Text>
                <Text style={{ ...typography.body, color: colors.textMuted, textAlign: 'center' }}>
                  Your application has been successfully submitted.
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: statusTone.bg,
                  borderRadius: radii.lg,
                  padding: spacing.lg,
                  borderWidth: 1,
                  borderColor: statusTone.border,
                  marginBottom: spacing.lg,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                  <MaterialIcons name={statusTone.icon} size={22} color={statusTone.text} />
                  <Text style={{ ...typography.titleMedium, color: statusTone.text, marginLeft: spacing.sm }}>
                    {statusLabel}
                  </Text>
                </View>
                <Text style={{ ...typography.body, color: colors.textPrimary }}>
                  {String(application.status ?? '').toLowerCase() === 'approved'
                    ? 'Your application has been approved. You now have full access to manage your portfolio.'
                    : 'Your application has been received. Our team is reviewing it and will notify you once it is approved. You can already start managing your portfolio.'}
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleGoToListerPortfolio}
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: radii.lg,
                  paddingVertical: spacing.md,
                  alignItems: 'center',
                  marginBottom: spacing.lg,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: spacing.sm,
                }}
              >
                <MaterialIcons name="storefront" size={20} color={colors.primaryForeground} />
                <Text style={{ ...typography.body, color: colors.primaryForeground, fontWeight: '700' }}>
                  Go to My Portfolio
                </Text>
              </TouchableOpacity>

              <View
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: radii.lg,
                  padding: spacing.lg,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  marginBottom: spacing.lg,
                }}
              >
                <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>
                  Submission Summary
                </Text>
                <View style={{ gap: spacing.md }}>
                  <View>
                    <Text style={{ ...typography.caption, color: colors.textMuted }}>Business</Text>
                    <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>{tradingName}</Text>
                  </View>
                  <View>
                    <Text style={{ ...typography.caption, color: colors.textMuted }}>Portfolio Type</Text>
                    <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
                      {application.portfolio_type === 'venue' ? 'Venue' : 'Vendor / Service Professional'}
                    </Text>
                  </View>
                  <View>
                    <Text style={{ ...typography.caption, color: colors.textMuted }}>Selected Package</Text>
                    <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
                      {formatStatusLabel(packageName)}
                    </Text>
                  </View>
                  <View>
                    <Text style={{ ...typography.caption, color: colors.textMuted }}>Submitted</Text>
                    <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
                      {formatDate(application.created_at)}
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
