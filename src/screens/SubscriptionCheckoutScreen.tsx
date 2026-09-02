import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as WebBrowser from 'expo-web-browser';
import { colors, radii, spacing, typography } from '../theme';
import type { ProfileStackParamList } from '../navigation/ProfileNavigator';
import { useApplicationForm } from '../context/ApplicationFormContext';
import { buildPayFastPaymentData, getPayFastCheckoutUrl, payfastConfig } from '../config/payfast';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';
import ThemedAlert from '../components/ThemedAlert';
import { useIsDesktop } from '../hooks/useIsDesktop';
import { getApprovedUserApplicationByType, getLatestUserApplicationByType } from '../lib/applicationService';
import { normalizePhone } from '../lib/phone';

const payfastLogo = require('../../assets/payfast.webp');

const SOUTH_AFRICAN_PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape',
  'Western Cape',
];

const normalizePayFastPhone = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return { normalized: '', error: 'Phone number is required' };
  }

  const digits = trimmed.replace(/\D/g, '');
  let normalized = digits;

  if (normalized.startsWith('27') && normalized.length === 11) {
    normalized = `0${normalized.slice(2)}`;
  }

  if (normalized.length !== 10 || !normalized.startsWith('0')) {
    return {
      normalized: '',
      error: 'Enter a valid South African mobile number like 0821234567 or +27821234567',
    };
  }

  if (!/^0[6-8][0-9]{8}$/.test(normalized)) {
    return {
      normalized: '',
      error: 'PayFast requires a valid South African mobile number',
    };
  }

  return { normalized, error: '' };
};

const ProvinceDropdown = ({
  value,
  onSelect,
  error,
}: {
  value: string;
  onSelect: (province: string) => void;
  error?: string;
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        activeOpacity={0.9}
        style={{
          borderWidth: 1,
          borderColor: error ? '#EF4444' : colors.borderSubtle,
          backgroundColor: colors.surface,
          borderRadius: radii.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text style={{ ...typography.body, color: value ? colors.textPrimary : colors.textMuted }}>
          {value || 'Select province'}
        </Text>
        <MaterialIcons name="arrow-drop-down" size={24} color={error ? '#EF4444' : colors.textMuted} />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: spacing.lg,
          }}
          onPress={() => setVisible(false)}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radii.lg,
              width: '100%',
              maxHeight: 400,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: spacing.md,
                borderBottomWidth: 1,
                borderBottomColor: colors.borderSubtle,
              }}
            >
              <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>Select Province</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <MaterialIcons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 320 }}>
              {SOUTH_AFRICAN_PROVINCES.map((province) => (
                <TouchableOpacity
                  key={province}
                  onPress={() => {
                    onSelect(province);
                    setVisible(false);
                  }}
                  style={{
                    padding: spacing.md,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.borderSubtle,
                    backgroundColor: value === province ? colors.surfaceMuted : colors.surface,
                  }}
                >
                  <Text
                    style={{
                      ...typography.body,
                      color: value === province ? colors.primary : colors.textPrimary,
                      fontWeight: value === province ? '600' : '400',
                    }}
                  >
                    {province}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
      {error && (
        <Text style={{ ...typography.caption, color: '#EF4444', marginTop: spacing.xs }}>{error}</Text>
      )}
    </>
  );
};

const Field = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  error,
  isDesktop,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  error?: string;
  isDesktop?: boolean;
}) => (
  <View style={{ marginBottom: spacing.md }}>
    <Text style={{ ...typography.caption, color: error ? '#EF4444' : colors.textSecondary, marginBottom: spacing.xs, fontSize: isDesktop ? 12 : undefined, fontWeight: isDesktop ? '600' : undefined, lineHeight: isDesktop ? 16 : undefined, letterSpacing: isDesktop ? 0.05 : undefined }}>
      {label}
    </Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      keyboardType={keyboardType ?? 'default'}
      style={{
        borderWidth: 1,
        borderColor: error ? '#EF4444' : isDesktop ? colors.outlineVariant : colors.borderSubtle,
        backgroundColor: isDesktop ? colors.surfaceContainerLowest : colors.surface,
        borderRadius: radii.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        color: colors.textPrimary,
        fontSize: isDesktop ? 16 : undefined,
      }}
    />
    {error && (
      <Text style={{ ...typography.caption, color: '#EF4444', marginTop: spacing.xs }}>{error}</Text>
    )}
  </View>
);

