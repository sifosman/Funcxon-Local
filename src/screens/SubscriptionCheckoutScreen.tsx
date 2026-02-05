import { useMemo, useState } from 'react';
import { Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radii, spacing, typography } from '../theme';
import type { ProfileStackParamList } from '../navigation/ProfileNavigator';
import { useApplicationForm } from '../context/ApplicationFormContext';

// Field component moved outside to prevent re-renders causing keyboard to close
const Field = ({ label, value, onChangeText, placeholder, keyboardType }: { label: string; value: string; onChangeText: (t: string) => void; placeholder?: string; keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric'; }) => (
  <View style={{ marginBottom: spacing.md }}>
    <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs }}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      keyboardType={keyboardType ?? 'default'}
      style={{
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        backgroundColor: colors.surface,
        borderRadius: radii.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        color: colors.textPrimary,
      }}
    />
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

  const summary = useMemo(() => {
    const planLabel = (tierName || '').toUpperCase();
    const periodLabel = billing === 'yearly' ? 'Yearly' : 'Monthly';
    return { planLabel, periodLabel };
  }, [tierName, billing]);

  const validate = () => {
    if (!tierName) {
      Alert.alert('Missing plan', 'Please go back and select a plan.');
      return false;
    }
    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      Alert.alert('Missing details', 'Please enter your name, email, and phone number.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return false;
    }
    if (!termsAccepted) {
      Alert.alert('Terms required', 'Please accept the terms to continue.');
      return false;
    }
    return true;
  };

  const handleContinue = () => {
    if (!validate()) return;

    updateStep4({ subscriptionPlan: tierName.toLowerCase() });

    if (isFree) {
      Alert.alert(
        'Free Plan Confirmed',
        'Your free plan has been selected. Next, create your vendor profile.',
        [{ text: 'Continue', onPress: () => navigation.navigate('ApplicationStep1') }],
      );
      return;
    }

    Alert.alert(
      'Proceed to PayFast',
      'PayFast checkout will be wired up soon. For now, we will take you to the vendor application wizard.',
      [{ text: 'Continue', onPress: () => navigation.navigate('ApplicationStep1') }],
    );
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
            <Field label="Full Name *" value={fullName} onChangeText={setFullName} placeholder="Your name" />
            <Field label="Email *" value={email} onChangeText={setEmail} placeholder="you@email.com" keyboardType="email-address" />
            <Field label="Phone *" value={phone} onChangeText={setPhone} placeholder="+27" keyboardType="phone-pad" />
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
            <Field label="Province" value={province} onChangeText={setProvince} placeholder="Province" />
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
                borderColor: termsAccepted ? colors.primary : colors.borderSubtle,
                backgroundColor: termsAccepted ? colors.primary : colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: spacing.sm,
              }}
            >
              {termsAccepted && <MaterialIcons name="check" size={14} color={colors.primaryForeground} />}
            </View>
            <Text style={{ ...typography.caption, color: colors.textPrimary, flex: 1 }}>
              I agree to the Terms and Conditions and confirm my details are correct.
            </Text>
          </TouchableOpacity>

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
