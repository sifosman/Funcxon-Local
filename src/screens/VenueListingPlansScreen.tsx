import { useMemo, useState, useRef } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthContext';
import { getLatestUserApplicationByType, isBlockingApplicationStatus } from '../lib/applicationService';
import { savePendingSubscriptionCheckout } from '../lib/pendingSubscriptionCheckout';
import { colors, spacing, radii, typography } from '../theme';
import type { ProfileStackParamList } from '../navigation/ProfileNavigator';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MARGIN = 4;
const CARD_WIDTH = SCREEN_WIDTH * 0.29;
const SNAP_INTERVAL = CARD_WIDTH + CARD_MARGIN * 2;
const ACTIVE_SCALE = 1.08;
const SIDE_SCALE = 0.78;
const FAR_SCALE = 0.65;
const ACTIVE_OPACITY = 1;
const SIDE_OPACITY = 0.45;
const FAR_OPACITY = 0.25;

type PlanKey = 'get_started' | 'monthly' | '6_month' | '12_month';

type VenuePlan = {
  key: PlanKey;
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
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('monthly');
  const [activeIndex, setActiveIndex] = useState(1);
  const scrollRef = useRef<ScrollView>(null);

  const plans: VenuePlan[] = useMemo(
    () => [
      {
        key: 'get_started',
        title: 'Get Started',
        subtitle: 'Perfect for trying us out',
        badge: 'Free',
        priceNow: 'R0',
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
        key: 'monthly',
        title: 'Monthly',
        subtitle: 'Flexible monthly billing',
        priceWas: 'R1,999',
        priceNow: 'R1,499',
        outcomes: 'Maximum Exposure',
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
        key: '6_month',
        title: '6-Month',
        subtitle: 'Most popular choice',
        badge: 'Best Value',
        priceWas: 'R11,994',
        priceNow: 'R9,995',
        saveLabel: 'Save R1,999',
        outcomes: 'Maximum Exposure',
        theme: {
          background: '#3A5F5E',
          backgroundLight: '#4D7574',
          text: '#FFFFFF',
          textMuted: 'rgba(255,255,255,0.75)',
          accent: '#FFD700',
          buttonBg: '#FFD700',
          buttonText: '#2B3840',
          checkColor: '#FFD700',
          borderColor: 'rgba(255,255,255,0.2)',
        },
      },
      {
        key: '12_month',
        title: '12-Month',
        subtitle: 'Maximum savings',
        badge: 'Super Saver',
        priceWas: 'R23,988',
        priceNow: 'R19,990',
        saveLabel: 'Save R3,998',
        outcomes: 'Maximum Exposure',
        theme: {
          background: '#2B3840',
          backgroundLight: '#3D4F58',
          text: '#FFFFFF',
          textMuted: 'rgba(255,255,255,0.75)',
          accent: '#9DCFDB',
          buttonBg: '#9DCFDB',
          buttonText: '#2B3840',
          checkColor: '#9DCFDB',
          borderColor: 'rgba(255,255,255,0.2)',
        },
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

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SNAP_INTERVAL);
    if (index >= 0 && index < plans.length) {
      setActiveIndex(index);
      setSelectedPlan(plans[index].key);
    }
  };

  const scrollToIndex = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * SNAP_INTERVAL, animated: true });
    setActiveIndex(index);
    setSelectedPlan(plans[index].key);
  };

  const renderFeatureValue = (value: string | boolean, theme: VenuePlan['theme']) => {
    if (typeof value === 'boolean') {
      return (
        <MaterialIcons
          name={value ? 'check-circle' : 'cancel'}
          size={16}
          color={value ? theme.checkColor : theme.textMuted}
        />
      );
    }
    return (
      <Text style={{ ...typography.caption, color: theme.text, fontWeight: '600' }}>{value}</Text>
    );
  };

  const handleContinueToCheckout = async () => {
    const latestVenueApplication = await getLatestUserApplicationByType('venue');
    if (
      latestVenueApplication.success &&
      latestVenueApplication.data &&
      isBlockingApplicationStatus(latestVenueApplication.data.status)
    ) {
      navigation.navigate('ApplicationStatus');
      return;
    }

    const isFree = selectedPlan === 'get_started';

    const priceLabel = isFree
      ? 'Free'
      : `R${Number((selected.priceNow || '0').replace(/[^0-9.]/g, '')).toLocaleString()}`;

    const checkoutParams: ProfileStackParamList['SubscriptionCheckout'] = {
      tierName: selected.title,
      billing: selectedPlan === 'monthly' ? 'monthly' : selectedPlan === 'get_started' ? 'monthly' : selectedPlan,
      priceLabel,
      isFree,
      productType: 'venue',
      planKey: selectedPlan,
    };

    if (!user) {
      savePendingSubscriptionCheckout(checkoutParams)
        .then(() => {
          const rootNav = navigation.getParent()?.getParent() as any;
          rootNav?.navigate?.('Auth', { screen: 'SignIn' });
        })
        .catch(() => {
          Alert.alert('Login required', 'Please log in to continue with this subscription plan.');
        });
      return;
    }

    navigation.navigate('SubscriptionCheckout', {
      ...checkoutParams,
    });
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
            Venue Listing Plans
          </Text>
          <Text style={{ ...typography.body, color: colors.textMuted, marginBottom: spacing.md }}>
            Limited-time launch offer — no hidden fees, zero commissions
          </Text>
        </View>

        {/* Horizontal Swipeable Cards */}
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
          {plans.map((plan, index) => {
            const isActive = index === activeIndex;
            const distance = Math.abs(index - activeIndex);
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
            return (
              <TouchableOpacity
                key={plan.key}
                activeOpacity={0.9}
                onPress={() => scrollToIndex(index)}
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
                      fontSize: isActive ? 28 : 20,
                    }}
                  >
                    {plan.priceNow}
                  </Text>
                  {plan.saveLabel ? (
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
                    scrollToIndex(index);
                    setTimeout(handleContinueToCheckout, 300);
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
                      ...typography.caption,
                      color: plan.theme.buttonText,
                      fontWeight: '700',
                      fontSize: 11,
                    }}
                  >
                    {plan.key === 'get_started' ? 'Choose Free' : 'Choose'}
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

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
                    <View style={{ width: 40, alignItems: 'flex-end' }}>
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
                  {showDivider ? (
                    <View style={{ height: 1, backgroundColor: colors.borderSubtle }} />
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>

        {/* Bottom CTA */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
          <TouchableOpacity
            onPress={handleContinueToCheckout}
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
      </ScrollView>
    </View>
  );
}
