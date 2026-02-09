import { useMemo, useState } from 'react';
import { Alert, Image, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as WebBrowser from 'expo-web-browser';
import { colors, radii, spacing, typography } from '../theme';
import type { ProfileStackParamList } from '../navigation/ProfileNavigator';
import { useApplicationForm } from '../context/ApplicationFormContext';
import { buildPayFastPaymentData, getPayFastCheckoutUrl } from '../config/payfast';
import { supabase } from '../lib/supabaseClient';

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
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  error?: string;
}) => (
  <View style={{ marginBottom: spacing.md }}>
    <Text style={{ ...typography.caption, color: error ? '#EF4444' : colors.textSecondary, marginBottom: spacing.xs }}>
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
        borderColor: error ? '#EF4444' : colors.borderSubtle,
        backgroundColor: colors.surface,
        borderRadius: radii.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        color: colors.textPrimary,
      }}
    />
    {error && (
      <Text style={{ ...typography.caption, color: '#EF4444', marginTop: spacing.xs }}>{error}</Text>
    )}
  </View>
);

type RouteParams = {
  tierName: string;
  billing: 'monthly' | 'yearly';
  priceLabel: string;
  isFree: boolean;
};

export default function SubscriptionCheckoutScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const route = useRoute();
  const { updateStep4 } = useApplicationForm();

  const { tierName, billing, priceLabel, isFree } = (route.params ?? {}) as RouteParams;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
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

  const summary = useMemo(() => {
    const planLabel = (tierName || '').toUpperCase();
    const periodLabel = billing === 'yearly' ? 'Yearly' : 'Monthly';
    return { planLabel, periodLabel };
  }, [tierName, billing]);

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
        if (!value.trim()) return 'Phone number is required';
        if (value.trim().length < 10) return 'Phone number must be at least 10 digits';
        break;
      case 'province':
        if (!value) return 'Please select a province';
        break;
    }
    return '';
  };

  const validateAll = () => {
    const newErrors: Record<string, string> = {};
    const fields = ['fullName', 'email', 'phone'] as const;
    
    fields.forEach((field) => {
      const value = { fullName, email, phone }[field];
      const error = validateField(field, value);
      if (error) newErrors[field] = error;
    });

    if (!termsAccepted) {
      newErrors.terms = 'Please accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    // Mark all required fields as touched
    setTouched({ fullName: true, email: true, phone: true, terms: true });
    
    if (!validateAll()) {
      // Scroll to top to show errors
      return;
    }

    console.log('Validation passed, updating step 4');
    updateStep4({ subscriptionPlan: tierName.toLowerCase() });

    if (isFree) {
      console.log('Free plan selected, navigating to VendorSignupSuccess');
      navigation.navigate('VendorSignupSuccess', {
        email: email.trim(),
        fullName: fullName.trim(),
        tierName: tierName,
      });
      return;
    }

    const priceNum = parseFloat((priceLabel || '0').replace(/[^0-9.]/g, ''));
    if (!priceNum || isNaN(priceNum)) {
      Alert.alert('Invalid price', 'Could not determine the plan price.');
      return;
    }

    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const paymentData = buildPayFastPaymentData({
      amount: priceNum,
      itemName: `Funcxon ${tierName} Plan (${billing})`,
      itemDescription: `${tierName} subscription - billed ${billing}`,
      firstName,
      lastName,
      email: email.trim(),
      phone: phone.trim(),
      subscriptionType: '1',
      frequency: billing === 'yearly' ? '6' : '3',
      recurringAmount: priceNum,
      cycles: 0,
      returnUrl: 'https://funcxon.com/payment/success',
      cancelUrl: 'https://funcxon.com/payment/cancel',
      notifyUrl: 'https://funcxon.com/api/payfast/notify',
    });

    const checkoutUrl = getPayFastCheckoutUrl(paymentData);

    try {
      await WebBrowser.openBrowserAsync(checkoutUrl);
      // After returning from PayFast, send welcome email and proceed to application
      await sendWelcomeEmail();
      navigation.navigate('ApplicationStep1');
    } catch (err) {
      Alert.alert('Payment Error', 'Could not open PayFast checkout. Please try again.');
    }
  };

  const sendWelcomeEmail = async () => {
    try {
      // Call the Supabase Edge Function to send welcome email
      const { data, error } = await supabase.functions.invoke('send-vendor-welcome-email', {
        body: {
          email: email.trim(),
          fullName: fullName.trim(),
          businessName: businessName.trim() || undefined,
          tierName: tierName,
          applicationUrl: 'https://funcxon.com/vendor-application',
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }} keyboardShouldPersistTaps="handled">
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.lg }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}>
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
            <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.sm }}>Order Summary</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }}>
              <Text style={{ ...typography.body, color: colors.textMuted }}>Plan</Text>
              <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>{summary.planLabel}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }}>
              <Text style={{ ...typography.body, color: colors.textMuted }}>Billing</Text>
              <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>{summary.periodLabel}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ ...typography.body, color: colors.textMuted }}>Total</Text>
              <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '700' }}>{priceLabel}</Text>
            </View>
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
            <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>Contact Details</Text>
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
            />
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
            />
            <Field
              label="Phone *"
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                if (touched.phone) {
                  setErrors((prev) => ({ ...prev, phone: validateField('phone', text) }));
                }
              }}
              placeholder="+27"
              keyboardType="phone-pad"
              error={touched.phone ? errors.phone : undefined}
            />
            <Field label="Business Name" value={businessName} onChangeText={setBusinessName} placeholder="Your business" />
            <Field label="VAT Number" value={vatNumber} onChangeText={setVatNumber} placeholder="Optional" />
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
            <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>Billing Address</Text>
            <Field label="Address Line 1" value={addressLine1} onChangeText={setAddressLine1} placeholder="Street address" />
            <Field label="Address Line 2" value={addressLine2} onChangeText={setAddressLine2} placeholder="Unit / Complex" />
            <Field label="City" value={city} onChangeText={setCity} placeholder="City" />
            <View style={{ marginBottom: spacing.md }}>
              <Text style={{ ...typography.caption, color: touched.province && errors.province ? '#EF4444' : colors.textSecondary, marginBottom: spacing.xs }}>
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
            <Field label="Postal Code" value={postalCode} onChangeText={setPostalCode} placeholder="Postal code" keyboardType="numeric" />
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
            <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>Payment Method</Text>
            <View
              style={{
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                borderRadius: radii.md,
                padding: spacing.md,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: spacing.md,
                  }}
                >
                  <Image
                    source={{ uri: 'https://www.payfast.co.za/wp-content/uploads/2020/05/payfast-logo.png' }}
                    style={{ width: 28, height: 28, resizeMode: 'contain' }}
                  />
                </View>
                <View>
                  <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>PayFast</Text>
                  <Text style={{ ...typography.caption, color: colors.textMuted }}>Payment integration will be enabled soon</Text>
                </View>
              </View>
              <MaterialIcons name="radio-button-checked" size={20} color={colors.primary} />
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setTermsAccepted(!termsAccepted)}
            activeOpacity={0.9}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                borderWidth: 2,
                borderColor: errors.terms ? '#EF4444' : termsAccepted ? colors.primary : colors.borderSubtle,
                backgroundColor: termsAccepted ? colors.primary : colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: spacing.sm,
              }}
            >
              {termsAccepted && <MaterialIcons name="check" size={14} color={colors.primaryForeground} />}
            </View>
            <Text style={{ ...typography.caption, color: errors.terms ? '#EF4444' : colors.textPrimary, flex: 1 }}>
              I agree to the{' '}
              <Text
                style={{ color: colors.primaryTeal, fontWeight: '600', textDecorationLine: 'underline' }}
                onPress={() => navigation.navigate('LegalDocument', { documentId: 'terms-and-conditions' })}
              >
                Terms and Conditions
              </Text>
              {' '}and{' '}
              <Text
                style={{ color: colors.primaryTeal, fontWeight: '600', textDecorationLine: 'underline' }}
                onPress={() => navigation.navigate('LegalDocument', { documentId: 'privacy-policy' })}
              >
                Privacy Policy
              </Text>
              {' '}and confirm my details are correct.
            </Text>
          </TouchableOpacity>
          {errors.terms && (
            <Text style={{ ...typography.caption, color: '#EF4444', marginTop: -spacing.md, marginBottom: spacing.md }}>
              {errors.terms}
            </Text>
          )}

          <TouchableOpacity
            onPress={handleContinue}
            activeOpacity={0.9}
            style={{
              backgroundColor: colors.primary,
              borderRadius: radii.lg,
              paddingVertical: spacing.md,
              alignItems: 'center',
              marginBottom: spacing.xl,
            }}
          >
            <Text style={{ ...typography.body, color: colors.primaryForeground, fontWeight: '700' }}>
              {isFree ? 'Confirm Free Plan & Continue' : 'Proceed to PayFast'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