const PhoneField = ({
  value,
  onChangeText,
  error,
  isDesktop,
}: {
  value: string;
  onChangeText: (t: string) => void;
  error?: string;
  isDesktop?: boolean;
}) => {
  const suffix = value.startsWith('+27') ? value.slice(3) : value.replace(/^0+/, '');

  const handleChange = (text: string) => {
    let digits = text.replace(/\D/g, '');
    digits = digits.replace(/^0+/, '');
    onChangeText(`+27${digits}`);
  };

  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={{ ...typography.caption, color: error ? '#EF4444' : colors.textSecondary, marginBottom: spacing.xs, fontSize: isDesktop ? 12 : undefined, fontWeight: isDesktop ? '600' : undefined, lineHeight: isDesktop ? 16 : undefined, letterSpacing: isDesktop ? 0.05 : undefined }}>
        Phone *
      </Text>
      <View
        style={{
          flexDirection: 'row',
          borderWidth: 1,
          borderColor: error ? '#EF4444' : isDesktop ? colors.outlineVariant : colors.borderSubtle,
          backgroundColor: isDesktop ? colors.surfaceContainerLowest : colors.surface,
          borderRadius: radii.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          alignItems: 'center',
        }}
      >
        <Text style={{ ...typography.body, color: colors.textMuted, marginRight: spacing.xs, fontSize: isDesktop ? 16 : undefined }}>+27</Text>
        <TextInput
          value={suffix}
          onChangeText={handleChange}
          placeholder="821234567"
          placeholderTextColor={colors.textMuted}
          keyboardType="phone-pad"
          style={{
            flex: 1,
            color: colors.textPrimary,
            paddingVertical: 0,
            fontSize: isDesktop ? 16 : undefined,
          }}
        />
      </View>
      {error && (
        <Text style={{ ...typography.caption, color: '#EF4444', marginTop: spacing.xs }}>{error}</Text>
      )}
    </View>
  );
};

type RouteParams = {
  tierName: string;
  billing: 'monthly' | 'yearly' | '6_month' | '12_month';
  priceLabel: string;
  isFree: boolean;
  productType?: 'vendor' | 'venue';
  planKey?: string;
};

