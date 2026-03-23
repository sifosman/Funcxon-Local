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

const getStatusTone = (status?: string | null) => {
  const normalized = String(status ?? 'pending').toLowerCase();
  if (normalized === 'approved') {
    return {
      bg: '#DCFCE7',
      border: '#86EFAC',
      text: '#166534',
      icon: 'check-circle' as const,
    };
  }

  if (normalized === 'rejected') {
    return {
      bg: '#FEE2E2',
      border: '#FCA5A5',
      text: '#991B1B',
      icon: 'cancel' as const,
    };
  }

  return {
    bg: '#FEF3C7',
    border: '#FCD34D',
    text: '#92400E',
    icon: 'schedule' as const,
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
    if (result.success) {
      setApplication(result.data ?? null);
    } else {
      setApplication(null);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function run() {
        setLoading(true);
        await loadApplication();
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

  const statusTone = getStatusTone(application?.status);
  const tradingName = application?.company_details?.tradingName || application?.company_details?.registeredBusinessName || 'Your application';
  const packageName = application?.subscription_tier ? application.subscription_tier.replace(/_/g, ' ') : 'Not available';
  const statusLabel = formatStatusLabel(application?.status);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primaryTeal} />}
      >
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xl }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('AccountMain')}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}
          >
            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
            <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>
              Back to My Account
            </Text>
          </TouchableOpacity>

          <View style={{ marginBottom: spacing.lg }}>
            <Text style={{ ...typography.displayMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
              Application Status
            </Text>
            <Text style={{ ...typography.body, color: colors.textMuted }}>
              Track your latest portfolio application and wait for approval before making changes.
            </Text>
          </View>

          {loading ? (
            <View style={{ paddingVertical: spacing.xxl, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={colors.primaryTeal} />
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
                  backgroundColor: colors.primaryTeal,
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
                  {String(application.status ?? 'pending').toLowerCase() === 'pending'
                    ? 'Your application is under review. While it is pending, you cannot edit or resubmit the application.'
                    : String(application.status ?? '').toLowerCase() === 'approved'
                      ? 'Your application has been approved. Your listing team will contact you if anything else is needed.'
                      : 'Your application has been reviewed. Please wait for further guidance from the Funcxon team.'}
                </Text>
              </View>

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

              <View
                style={{
                  backgroundColor: '#E0F2F7',
                  borderRadius: radii.lg,
                  padding: spacing.lg,
                  borderWidth: 1,
                  borderColor: '#B6E3EE',
                }}
              >
                <Text style={{ ...typography.body, color: colors.textPrimary }}>
                  We aim to review applications within 12 to 24 hours. You can return here any time to check the latest status.
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
