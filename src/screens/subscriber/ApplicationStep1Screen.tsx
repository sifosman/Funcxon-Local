import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radii, typography } from '../../theme';
import { useApplicationForm } from '../../context/ApplicationFormContext';
import { validateStep1 } from '../../utils/formValidation';
import { ApplicationProgress } from '../../components/ApplicationProgress';
import { AddressAutocompleteInput } from '../../components/AddressAutocompleteInput';
import { useAuth } from '../../auth/AuthContext';
import { getLatestUserApplicationByType, isBlockingApplicationStatus } from '../../lib/applicationService';
import ThemedAlert from '../../components/ThemedAlert';
import { normalizePhoneNumber } from '../../utils/phoneNormalization';
import { useIsDesktop } from '../../hooks/useIsDesktop';

type ProfileStackParamList = {
  PortfolioType: undefined;
  ApplicationStep1: undefined;
  ApplicationStep2: undefined;
  ApplicationStatus: undefined;
};

export default function ApplicationStep1Screen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { state, updateStep1 } = useApplicationForm();
  const { user } = useAuth();
  const isDesktop = useIsDesktop();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [alertState, setAlertState] = useState<{visible: boolean; title: string; message: string; buttons?: any[]} | null>(null);

  useEffect(() => {
    let isActive = true;

    async function redirectPendingApplication() {
      if (!state.portfolioType) return;
      
      const portfolioType = state.portfolioType === 'vendors' ? 'vendor' : 'venue';
      const result = await getLatestUserApplicationByType(portfolioType);
      if (!isActive || !result.success || !result.data) return;

      if (isBlockingApplicationStatus(result.data.status)) {
        navigation.replace('ApplicationStatus');
      }
    }

    redirectPendingApplication();

    return () => {
      isActive = false;
    };
  }, [navigation, state.portfolioType]);

  const handleChange = (field: string, value: string) => {
    const phoneFields = ['contactPhoneNumber', 'alternatePhone1', 'alternatePhone2', 'userWhatsapp'];
    const normalizedValue = phoneFields.includes(field) ? normalizePhoneNumber(value) : value;

    updateStep1({ [field]: normalizedValue });
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
      setAlertState({ visible: true, title: 'Validation Error', message: 'Please fix the errors before continuing', buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
      return;
    }

    navigation.navigate('ApplicationStep2');
  };

  const desktopContainerStyle = {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center' as const,
    paddingHorizontal: 48,
    paddingBottom: spacing.xxl * 6,
  };

  const cardSurface = isDesktop ? colors.surfaceContainerLowest : colors.surface;
  const cardBorder = isDesktop ? colors.outlineVariant : colors.borderSubtle;

  const renderForm = () => (
    <View
      style={{
        backgroundColor: cardSurface,
        borderRadius: radii.lg,
        padding: isDesktop ? spacing.xl : spacing.lg,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: cardBorder,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
        maxWidth: isDesktop ? 800 : undefined,
        width: isDesktop ? '100%' : undefined,
        alignSelf: isDesktop ? 'center' as const : undefined,
      }}
    >
      <Text style={isDesktop ? { ...typography.headlineSm, color: colors.textPrimary, marginBottom: spacing.xs } as any : { ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
        Business Information
      </Text>
      <Text style={isDesktop ? { ...typography.bodyMd, color: colors.onSurfaceVariant, marginBottom: spacing.lg } as any : { ...typography.caption, color: colors.textMuted, marginBottom: spacing.lg }}>
        Please provide your company details. Fields marked with * are required.
      </Text>

      <View style={{ gap: spacing.md }}>
        <View>
          <Text style={{ ...typography.bodyMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
            Registered Business Name *
          </Text>
          <TextInput
            placeholder="Enter your registered business name"
            value={state.step1.registeredBusinessName}
            onChangeText={(value) => handleChange('registeredBusinessName', value)}
            style={{
              borderWidth: 1,
              borderColor: errors.registeredBusinessName ? '#EF4444' : cardBorder,
              borderRadius: radii.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              backgroundColor: cardSurface,
              fontSize: 14,
              color: colors.textPrimary,
              fontFamily: typography.body.fontFamily,
            }}
          />
          {errors.registeredBusinessName && (
            <Text style={{ ...typography.caption, fontSize: 12, color: '#EF4444', marginTop: 4 }}>
              {errors.registeredBusinessName}
            </Text>
          )}
        </View>

        <View>
          <Text style={{ ...typography.bodyMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
            Trading Name
          </Text>
          <TextInput
            placeholder="Enter your trading name"
            value={state.step1.tradingName}
            onChangeText={(value) => handleChange('tradingName', value)}
            style={{
              borderWidth: 1,
              borderColor: cardBorder,
              borderRadius: radii.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              backgroundColor: cardSurface,
              fontSize: 14,
              color: colors.textPrimary,
              fontFamily: typography.body.fontFamily,
            }}
          />
        </View>

        <View>
          <Text style={{ ...typography.bodyMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
            Owner's Name *
          </Text>
          <TextInput
            placeholder="Enter owner's full name"
            value={state.step1.ownersName}
            onChangeText={(value) => handleChange('ownersName', value)}
            style={{
              borderWidth: 1,
              borderColor: errors.ownersName ? '#EF4444' : cardBorder,
              borderRadius: radii.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              backgroundColor: cardSurface,
              fontSize: 14,
              color: colors.textPrimary,
              fontFamily: typography.body.fontFamily,
            }}
          />
          {errors.ownersName && (
            <Text style={{ ...typography.caption, fontSize: 12, color: '#EF4444', marginTop: 4 }}>
              {errors.ownersName}
            </Text>
          )}
        </View>

        <View>
          <Text style={{ ...typography.bodyMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
            Company Reg/ID Number
          </Text>
          <TextInput
            placeholder="Enter company registration or ID number"
            value={state.step1.companyRegNumber}
            onChangeText={(value) => handleChange('companyRegNumber', value)}
            style={{
              borderWidth: 1,
              borderColor: cardBorder,
              borderRadius: radii.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              backgroundColor: cardSurface,
              fontSize: 14,
              color: colors.textPrimary,
              fontFamily: typography.body.fontFamily,
            }}
          />
        </View>

        <View>
          <Text style={{ ...typography.bodyMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
            VAT Number
          </Text>
          <TextInput
            placeholder="Enter VAT number"
            value={state.step1.vatNumber}
            onChangeText={(value) => handleChange('vatNumber', value)}
            style={{
              borderWidth: 1,
              borderColor: cardBorder,
              borderRadius: radii.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              backgroundColor: cardSurface,
              fontSize: 14,
              color: colors.textPrimary,
              fontFamily: typography.body.fontFamily,
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
          <Text style={{ ...typography.bodyMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
            Contact Phone Number *
          </Text>
          <TextInput
            placeholder="Enter contact phone"
            value={state.step1.contactPhoneNumber}
            onChangeText={(value) => handleChange('contactPhoneNumber', value)}
            keyboardType="phone-pad"
            style={{
              borderWidth: 1,
              borderColor: errors.contactPhoneNumber ? '#EF4444' : cardBorder,
              borderRadius: radii.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              backgroundColor: cardSurface,
              fontSize: 14,
              color: colors.textPrimary,
              fontFamily: typography.body.fontFamily,
            }}
          />
          {errors.contactPhoneNumber && (
            <Text style={{ ...typography.caption, fontSize: 12, color: '#EF4444', marginTop: 4 }}>
              {errors.contactPhoneNumber}
            </Text>
          )}
        </View>

        <View>
          <Text style={{ ...typography.bodyMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
            Alternate Phone 1
          </Text>
          <TextInput
            placeholder="Enter alternate phone"
            value={state.step1.alternatePhone1}
            onChangeText={(value) => handleChange('alternatePhone1', value)}
            keyboardType="phone-pad"
            style={{
              borderWidth: 1,
              borderColor: errors.alternatePhone1 ? '#EF4444' : cardBorder,
              borderRadius: radii.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              backgroundColor: cardSurface,
              fontSize: 14,
              color: colors.textPrimary,
              fontFamily: typography.body.fontFamily,
            }}
          />
          {errors.alternatePhone1 && (
            <Text style={{ ...typography.caption, fontSize: 12, color: '#EF4444', marginTop: 4 }}>
              {errors.alternatePhone1}
            </Text>
          )}
        </View>

        <View>
          <Text style={{ ...typography.bodyMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
            Alternate Phone 2
          </Text>
          <TextInput
            placeholder="Enter another alternate phone"
            value={state.step1.alternatePhone2}
            onChangeText={(value) => handleChange('alternatePhone2', value)}
            keyboardType="phone-pad"
            style={{
              borderWidth: 1,
              borderColor: errors.alternatePhone2 ? '#EF4444' : cardBorder,
              borderRadius: radii.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              backgroundColor: cardSurface,
              fontSize: 14,
              color: colors.textPrimary,
              fontFamily: typography.body.fontFamily,
            }}
          />
          {errors.alternatePhone2 && (
            <Text style={{ ...typography.caption, fontSize: 12, color: '#EF4444', marginTop: 4 }}>
              {errors.alternatePhone2}
            </Text>
          )}
        </View>

        <View>
          <Text style={{ ...typography.bodyMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
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
              borderColor: errors.email ? '#EF4444' : cardBorder,
              borderRadius: radii.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              backgroundColor: cardSurface,
              fontSize: 14,
              color: colors.textPrimary,
              fontFamily: typography.body.fontFamily,
            }}
          />
          {errors.email && (
            <Text style={{ ...typography.caption, fontSize: 12, color: '#EF4444', marginTop: 4 }}>
              {errors.email}
            </Text>
          )}
        </View>

        <View>
          <Text style={{ ...typography.bodyMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
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
              borderColor: errors.alternateEmail ? '#EF4444' : cardBorder,
              borderRadius: radii.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              backgroundColor: cardSurface,
              fontSize: 14,
              color: colors.textPrimary,
              fontFamily: typography.body.fontFamily,
            }}
          />
          {errors.alternateEmail && (
            <Text style={{ ...typography.caption, fontSize: 12, color: '#EF4444', marginTop: 4 }}>
              {errors.alternateEmail}
            </Text>
          )}
        </View>

        <View>
          <Text style={{ ...typography.bodyMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
            Instagram
          </Text>
          <TextInput
            placeholder="@yourhandle"
            value={state.step1.instagram}
            onChangeText={(value) => handleChange('instagram', value)}
            autoCapitalize="none"
            style={{
              borderWidth: 1,
              borderColor: cardBorder,
              borderRadius: radii.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              backgroundColor: cardSurface,
              fontSize: 14,
              color: colors.textPrimary,
              fontFamily: typography.body.fontFamily,
            }}
          />
        </View>

        <View>
          <Text style={{ ...typography.bodyMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
            Facebook
          </Text>
          <TextInput
            placeholder="Facebook page or profile URL"
            value={state.step1.facebook}
            onChangeText={(value) => handleChange('facebook', value)}
            autoCapitalize="none"
            style={{
              borderWidth: 1,
              borderColor: cardBorder,
              borderRadius: radii.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              backgroundColor: cardSurface,
              fontSize: 14,
              color: colors.textPrimary,
              fontFamily: typography.body.fontFamily,
            }}
          />
        </View>

        <View>
          <Text style={{ ...typography.bodyMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
            TikTok
          </Text>
          <TextInput
            placeholder="@yourhandle"
            value={state.step1.tiktok}
            onChangeText={(value) => handleChange('tiktok', value)}
            autoCapitalize="none"
            style={{
              borderWidth: 1,
              borderColor: cardBorder,
              borderRadius: radii.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              backgroundColor: cardSurface,
              fontSize: 14,
              color: colors.textPrimary,
              fontFamily: typography.body.fontFamily,
            }}
          />
        </View>

      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: isDesktop ? colors.surfaceBg : colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? spacing.lg : 0}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        contentContainerStyle={isDesktop ? { ...desktopContainerStyle } as any : { paddingBottom: spacing.xxl * 6 }}
      >
        <View style={{ paddingHorizontal: isDesktop ? 0 : spacing.lg, paddingTop: spacing.sm }}>
          {!isDesktop && (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}
            >
              <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
              <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>
                Back
              </Text>
            </TouchableOpacity>
          )}

          <View style={{ marginBottom: spacing.lg, maxWidth: isDesktop ? 800 : undefined, width: isDesktop ? '100%' : undefined, alignSelf: isDesktop ? 'center' as const : undefined }}>
            <View style={{ marginBottom: spacing.md, alignSelf: 'flex-start' }}>
              <ApplicationProgress currentStep={1} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
              <MaterialIcons name="business" size={32} color={colors.textPrimary} />
              <View style={{ flex: 1 }}>
                <Text style={isDesktop ? { ...typography.headlineMd, color: colors.primary } as any : { ...typography.titleMedium, color: colors.textPrimary }}>
                  Company Details
                </Text>
                <Text style={isDesktop ? { ...typography.bodyMd, color: colors.onSurfaceVariant } as any : { ...typography.caption, color: colors.textMuted }}>
                  Page 1 of 4
                </Text>
              </View>
            </View>
          </View>

          {renderForm()}

          {/* Navigation Buttons */}
          <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg, maxWidth: isDesktop ? 800 : undefined, width: isDesktop ? '100%' : undefined, alignSelf: isDesktop ? 'center' as const : undefined }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                flex: 1,
                backgroundColor: cardSurface,
                borderWidth: 1,
                borderColor: colors.textPrimary,
                paddingVertical: spacing.md,
                borderRadius: radii.md,
                alignItems: 'center',
              }}
            >
              <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary, fontSize: 16 }}>
                Back
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleNext}
              style={{
                flex: 1,
                backgroundColor: colors.textPrimary,
                paddingVertical: spacing.md,
                borderRadius: radii.md,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              activeOpacity={0.8}
            >
              <Text style={{ ...typography.bodySemiBold, color: '#FFFFFF', fontSize: 16, marginRight: spacing.sm }}>
                Next
              </Text>
              <MaterialIcons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
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