export default function SubscriptionCheckoutScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const route = useRoute();
  const isDesktop = useIsDesktop();
  const { user } = useAuth();
  const { updateStep4, setPortfolioType } = useApplicationForm();
  const [alertState, setAlertState] = useState<{visible: boolean; title: string; message: string; buttons?: any[]} | null>(null);

  const { tierName, billing, priceLabel, isFree, productType, planKey } = (route.params ?? {}) as RouteParams;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+27');
  const [businessName, setBusinessName] = useState('');
  const [vatNumber, setVatNumber] = useState('');

  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const scrollViewRef = useRef<ScrollView>(null);
  const fieldLayouts = useRef<Record<string, number>>({});

  const supabaseBaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://fhlocaqndxawkbztncwo.supabase.co';
  const notifyUrl = `${supabaseBaseUrl}/functions/v1/payfast-itn`;
  // On web, PayFast must redirect back to an actual https page (this web app's own origin),
  // since browsers cannot navigate to the native-only `funxon://` custom URI scheme. On native,
  // we route through the payfast-redirect edge function which 302s to the funxon:// deep link.
  const webOrigin = Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : '';
  const returnUrl = Platform.OS === 'web'
    ? `${webOrigin}/payment/success`
    : `${supabaseBaseUrl}/functions/v1/payfast-redirect?type=success`;
  const cancelUrl = Platform.OS === 'web'
    ? `${webOrigin}/payment/cancel`
    : `${supabaseBaseUrl}/functions/v1/payfast-redirect?type=cancel`;
  // Use the bare origin (not the full success path) as the web redirect target so that both the
  // success AND cancel redirects (different paths) are detected by openAuthSessionAsync's URL match.
  const paymentRedirectTarget = Platform.OS === 'web' ? webOrigin : 'funxon://payment/success';
  const paymentCancelTarget = Platform.OS === 'web' ? cancelUrl : 'funxon://payment/cancel';

  useEffect(() => {
    if (!user?.id) return;

    const applyApplicationData = (application: any) => {
      const details = application?.company_details ?? {};
      const coverageProvinces = application?.coverage_provinces ?? [];
      const coverageCities = application?.coverage_cities ?? [];

      if (details.ownersName?.trim()) setFullName(details.ownersName.trim());
      if (details.email?.trim()) setEmail(details.email.trim());
      else if (details.userEmail?.trim()) setEmail(details.userEmail.trim());
      if (details.contactPhoneNumber?.trim()) setPhone(normalizePhone(details.contactPhoneNumber.trim()));
      else if (details.userWhatsapp?.trim()) setPhone(normalizePhone(details.userWhatsapp.trim()));
      if (details.tradingName?.trim()) setBusinessName(details.tradingName.trim());
      else if (details.registeredBusinessName?.trim()) setBusinessName(details.registeredBusinessName.trim());
      if (details.vatNumber?.trim()) setVatNumber(details.vatNumber.trim());
      if (details.billingAddress?.trim()) setAddressLine1(details.billingAddress.trim());
      else if (details.businessPhysicalAddress?.trim()) setAddressLine1(details.businessPhysicalAddress.trim());
      if (coverageCities[0]?.trim()) setCity(coverageCities[0].trim());
      if (coverageProvinces[0]?.trim()) setProvince(coverageProvinces[0].trim());
    };

    const loadUserFallback = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const { data: userRow } = await supabase
        .from('users')
        .select('full_name, email, phone, business_name, vat_number, address_line1, address_line2, city, province, postal_code')
        .eq('auth_user_id', auth?.user?.id ?? user.id)
        .maybeSingle();
      if (!userRow) return;
      const row = userRow as any;
      if (row.full_name) setFullName(row.full_name);
      if (row.email) setEmail(row.email);
      if (row.phone) setPhone(normalizePhone(row.phone));
      if (row.business_name) setBusinessName(row.business_name);
      if (row.vat_number) setVatNumber(row.vat_number);
      if (row.address_line1) setAddressLine1(row.address_line1);
      if (row.address_line2) setAddressLine2(row.address_line2);
      if (row.city) setCity(row.city);
      if (row.province) setProvince(row.province);
      if (row.postal_code) setPostalCode(row.postal_code);
    };

    const loadBillingDetails = async () => {
      const portfolioType = productType === 'venue' ? 'venue' : 'vendor';
      const approved = await getApprovedUserApplicationByType(portfolioType);
      if (approved.success && approved.data) {
        applyApplicationData(approved.data);
        return;
      }
      const latest = await getLatestUserApplicationByType(portfolioType);
      if (latest.success && latest.data) {
        applyApplicationData(latest.data);
        return;
      }
      await loadUserFallback();
    };

    loadBillingDetails();
  }, [user?.id, productType]);

  const populatePortfolioFromApplication = async (portfolioType: 'venue' | 'vendor') => {
    if (!user?.id) return;
    const { data: application } = await getLatestUserApplicationByType(portfolioType);
    if (!application) return;

    const details = (application.company_details ?? {}) as any;
    const serviceCategories = (application.service_categories ?? {}) as any;
    const listingName =
      details.tradingName?.trim() ||
      details.registeredBusinessName?.trim() ||
      (portfolioType === 'venue' ? 'Venue Listing' : 'Vendor Listing');

    if (portfolioType === 'venue') {
      const parseCapacityNumber = (value: string): number | null => {
        const numbers = (value ?? '').match(/\d[\d,]*/g);
        if (!numbers || numbers.length === 0) return null;
        const last = numbers[numbers.length - 1];
        const parsed = parseInt(last.replace(/,/g, ''), 10);
        return Number.isFinite(parsed) ? parsed : null;
      };
      const halls = (serviceCategories.halls ?? [])
        .map((h: any) => ({
          name: (h?.name ?? '').trim(),
          capacity: (h?.capacity ?? '').trim(),
        }))
        // Only persist halls that actually have a name or capacity,
        // so empty placeholder rows don't clobber real data.
        .filter((h: any) => h.name !== '' || h.capacity !== '');
      const hallCapacities = halls
        .map((h: any) => parseCapacityNumber(h.capacity))
        .filter((n: any): n is number => typeof n === 'number' && Number.isFinite(n));
      const maxHallCapacity = hallCapacities.length ? Math.max(...hallCapacities) : null;

      const { data: existing } = await supabase
        .from('venue_listings')
        .select('features')
        .eq('user_id', user.id)
        .maybeSingle();
      const existingFeatures = (existing as any)?.features ?? {};
      const nextFeatures = {
        ...(existingFeatures ?? {}),
        halls,
        maxHallCapacity,
        venueTypes: serviceCategories.venueType,
      };

      await supabase.from('venue_listings').upsert(
        {
          user_id: user.id,
          name: listingName,
          description: application.business_description?.trim() || null,
          location: details.businessPhysicalAddress?.trim() || null,
          address_line_1: details.businessPhysicalAddress?.trim() || null,
          city: application.coverage_cities?.[0] || null,
          province: application.coverage_provinces?.[0] || null,
          country: 'South Africa',
          contact_email: details.email?.trim() || details.userEmail?.trim() || null,
          whatsapp_number: details.userWhatsapp?.trim() || details.contactPhoneNumber?.trim() || null,
          instagram_url: details.instagram?.trim() || null,
          facebook_url: details.facebook?.trim() || null,
          tiktok_url: details.tiktok?.trim() || null,
          venue_type: (serviceCategories.venueType ?? []).join(', ') || null,
          venue_capacity: serviceCategories.venueCapacity ?? null,
          amenities: serviceCategories.amenities,
          event_types: serviceCategories.eventTypes,
          provinces: application.coverage_provinces,
          cities: application.coverage_cities,
          features: nextFeatures,
          image_url: application.portfolio_images?.[0] || null,
          subscription_plan: application.subscription_tier,
          subscription_status: 'active',
        } as any,
        { onConflict: 'user_id' },
      );

      await supabase.from('venues').upsert(
        {
          user_id: user.id,
          name: listingName,
          description: application.business_description?.trim() || null,
          location: details.businessPhysicalAddress?.trim() || null,
          subscription_plan_key: application.subscription_tier,
          subscription_status: 'active',
          billing_period: billing || 'monthly',
          billing_email: details.email?.trim() || null,
          billing_name: details.ownersName?.trim() || null,
          billing_phone: details.contactPhoneNumber?.trim() || null,
          subscription_started_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );
    } else {
      const vendorPayload = {
        user_id: user.id,
        name: listingName,
        description: application.business_description?.trim() || null,
        location: details.businessPhysicalAddress?.trim() || null,
        address_line_1: details.businessPhysicalAddress?.trim() || null,
        city: application.coverage_cities?.[0] || null,
        province: application.coverage_provinces?.[0] || null,
        email: details.email?.trim() || details.userEmail?.trim() || null,
        whatsapp_number: details.contactPhoneNumber?.trim() || null,
        instagram_url: details.instagram?.trim() || null,
        facebook_url: details.facebook?.trim() || null,
        tiktok_url: details.tiktok?.trim() || null,
        image_url: application.portfolio_images?.[0] || null,
        subscription_tier: normalizeVendorTierKey(application.subscription_tier ?? tierName),
        subscription_status: 'active',
        billing_period: billing || 'monthly',
        billing_email: details.email?.trim() || null,
        billing_name: details.ownersName?.trim() || null,
        billing_phone: details.contactPhoneNumber?.trim() || null,
        subscription_started_at: new Date().toISOString(),
        service_options: serviceCategories.serviceCategories ?? [],
        vendor_tags: serviceCategories.serviceSubcategories ?? [],
        amenities: serviceCategories.amenities ?? [],
        accepted_payment_methods: serviceCategories.paymentMethods ?? [],
      };

      const { data: existingVendor } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      const vendorId = existingVendor?.id ?? null;

      if (vendorId) {
        await supabase.from('vendors').update(vendorPayload).eq('id', vendorId);
      } else {
        await supabase.from('vendors').insert(vendorPayload);
      }
    }
  };

  const summary = useMemo(() => {
    const planLabel = (tierName || '').toUpperCase();
    const periodLabel =
      billing === 'yearly'
        ? 'Yearly'
        : billing === '6_month'
          ? '6-Month'
          : billing === '12_month'
            ? '12-Month'
            : 'Monthly';
    return { planLabel, periodLabel };
  }, [tierName, billing]);

  const normalizeVendorTierKey = (rawTierName: string): string => {
    const t = (rawTierName ?? '').trim().toLowerCase();
    if (t === 'get started' || t === 'get_started' || t === 'free') return 'get_started';
    if (t === 'premium plus' || t === 'premium_plus' || t === 'premiumplus') return 'premium_plus';
    if (t === 'premium') return 'premium';
    return t.replace(/\s+/g, '_');
  };

  const validateField = (field: string, value: string) => {
    switch (field) {
      case 'fullName':
        if (!value.trim()) return 'Full name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        break;
      case 'email':
        if (!value.trim()) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value.trim())) return 'Please enter a valid email address';
        break;
      case 'phone':
        return normalizePayFastPhone(value).error;
        break;
      case 'province':
        if (!value) return 'Please select a province';
        break;
    }
    return '';
  };

  const validateAll = () => {
    const newErrors: Record<string, string> = {};
    const fields = ['fullName', 'email', 'phone', 'province'] as const;

    fields.forEach((field) => {
      const value = { fullName, email, phone, province }[field];
      const error = validateField(field, value);
      if (error) newErrors[field] = error;
    });

    if (!termsAccepted) {
      newErrors.terms = 'Please accept the terms and conditions';
    }

    setErrors(newErrors);
    return newErrors;
  };

  const scrollToFirstError = (errorMap: Record<string, string>) => {
    const fieldOrder = ['fullName', 'email', 'phone', 'province', 'terms'];
    for (const field of fieldOrder) {
      if (errorMap[field] && fieldLayouts.current[field] !== undefined) {
        scrollViewRef.current?.scrollTo({
          y: Math.max(0, fieldLayouts.current[field] - 20),
          animated: true,
        });
        return;
      }
    }
  };

  const handleContinue = async () => {
    const newErrors = validateAll();

    if (Object.keys(newErrors).length > 0) {
      setTouched({ fullName: true, email: true, phone: true, province: true, terms: true });
      scrollToFirstError(newErrors);
      return;
    }

    const normalizedPhone = normalizePayFastPhone(phone).normalized;
    if (!normalizedPhone) {
      setErrors((prev) => ({ ...prev, phone: validateField('phone', phone) }));
      return;
    }

    const { data: auth } = await supabase.auth.getUser();
    const authUserId = auth?.user?.id;
    if (authUserId) {
      await supabase.from('users').update({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: normalizedPhone,
        business_name: businessName.trim() || null,
        vat_number: vatNumber.trim() || null,
        address_line1: addressLine1.trim() || null,
        address_line2: addressLine2.trim() || null,
        city: city.trim() || null,
        province: province || null,
        postal_code: postalCode.trim() || null,
      }).eq('auth_user_id', authUserId);
    }

    console.log('Validation passed, updating step 4');
    const normalizedVendorTier = normalizeVendorTierKey(tierName);
    updateStep4({ subscriptionPlan: normalizedVendorTier });

    if (isFree) {
      if (productType === 'venue' && authUserId) {
        const { error: upsertErr } = await supabase
          .from('venues')
          .upsert(
            {
              user_id: authUserId,
              subscription_plan_key: planKey || 'get_started',
              subscription_status: 'active',
              billing_period: 'monthly',
              billing_email: email.trim(),
              billing_name: fullName.trim(),
              billing_phone: normalizedPhone,
              subscription_started_at: new Date().toISOString(),
              features: { featured: false },
            },
            { onConflict: 'user_id' },
          );

        if (upsertErr) {
          console.error('Failed to upsert venue (free plan):', upsertErr);
        }
      }

      if (productType !== 'venue' && authUserId) {
        const { error: upsertErr } = await supabase
          .from('vendors')
          .upsert(
            {
              user_id: authUserId,
              subscription_tier: normalizedVendorTier,
              subscription_status: 'active',
              billing_period: 'monthly',
              email: email.trim(),
              billing_email: email.trim(),
              billing_name: fullName.trim(),
              billing_phone: normalizedPhone,
              subscription_started_at: new Date().toISOString(),
              featured_listing: false,
            },
            { onConflict: 'user_id' },
          );

        if (upsertErr) {
          console.error('Failed to upsert vendor (free plan):', upsertErr);
        }
      }

      console.log('Free plan selected, navigating to VendorSignupSuccess');
      navigation.navigate('VendorSignupSuccess', {
        email: email.trim(),
        fullName: fullName.trim(),
        businessName: businessName.trim() || undefined,
        tierName: tierName,
        productType: productType || 'vendor',
      });
      return;
    }

    const priceNum = parseFloat((priceLabel || '0').replace(/[^0-9.]/g, ''));
    if (!priceNum || isNaN(priceNum)) {
      setAlertState({ visible: true, title: 'Invalid price', message: 'Could not determine the plan price.' });
      return;
    }

    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const payfastPaymentId = `pf_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    const paymentData = buildPayFastPaymentData({
      amount: priceNum,
      paymentId: payfastPaymentId,
      itemName: `${productType === 'venue' ? 'Funxon Venue' : 'Funxon'} ${tierName} Plan (${billing})`,
      itemDescription: `${productType === 'venue' ? 'Venue' : 'Vendor'} subscription - billed ${billing}`,
      firstName,
      lastName,
      email: email.trim(),
      phone: normalizedPhone,
      subscriptionType: billing === '6_month' || billing === '12_month' ? '2' : '1',
      frequency: billing === 'yearly' ? '6' : '3',
      recurringAmount: billing === '6_month' || billing === '12_month' ? undefined : priceNum,
      cycles: billing === '6_month' || billing === '12_month' ? undefined : 0,
      returnUrl,
      cancelUrl,
      notifyUrl,
    });

    if (productType === 'venue' && authUserId) {
      const billingPeriodToStore = billing === 'yearly' ? '12_month' : billing;
      const { error: upsertErr } = await supabase
        .from('venues')
        .upsert(
          {
            user_id: authUserId,
            subscription_plan_key: planKey || 'monthly',
            subscription_status: 'inactive',
            billing_period: billingPeriodToStore,
            pending_payment_id: payfastPaymentId,
            billing_email: email.trim(),
            billing_name: fullName.trim(),
            billing_phone: normalizedPhone,
          },
          { onConflict: 'user_id' },
        );

      if (upsertErr) {
        console.error('Failed to upsert venue (paid plan pre-record):', upsertErr);
      }
    }

    if (productType !== 'venue' && authUserId) {
      const billingPeriodToStore = billing === 'yearly' ? 'yearly' : billing;
      const { error: upsertErr } = await supabase
        .from('vendors')
        .upsert(
          {
            user_id: authUserId,
            subscription_tier: normalizedVendorTier,
            subscription_status: 'inactive',
            billing_period: billingPeriodToStore,
            pending_payment_id: payfastPaymentId,
            email: email.trim(),
            billing_email: email.trim(),
            billing_name: fullName.trim(),
            billing_phone: normalizedPhone,
          },
          { onConflict: 'user_id' },
        );

      if (upsertErr) {
        console.error('Failed to upsert vendor (paid plan pre-record):', upsertErr);
      }
    }

    const checkoutUrl = getPayFastCheckoutUrl(paymentData);

    try {
      const result = await WebBrowser.openAuthSessionAsync(checkoutUrl, paymentRedirectTarget);
      if (result.type === 'cancel' || result.type === 'dismiss') {
        return;
      }
      if (result.type === 'success' && result.url?.startsWith(paymentCancelTarget)) {
        return;
      }
      // Treat success (or unknown) as completed payment and proceed
      await sendWelcomeEmail();

      // Set portfolio type based on productType before navigating
      const portfolioType = productType === 'venue' ? 'venues' : 'vendors';
      console.log('SubscriptionCheckoutScreen - Setting portfolio type to:', portfolioType);
      await setPortfolioType(portfolioType);

      // Populate vendor/venue record with application data so portfolio is not empty
      const portfolioTypeForPopulate = productType === 'venue' ? 'venue' : 'vendor';
      await populatePortfolioFromApplication(portfolioTypeForPopulate);

      console.log('SubscriptionCheckoutScreen - Navigating to portfolio management');

      const nextRoute = productType === 'venue' ? 'UpdateVenuePortfolio' : 'UpdateVendorPortfolio';
      navigation.reset({
        index: 0,
        routes: [{ name: nextRoute }],
      });
    } catch (err) {
      setAlertState({ visible: true, title: 'Payment Error', message: 'Could not open PayFast checkout. Please try again.' });
    }
  };

  const sendWelcomeEmail = async () => {
    try {
      const isVenue = productType === 'venue';
      const functionName = isVenue ? 'send-venue-welcome-email' : 'send-vendor-welcome-email';
      const catalogueUrl = isVenue ? 'https://funxon.co.za/venue-catalogue' : 'https://funxon.co.za/vendor-catalogue';
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {
          email: email.trim(),
          fullName: fullName.trim(),
          businessName: businessName.trim() || undefined,
          tierName: tierName,
          applicationUrl: isVenue ? 'https://funxon.co.za/venue-application' : 'https://funxon.co.za/vendor-application',
          catalogueUrl,
        },
      });

      if (error) {
        console.error('Error sending welcome email:', error);
        return;
      }

      console.log('Welcome email sent successfully:', data);
      
      // Send admin notification about new subscription
      await sendAdminNotification();
    } catch (err) {
      console.error('Failed to send welcome email:', err);
    }
  };

  const sendAdminNotification = async () => {
    try {
      const priceNum = parseFloat((priceLabel || '0').replace(/[^0-9.]/g, ''));
      
      const { data, error } = await supabase.functions.invoke('send-admin-notification', {
        body: {
          type: 'vendor-subscription-purchased',
          vendorName: fullName.trim(),
          vendorEmail: email.trim(),
          businessName: businessName.trim() || undefined,
          tierName: tierName,
          amount: priceNum,
          portfolioType: productType || 'vendor',
        },
      });

      if (error) {
        console.error('Error sending admin notification:', error);
        return;
      }

      console.log('Admin notification sent successfully:', data);
    } catch (err) {
      console.error('Failed to send admin notification:', err);
    }
  };

  const cardStyle = (isDesktop?: boolean) => ({
    backgroundColor: isDesktop ? colors.surfaceContainerLowest : colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: isDesktop ? colors.outlineVariant : colors.borderSubtle,
    marginBottom: isDesktop ? 0 : spacing.lg,
  });

  const sectionTitleStyle = (isDesktop?: boolean) => ({
    ...typography.titleMedium,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    fontSize: isDesktop ? 24 : undefined,
  });

  const renderOrderSummary = (isDesktop?: boolean) => (
    <View style={cardStyle(isDesktop)}>
      <Text style={sectionTitleStyle(isDesktop)}>Order Summary</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }}>
        <Text style={{ ...typography.body, color: colors.textMuted, fontSize: isDesktop ? 16 : undefined }}>Plan</Text>
        <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary, fontSize: isDesktop ? 16 : undefined }}>{summary.planLabel}</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }}>
        <Text style={{ ...typography.body, color: colors.textMuted, fontSize: isDesktop ? 16 : undefined }}>Billing</Text>
        <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary, fontSize: isDesktop ? 16 : undefined }}>{summary.periodLabel}</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ ...typography.body, color: colors.textMuted, fontSize: isDesktop ? 16 : undefined }}>Total</Text>
        <Text style={{ ...typography.bodyBold, color: colors.textPrimary, fontSize: isDesktop ? 16 : undefined }}>{priceLabel}</Text>
      </View>
    </View>
  );

  const renderContactDetails = (isDesktop?: boolean) => (
    <View style={cardStyle(isDesktop)}>
      <Text style={sectionTitleStyle(isDesktop)}>Contact Details</Text>
      <View onLayout={(e) => { fieldLayouts.current.fullName = e.nativeEvent.layout.y; }}>
        <Field
          label="Full Name *"
          value={fullName}
          onChangeText={(text) => {
            setFullName(text);
            if (touched.fullName) {
              setErrors((prev) => ({ ...prev, fullName: validateField('fullName', text) }));
            }
          }}
          placeholder="Your name"
          error={touched.fullName ? errors.fullName : undefined}
          isDesktop={isDesktop}
        />
      </View>
      <View onLayout={(e) => { fieldLayouts.current.email = e.nativeEvent.layout.y; }}>
        <Field
          label="Email *"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (touched.email) {
              setErrors((prev) => ({ ...prev, email: validateField('email', text) }));
            }
          }}
          placeholder="you@email.com"
          keyboardType="email-address"
          error={touched.email ? errors.email : undefined}
          isDesktop={isDesktop}
        />
      </View>
      <View onLayout={(e) => { fieldLayouts.current.phone = e.nativeEvent.layout.y; }}>
        <PhoneField
          value={phone}
          onChangeText={(text) => {
            setPhone(text);
            if (touched.phone) {
              setErrors((prev) => ({ ...prev, phone: validateField('phone', text) }));
            }
          }}
          error={touched.phone ? errors.phone : undefined}
          isDesktop={isDesktop}
        />
      </View>
      <Field label="Business Name" value={businessName} onChangeText={setBusinessName} placeholder="Your business" isDesktop={isDesktop} />
      <Field label="VAT Number" value={vatNumber} onChangeText={setVatNumber} placeholder="Optional" isDesktop={isDesktop} />
    </View>
  );

  const renderBillingAddress = (isDesktop?: boolean) => (
    <View style={cardStyle(isDesktop)}>
      <Text style={sectionTitleStyle(isDesktop)}>Billing Address</Text>
      <Field label="Address Line 1" value={addressLine1} onChangeText={setAddressLine1} placeholder="Street address" isDesktop={isDesktop} />
      <Field label="Address Line 2" value={addressLine2} onChangeText={setAddressLine2} placeholder="Unit / Complex" isDesktop={isDesktop} />
      <Field label="City" value={city} onChangeText={setCity} placeholder="City" isDesktop={isDesktop} />
      <View style={{ marginBottom: spacing.md }} onLayout={(e) => { fieldLayouts.current.province = e.nativeEvent.layout.y; }}>
        <Text style={{ ...typography.caption, color: touched.province && errors.province ? '#EF4444' : colors.textSecondary, marginBottom: spacing.xs, fontSize: isDesktop ? 12 : undefined, fontWeight: isDesktop ? '600' : undefined, lineHeight: isDesktop ? 16 : undefined, letterSpacing: isDesktop ? 0.05 : undefined }}>
          Province
        </Text>
        <ProvinceDropdown
          value={province}
          onSelect={(value) => {
            setProvince(value);
            if (touched.province) {
              setErrors((prev) => ({ ...prev, province: validateField('province', value) }));
            }
          }}
          error={touched.province ? errors.province : undefined}
        />
      </View>
      <Field label="Postal Code" value={postalCode} onChangeText={setPostalCode} placeholder="Postal code" keyboardType="numeric" isDesktop={isDesktop} />
    </View>
  );

  const renderPaymentMethod = (isDesktop?: boolean) => (
    <View style={cardStyle(isDesktop)}>
      <Text style={sectionTitleStyle(isDesktop)}>Payment Method</Text>
      <View
        style={{
          borderWidth: 1,
          borderColor: isDesktop ? colors.outlineVariant : colors.borderSubtle,
          borderRadius: radii.lg,
          padding: spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: isDesktop ? colors.surfaceContainerLow : colors.backgroundAlt,
        }}
      >
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: 132,
              height: 60,
              borderRadius: radii.md,
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: isDesktop ? colors.outlineVariant : colors.borderSubtle,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: spacing.md,
              paddingHorizontal: spacing.md,
              shadowColor: '#000',
              shadowOpacity: 0.04,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
              elevation: 1,
            }}
          >
            <Image
              source={payfastLogo}
              style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary, fontSize: isDesktop ? 16 : undefined }}>PayFast</Text>
              {payfastConfig.sandbox && (
                <View
                  style={{
                    backgroundColor: '#FEF3C7',
                    borderRadius: radii.full,
                    paddingHorizontal: spacing.sm,
                    paddingVertical: 2,
                    borderWidth: 1,
                    borderColor: '#F59E0B',
                  }}
                >
                  <Text style={{ ...typography.captionSemiBold, color: '#B45309', fontSize: 10 }}>
                    SANDBOX TEST MODE
                  </Text>
                </View>
              )}
            </View>
            <Text style={{ ...typography.caption, color: colors.textMuted, fontSize: isDesktop ? 14 : undefined }}>
              Secure checkout powered by PayFast
            </Text>
          </View>
        </View>
        <MaterialIcons name="radio-button-checked" size={20} color={colors.primary} />
      </View>
    </View>
  );

  const renderTerms = (isDesktop?: boolean) => (
    <>
      <TouchableOpacity
        onPress={() => setTermsAccepted(!termsAccepted)}
        onLayout={(e) => { fieldLayouts.current.terms = e.nativeEvent.layout.y; }}
        activeOpacity={0.9}
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}
      >
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            borderWidth: 2,
            borderColor: errors.terms ? '#EF4444' : termsAccepted ? colors.primary : isDesktop ? colors.outlineVariant : colors.borderSubtle,
            backgroundColor: termsAccepted ? colors.primary : colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: spacing.sm,
          }}
        >
          {termsAccepted && <MaterialIcons name="check" size={14} color={colors.primaryForeground} />}
        </View>
        <Text style={{ ...typography.caption, color: errors.terms ? '#EF4444' : colors.textPrimary, flex: 1, fontSize: isDesktop ? 14 : undefined }}>
          I agree to the{' '}
          <Text
            style={{ ...typography.captionSemiBold, color: colors.textPrimary, textDecorationLine: 'underline', fontSize: isDesktop ? 14 : undefined }}
            onPress={() => navigation.navigate('LegalDocument', { documentId: 'terms-and-conditions' })}
          >
            Terms and Conditions
          </Text>
          {' '}and{' '}
          <Text
            style={{ ...typography.captionSemiBold, color: colors.textPrimary, textDecorationLine: 'underline', fontSize: isDesktop ? 14 : undefined }}
            onPress={() => navigation.navigate('LegalDocument', { documentId: 'privacy-policy' })}
          >
            Privacy Policy
          </Text>
          {' '}and confirm my details are correct.
        </Text>
      </TouchableOpacity>
      {errors.terms && (
        <Text style={{ ...typography.caption, color: '#EF4444', marginTop: -spacing.md, marginBottom: spacing.md, fontSize: isDesktop ? 14 : undefined }}>
          {errors.terms}
        </Text>
      )}
    </>
  );

  const renderCta = (isDesktop?: boolean) => (
    <TouchableOpacity
      onPress={handleContinue}
      activeOpacity={0.9}
      style={{
        backgroundColor: colors.primary,
        borderRadius: radii.lg,
        paddingVertical: spacing.md,
        alignItems: 'center',
        marginBottom: isDesktop ? 0 : spacing.xl,
      }}
    >
      <Text style={{ ...typography.bodyBold, color: colors.primaryForeground, fontSize: isDesktop ? 16 : undefined }}>
        {isFree ? 'Confirm Free Plan & Continue' : 'Proceed to PayFast'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: isDesktop ? colors.surfaceBg : colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? spacing.lg : 0}
    >
      <ScrollView ref={scrollViewRef} contentContainerStyle={isDesktop ? { paddingHorizontal: 48, paddingTop: spacing.xl, paddingBottom: 120, maxWidth: 1200, width: '100%', alignSelf: 'center' } : { paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
        {isDesktop ? (
          <View style={{ flexDirection: 'row', gap: spacing.gutter } as any}>
            <View style={{ flex: 2, gap: spacing.gutter } as any}>
              <View style={{ marginBottom: spacing.md }}>
                <Text style={{ ...typography.headlineSm, color: colors.textPrimary, marginBottom: spacing.xs }}>
                  Checkout
                </Text>
                <Text style={{ ...typography.bodyMd, color: colors.onSurfaceVariant }}>
                  Confirm your plan and enter your billing details
                </Text>
              </View>
              {renderContactDetails(true)}
              {renderBillingAddress(true)}
              {renderPaymentMethod(true)}
              {renderTerms(true)}
              {renderCta(true)}
            </View>
            <View style={{ flex: 1, gap: spacing.gutter } as any}>
              {renderOrderSummary(true)}
            </View>
          </View>
        ) : (
          <>
            <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.lg }}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
                <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>Back</Text>
              </TouchableOpacity>

              <Text style={{ ...typography.displayMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
                Checkout
              </Text>
              <Text style={{ ...typography.body, color: colors.textMuted }}>
                Confirm your plan and enter your billing details
              </Text>
            </View>

            <View style={{ paddingHorizontal: spacing.lg }}>
              {renderOrderSummary(false)}
              {renderContactDetails(false)}
              {renderBillingAddress(false)}
              {renderPaymentMethod(false)}
              {renderTerms(false)}
              {renderCta(false)}
            </View>
          </>
        )}
      </ScrollView>

      {alertState && (
        <ThemedAlert
          visible={alertState.visible}
          title={alertState.title}
          message={alertState.message}
          buttons={alertState.buttons ?? [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }]}
          onDismiss={() => setAlertState(null)}
        />
      )}
    </KeyboardAvoidingView>
  );
}
