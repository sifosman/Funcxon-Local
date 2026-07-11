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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { getLatestUserApplicationByType, isBlockingApplicationStatus } from '../lib/applicationService';
import { savePendingSubscriptionCheckout } from '../lib/pendingSubscriptionCheckout';
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
const SIDE_OPACITY = 0.98;
const FAR_OPACITY = 0.95;

type PlanKey = 'get_started' | 'monthly' | '6_month' | '12_month';

type VenuePlan = {
  key: PlanKey;
  _key?: string;
  title: string;
  subtitle: string;
  badge?: string;
  priceNow: string;
  priceWas?: string;
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

type VenueFeature = {
  label: string;
  get_started: string | boolean;
  monthly: string | boolean;
  '6_month': string | boolean;
  '12_month': string | boolean;
};

export default function VenueListingPlansScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { user } = useAuth();
  const isDesktop = useIsDesktop();
  const { setPortfolioType, updateStep4 } = useApplicationForm();

  const [containerWidth, setContainerWidth] = useState(0);

  const { width: SCREEN_WIDTH, CARD_WIDTH, SNAP_INTERVAL } = useMemo(() => {
    const width = containerWidth || Dimensions.get('window').width;
    const CARD_WIDTH = width * 0.36;
    const SNAP_INTERVAL = CARD_WIDTH + CARD_MARGIN * 2;
    return { width, CARD_WIDTH, SNAP_INTERVAL };
  }, [containerWidth]);

  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('monthly');
  const [activeIndex, setActiveIndex] = useState(1);
  const [existingVenueId, setExistingVenueId] = useState<number | null>(null);
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
      .from('venue_listings')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.id) setExistingVenueId(data.id);
      });
  }, [user?.id]);

  const plans: VenuePlan[] = useMemo(
    () => [
      {
        key: 'get_started',
        title: 'Get Started',
        subtitle: '2 months free',
        badge: 'Free',
        priceNow: 'R0',
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
        key: 'monthly',
        title: 'Monthly',
        subtitle: 'Unlock Full Features',
        priceWas: 'R2,499',
        priceNow: 'R1,750',
        saveLabel: 'SAVE 30%',
        outcomes: 'Unlock Full Features',
        theme: {
          background: '#ff6b5d',
          backgroundLight: '#ff8a7d',
          text: '#FFFFFF',
          textMuted: 'rgba(255,255,255,0.85)',
          accent: '#FFFFFF',
          buttonBg: '#FFFFFF',
          buttonText: '#ff6b5d',
          checkColor: '#FFFFFF',
          borderColor: 'rgba(255,255,255,0.3)',
        },
      },
      {
        key: '6_month',
        title: '6-Month',
        subtitle: 'Most popular choice',
        badge: 'Most Popular',
        priceWas: 'R15,000',
        priceNow: 'R9,750',
        saveLabel: 'SAVE 35%',
        outcomes: 'Maximum Exposure',
        theme: {
          background: '#123f5c',
          backgroundLight: '#1a567a',
          text: '#FFFFFF',
          textMuted: 'rgba(255,255,255,0.85)',
          accent: '#FFFFFF',
          buttonBg: '#FFFFFF',
          buttonText: '#123f5c',
          checkColor: '#FFFFFF',
          borderColor: 'rgba(255,255,255,0.3)',
        },
      },
      {
        key: '12_month',
        title: '12-Month',
        subtitle: 'Maximum savings',
        badge: 'Maximum savings',
        priceWas: 'R30,000',
        priceNow: 'R18,000',
        saveLabel: 'SAVE 40%',
        outcomes: 'Maximum Exposure',
        theme: {
          background: '#94064d',
          backgroundLight: '#b3085a',
          text: '#FFFFFF',
          textMuted: 'rgba(255,255,255,0.85)',
          accent: '#FFFFFF',
          buttonBg: '#FFFFFF',
          buttonText: '#94064d',
          checkColor: '#FFFFFF',
          borderColor: 'rgba(255,255,255,0.3)',
        },
      },
    ],
    [],
  );

  const circularPlans = plans;

  const features: VenueFeature[] = useMemo(
    () => [
      { label: 'Photo Uploads', get_started: '10', monthly: '40', '6_month': '40', '12_month': '40' },
      { label: 'Video uploads', get_started: '1', monthly: '4', '6_month': '4', '12_month': '4' },
      { label: 'Catalogue / Pricelist', get_started: 'Limited', monthly: 'Full', '6_month': 'Full', '12_month': 'Full' },
      {
        label: 'Portfolio Build & Manage assistance',
        get_started: true,
        monthly: true,
        '6_month': true,
        '12_month': true,
      },
      { label: 'Full-time helpdesk support', get_started: true, monthly: true, '6_month': true, '12_month': true },
      {
        label: 'Dedicated Funxon Portfolio Manager',
        get_started: false,
        monthly: true,
        '6_month': true,
        '12_month': true,
      },
      { label: 'Analytics & stats', get_started: 'Limited', monthly: 'Full', '6_month': 'Full', '12_month': 'Full' },
      {
        label: 'Online quote requests & updates',
        get_started: true,
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
        monthly: false,
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
      { label: 'Featured Listings', get_started: false, monthly: true, '6_month': true, '12_month': true },
    ],
    [],
  );

  const selected = plans.find((p) => p.key === selectedPlan) ?? plans[0];

  const renderDesktopPlanCard = (plan: VenuePlan) => {
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

          <Text style={{ ...typography.titleMedium, color: plan.theme.text, fontSize: 20, marginBottom: 2 }}>
            {plan.title}
          </Text>
          <Text style={{ ...typography.caption, color: plan.theme.textMuted, marginBottom: spacing.sm, fontSize: 12 }}>
            {plan.subtitle}
          </Text>

          <View style={{ marginBottom: spacing.sm }}>
            {plan.priceWas ? (
              <Text style={{ ...typography.caption, color: plan.theme.textMuted, textDecorationLine: 'line-through', marginBottom: 1, fontSize: 12 }}>
                Was {plan.priceWas}
              </Text>
            ) : null}
            <Text style={{ ...typography.displayLarge, color: plan.theme.text, fontSize: 28 }}>
              {plan.priceNow}
            </Text>
            {plan.saveLabel ? (
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
              backgroundColor: plan.theme.buttonBg,
              borderRadius: radii.md,
              paddingVertical: spacing.sm,
              alignItems: 'center',
              marginTop: 'auto',
            }}
          >
            <Text
              style={{
                ...typography.captionBold,
                color: plan.theme.buttonText,
                fontSize: 12,
              }}
            >
              {plan.key === 'get_started' ? 'Choose Free' : 'Choose'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

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
      : `R${Number((selected.priceNow || '0').replace(/[^0-9.]/g, '')).toLocaleString()}`;

    const billingPeriod = selectedPlan === 'get_started' ? 'monthly' : selectedPlan;
    await setPortfolioType('venues');
    updateStep4({ subscriptionPlan: selectedPlan, billingPeriod });

    const checkoutParams: ProfileStackParamList['SubscriptionCheckout'] = {
      tierName: selected.title,
      billing: billingPeriod,
      priceLabel,
      isFree,
      productType: 'venue',
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

    // Existing venue — go straight to checkout (upgrade/change plan flow)
    if (existingVenueId) {
      navigation.navigate('SubscriptionCheckout', checkoutParams);
      return;
    }

    // New applicant — check for blocking application status before starting application form
    const latestVenueApplication = await getLatestUserApplicationByType('venue');
    if (
      latestVenueApplication.success &&
      latestVenueApplication.data &&
      isBlockingApplicationStatus(latestVenueApplication.data.status)
    ) {
      navigation.navigate('ApplicationStatus');
      return;
    }

    navigation.navigate('Account' as any, { screen: 'ApplicationStep1' });
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDesktop ? colors.surfaceBg : colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }} showsVerticalScrollIndicator={false}>
        <View style={isDesktop ? { maxWidth: 1200, width: '100%', alignSelf: 'center', paddingHorizontal: 48, paddingTop: spacing.xl, paddingBottom: spacing.xl } : undefined}>
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
            Venue Listing Plans
          </Text>
          <Text style={{ ...typography.body, color: isDesktop ? colors.onSurfaceVariant : colors.textMuted, marginBottom: spacing.md, fontSize: isDesktop ? 16 : undefined, lineHeight: isDesktop ? 24 : undefined }}>
            Limited-time launch offer — no hidden fees, zero commissions
          </Text>
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
                      {plan.priceWas ? (
                        <Text
                          style={{
                            ...typography.caption,
                            color: plan.theme.textMuted,
                            textDecorationLine: 'line-through',
                            marginBottom: 1,
                            fontSize: 10,
                          }}
                        >
                          Was {plan.priceWas}
                        </Text>
                      ) : null}
                      <Text
                        style={{
                          ...typography.displayLarge,
                          color: plan.theme.text,
                          fontSize: isActive ? 22 : 16,
                        }}
                      >
                        {plan.priceNow}
                      </Text>
                      {plan.saveLabel ? (
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
                      {features.slice(0, 5).map((feature) => {
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
                        backgroundColor: plan.theme.buttonBg,
                        borderRadius: radii.md,
                        paddingVertical: spacing.sm,
                        alignItems: 'center',
                        marginTop: 'auto',
                      }}
                    >
                      <Text
                        style={{
                          ...typography.captionBold,
                          color: plan.theme.buttonText,
                          fontSize: 11,
                        }}
                      >
                        {plan.key === 'get_started' ? 'Choose Free' : 'Choose'}
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
                : `Continue with ${selected.title}`}
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
