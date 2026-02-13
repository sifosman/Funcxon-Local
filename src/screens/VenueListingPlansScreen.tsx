import { useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radii, typography } from '../theme';
import type { ProfileStackParamList } from '../navigation/ProfileNavigator';

type PlanKey = 'get_started' | 'monthly' | '6_month' | '12_month';

type VenuePlan = {
  key: PlanKey;
  title: string;
  badge?: string;
  priceNow: string;
  priceWas?: string;
  saveLabel?: string;
  outcomes: string;
};

type VenueFeature = {
  label: string;
  get_started: string | boolean;
  monthly: string | boolean;
  '6_month': string | boolean;
  '12_month': string | boolean;
};

export default function VenueListingPlansScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('monthly');

  const plans: VenuePlan[] = useMemo(
    () => [
      {
        key: 'get_started',
        title: 'Get Started',
        badge: 'Free',
        priceNow: 'R0',
        outcomes: 'Get Noticed',
      },
      {
        key: 'monthly',
        title: 'Monthly Plan',
        priceWas: 'R1,999',
        priceNow: 'R1,499',
        outcomes: 'Maximum Exposure',
      },
      {
        key: '6_month',
        title: '6-Month Plan',
        priceWas: 'R11,994',
        priceNow: 'R9,995',
        saveLabel: 'Save R1,999',
        outcomes: 'Maximum Exposure',
      },
      {
        key: '12_month',
        title: '12-Month Plan',
        priceWas: 'R23,988',
        priceNow: 'R19,990',
        saveLabel: 'Save R3,998',
        outcomes: 'Maximum Exposure',
      },
    ],
    [],
  );

  const features: VenueFeature[] = useMemo(
    () => [
      { label: 'Photo Uploads', get_started: '10', monthly: '50', '6_month': '50', '12_month': '50' },
      { label: 'Video uploads', get_started: '1', monthly: '5', '6_month': '5', '12_month': '5' },
      { label: 'Catalogue / Pricelist', get_started: false, monthly: true, '6_month': true, '12_month': true },
      {
        label: 'Portfolio Build & Manage assistance',
        get_started: true,
        monthly: true,
        '6_month': true,
        '12_month': true,
      },
      { label: 'Full-time helpdesk support', get_started: true, monthly: true, '6_month': true, '12_month': true },
      {
        label: 'Dedicated Funcxon Portfolio Manager',
        get_started: false,
        monthly: true,
        '6_month': true,
        '12_month': true,
      },
      { label: 'Analytics & stats', get_started: false, monthly: true, '6_month': true, '12_month': true },
      {
        label: 'Online quote requests & updates',
        get_started: false,
        monthly: true,
        '6_month': true,
        '12_month': true,
      },
      {
        label: 'Calendar availability & updates',
        get_started: true,
        monthly: true,
        '6_month': true,
        '12_month': true,
      },
      { label: 'Map location display', get_started: true, monthly: true, '6_month': true, '12_month': true },
      {
        label: 'Website & social media links',
        get_started: false,
        monthly: true,
        '6_month': true,
        '12_month': true,
      },
      { label: 'Live WhatsApp chat', get_started: true, monthly: true, '6_month': true, '12_month': true },
      { label: 'Ratings & reviews', get_started: true, monthly: true, '6_month': true, '12_month': true },
      {
        label: 'Instant venue tour bookings',
        get_started: false,
        monthly: true,
        '6_month': true,
        '12_month': true,
      },
    ],
    [],
  );

  const selected = plans.find((p) => p.key === selectedPlan) ?? plans[0];

  const renderValue = (value: string | boolean) => {
    if (typeof value === 'boolean') {
      return (
        <MaterialIcons
          name={value ? 'check-circle' : 'cancel'}
          size={16}
          color={value ? colors.primaryTeal : colors.textMuted}
        />
      );
    }

    return <Text style={{ ...typography.caption, color: colors.textPrimary, fontWeight: '600' }}>{value}</Text>;
  };

  const handleContinueToCheckout = () => {
    const isFree = selectedPlan === 'get_started';

    const priceLabel = isFree
      ? 'Free'
      : `R${Number((selected.priceNow || '0').replace(/[^0-9.]/g, '')).toLocaleString()}`;

    navigation.navigate('SubscriptionCheckout', {
      tierName: selected.title,
      billing: selectedPlan === 'monthly' ? 'monthly' : selectedPlan === 'get_started' ? 'monthly' : selectedPlan,
      priceLabel,
      isFree,
      productType: 'venue',
      planKey: selectedPlan,
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}
        >
          <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
          <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>Back</Text>
        </TouchableOpacity>

        <Text style={{ ...typography.titleLarge, color: colors.textPrimary, marginBottom: spacing.xs }}>
          Venue Listing Plans
        </Text>
        <Text style={{ ...typography.body, color: colors.textMuted, marginBottom: spacing.lg }}>
          Limited-time launch offer
        </Text>

        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            padding: spacing.lg,
            marginBottom: spacing.lg,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
            <MaterialIcons name="check" size={18} color={colors.primaryTeal} />
            <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>No hidden fees</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialIcons name="check" size={18} color={colors.primaryTeal} />
            <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>Zero commissions</Text>
          </View>
        </View>

        <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.sm }}>Choose a plan</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg }}>
          {plans.map((plan) => {
            const isSelected = plan.key === selectedPlan;
            return (
              <TouchableOpacity
                key={plan.key}
                onPress={() => setSelectedPlan(plan.key)}
                activeOpacity={0.85}
                style={{
                  flexGrow: 1,
                  minWidth: 150,
                  padding: spacing.md,
                  borderRadius: radii.lg,
                  borderWidth: 1,
                  borderColor: isSelected ? colors.primaryTeal : colors.borderSubtle,
                  backgroundColor: isSelected ? colors.backgroundAlt : colors.surface,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '700' }}>{plan.title}</Text>
                  {plan.badge ? (
                    <View
                      style={{
                        paddingHorizontal: spacing.sm,
                        paddingVertical: 2,
                        borderRadius: radii.full,
                        backgroundColor: colors.primaryTeal,
                      }}
                    >
                      <Text style={{ ...typography.caption, color: '#FFFFFF', fontWeight: '700' }}>{plan.badge}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={{ marginTop: spacing.sm }}>
                  {plan.priceWas ? (
                    <Text
                      style={{
                        ...typography.caption,
                        color: colors.textMuted,
                        textDecorationLine: 'line-through',
                      }}
                    >
                      {plan.priceWas}
                    </Text>
                  ) : null}
                  <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>{plan.priceNow}</Text>
                  {plan.saveLabel ? (
                    <Text style={{ ...typography.caption, color: colors.primaryTeal, marginTop: 2 }}>{plan.saveLabel}</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            padding: spacing.lg,
            marginBottom: spacing.lg,
          }}
        >
          <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>Selected plan</Text>
          <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '700' }}>{selected.title}</Text>
          <Text style={{ ...typography.body, color: colors.textMuted, marginTop: spacing.xs }}>{selected.outcomes}</Text>
        </View>

        <TouchableOpacity
          onPress={handleContinueToCheckout}
          activeOpacity={0.9}
          style={{
            backgroundColor: colors.primary,
            borderRadius: radii.lg,
            paddingVertical: spacing.md,
            alignItems: 'center',
            marginBottom: spacing.lg,
          }}
        >
          <Text style={{ ...typography.body, color: colors.primaryForeground, fontWeight: '700' }}>
            {selectedPlan === 'get_started' ? 'Confirm Free Plan' : 'Continue to Checkout'}
          </Text>
        </TouchableOpacity>

        <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.sm }}>
          What you get
        </Text>

        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            overflow: 'hidden',
          }}
        >
          {features.map((feature, idx) => {
            const value = feature[selectedPlan];
            const showDivider = idx !== features.length - 1;

            return (
              <View key={feature.label}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.md,
                  }}
                >
                  <Text style={{ ...typography.body, color: colors.textPrimary, flex: 1, paddingRight: spacing.md }}>
                    {feature.label}
                  </Text>
                  <View style={{ width: 40, alignItems: 'flex-end' }}>{renderValue(value)}</View>
                </View>
                {showDivider ? <View style={{ height: 1, backgroundColor: colors.borderSubtle }} /> : null}
              </View>
            );
          })}
        </View>

        <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.lg, textAlign: 'center' }}>
          Upgrade Anytime!
        </Text>
      </ScrollView>
    </View>
  );
}
