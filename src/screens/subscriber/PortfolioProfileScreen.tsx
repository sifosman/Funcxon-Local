import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radii, typography } from '../../theme';
import { PhotoUploadCounter } from '../../components/PhotoUploadCounter';
import { useIsDesktop } from '../../hooks/useIsDesktop';

type ProfileStackParamList = {
  SubscriberSuite: undefined;
  PortfolioProfile: undefined;
  PortfolioType: undefined;
  SubscriptionPlans: undefined;
};

interface QuickActionCard {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  iconBg: string;
  route: keyof ProfileStackParamList;
}

export default function PortfolioProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const isDesktop = useIsDesktop();

  const quickActions: QuickActionCard[] = [
    {
      id: 'create-portfolio',
      title: 'Create New Portfolio',
      description: 'Start your application to create a new venue or vendor portfolio',
      icon: 'add-business',
      iconColor: colors.textPrimary,
      iconBg: '#f2f7ff',
      route: 'PortfolioType',
    },
  ];

  const statsCards = [
    {
      id: 'portfolios',
      label: 'Active Portfolios',
      value: '0',
      icon: 'business' as keyof typeof MaterialIcons.glyphMap,
      color: colors.textPrimary,
    },
    {
      id: 'views',
      label: 'Total Views',
      value: '0',
      icon: 'visibility' as keyof typeof MaterialIcons.glyphMap,
      color: '#8B5CF6',
    },
    {
      id: 'quotes',
      label: 'Quote Requests',
      value: '0',
      icon: 'request-quote' as keyof typeof MaterialIcons.glyphMap,
      color: '#F59E0B',
    },
  ];

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
        Portfolio Dashboard
      </Text>
      <Text style={isDesktopHeader ? { ...typography.headlineMd, color: colors.primary } as any : { ...typography.displayMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
        Portfolio Dashboard
      </Text>
      <Text style={{ ...typography.bodyMd, color: isDesktopHeader ? colors.onSurfaceVariant : colors.textMuted }}>
        Manage your business listings and subscriber profile
      </Text>
    </View>
  );

  const renderStatsCards = () => (
    <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg }}>
      {statsCards.map((stat) => (
        <View
          key={stat.id}
          style={{
            flex: 1,
            backgroundColor: cardSurface,
            borderRadius: radii.lg,
            padding: spacing.md,
            borderWidth: 1,
            borderColor: cardBorder,
            shadowColor: '#000',
            shadowOpacity: 0.05,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: radii.md,
              backgroundColor: `${stat.color}15`,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing.sm,
            }}
          >
            <MaterialIcons name={stat.icon} size={20} color={stat.color} />
          </View>
          <Text style={{ ...typography.titleLarge, color: colors.textPrimary, marginBottom: 2 }}>
            {stat.value}
          </Text>
          <Text style={isDesktop ? { ...typography.bodyMd, color: colors.onSurfaceVariant } as any : { ...typography.caption, color: colors.textMuted }}>
            {stat.label}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderQuickActions = () => (
    <View>
      <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>
        Quick Actions
      </Text>

      <View
        style={{
          borderRadius: radii.lg,
          overflow: 'hidden',
          backgroundColor: cardSurface,
          borderWidth: 1,
          borderColor: cardBorder,
          shadowColor: '#000',
          shadowOpacity: 0.05,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        }}
      >
        {quickActions.map((action, index) => (
          <TouchableOpacity
            key={action.id}
            onPress={() => navigation.navigate(action.route)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: spacing.lg,
              borderBottomWidth: index < quickActions.length - 1 ? 1 : 0,
              borderBottomColor: cardBorder,
            }}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: radii.lg,
                  backgroundColor: action.iconBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: spacing.md,
                }}
              >
                <MaterialIcons name={action.icon} size={24} color={action.iconColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textPrimary, fontWeight: '600' } as any : { ...typography.bodySemiBold, color: colors.textPrimary }}>
                  {action.title}
                </Text>
                <Text style={isDesktop ? { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: 2 } as any : { ...typography.caption, color: colors.textMuted, marginTop: 2 }}>
                  {action.description}
                </Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderInfoCard = () => (
    <View
      style={{
        backgroundColor: isDesktop ? colors.surfaceContainerLow : '#f2f7ff',
        borderRadius: radii.lg,
        padding: spacing.lg,
        flexDirection: 'row',
        borderWidth: isDesktop ? 1 : 0,
        borderColor: isDesktop ? colors.outlineVariant : undefined,
      }}
    >
      <MaterialIcons name="info" size={24} color={colors.textPrimary} style={{ marginRight: spacing.md }} />
      <View style={{ flex: 1 }}>
        <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary, marginBottom: spacing.xs }}>
          Welcome to Your Portfolio Dashboard
        </Text>
        <Text style={isDesktop ? { ...typography.bodyMd, color: colors.onSurfaceVariant } as any : { ...typography.caption, color: colors.textPrimary }}>
          Create and manage your business portfolios here. You can list venues, services, or both. Each portfolio will be visible to users searching for event professionals.
        </Text>
      </View>
    </View>
  );

  const renderRecentActivity = () => (
    <View>
      <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>
        Recent Activity
      </Text>
      <View
        style={{
          backgroundColor: cardSurface,
          borderRadius: radii.lg,
          padding: spacing.xl,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: cardBorder,
        }}
      >
        <MaterialIcons name="inbox" size={48} color={colors.textMuted} />
        <Text style={{ ...typography.body, color: colors.textMuted, marginTop: spacing.md, textAlign: 'center' }}>
          No activity yet. Create your first portfolio to get started!
        </Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: isDesktop ? colors.surfaceBg : colors.background }}>
      <ScrollView contentContainerStyle={isDesktop ? { ...desktopContainerStyle, paddingBottom: spacing.xxl } as any : { paddingBottom: spacing.xl }}>
        {isDesktop ? (
          <>
            {renderHeader(true)}
            <View style={{ flexDirection: 'row', gap: spacing.gutter, marginBottom: spacing.md } as any}>
              <View style={{ flex: 2, gap: spacing.lg } as any}>
                <View style={{ paddingHorizontal: 0 }}>
                  <PhotoUploadCounter
                    vendorId={1} // TODO: use actual vendor ID from context
                    onUpgradePress={() => {
                      navigation.navigate('SubscriptionPlans');
                    }}
                  />
                </View>
                {renderQuickActions()}
                {renderInfoCard()}
              </View>
              <View style={{ flex: 1, gap: spacing.lg } as any}>
                {renderStatsCards()}
                {renderRecentActivity()}
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Header */}
            <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md }}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}
              >
                <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
                <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>
                  Back to Subscriber Suite
                </Text>
              </TouchableOpacity>

              {renderHeader(false)}
            </View>

            {/* Photo Upload Counter */}
            <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
              <PhotoUploadCounter
                vendorId={1} // TODO: use actual vendor ID from context
                onUpgradePress={() => {
                  navigation.navigate('SubscriptionPlans');
                }}
              />
            </View>

            {/* Stats Cards */}
            <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
              {renderStatsCards()}
            </View>

            {/* Quick Actions */}
            <View style={{ paddingHorizontal: spacing.lg }}>
              {renderQuickActions()}
            </View>

            {/* Info Card */}
            <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
              {renderInfoCard()}
            </View>

            {/* Recent Activity Placeholder */}
            <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
              {renderRecentActivity()}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
