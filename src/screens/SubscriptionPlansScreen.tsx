import { useMemo, useState, useRef, useEffect } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthContext';
import { savePendingSubscriptionCheckout } from '../lib/pendingSubscriptionCheckout';
import { getLatestUserApplicationByType, isBlockingApplicationStatus } from '../lib/applicationService';
import { useApplicationForm } from '../context/ApplicationFormContext';
import { colors, spacing, radii, typography } from '../theme';
import type { ProfileStackParamList } from '../navigation/ProfileNavigator';

const CARD_MARGIN = 4;
const ACTIVE_SCALE = 1.08;
const SIDE_SCALE = 0.88;
const FAR_SCALE = 0.65;
const ACTIVE_OPACITY = 1;
const SIDE_OPACITY = 0.65;
const FAR_OPACITY = 0.25;

type BillingPeriod = 'monthly' | 'yearly';
type PlanKey = 'get_started' | 'premium' | 'premium_plus';

type VendorPlan = {
  key: PlanKey;
  _key?: string;
  title: string;
  subtitle: string;
  badge?: string;
  priceMonthly: string;
  priceYearly: string;
  saveLabel?: string;
  outcomes: string;
  theme: {
    background: string;
    backgroundLight: string;
    text: string;
    textMuted: string;
    accent: string;
    buttonBg: string;
    buttonText: string;
    checkColor: string;
    borderColor: string;
  };
};

type VendorFeature = {
  label: string;
  get_started: string | boolean;
  premium: string | boolean;
  premium_plus: string | boolean;
};

type RouteParams = {
  currentTier?: string;
};

