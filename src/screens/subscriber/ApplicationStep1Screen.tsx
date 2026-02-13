import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radii, typography } from '../../theme';
import { useApplicationForm } from '../../context/ApplicationFormContext';
import { validateStep1 } from '../../utils/formValidation';
import { ApplicationProgress } from '../../components/ApplicationProgress';
import { AddressAutocompleteInput } from '../../components/AddressAutocompleteInput';
import { useAuth } from '../../auth/AuthContext';
import { getMyVenueEntitlement, isVenueFeatureEnabled } from '../../lib/venueSubscription';

type ProfileStackParamList = {
  PortfolioType: undefined;
  ApplicationStep1: undefined;
  ApplicationStep2: undefined;
};

export default function ApplicationStep1Screen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { state, updateStep1 } = useApplicationForm();
  const { user } = useAuth();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [canEditVenueLinks, setCanEditVenueLinks] = useState(true);

  useEffect(() => {
    async function loadVenueLinkEntitlement() {
      if (!user) return;
      if (state.portfolioType !== 'venues') {
        setCanEditVenueLinks(true);
        return;
      }

      const ent = await getMyVenueEntitlement(user.id);
      setCanEditVenueLinks(isVenueFeatureEnabled(ent, 'website_social_links'));
    }

    loadVenueLinkEntitlement();
  }, [state.portfolioType, user]);

  const handleChange = (field: string, value: string) => {
    const isVenueLinksField =
      field === 'instagram' ||
      field === 'facebook' ||
      field === 'tiktok' ||
      field === 'linkedin' ||
      field === 'website';

    if (state.portfolioType === 'venues' && isVenueLinksField && !canEditVenueLinks) {
      Alert.alert(
        'Upgrade Required',
        'Website & social media links are available on paid venue plans. Please upgrade to add these links.',
        [{ text: 'OK' }],
      );
      return;
    }

    updateStep1({ [field]: value });
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleNext = () => {
    const validation = validateStep1(state.step1);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      Alert.alert('Validation Error', 'Please fix the errors before continuing');
      return;
    }

    navigation.navigate('ApplicationStep2');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xl }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}
          >
            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
            <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>
              Back
            </Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <MaterialIcons name="business" size={32} color={colors.primaryTeal} />
              <View>
                <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>
                  Company Details
                </Text>
                <Text style={{ ...typography.caption, color: colors.textMuted }}>
                  Page 1 of 4
                </Text>
              </View>
            </View>
            <ApplicationProgress currentStep={1} />
          </View>

          {/* Business Information Card */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radii.lg,
              padding: spacing.lg,
              marginBottom: spacing.lg,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              shadowColor: '#000',
              shadowOpacity: 0.05,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            }}
          >
            <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
              Business Information
            </Text>
            <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.lg }}>
              Please provide your company details. Fields marked with * are required.
            </Text>

            <View style={{ gap: spacing.md }}>
              <View>
                <Text style={{ ...typography.body, fontWeight: '500', color: colors.textPrimary, marginBottom: spacing.xs }}>
                  Registered Business Name *
                </Text>
                <TextInput
                  placeholder="Enter your registered business name"
                  value={state.step1.registeredBusinessName}
                  onChangeText={(value) => handleChange('registeredBusinessName', value)}
                  style={{
                    borderWidth: 1,
                    borderColor: errors.registeredBusinessName ? '#EF4444' : colors.borderSubtle,
                    borderRadius: radii.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    backgroundColor: colors.surface,
                    fontSize: 14,
                    color: colors.textPrimary,
                  }}
                />
                {errors.registeredBusinessName && (
                  <Text style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>
                    {errors.registeredBusinessName}
                  </Text>
                )}
              </View>

              <View>
                <Text style={{ ...typography.body, fontWeight: '500', color: colors.textPrimary, marginBottom: spacing.xs }}>
                  Trading Name
                </Text>
                <TextInput
                  placeholder="Enter your trading name"
                  value={state.step1.tradingName}
                  onChangeText={(value) => handleChange('tradingName', value)}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                    borderRadius: radii.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    backgroundColor: colors.surface,
                    fontSize: 14,
                    color: colors.textPrimary,
                  }}
                />
              </View>

              <View>
                <Text style={{ ...typography.body, fontWeight: '500', color: colors.textPrimary, marginBottom: spacing.xs }}>
                  Owner's Name *
                </Text>
                <TextInput
                  placeholder="Enter owner's full name"
                  value={state.step1.ownersName}
                  onChangeText={(value) => handleChange('ownersName', value)}
                  style={{
                    borderWidth: 1,
                    borderColor: errors.ownersName ? '#EF4444' : colors.borderSubtle,
                    borderRadius: radii.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    backgroundColor: colors.surface,
                    fontSize: 14,
                    color: colors.textPrimary,
                  }}
                />
                {errors.ownersName && (
                  <Text style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>
                    {errors.ownersName}
                  </Text>
                )}
              </View>

              <View>
                <Text style={{ ...typography.body, fontWeight: '500', color: colors.textPrimary, marginBottom: spacing.xs }}>
                  Company Reg/ID Number
                </Text>
                <TextInput
                  placeholder="Enter company registration or ID number"
                  value={state.step1.companyRegNumber}
                  onChangeText={(value) => handleChange('companyRegNumber', value)}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                    borderRadius: radii.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    backgroundColor: colors.surface,
                    fontSize: 14,
                    color: colors.textPrimary,
                  }}
                />
              </View>

              <View>
                <Text style={{ ...typography.body, fontWeight: '500', color: colors.textPrimary, marginBottom: spacing.xs }}>
                  VAT Number
                </Text>
                <TextInput
                  placeholder="Enter VAT number"
                  value={state.step1.vatNumber}
                  onChangeText={(value) => handleChange('vatNumber', value)}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                    borderRadius: radii.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    backgroundColor: colors.surface,
                    fontSize: 14,
                    color: colors.textPrimary,
                  }}
                />
              </View>

              <View>
                <AddressAutocompleteInput
                  label="Business Physical Address"
                  placeholder="Enter physical business address"
                  value={state.step1.businessPhysicalAddress}
                  onChangeValue={(value) => handleChange('businessPhysicalAddress', value)}
                  numberOfLines={2}
                />
              </View>

              <View>
                <AddressAutocompleteInput
                  label="Billing Address"
                  placeholder="Enter billing address"
                  value={state.step1.billingAddress}
                  onChangeValue={(value) => handleChange('billingAddress', value)}
                  numberOfLines={2}
                />
              </View>

              <View>
                <Text style={{ ...typography.body, fontWeight: '500', color: colors.textPrimary, marginBottom: spacing.xs }}>
                  Contact Phone Number *
                </Text>
                <TextInput
                  placeholder="Enter contact phone"
                  value={state.step1.contactPhoneNumber}
                  onChangeText={(value) => handleChange('contactPhoneNumber', value)}
                  keyboardType="phone-pad"
                  style={{
                    borderWidth: 1,
                    borderColor: errors.contactPhoneNumber ? '#EF4444' : colors.borderSubtle,
                    borderRadius: radii.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    backgroundColor: colors.surface,
                    fontSize: 14,
                    color: colors.textPrimary,
                  }}
                />
                {errors.contactPhoneNumber && (
                  <Text style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>
                    {errors.contactPhoneNumber}
                  </Text>
                )}
              </View>

              <View>
                <Text style={{ ...typography.body, fontWeight: '500', color: colors.textPrimary, marginBottom: spacing.xs }}>
                  Alternate Phone 1
                </Text>
                <TextInput
                  placeholder="Enter alternate phone"
                  value={state.step1.alternatePhone1}
                  onChangeText={(value) => handleChange('alternatePhone1', value)}
                  keyboardType="phone-pad"
                  style={{
                    borderWidth: 1,
                    borderColor: errors.alternatePhone1 ? '#EF4444' : colors.borderSubtle,
                    borderRadius: radii.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    backgroundColor: colors.surface,
                    fontSize: 14,
                    color: colors.textPrimary,
                  }}
                />
                {errors.alternatePhone1 && (
                  <Text style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>
                    {errors.alternatePhone1}
                  </Text>
                )}
              </View>

              <View>
                <Text style={{ ...typography.body, fontWeight: '500', color: colors.textPrimary, marginBottom: spacing.xs }}>
                  Alternate Phone 2
                </Text>
                <TextInput
                  placeholder="Enter another alternate phone"
                  value={state.step1.alternatePhone2}
                  onChangeText={(value) => handleChange('alternatePhone2', value)}
                  keyboardType="phone-pad"
                  style={{
                    borderWidth: 1,
                    borderColor: errors.alternatePhone2 ? '#EF4444' : colors.borderSubtle,
                    borderRadius: radii.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    backgroundColor: colors.surface,
                    fontSize: 14,
                    color: colors.textPrimary,
                  }}
                />
                {errors.alternatePhone2 && (
                  <Text style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>
                    {errors.alternatePhone2}
                  </Text>
                )}
              </View>

              <View>
                <Text style={{ ...typography.body, fontWeight: '500', color: colors.textPrimary, marginBottom: spacing.xs }}>
                  Email *
                </Text>
                <TextInput
                  placeholder="Enter email address"
                  value={state.step1.email}
                  onChangeText={(value) => handleChange('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={{
                    borderWidth: 1,
                    borderColor: errors.email ? '#EF4444' : colors.borderSubtle,
                    borderRadius: radii.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    backgroundColor: colors.surface,
                    fontSize: 14,
                    color: colors.textPrimary,
                  }}
                />
                {errors.email && (
                  <Text style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>
                    {errors.email}
                  </Text>
                )}
              </View>

              <View>
                <Text style={{ ...typography.body, fontWeight: '500', color: colors.textPrimary, marginBottom: spacing.xs }}>
                  Alternate Email
                </Text>
                <TextInput
                  placeholder="Enter alternate email"
                  value={state.step1.alternateEmail}
                  onChangeText={(value) => handleChange('alternateEmail', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={{
                    borderWidth: 1,
                    borderColor: errors.alternateEmail ? '#EF4444' : colors.borderSubtle,
                    borderRadius: radii.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    backgroundColor: colors.surface,
                    fontSize: 14,
                    color: colors.textPrimary,
                  }}
                />
                {errors.alternateEmail && (
                  <Text style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>
                    {errors.alternateEmail}
                  </Text>
                )}
              </View>

              <View>
                <Text style={{ ...typography.body, fontWeight: '500', color: colors.textPrimary, marginBottom: spacing.xs }}>
                  Instagram
                </Text>
                <TextInput
                  placeholder="@yourhandle"
                  value={state.step1.instagram}
                  onChangeText={(value) => handleChange('instagram', value)}
                  editable={state.portfolioType !== 'venues' || canEditVenueLinks}
                  autoCapitalize="none"
                  style={{
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                    borderRadius: radii.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    backgroundColor:
                      state.portfolioType === 'venues' && !canEditVenueLinks ? colors.surfaceMuted : colors.surface,
                    fontSize: 14,
                    color: colors.textPrimary,
                    opacity: state.portfolioType === 'venues' && !canEditVenueLinks ? 0.7 : 1,
                  }}
                />
              </View>

              <View>
                <Text style={{ ...typography.body, fontWeight: '500', color: colors.textPrimary, marginBottom: spacing.xs }}>
                  Facebook
                </Text>
                <TextInput
                  placeholder="Facebook page or profile URL"
                  value={state.step1.facebook}
                  onChangeText={(value) => handleChange('facebook', value)}
                  editable={state.portfolioType !== 'venues' || canEditVenueLinks}
                  autoCapitalize="none"
                  style={{
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                    borderRadius: radii.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    backgroundColor:
                      state.portfolioType === 'venues' && !canEditVenueLinks ? colors.surfaceMuted : colors.surface,
                    fontSize: 14,
                    color: colors.textPrimary,
                    opacity: state.portfolioType === 'venues' && !canEditVenueLinks ? 0.7 : 1,
                  }}
                />
              </View>

              <View>
                <Text style={{ ...typography.body, fontWeight: '500', color: colors.textPrimary, marginBottom: spacing.xs }}>
                  TikTok
                </Text>
                <TextInput
                  placeholder="@yourhandle"
                  value={state.step1.tiktok}
                  onChangeText={(value) => handleChange('tiktok', value)}
                  editable={state.portfolioType !== 'venues' || canEditVenueLinks}
                  autoCapitalize="none"
                  style={{
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                    borderRadius: radii.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    backgroundColor:
                      state.portfolioType === 'venues' && !canEditVenueLinks ? colors.surfaceMuted : colors.surface,
                    fontSize: 14,
                    color: colors.textPrimary,
                    opacity: state.portfolioType === 'venues' && !canEditVenueLinks ? 0.7 : 1,
                  }}
                />
              </View>

              <View>
                <Text style={{ ...typography.body, fontWeight: '500', color: colors.textPrimary, marginBottom: spacing.xs }}>
                  LinkedIn
                </Text>
                <TextInput
                  placeholder="LinkedIn profile URL"
                  value={state.step1.linkedin}
                  onChangeText={(value) => handleChange('linkedin', value)}
                  editable={state.portfolioType !== 'venues' || canEditVenueLinks}
                  autoCapitalize="none"
                  style={{
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                    borderRadius: radii.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    backgroundColor:
                      state.portfolioType === 'venues' && !canEditVenueLinks ? colors.surfaceMuted : colors.surface,
                    fontSize: 14,
                    color: colors.textPrimary,
                    opacity: state.portfolioType === 'venues' && !canEditVenueLinks ? 0.7 : 1,
                  }}
                />
              </View>

              <View>
                <Text style={{ ...typography.body, fontWeight: '500', color: colors.textPrimary, marginBottom: spacing.xs }}>
                  Website
                </Text>
                <TextInput
                  placeholder="https://www.yourwebsite.com"
                  value={state.step1.website}
                  onChangeText={(value) => handleChange('website', value)}
                  editable={state.portfolioType !== 'venues' || canEditVenueLinks}
                  keyboardType="url"
                  autoCapitalize="none"
                  style={{
                    borderWidth: 1,
                    borderColor: errors.website ? '#EF4444' : colors.borderSubtle,
                    borderRadius: radii.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    backgroundColor:
                      state.portfolioType === 'venues' && !canEditVenueLinks ? colors.surfaceMuted : colors.surface,
                    fontSize: 14,
                    color: colors.textPrimary,
                    opacity: state.portfolioType === 'venues' && !canEditVenueLinks ? 0.7 : 1,
                  }}
                />
                {errors.website && (
                  <Text style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>
                    {errors.website}
                  </Text>
                )}
              </View>

              {state.portfolioType === 'venues' && !canEditVenueLinks && (
                <View
                  style={{
                    marginTop: spacing.md,
                    padding: spacing.md,
                    borderRadius: radii.md,
                    backgroundColor: '#FFF7ED',
                    borderWidth: 1,
                    borderColor: '#FDBA74',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: spacing.md,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...typography.caption, color: '#9A3412', fontWeight: '600' }}>
                      Upgrade required
                    </Text>
                    <Text style={{ ...typography.caption, color: '#9A3412', marginTop: 2 }}>
                      Website & social media links are available on paid venue plans.
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => (navigation as any).navigate('VenueListingPlans')}
                    style={{
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.xs,
                      borderRadius: radii.full,
                      backgroundColor: colors.primary,
                    }}
                  >
                    <Text style={{ ...typography.caption, color: '#FFFFFF', fontWeight: '600' }}>Upgrade</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Bank Account Details Card */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radii.lg,
              padding: spacing.lg,
              marginBottom: spacing.lg,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              shadowColor: '#000',
              shadowOpacity: 0.05,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            }}
          >
            <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
              Bank Account Details
            </Text>
            <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.lg }}>
              Please provide your banking information for payment processing.
            </Text>

            <View style={{ gap: spacing.md }}>
              <View>
                <Text style={{ ...typography.body, fontWeight: '500', color: colors.textPrimary, marginBottom: spacing.xs }}>
                  Account Holder Name
                </Text>
                <TextInput
                  placeholder="Enter account holder name"
                  value={state.step1.accountHolderName}
                  onChangeText={(value) => handleChange('accountHolderName', value)}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                    borderRadius: radii.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    backgroundColor: colors.surface,
                    fontSize: 14,
                    color: colors.textPrimary,
                  }}
                />
              </View>

              <View>
                <Text style={{ ...typography.body, fontWeight: '500', color: colors.textPrimary, marginBottom: spacing.xs }}>
                  Bank
                </Text>
                <TextInput
                  placeholder="Enter bank name"
                  value={state.step1.bank}
                  onChangeText={(value) => handleChange('bank', value)}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                    borderRadius: radii.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    backgroundColor: colors.surface,
                    fontSize: 14,
                    color: colors.textPrimary,
                  }}
                />
              </View>

              <View>
                <Text style={{ ...typography.body, fontWeight: '500', color: colors.textPrimary, marginBottom: spacing.xs }}>
                  Branch
                </Text>
                <TextInput
                  placeholder="Enter branch name"
                  value={state.step1.branch}
                  onChangeText={(value) => handleChange('branch', value)}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                    borderRadius: radii.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    backgroundColor: colors.surface,
                    fontSize: 14,
                    color: colors.textPrimary,
                  }}
                />
              </View>

              <View>
                <Text style={{ ...typography.body, fontWeight: '500', color: colors.textPrimary, marginBottom: spacing.xs }}>
                  Branch Code
                </Text>
                <TextInput
                  placeholder="Enter branch code"
                  value={state.step1.branchCode}
                  onChangeText={(value) => handleChange('branchCode', value)}
                  keyboardType="number-pad"
                  style={{
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                    borderRadius: radii.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    backgroundColor: colors.surface,
                    fontSize: 14,
                    color: colors.textPrimary,
                  }}
                />
              </View>

              <View>
                <Text style={{ ...typography.body, fontWeight: '500', color: colors.textPrimary, marginBottom: spacing.xs }}>
                  Account Number
                </Text>
                <TextInput
                  placeholder="Enter account number"
                  value={state.step1.accountNumber}
                  onChangeText={(value) => handleChange('accountNumber', value)}
                  keyboardType="number-pad"
                  style={{
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                    borderRadius: radii.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    backgroundColor: colors.surface,
                    fontSize: 14,
                    color: colors.textPrimary,
                  }}
                />
              </View>
            </View>
          </View>

          {/* Funcxon User Profile Details Card */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radii.lg,
              padding: spacing.lg,
              marginBottom: spacing.lg,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              shadowColor: '#000',
              shadowOpacity: 0.05,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            }}
          >
            <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
              Funcxon User Profile Details
            </Text>
            <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.lg }}>
              Your Funcxon profile information for the platform.
            </Text>

            <View style={{ gap: spacing.md }}>
              <View>
                <Text style={{ ...typography.body, fontWeight: '500', color: colors.textPrimary, marginBottom: spacing.xs }}>
                  Funcxon User Name
                </Text>
                <TextInput
                  placeholder="Enter your Funcxon user name"
                  value={state.step1.funcxonUserName}
                  onChangeText={(value) => handleChange('funcxonUserName', value)}
                  autoCapitalize="none"
                  style={{
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                    borderRadius: radii.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    backgroundColor: colors.surface,
                    fontSize: 14,
                    color: colors.textPrimary,
                  }}
                />
              </View>

              <View>
                <Text style={{ ...typography.body, fontWeight: '500', color: colors.textPrimary, marginBottom: spacing.xs }}>
                  User Whatsapp
                </Text>
                <TextInput
                  placeholder="Enter your WhatsApp number"
                  value={state.step1.userWhatsapp}
                  onChangeText={(value) => handleChange('userWhatsapp', value)}
                  keyboardType="phone-pad"
                  style={{
                    borderWidth: 1,
                    borderColor: errors.userWhatsapp ? '#EF4444' : colors.borderSubtle,
                    borderRadius: radii.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    backgroundColor: colors.surface,
                    fontSize: 14,
                    color: colors.textPrimary,
                  }}
                />
                {errors.userWhatsapp && (
                  <Text style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>
                    {errors.userWhatsapp}
                  </Text>
                )}
              </View>

              <View>
                <Text style={{ ...typography.body, fontWeight: '500', color: colors.textPrimary, marginBottom: spacing.xs }}>
                  User Email
                </Text>
                <TextInput
                  placeholder="Enter your email address"
                  value={state.step1.userEmail}
                  onChangeText={(value) => handleChange('userEmail', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={{
                    borderWidth: 1,
                    borderColor: errors.userEmail ? '#EF4444' : colors.borderSubtle,
                    borderRadius: radii.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    backgroundColor: colors.surface,
                    fontSize: 14,
                    color: colors.textPrimary,
                  }}
                />
                {errors.userEmail && (
                  <Text style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>
                    {errors.userEmail}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                onPress={handleNext}
                style={{
                  backgroundColor: colors.primaryTeal,
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.lg,
                  borderRadius: radii.md,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: spacing.md,
                }}
                activeOpacity={0.8}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginRight: spacing.sm }}>
                  Next
                </Text>
                <MaterialIcons name="arrow-forward" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
