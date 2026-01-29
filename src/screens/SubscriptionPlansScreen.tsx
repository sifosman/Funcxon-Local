import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radii, typography } from '../theme';
import { getSubscriptionTiers } from '../lib/subscription';
import type { ProfileStackParamList } from '../navigation/ProfileNavigator';

type SubscriptionTier = {
  id: number;
  tier_name: string;
  photo_limit: number;
  price_monthly: number | null;
  price_yearly: number | null;
  features: Record<string, any> | null;
  is_active: boolean;
  created_at: string;
};

type RouteParams = {
  currentTier?: string;
};

export default function SubscriptionPlansScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const route = useRoute();
  const { currentTier } = route.params as RouteParams || {};
  
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    loadSubscriptionTiers();
  }, []);

  const loadSubscriptionTiers = async () => {
    try {
      const data = await getSubscriptionTiers();
      setTiers(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load subscription plans. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = (tier: SubscriptionTier) => {
    const price = selectedBilling === 'monthly' ? tier.price_monthly : tier.price_yearly;
    const isFree = !price || price === 0;
    const priceLabel = isFree ? 'Free' : `R${Number(price).toLocaleString()}/${selectedBilling.slice(0, -2)}ly`;

    navigation.navigate('SubscriptionCheckout', {
      tierName: tier.tier_name,
      billing: selectedBilling,
      priceLabel,
      isFree,
    });
  };

  const formatPrice = (price: number | null) => {
    return price ? `R${price.toLocaleString()}` : 'Free';
  };

  const getTierColor = (tierName: string) => {
    switch (tierName.toLowerCase()) {
      case 'free': return colors.textMuted;
      case 'basic': return colors.primary;
      case 'premium': return '#8B5CF6';
      case 'enterprise': return '#DC2626';
      default: return colors.textPrimary;
    }
  };

  const getPopularBadge = (tierName: string) => {
    return tierName.toLowerCase() === 'premium';
  };

  const renderFeature = (key: string, value: any) => {
    if (typeof value === 'boolean') {
      return (
        <View key={key} style={styles.featureRow}>
          <MaterialIcons 
            name={value ? 'check-circle' : 'cancel'} 
            size={16} 
            color={value ? colors.primary : colors.textMuted} 
          />
          <Text style={[styles.featureText, !value && styles.featureTextDisabled]}>
            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Text>
        </View>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading subscription plans...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          
          <Text style={styles.title}>Subscription Plans</Text>
          <Text style={styles.subtitle}>
            Choose the perfect plan for your business needs
          </Text>
        </View>

        {/* Billing Toggle */}
        <View style={styles.billingToggle}>
          <TouchableOpacity
            style={[
              styles.billingOption,
              selectedBilling === 'monthly' && styles.billingOptionActive
            ]}
            onPress={() => setSelectedBilling('monthly')}
          >
            <Text style={[
              styles.billingText,
              selectedBilling === 'monthly' && styles.billingTextActive
            ]}>
              Monthly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.billingOption,
              selectedBilling === 'yearly' && styles.billingOptionActive
            ]}
            onPress={() => setSelectedBilling('yearly')}
          >
            <Text style={[
              styles.billingText,
              selectedBilling === 'yearly' && styles.billingTextActive
            ]}>
              Yearly (Save 20%)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Plans */}
        <View style={styles.plansContainer}>
          {tiers.map((tier) => {
            const isCurrent = currentTier === tier.tier_name;
            const isPopular = getPopularBadge(tier.tier_name);
            const price = selectedBilling === 'monthly' ? tier.price_monthly : tier.price_yearly;
            
            return (
              <View
                key={tier.id}
                style={[
                  styles.planCard,
                  isCurrent && styles.planCardCurrent,
                  isPopular && styles.planCardPopular
                ]}
              >
                {isPopular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                  </View>
                )}
                
                {isCurrent && (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>CURRENT PLAN</Text>
                  </View>
                )}

                <View style={styles.planHeader}>
                  <Text style={[
                    styles.planName,
                    { color: getTierColor(tier.tier_name) }
                  ]}>
                    {tier.tier_name.toUpperCase()}
                  </Text>
                  <Text style={styles.planPrice}>
                    {formatPrice(price)}
                    <Text style={styles.planPricePeriod}>
                      /{selectedBilling.slice(0, -2)}ly
                    </Text>
                  </Text>
                </View>

                <View style={styles.planFeatures}>
                  <View style={styles.featureRow}>
                    <MaterialIcons name="photo-library" size={16} color={colors.primary} />
                    <Text style={styles.featureText}>
                      {tier.photo_limit} photos
                    </Text>
                  </View>

                  {tier.features && Object.entries(tier.features).map(([key, value]) => 
                    renderFeature(key, value)
                  )}
                </View>

                <TouchableOpacity
                  style={[
                    styles.planButton,
                    isCurrent ? styles.planButtonCurrent : 
                    isPopular ? styles.planButtonPopular : styles.planButtonDefault
                  ]}
                  onPress={() => isCurrent ? null : handleUpgrade(tier)}
                  disabled={isCurrent}
                >
                  <Text style={[
                    styles.planButtonText,
                    isCurrent ? styles.planButtonTextCurrent :
                    isPopular ? styles.planButtonTextPopular : styles.planButtonTextDefault
                  ]}>
                    {isCurrent ? 'Current Plan' : 'Upgrade Now'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Help Section */}
        <View style={styles.helpSection}>
          <MaterialIcons name="help-outline" size={24} color={colors.primary} />
          <Text style={styles.helpTitle}>Need help choosing?</Text>
          <Text style={styles.helpText}>
            Contact our support team for personalized recommendations based on your business needs.
          </Text>
          <TouchableOpacity style={styles.helpButton}>
            <MaterialIcons name="chat" size={16} color={colors.primaryForeground} />
            <Text style={styles.helpButtonText}>Chat with Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textMuted,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  backText: {
    ...typography.body,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  title: {
    ...typography.displayMedium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
  },
  billingToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.full,
    padding: 4,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  billingOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    alignItems: 'center',
  },
  billingOptionActive: {
    backgroundColor: colors.primary,
  },
  billingText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '500',
  },
  billingTextActive: {
    color: colors.primaryForeground,
  },
  plansContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    position: 'relative',
  },
  planCardCurrent: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  planCardPopular: {
    borderColor: '#8B5CF6',
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -1,
    right: 20,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderTopLeftRadius: radii.md,
    borderTopRightRadius: radii.md,
  },
  popularBadgeText: {
    ...typography.caption,
    color: colors.primaryForeground,
    fontWeight: '600',
    fontSize: 10,
  },
  currentBadge: {
    position: 'absolute',
    top: -1,
    left: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderTopLeftRadius: radii.md,
    borderTopRightRadius: radii.md,
  },
  currentBadgeText: {
    ...typography.caption,
    color: colors.primaryForeground,
    fontWeight: '600',
    fontSize: 10,
  },
  planHeader: {
    marginBottom: spacing.md,
  },
  planName: {
    ...typography.titleMedium,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  planPrice: {
    ...typography.displayLarge,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  planPricePeriod: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 16,
  },
  planFeatures: {
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureText: {
    ...typography.caption,
    color: colors.textPrimary,
  },
  featureTextDisabled: {
    color: colors.textMuted,
  },
  planButton: {
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  planButtonDefault: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  planButtonPopular: {
    backgroundColor: '#8B5CF6',
  },
  planButtonCurrent: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  planButtonText: {
    ...typography.body,
    fontWeight: '600',
  },
  planButtonTextDefault: {
    color: colors.primary,
  },
  planButtonTextPopular: {
    color: colors.primaryForeground,
  },
  planButtonTextCurrent: {
    color: colors.textMuted,
  },
  helpSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  helpTitle: {
    ...typography.titleMedium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  helpText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  helpButtonText: {
    ...typography.caption,
    color: colors.primaryForeground,
    fontWeight: '600',
  },
});