export default function SubscriptionPlansScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const route = useRoute();
  const { user } = useAuth();
  const { setPortfolioType, updateStep4 } = useApplicationForm();
  const { currentTier } = (route.params as RouteParams) || {};

  const [containerWidth, setContainerWidth] = useState(0);

  const { width: SCREEN_WIDTH, CARD_WIDTH, SNAP_INTERVAL } = useMemo(() => {
    const width = containerWidth || Dimensions.get('window').width;
    const CARD_WIDTH = width * 0.33;
    const SNAP_INTERVAL = CARD_WIDTH + CARD_MARGIN * 2;
    return { width, CARD_WIDTH, SNAP_INTERVAL };
  }, [containerWidth]);

  const [selectedBilling, setSelectedBilling] = useState<BillingPeriod>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('premium');
  const [activeIndex, setActiveIndex] = useState(1);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (containerWidth > 0 && scrollRef.current) {
      scrollRef.current.scrollTo({ x: (activeIndex + 1) * SNAP_INTERVAL, animated: false });
    }
  }, [containerWidth, activeIndex, SNAP_INTERVAL]);

  const plans: VendorPlan[] = useMemo(
    () => [
      {
        key: 'get_started',
        title: 'Get Started',
        subtitle: 'Perfect for trying us out',
        badge: 'Free',
        priceMonthly: 'R0',
        priceYearly: 'R0',
        outcomes: 'Get Noticed',
        theme: {
          background: '#F5F1E8',
          backgroundLight: '#FAF8F2',
          text: colors.textPrimary,
          textMuted: colors.textMuted,
          accent: colors.primary,
          buttonBg: colors.primary,
          buttonText: colors.primaryForeground,
          checkColor: colors.primary,
          borderColor: colors.borderSubtle,
        },
      },
      {
        key: 'premium',
        title: 'Premium',
        subtitle: 'Secure Bookings Online',
        badge: 'Most Popular',
        priceMonthly: 'R299',
        priceYearly: 'R3,289',
        saveLabel: '1 Month Free',
        outcomes: 'Secure Bookings Online',
        theme: {
          background: '#477372',
          backgroundLight: '#5A8A89',
          text: '#FFFFFF',
          textMuted: 'rgba(255,255,255,0.75)',
          accent: '#9DCFDB',
          buttonBg: '#FFFFFF',
          buttonText: '#477372',
          checkColor: '#9DCFDB',
          borderColor: 'rgba(255,255,255,0.2)',
        },
      },
      {
        key: 'premium_plus',
        title: 'Premium Plus',
        subtitle: 'Maximum Exposure',
        badge: 'Best Value',
        priceMonthly: 'R399',
        priceYearly: 'R4,389',
        saveLabel: '1 Month Free',
        outcomes: 'Maximum Exposure',
        theme: {
          background: '#2B3840',
          backgroundLight: '#3D4F58',
          text: '#FFFFFF',
          textMuted: 'rgba(255,255,255,0.75)',
          accent: '#FFD700',
          buttonBg: '#FFD700',
          buttonText: '#2B3840',
          checkColor: '#FFD700',
          borderColor: 'rgba(255,255,255,0.2)',
        },
      },
    ],
    [],
  );

  const circularPlans = useMemo(() => {
    if (plans.length < 2) return plans;
    return [
      { ...plans[plans.length - 1], _key: `${plans[plans.length - 1].key}-clone-start` },
      ...plans.map((p) => ({ ...p, _key: p.key })),
      { ...plans[0], _key: `${plans[0].key}-clone-end` },
    ];
  }, [plans]);

  const features: VendorFeature[] = useMemo(
    () => [
      { label: 'Photo Uploads', get_started: '10', premium: '40', premium_plus: '60' },
      { label: 'Video uploads', get_started: false, premium: '5', premium_plus: '10' },
      { label: 'Catalogue / Pricelist', get_started: 'Up to 10', premium: 'Full', premium_plus: 'Full' },
      { label: 'Portfolio build assistance', get_started: true, premium: true, premium_plus: true },
      { label: 'Calendar availability', get_started: true, premium: true, premium_plus: true },
      { label: 'Online quote requests', get_started: true, premium: true, premium_plus: true },
      { label: 'Full-time helpdesk support', get_started: true, premium: true, premium_plus: true },
      { label: 'Ratings & reviews', get_started: false, premium: true, premium_plus: true },
      { label: 'Analytics & stats', get_started: false, premium: true, premium_plus: true },
      { label: 'WhatsApp chat', get_started: false, premium: true, premium_plus: true },
      { label: 'Website & social links', get_started: false, premium: true, premium_plus: true },
      { label: 'Edit portfolio anytime', get_started: true, premium: true, premium_plus: true },
      { label: 'Dedicated Portfolio Manager', get_started: false, premium: false, premium_plus: true },
    ],
    [],
  );

  const selected = plans.find((p) => p.key === selectedPlan) ?? plans[0];
  const currentPrice = selectedBilling === 'monthly' ? selected.priceMonthly : selected.priceYearly;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const circularIndex = Math.round(offsetX / SNAP_INTERVAL);

    let realIndex: number;

    if (circularIndex === 0) {
      realIndex = plans.length - 1;
      setTimeout(() => {
        scrollRef.current?.scrollTo({ x: plans.length * SNAP_INTERVAL, animated: false });
      }, 50);
    } else if (circularIndex === circularPlans.length - 1) {
      realIndex = 0;
      setTimeout(() => {
        scrollRef.current?.scrollTo({ x: 1 * SNAP_INTERVAL, animated: false });
      }, 50);
    } else {
      realIndex = circularIndex - 1;
    }

    if (realIndex >= 0 && realIndex < plans.length) {
      setActiveIndex(realIndex);
      setSelectedPlan(plans[realIndex].key);
    }
  };

  const scrollToIndex = (realIndex: number) => {
    const circularIndex = realIndex + 1;
    scrollRef.current?.scrollTo({ x: circularIndex * SNAP_INTERVAL, animated: true });
    setActiveIndex(realIndex);
    setSelectedPlan(plans[realIndex].key);
  };

  const handleSelectPlan = async () => {
    const latestVendorApplication = await getLatestUserApplicationByType('vendor');
    if (latestVendorApplication.success && latestVendorApplication.data && isBlockingApplicationStatus(latestVendorApplication.data.status)) {
      navigation.navigate('ApplicationStatus');
      return;
    }

    const isFree = selectedPlan === 'get_started';

    const priceLabel = isFree
      ? 'Free'
      : `${currentPrice}/${selectedBilling === 'monthly' ? 'month' : 'year'}`;

    await setPortfolioType('vendors');
    updateStep4({ subscriptionPlan: selectedPlan, billingPeriod: selectedBilling });

    if (!user) {
      const checkoutParams: ProfileStackParamList['SubscriptionCheckout'] = {
        tierName: selected.title,
        billing: selectedBilling,
        priceLabel,
        isFree,
        productType: 'vendor',
        planKey: selectedPlan,
      };
      savePendingSubscriptionCheckout(checkoutParams)
        .then(() => {
          const rootNav = navigation.getParent()?.getParent() as any;
          rootNav?.navigate?.('Auth', { screen: 'GuestPrompt', params: { label: 'Account' } });
        })
        .catch(() => {
          Alert.alert('Login required', 'Please log in to continue with this subscription plan.');
        });
      return;
    }

    navigation.navigate('Account' as any, { screen: 'ApplicationStep1' });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}
          >
            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
            <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>Back</Text>
          </TouchableOpacity>

          <Text style={{ ...typography.titleLarge, color: colors.textPrimary, marginBottom: spacing.xs }}>
            Vendor & Service Plans
          </Text>
          <Text style={{ ...typography.body, color: colors.textMuted, marginBottom: spacing.md }}>
            Limited-time launch offer — no hidden fees, zero commissions
          </Text>
        </View>

        {/* Billing Toggle */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: colors.surface,
            borderRadius: radii.full,
            padding: 4,
            marginHorizontal: spacing.lg,
            marginBottom: spacing.md,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
          }}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: spacing.sm,
              borderRadius: radii.full,
              alignItems: 'center',
              backgroundColor: selectedBilling === 'monthly' ? colors.primary : 'transparent',
            }}
            onPress={() => setSelectedBilling('monthly')}
          >
            <Text
              style={{
                ...typography.caption,
                color: selectedBilling === 'monthly' ? colors.primaryForeground : colors.textMuted,
                fontWeight: '500',
              }}
            >
              Monthly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: spacing.sm,
              borderRadius: radii.full,
              alignItems: 'center',
              backgroundColor: selectedBilling === 'yearly' ? colors.primary : 'transparent',
            }}
            onPress={() => setSelectedBilling('yearly')}
          >
            <Text
              style={{
                ...typography.caption,
                color: selectedBilling === 'yearly' ? colors.primaryForeground : colors.textMuted,
                fontWeight: '500',
              }}
            >
              Yearly (Save 20%)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Horizontal Swipeable Cards */}
        <View onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled={false}
            showsHorizontalScrollIndicator={false}
            snapToInterval={SNAP_INTERVAL}
            snapToAlignment="center"
            decelerationRate="fast"
            onMomentumScrollEnd={handleScroll}
            contentContainerStyle={{
              paddingHorizontal: (SCREEN_WIDTH - CARD_WIDTH) / 2 - CARD_MARGIN,
              paddingVertical: spacing.xl,
              alignItems: 'center',
            }}
          >
          {circularPlans.map((plan, circularIndex) => {
            const realIndex = circularIndex === 0
              ? plans.length - 1
              : circularIndex === circularPlans.length - 1
                ? 0
                : circularIndex - 1;
            const isActive = realIndex === activeIndex;
            const distance = Math.abs(realIndex - activeIndex);
            const scale = isActive
              ? ACTIVE_SCALE
              : distance === 1
                ? SIDE_SCALE
                : Math.max(FAR_SCALE, 0.55);
            const opacity = isActive
              ? ACTIVE_OPACITY
              : distance === 1
                ? SIDE_OPACITY
                : Math.max(FAR_OPACITY, 0.15);
            const zIndex = isActive ? 20 : distance === 1 ? 15 : 10 - distance;
            const isCurrentPlan = currentTier?.toLowerCase() === plan.key.replace('_', '');
            return (
              <TouchableOpacity
                key={plan._key || plan.key}
                activeOpacity={0.9}
                onPress={() => {
                  if (isActive) {
                    handleSelectPlan();
                  } else {
                    scrollToIndex(realIndex);
                  }
                }}
                style={{
                  width: CARD_WIDTH,
                  marginHorizontal: CARD_MARGIN,
                  borderRadius: radii.xl,
                  backgroundColor: plan.theme.background,
                  padding: spacing.md,
                  transform: [{ scale }],
                  opacity,
                  zIndex,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: isActive ? 10 : 3 },
                  shadowOpacity: isActive ? 0.3 : 0.06,
                  shadowRadius: isActive ? 20 : 5,
                  elevation: isActive ? 14 : 3,
                }}
              >
                {/* Badge */}
                {plan.badge ? (
                  <View
                    style={{
                      alignSelf: 'flex-start',
                      backgroundColor: plan.theme.accent,
                      borderRadius: radii.full,
                      paddingHorizontal: spacing.sm,
                      paddingVertical: 2,
                      marginBottom: spacing.sm,
                    }}
                  >
                    <Text
                      style={{
                        ...typography.caption,
                        color: plan.theme.buttonText,
                        fontWeight: '700',
                        fontSize: 9,
                      }}
                    >
                      {plan.badge}
                    </Text>
                  </View>
                ) : (
                  <View style={{ height: 18, marginBottom: spacing.sm }} />
                )}

                {/* Current Plan Indicator */}
                {isCurrentPlan && (
                  <View
                    style={{
                      alignSelf: 'flex-start',
                      backgroundColor: plan.theme.accent,
                      borderRadius: radii.full,
                      paddingHorizontal: spacing.sm,
                      paddingVertical: 2,
                      marginBottom: spacing.sm,
                    }}
                  >
                    <Text
                      style={{
                        ...typography.caption,
                        color: plan.theme.buttonText,
                        fontWeight: '700',
                        fontSize: 9,
                      }}
                    >
                      CURRENT
                    </Text>
                  </View>
                )}

                {/* Title & Subtitle */}
                <Text
                  style={{
                    ...typography.titleMedium,
                    color: plan.theme.text,
                    fontSize: isActive ? 16 : 13,
                    marginBottom: 2,
                  }}
                >
                  {plan.title}
                </Text>
                <Text
                  style={{
                    ...typography.caption,
                    color: plan.theme.textMuted,
                    marginBottom: spacing.sm,
                    fontSize: 10,
                  }}
                >
                  {plan.subtitle}
                </Text>

                {/* Price */}
                <View style={{ marginBottom: spacing.sm }}>
                  <Text
                    style={{
                      ...typography.displayLarge,
                      color: plan.theme.text,
                      fontSize: isActive ? 22 : 16,
                    }}
                  >
                    {selectedBilling === 'monthly' ? plan.priceMonthly : plan.priceYearly}
                  </Text>
                  <Text
                    style={{
                      ...typography.caption,
                      color: plan.theme.textMuted,
                      fontSize: 10,
                    }}
                  >
                    {plan.key === 'get_started' ? 'Forever free' : `per ${selectedBilling === 'monthly' ? 'month' : 'year'}`}
                  </Text>
                  {plan.saveLabel && selectedBilling === 'yearly' ? (
                    <Text
                      style={{
                        ...typography.caption,
                        color: plan.theme.accent,
                        fontWeight: '700',
                        marginTop: 1,
                        fontSize: 10,
                      }}
                    >
                      {plan.saveLabel}
                    </Text>
                  ) : null}
                </View>

                {/* Divider */}
                <View
                  style={{
                    height: 1,
                    backgroundColor: plan.theme.borderColor,
                    marginBottom: spacing.sm,
                  }}
                />

                {/* Features */}
                <View style={{ marginBottom: spacing.sm }}>
                  {features.slice(0, 6).map((feature) => {
                    const value = feature[plan.key];
                    return (
                      <View
                        key={feature.label}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginBottom: 4,
                        }}
                      >
                        {typeof value === 'boolean' ? (
                          <MaterialIcons
                            name={value ? 'check-circle' : 'cancel'}
                            size={12}
                            color={value ? plan.theme.checkColor : plan.theme.textMuted}
                          />
                        ) : (
                          <Text style={{ ...typography.caption, color: plan.theme.text, fontWeight: '600', fontSize: 10 }}>
                            {value}
                          </Text>
                        )}
                        <Text
                          style={{
                            ...typography.caption,
                            color: plan.theme.textMuted,
                            marginLeft: 4,
                            flex: 1,
                            fontSize: 9,
                          }}
                          numberOfLines={1}
                        >
                          {feature.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                {/* CTA Button */}
                <TouchableOpacity
                  onPress={() => {
                    scrollToIndex(realIndex);
                    setTimeout(handleSelectPlan, 300);
                  }}
                  activeOpacity={0.85}
                  style={{
                    backgroundColor: isCurrentPlan ? plan.theme.textMuted : plan.theme.buttonBg,
                    borderRadius: radii.md,
                    paddingVertical: spacing.sm,
                    alignItems: 'center',
                    marginTop: 'auto',
                  }}
                  disabled={isCurrentPlan}
                >
                  <Text
                    style={{
                      ...typography.caption,
                      color: isCurrentPlan ? plan.theme.text : plan.theme.buttonText,
                      fontWeight: '700',
                      fontSize: 11,
                    }}
                  >
                    {isCurrentPlan ? 'Current Plan' : plan.key === 'get_started' ? 'Choose Free' : 'Choose'}
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
          </ScrollView>
        </View>

        {/* Pagination Dots */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginVertical: spacing.md,
          }}
        >
          {plans.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => scrollToIndex(index)}
              style={{
                width: activeIndex === index ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: activeIndex === index ? colors.primary : colors.borderSubtle,
                marginHorizontal: 4,
              }}
            />
          ))}
        </View>

        {/* Full Feature Comparison */}
        <View style={{ paddingHorizontal: spacing.lg }}>
          <Text
            style={{
              ...typography.titleMedium,
              color: colors.textPrimary,
              marginBottom: spacing.md,
              marginTop: spacing.sm,
            }}
          >
            Full Feature Comparison
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
                    <Text
                      style={{
                        ...typography.body,
                        color: colors.textPrimary,
                        flex: 1,
                        paddingRight: spacing.md,
                      }}
                    >
                      {feature.label}
                    </Text>
                    <View style={{ width: 60, alignItems: 'flex-end' }}>
                      {typeof value === 'boolean' ? (
                        <MaterialIcons
                          name={value ? 'check-circle' : 'cancel'}
                          size={18}
                          color={value ? colors.primaryTeal : colors.textMuted}
                        />
                      ) : (
                        <Text
                          style={{
                            ...typography.caption,
                            color: colors.textPrimary,
                            fontWeight: '600',
                          }}
                        >
                          {value}
                        </Text>
                      )}
                    </View>
                  </View>
                  {showDivider ? <View style={{ height: 1, backgroundColor: colors.borderSubtle }} /> : null}
                </View>
              );
            })}
          </View>
        </View>

        {/* Bottom CTA */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
          <TouchableOpacity
            onPress={handleSelectPlan}
            activeOpacity={0.9}
            style={{
              backgroundColor: colors.primary,
              borderRadius: radii.lg,
              paddingVertical: spacing.md,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                ...typography.body,
                color: colors.primaryForeground,
                fontWeight: '700',
              }}
            >
              {selectedPlan === 'get_started'
                ? 'Confirm Free Plan'
                : `Continue with ${selected.title} (${selectedBilling})`}
            </Text>
          </TouchableOpacity>

          <Text
            style={{
              ...typography.caption,
              color: colors.textMuted,
              marginTop: spacing.md,
              textAlign: 'center',
            }}
          >
            Upgrade or cancel anytime. No hidden fees.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
