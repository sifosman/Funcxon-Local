import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radii, spacing, typography } from '../../theme';
import type { ProfileStackParamList } from '../../navigation/ProfileNavigator';
import { getLatestUserApplication, type SubscriberApplication } from '../../lib/applicationService';
import { useIsDesktop } from '../../hooks/useIsDesktop';

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
  return date.toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export default function ApplicationStatusScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const isDesktop = useIsDesktop();
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

  const desktopContainerStyle = {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center' as const,
    paddingHorizontal: 48,
  };

  const cardSurface = isDesktop ? colors.surfaceContainerLowest : colors.surface;
  const cardBorder = isDesktop ? colors.outlineVariant : colors.borderSubtle;

  const renderHeader = (isDesktopHeader: boolean) => (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={isDesktopHeader ? { ...typography.labelMd, color: colors.dustyRose, textTransform: 'uppercase', marginBottom: spacing.sm } as any : { display: 'none' } as any}>
        Application
      </Text>
      <Text style={isDesktopHeader ? { ...typography.headlineMd, color: colors.primary } as any : { ...typography.displayMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
        Application Status
      </Text>
      <Text style={{ ...typography.bodyMd, color: isDesktopHeader ? colors.onSurfaceVariant : colors.textMuted }}>
        Track your portfolio application progress
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <View
      style={{
        backgroundColor: cardSurface,
        borderRadius: radii.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: cardBorder,
      }}
    >
      <Text style={isDesktop ? { ...typography.headlineSm, color: colors.textPrimary, marginBottom: spacing.sm } as any : { ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.sm }}>
        No application found
      </Text>
      <Text style={{ ...typography.bodyMd, color: isDesktop ? colors.onSurfaceVariant : colors.textMuted, marginBottom: spacing.lg }}>
        We could not find a submitted application for your account yet.
      </Text>
      <TouchableOpacity
        onPress={() => navigation.navigate('PortfolioType')}
        style={{
          alignSelf: 'flex-start',
          backgroundColor: colors.cta,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          borderRadius: radii.md,
        }}
      >
        <Text style={{ ...typography.bodySemiBold, color: '#FFFFFF' }}>
          Start Application
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    if (!application) return null;
    const app = application;
    return (
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
        <Text style={isDesktop ? { ...typography.headlineMd, color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.sm } as any : { ...typography.displayMedium, color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.sm }}>
          Congratulations!
        </Text>
        <Text style={{ ...typography.bodyMd, color: isDesktop ? colors.onSurfaceVariant : colors.textMuted, textAlign: 'center' }}>
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
          <Text style={isDesktop ? { ...typography.headlineSm, color: statusTone.text, marginLeft: spacing.sm } as any : { ...typography.titleMedium, color: statusTone.text, marginLeft: spacing.sm }}>
            {statusLabel}
          </Text>
        </View>
        <Text style={{ ...typography.bodyMd, color: colors.textPrimary }}>
          {String(app.status ?? '').toLowerCase() === 'approved'
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
        <Text style={{ ...typography.bodyBold, color: colors.primaryForeground }}>
          Go to My Portfolio
        </Text>
      </TouchableOpacity>

      <View
        style={{
          backgroundColor: cardSurface,
          borderRadius: radii.lg,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: cardBorder,
          marginBottom: spacing.lg,
        }}
      >
        <Text style={isDesktop ? { ...typography.headlineSm, color: colors.textPrimary, marginBottom: spacing.md } as any : { ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>
          Submission Summary
        </Text>
        <View style={{ gap: spacing.md }}>
          <View>
            <Text style={{ ...typography.labelMd, color: colors.onSurfaceVariant } as any}>Business</Text>
            <Text style={{ ...typography.bodyMd, color: colors.textPrimary, fontWeight: '600' } as any}>{tradingName}</Text>
          </View>
          <View>
            <Text style={{ ...typography.labelMd, color: colors.onSurfaceVariant } as any}>Portfolio Type</Text>
            <Text style={{ ...typography.bodyMd, color: colors.textPrimary, fontWeight: '600' } as any}>
              {app.portfolio_type === 'venue' ? 'Venue' : 'Vendor / Service Professional'}
            </Text>
          </View>
          <View>
            <Text style={{ ...typography.labelMd, color: colors.onSurfaceVariant } as any}>Selected Package</Text>
            <Text style={{ ...typography.bodyMd, color: colors.textPrimary, fontWeight: '600' } as any}>
              {formatStatusLabel(packageName)}
            </Text>
          </View>
          <View>
            <Text style={{ ...typography.labelMd, color: colors.onSurfaceVariant } as any}>Submitted</Text>
            <Text style={{ ...typography.bodyMd, color: colors.textPrimary, fontWeight: '600' } as any}>
              {formatDate(app.created_at)}
            </Text>
          </View>
        </View>
      </View>
    </>
  );
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDesktop ? colors.surfaceBg : colors.background }}>
      <ScrollView
        contentContainerStyle={isDesktop ? { ...desktopContainerStyle, paddingBottom: spacing.xxl } as any : { paddingBottom: spacing.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.textPrimary} />}
      >
        {isDesktop ? (
          <>
            {renderHeader(true)}
            <View style={{ maxWidth: 720, width: '100%', alignSelf: 'center' } as any}>
              {loading ? (
                <View style={{ paddingVertical: spacing.xxl, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={colors.textPrimary} />
                  <Text style={{ ...typography.bodyMd, color: colors.textMuted, marginTop: spacing.sm } as any}>
                    Loading application status...
                  </Text>
                </View>
              ) : !application ? (
                renderEmptyState()
              ) : (
                renderContent()
              )}
            </View>
          </>
        ) : (
          <>
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

              {renderHeader(false)}

              {loading ? (
                <View style={{ paddingVertical: spacing.xxl, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={colors.textPrimary} />
                  <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.sm }}>
                    Loading application status...
                  </Text>
                </View>
              ) : !application ? (
                renderEmptyState()
              ) : (
                renderContent()
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
