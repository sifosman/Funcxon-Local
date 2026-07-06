import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import Animated, { useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';
import Carousel from 'react-native-reanimated-carousel';
import type { ICarouselInstance } from 'react-native-reanimated-carousel';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { savePendingSubscriptionCheckout } from '../lib/pendingSubscriptionCheckout';
import { getLatestUserApplicationByType, isBlockingApplicationStatus } from '../lib/applicationService';
import { useApplicationForm } from '../context/ApplicationFormContext';
import { colors, spacing, radii, typography } from '../theme';
import { useIsDesktop } from '../hooks/useIsDesktop';
import type { ProfileStackParamList } from '../navigation/ProfileNavigator';
import ThemedAlert from '../components/ThemedAlert';

const CARD_MARGIN = 8;
const ACTIVE_SCALE = 1.02;
const SIDE_SCALE = 0.88;
const FAR_SCALE = 0.65;
const ACTIVE_OPACITY = 1;
const SIDE_OPACITY = 0.92;
const FAR_OPACITY = 0.7;

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
  const isDesktop = useIsDesktop();
  const { setPortfolioType, updateStep4 } = useApplicationForm();
  const { currentTier } = (route.params as RouteParams) || {};

  const [containerWidth, setContainerWidth] = useState(0);

  const { width: SCREEN_WIDTH, CARD_WIDTH, SNAP_INTERVAL } = useMemo(() => {
    const width = containerWidth || Dimensions.get('window').width;
    const CARD_WIDTH = width * 0.36;
    const SNAP_INTERVAL = CARD_WIDTH + CARD_MARGIN * 2;
    return { width, CARD_WIDTH, SNAP_INTERVAL };
  }, [containerWidth]);

  const [selectedBilling, setSelectedBilling] = useState<BillingPeriod>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('premium');
  const [activeIndex, setActiveIndex] = useState(1);
  const [existingVendorId, setExistingVendorId] = useState<number | null>(null);
  const [alertState, setAlertState] = useState<{visible: boolean; title: string; message: string} | null>(null);
  const carouselRef = useRef<ICarouselInstance>(null);

  useEffect(() => {
    if (containerWidth > 0 && carouselRef.current) {
      carouselRef.current.scrollTo({ index: activeIndex, animated: false });
    }
  }, [containerWidth, activeIndex]);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.id) setExistingVendorId(data.id);
      });
  }, [user?.id]);

  const plans: VendorPlan[] = useMemo(
    () => [
      {
        key: 'get_started',
        title: 'Basic Package',
        subtitle: 'Your business is seen',
        badge: 'Get Noticed',
        priceMonthly: 'R0',
        priceYearly: 'R0',
        outcomes: 'Get Noticed',
        theme: {
          background: '#FFFFFF',
          backgroundLight: '#FFFFFF',
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
          background: '#030255',
          backgroundLight: '#1a1a5c',
          text: '#FFFFFF',
          textMuted: 'rgba(255,255,255,0.75)',
          accent: '#b9c4eb',
          buttonBg: '#FFFFFF',
          buttonText: '#030255',
          checkColor: '#b9c4eb',
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
        outcomes: 'Maximum Exposure & Bookings',
        theme: {
          background: '#000000',
          backgroundLight: '#1a1a5c',
          text: '#FFFFFF',
          textMuted: 'rgba(255,255,255,0.75)',
          accent: '#FFD700',
          buttonBg: '#FFD700',
          buttonText: '#000000',
          checkColor: '#FFD700',
          borderColor: 'rgba(255,255,255,0.2)',
        },
      },
    ],
    [],
  );

  const circularPlans = plans;

  const features: VendorFeature[] = useMemo(
    () => [
      { label: 'Photo Uploads', get_started: '5', premium: '25', premium_plus: '50' },
      { label: 'Video uploads', get_started: '0', premium: '5', premium_plus: '10' },
      { label: 'Catalogue / Pricelist', get_started: 'Limited', premium: 'Full', premium_plus: 'Full' },
      { label: 'Online quote requests', get_started: true, premium: true, premium_plus: true },
      { label: 'WhatsApp chat', get_started: false, premium: true, premium_plus: true },
      { label: 'Website & social links', get_started: false, premium: true, premium_plus: true },
      { label: 'Map location display', get_started: true, premium: true, premium_plus: true },
      { label: 'Ratings & reviews', get_started: 'Limited', premium: true, premium_plus: true },
      { label: 'Self edit portfolio anytime', get_started: true, premium: true, premium_plus: true },
      { label: 'Portfolio Performance Analytics & Stats', get_started: false, premium: 'Limited', premium_plus: true },
      { label: 'Featured Listings', get_started: false, premium: false, premium_plus: true },
      { label: 'Funxon Portfolio Build Assistance', get_started: true, premium: true, premium_plus: true },
      { label: 'Dedicated Funxon Portfolio Manager', get_started: false, premium: false, premium_plus: true },
    ],
    [],
  );

  const selected = plans.find((p) => p.key === selectedPlan) ?? plans[0];
  const currentPrice = selectedBilling === 'monthly' ? selected.priceMonthly : selected.priceYearly;

  const handleSnapToItem = useCallback((index: number) => {
    setActiveIndex(index);
    setSelectedPlan(plans[index].key);
  }, [plans]);

  const scrollToIndex = (realIndex: number) => {
    carouselRef.current?.scrollTo({ index: realIndex, animated: true });
    setActiveIndex(realIndex);
    setSelectedPlan(plans[realIndex].key);
  };

  const customAnimation = useCallback(
    (value: number, _index: number) => {
      'worklet';
      const centerOffset = (SCREEN_WIDTH - SNAP_INTERVAL) / 2;
      const translate = interpolate(
        value,
        [-1, 0, 1],
        [-SNAP_INTERVAL + centerOffset, centerOffset, SNAP_INTERVAL + centerOffset],
        Extrapolation.CLAMP,
      );
      return { transform: [{ translateX: translate }] };
    },
    [SCREEN_WIDTH, SNAP_INTERVAL],
  );

  const handleSelectPlan = async () => {
    const isFree = selectedPlan === 'get_started';

    const priceLabel = isFree
      ? 'Free'
      : `${currentPrice}/${selectedBilling === 'monthly' ? 'month' : 'year'}`;

    await setPortfolioType('vendors');
    updateStep4({ subscriptionPlan: selectedPlan, billingPeriod: selectedBilling });

    const checkoutParams: ProfileStackParamList['SubscriptionCheckout'] = {
      tierName: selected.title,
      billing: selectedBilling,
      priceLabel,
      isFree,
      productType: 'vendor',
      planKey: selectedPlan,
    };

    if (!user) {
      savePendingSubscriptionCheckout(checkoutParams)
        .then(() => {
          const rootNav = navigation.getParent()?.getParent() as any;
          rootNav?.navigate?.('Auth', { screen: 'GuestPrompt', params: { label: 'Account' } });
        })
        .catch(() => {
          setAlertState({ visible: true, title: 'Login required', message: 'Please log in to continue with this subscription plan.' });
        });
      return;
    }

    // Existing vendor — go straight to checkout (upgrade/change plan flow)
    if (existingVendorId) {
      navigation.navigate('SubscriptionCheckout', checkoutParams);
      return;
    }

    // New applicant — check for blocking application status before starting application form
    const latestVendorApplication = await getLatestUserApplicationByType('vendor');
    if (latestVendorApplication.success && latestVendorApplication.data && isBlockingApplicationStatus(latestVendorApplication.data.status)) {
      navigation.navigate('ApplicationStatus');
      return;
    }

    navigation.navigate('Account' as any, { screen: 'ApplicationStep1' });
  };

  const renderDesktopPlanCard = (plan: VendorPlan) => {
    const isCurrentPlan = currentTier?.toLowerCase() === plan.key.replace('_', '');
    return (
      <TouchableOpacity
        key={plan.key}
        activeOpacity={0.9}
        onPress={() => {
          setSelectedPlan(plan.key);
          setActiveIndex(plans.findIndex((p) => p.key === plan.key));
          handleSelectPlan();
        }}
        style={{ flex: 1 }}
      >
        <View
          style={{
            height: 480,
            borderRadius: radii.xl,
            backgroundColor: plan.theme.background,
            padding: spacing.lg,
            borderWidth: 1,
            borderColor: plan.theme.borderColor,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 5,
          }}
        >
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
              <Text style={{ ...typography.captionBold, color: plan.theme.buttonText, fontSize: 10 }}>
                {plan.badge}
              </Text>
            </View>
          ) : (
            <View style={{ height: 22, marginBottom: spacing.sm }} />
          )}

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
              <Text style={{ ...typography.captionBold, color: plan.theme.buttonText, fontSize: 10 }}>
                CURRENT
              </Text>
            </View>
          )}

          <Text style={{ ...typography.titleMedium, color: plan.theme.text, fontSize: 20, marginBottom: 2 }}>
            {plan.title}
          </Text>
          <Text style={{ ...typography.caption, color: plan.theme.textMuted, marginBottom: spacing.sm, fontSize: 12 }}>
            {plan.subtitle}
          </Text>

          <View style={{ marginBottom: spacing.sm }}>
            <Text style={{ ...typography.displayLarge, color: plan.theme.text, fontSize: 28 }}>
              {selectedBilling === 'monthly' ? plan.priceMonthly : plan.priceYearly}
            </Text>
            <Text style={{ ...typography.caption, color: plan.theme.textMuted, fontSize: 12 }}>
              {plan.key === 'get_started' ? 'Forever free' : `per ${selectedBilling === 'monthly' ? 'month' : 'year'}`}
            </Text>
            {plan.saveLabel && selectedBilling === 'yearly' ? (
              <Text style={{ ...typography.captionBold, color: plan.theme.accent, marginTop: 1, fontSize: 12 }}>
                {plan.saveLabel}
              </Text>
            ) : null}
          </View>

          <View style={{ height: 1, backgroundColor: plan.theme.borderColor, marginBottom: spacing.sm }} />

          <View style={{ flex: 1, marginBottom: spacing.sm }}>
            {features.slice(0, 8).map((feature) => {
              const value = feature[plan.key];
              return (
                <View
                  key={feature.label}
                  style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}
                >
                  {typeof value === 'boolean' ? (
                    <MaterialIcons
                      name={value ? 'check-circle' : 'cancel'}
                      size={14}
                      color={value ? plan.theme.checkColor : plan.theme.textMuted}
                    />
                  ) : (
                    <Text style={{ ...typography.captionSemiBold, color: plan.theme.text, fontSize: 11 }}>
                      {value}
                    </Text>
                  )}
                  <Text
                    style={{
                      ...typography.caption,
                      color: plan.theme.textMuted,
                      marginLeft: 4,
                      flex: 1,
                      fontSize: 11,
                    }}
                    numberOfLines={1}
                  >
                    {feature.label}
                  </Text>
                </View>
              );
            })}
          </View>

          <TouchableOpacity
            onPress={() => {
              setSelectedPlan(plan.key);
              setActiveIndex(plans.findIndex((p) => p.key === plan.key));
              handleSelectPlan();
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
                ...typography.captionBold,
                color: isCurrentPlan ? plan.theme.text : plan.theme.buttonText,
                fontSize: 12,
              }}
            >
              {isCurrentPlan ? 'Current Plan' : plan.key === 'get_started' ? 'Choose Free' : 'Choose'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDesktop ? colors.surfaceBg : colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }} showsVerticalScrollIndicator={false}>
        <View style={isDesktop ? { maxWidth: 1200, width: '100%', alignSelf: 'center', paddingHorizontal: 48, paddingTop: spacing.sm, paddingBottom: spacing.xl } : undefined}>
          {/* Header */}
          <View style={{ paddingHorizontal: isDesktop ? 0 : spacing.lg, paddingTop: spacing.sm }}>
            {isDesktop ? null : (
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}
              >
                <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
                <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>Back</Text>
              </TouchableOpacity>
            )}

            <Text style={{ ...typography.titleLarge, color: colors.textPrimary, marginBottom: spacing.xs, fontSize: isDesktop ? 32 : undefined, fontWeight: isDesktop ? '600' : undefined }}>
              Vendor & Service Plans
            </Text>
            <Text style={{ ...typography.body, color: isDesktop ? colors.onSurfaceVariant : colors.textMuted, marginBottom: spacing.md, fontSize: isDesktop ? 16 : undefined, lineHeight: isDesktop ? 24 : undefined }}>
              Limited-time launch offer — no hidden fees, zero commissions
            </Text>
          </View>

        {/* Billing Toggle */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: isDesktop ? colors.surfaceContainerLowest : colors.surface,
            borderRadius: radii.full,
            padding: 4,
            marginHorizontal: isDesktop ? 0 : spacing.lg,
            marginBottom: spacing.md,
            borderWidth: 1,
            borderColor: isDesktop ? colors.outlineVariant : colors.borderSubtle,
            maxWidth: isDesktop ? 400 : undefined,
            alignSelf: isDesktop ? 'center' : undefined,
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
                ...typography.captionSemiBold,
                color: selectedBilling === 'monthly' ? colors.primaryForeground : colors.textMuted,
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
                ...typography.captionSemiBold,
                color: selectedBilling === 'yearly' ? colors.primaryForeground : colors.textMuted,
              }}
            >
              Yearly (Save 20%)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Desktop Grid / Mobile Carousel */}
        {isDesktop ? (
          <View style={{ marginBottom: spacing.lg, marginTop: spacing.xl } as any}>
            <View style={{ flexDirection: 'row', gap: spacing.gutter } as any}>
              {plans.map((plan) => renderDesktopPlanCard(plan))}
            </View>
          </View>
        ) : (
          <View onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)} style={{ paddingVertical: spacing.xl, overflow: 'visible' }}>
            <Carousel
            ref={carouselRef}
            loop
            snapEnabled
            pagingEnabled={true}
            defaultIndex={activeIndex}
            scrollAnimationDuration={350}
            overscrollEnabled={false}
            width={SNAP_INTERVAL}
            height={460}
            data={plans}
            style={{ width: '100%', overflow: 'visible' }}
            customAnimation={customAnimation}
            onSnapToItem={handleSnapToItem}
            renderItem={({ item: plan, animationValue }) => {
              const planIndex = plans.findIndex((p) => p.key === plan.key);
              const isActive = planIndex === activeIndex;
              const isCurrentPlan = currentTier?.toLowerCase() === plan.key.replace('_', '');
              const animatedStyle = useAnimatedStyle(() => {
                const value = Math.abs(animationValue.value);
                const scale = interpolate(
                  value,
                  [0, 1, 2],
                  [ACTIVE_SCALE, SIDE_SCALE, FAR_SCALE],
                  Extrapolation.CLAMP,
                );
                const opacity = interpolate(
                  value,
                  [0, 1, 2],
                  [ACTIVE_OPACITY, SIDE_OPACITY, FAR_OPACITY],
                  Extrapolation.CLAMP,
                );
                return { transform: [{ scale }], opacity };
              });
              return (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => {
                    if (isActive) {
                      handleSelectPlan();
                    } else {
                      scrollToIndex(planIndex);
                    }
                  }}
                  style={{ width: CARD_WIDTH, marginHorizontal: CARD_MARGIN, overflow: 'visible' }}
                >
                  <Animated.View
                    style={[
                      {
                        height: 440,
                        borderRadius: radii.xl,
                        backgroundColor: plan.theme.background,
                        padding: spacing.md,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: isActive ? 10 : 3 },
                        shadowOpacity: isActive ? 0.3 : 0.06,
                        shadowRadius: isActive ? 20 : 5,
                        elevation: isActive ? 14 : 3,
                      },
                      animatedStyle,
                    ]}
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
                            ...typography.captionBold,
                            color: plan.theme.buttonText,
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
                            ...typography.captionBold,
                            color: plan.theme.buttonText,
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
                            ...typography.captionBold,
                            color: plan.theme.accent,
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
                    <View style={{ flex: 1, marginBottom: spacing.sm }}>
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
                              <Text style={{ ...typography.captionSemiBold, color: plan.theme.text, fontSize: 10 }}>
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
                        scrollToIndex(planIndex);
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
                          ...typography.captionBold,
                          color: isCurrentPlan ? plan.theme.text : plan.theme.buttonText,
                          fontSize: 11,
                        }}
                      >
                        {isCurrentPlan ? 'Current Plan' : plan.key === 'get_started' ? 'Choose Free' : 'Choose'}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}

      {/* Pagination Dots */}
        {!isDesktop && (
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
        )}

        {/* Full Feature Comparison */}
        <View style={{ paddingHorizontal: isDesktop ? 0 : spacing.lg }}>
          <Text
            style={{
              ...typography.titleMedium,
              color: colors.textPrimary,
              marginBottom: spacing.md,
              marginTop: spacing.sm,
              fontSize: isDesktop ? 24 : undefined,
            }}
          >
            Full Feature Comparison
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ minWidth: '100%' }}>
            <View
              style={{
                backgroundColor: isDesktop ? colors.surfaceContainerLowest : colors.surface,
                borderRadius: radii.lg,
                borderWidth: 1,
                borderColor: isDesktop ? colors.outlineVariant : colors.borderSubtle,
                overflow: 'hidden',
                minWidth: '100%',
              }}
            >
              {/* Header */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderBottomWidth: 1,
                  borderBottomColor: isDesktop ? colors.outlineVariant : colors.borderSubtle,
                  backgroundColor: isDesktop ? colors.surfaceContainerLow : colors.surface,
                }}
              >
                <View style={{ width: 140, paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>
                  <Text style={{ ...typography.captionBold, color: colors.textPrimary }}>Feature</Text>
                </View>
                {plans.map((plan) => (
                  <View
                    key={plan.key}
                    style={{
                      flex: 1,
                      minWidth: 70,
                      paddingHorizontal: spacing.sm,
                      paddingVertical: spacing.md,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        ...typography.captionBold,
                        color: colors.textPrimary,
                        fontSize: 11,
                        textAlign: 'center',
                      }}
                      numberOfLines={2}
                    >
                      {plan.title}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Feature rows */}
              {features.map((feature, idx) => {
                const showDivider = idx !== features.length - 1;
                return (
                  <View key={feature.label}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View
                        style={{
                          width: 140,
                          paddingHorizontal: spacing.lg,
                          paddingVertical: spacing.md,
                        }}
                      >
                        <Text
                          style={{
                            ...typography.body,
                            color: colors.textPrimary,
                            fontSize: 12,
                          }}
                        >
                          {feature.label}
                        </Text>
                      </View>
                      {plans.map((plan) => {
                        const value = feature[plan.key];
                        return (
                          <View
                            key={plan.key}
                            style={{
                              flex: 1,
                              minWidth: 70,
                              paddingHorizontal: spacing.sm,
                              paddingVertical: spacing.md,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {typeof value === 'boolean' ? (
                              value ? (
                                <View
                                  style={{
                                    backgroundColor: '#22C55E',
                                    borderRadius: radii.full,
                                    width: 24,
                                    height: 24,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <MaterialIcons name="check" size={16} color="#FFFFFF" />
                                </View>
                              ) : (
                                <MaterialIcons name="close" size={20} color={colors.destructive} />
                              )
                            ) : (
                              <Text
                                style={{
                                  ...typography.captionSemiBold,
                                  color: colors.textPrimary,
                                  fontSize: 11,
                                  textAlign: 'center',
                                }}
                              >
                                {value}
                              </Text>
                            )}
                          </View>
                        );
                      })}
                    </View>
                    {showDivider ? (
                      <View style={{ height: 1, backgroundColor: isDesktop ? colors.outlineVariant : colors.borderSubtle }} />
                    ) : null}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Bottom CTA */}
        <View style={{ paddingHorizontal: isDesktop ? 0 : spacing.lg, marginTop: spacing.lg, maxWidth: isDesktop ? 720 : undefined, width: '100%', alignSelf: isDesktop ? 'center' : undefined }}>
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
                ...typography.bodyBold,
                color: colors.primaryForeground,
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
        </View>
      </ScrollView>

      {alertState && (
        <ThemedAlert
          visible={alertState.visible}
          title={alertState.title}
          message={alertState.message}
          buttons={[{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }]}
          onDismiss={() => setAlertState(null)}
        />
      )}
    </View>
  );
}
