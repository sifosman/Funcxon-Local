import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radii, typography } from '../../theme';
import { useApplicationForm } from '../../context/ApplicationFormContext';
import { validateStep4 } from '../../utils/formValidation';
import { ApplicationProgress } from '../../components/ApplicationProgress';
import { subscriptionPlans } from '../../config/subscriptionPlans';
import { submitApplication, uploadFileToStorage } from '../../lib/applicationService';
import { useAuth } from '../../auth/AuthContext';

type ProfileStackParamList = {
  ApplicationStep3: undefined;
  ApplicationStep4: undefined;
  Payment: undefined;
  PortfolioProfile: undefined;
};

export default function ApplicationStep4Screen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { state, updateStep4 } = useApplicationForm();
  const { user } = useAuth();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const validation = validateStep4(state.step4);

    if (!validation.isValid) {
      setErrors(validation.errors);
      Alert.alert('Validation Error', 'Please fix the errors before continuing');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'Please sign in to submit your application');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload files to Supabase Storage first
      const uploadedImages = [];
      const uploadedVideos = [];
      const uploadedDocuments = [];

      // Upload images
      for (const image of state.step3.images) {
        const result = await uploadFileToStorage('portfolio-images', image, user.id);
        if (result.success && result.url) {
          uploadedImages.push(result.url);
        }
      }

      // Upload videos
      for (const video of state.step3.videos) {
        const result = await uploadFileToStorage('portfolio-videos', video, user.id);
        if (result.success && result.url) {
          uploadedVideos.push(result.url);
        }
      }

      // Upload documents
      for (const document of state.step3.documents) {
        const result = await uploadFileToStorage('business-documents', document, user.id);
        if (result.success && result.url) {
          uploadedDocuments.push(result.url);
        }
      }

      // Submit application to database
      const portfolioType = state.portfolioType === 'venues' ? 'venue' as const : 'vendor' as const;
      
      const submission = {
        portfolio_type: portfolioType,
        company_details: state.step1,
        service_categories: state.step2,
        coverage_provinces: state.step2.provinces,
        coverage_cities: state.step2.cities,
        business_description: state.step2.description,
        portfolio_images: uploadedImages,
        portfolio_videos: uploadedVideos,
        business_documents: uploadedDocuments,
        subscription_tier: state.step4.subscriptionPlan,
        terms_accepted: state.step4.termsAccepted,
        privacy_accepted: state.step4.privacyAccepted,
        marketing_consent: state.step4.marketingConsent,
      };

      const result = await submitApplication(submission);

      if (result.success) {
        Alert.alert(
          'Application Submitted!',
          'Your application has been submitted successfully. We will review it and get back to you within 3-5 business days.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Reset form and navigate to portfolio profile
                updateStep4({ subscriptionPlan: '', termsAccepted: false, privacyAccepted: false, marketingConsent: false });
                navigation.navigate('PortfolioProfile');
              },
            },
          ]
        );
      } else {
        Alert.alert('Submission Failed', result.error || 'Failed to submit application. Please try again.');
      }
    } catch (error) {
      console.error('Submit application error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
              <MaterialIcons name="card-membership" size={32} color={colors.primaryTeal} />
              <View>
                <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>
                  Subscription & Legal
                </Text>
                <Text style={{ ...typography.caption, color: colors.textMuted }}>
                  Page 4 of 4
                </Text>
              </View>
            </View>
            <ApplicationProgress currentStep={4} />
          </View>

          {/* Subscription Plans */}
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
              Select Subscription Plan *
            </Text>
            <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.lg }}>
              Choose the plan that best suits your needs
            </Text>

            {subscriptionPlans.map((plan) => {
              const isSelected = state.step4.subscriptionPlan === plan.id;
              return (
                <TouchableOpacity
                  key={plan.id}
                  onPress={() => updateStep4({ subscriptionPlan: plan.id })}
                  style={{
                    padding: spacing.lg,
                    marginBottom: spacing.md,
                    borderRadius: radii.lg,
                    borderWidth: 2,
                    borderColor: isSelected ? colors.primaryTeal : colors.borderSubtle,
                    backgroundColor: isSelected ? '#E0F2F7' : colors.surface,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
                    <View>
                      <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>
                        {plan.name}
                      </Text>
                      <Text style={{ ...typography.body, color: colors.textMuted, marginTop: 2 }}>
                        {plan.price} {plan.billingPeriod}
                      </Text>
                    </View>
                    {isSelected && <MaterialIcons name="check-circle" size={28} color={colors.primaryTeal} />}
                    {plan.highlighted && !isSelected && (
                      <View style={{ backgroundColor: colors.primaryTeal, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radii.sm }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>POPULAR</Text>
                      </View>
                    )}
                  </View>
                  <View style={{ gap: spacing.xs }}>
                    {plan.features.map((feature, idx) => (
                      <View key={idx} style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <MaterialIcons name="check" size={16} color={colors.primaryTeal} style={{ marginRight: spacing.xs }} />
                        <Text style={{ ...typography.caption, color: colors.textPrimary }}>
                          {feature}
                        </Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              );
            })}
            {errors.subscriptionPlan && (
              <Text style={{ fontSize: 12, color: '#EF4444', marginTop: spacing.xs }}>
                {errors.subscriptionPlan}
              </Text>
            )}
          </View>

          {/* Legal Agreements */}
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
            <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.lg }}>
              Legal Agreements
            </Text>

            {/* Terms and Conditions */}
            <TouchableOpacity
              onPress={() => updateStep4({ termsAccepted: !state.step4.termsAccepted })}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                marginBottom: spacing.lg,
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  borderWidth: 2,
                  borderColor: errors.termsAccepted ? '#EF4444' : state.step4.termsAccepted ? colors.primaryTeal : colors.borderSubtle,
                  backgroundColor: state.step4.termsAccepted ? colors.primaryTeal : colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: spacing.md,
                }}
              >
                {state.step4.termsAccepted && (
                  <MaterialIcons name="check" size={16} color="#FFFFFF" />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ ...typography.body, color: colors.textPrimary }}>
                  I accept the{' '}
                  <Text style={{ color: colors.primaryTeal, fontWeight: '600' }}>
                    Terms and Conditions
                  </Text>{' '}
                  *
                </Text>
                {errors.termsAccepted && (
                  <Text style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>
                    {errors.termsAccepted}
                  </Text>
                )}
              </View>
            </TouchableOpacity>

            {/* Privacy Policy */}
            <TouchableOpacity
              onPress={() => updateStep4({ privacyAccepted: !state.step4.privacyAccepted })}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                marginBottom: spacing.lg,
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  borderWidth: 2,
                  borderColor: errors.privacyAccepted ? '#EF4444' : state.step4.privacyAccepted ? colors.primaryTeal : colors.borderSubtle,
                  backgroundColor: state.step4.privacyAccepted ? colors.primaryTeal : colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: spacing.md,
                }}
              >
                {state.step4.privacyAccepted && (
                  <MaterialIcons name="check" size={16} color="#FFFFFF" />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ ...typography.body, color: colors.textPrimary }}>
                  I accept the{' '}
                  <Text style={{ color: colors.primaryTeal, fontWeight: '600' }}>
                    Privacy Policy
                  </Text>{' '}
                  *
                </Text>
                {errors.privacyAccepted && (
                  <Text style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>
                    {errors.privacyAccepted}
                  </Text>
                )}
              </View>
            </TouchableOpacity>

            {/* Marketing Consent */}
            <TouchableOpacity
              onPress={() => updateStep4({ marketingConsent: !state.step4.marketingConsent })}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  borderWidth: 2,
                  borderColor: state.step4.marketingConsent ? colors.primaryTeal : colors.borderSubtle,
                  backgroundColor: state.step4.marketingConsent ? colors.primaryTeal : colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: spacing.md,
                }}
              >
                {state.step4.marketingConsent && (
                  <MaterialIcons name="check" size={16} color="#FFFFFF" />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ ...typography.body, color: colors.textPrimary }}>
                  I agree to receive marketing communications and updates (Optional)
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Summary Info */}
          <View
            style={{
              backgroundColor: '#E0F2F7',
              borderRadius: radii.md,
              padding: spacing.md,
              flexDirection: 'row',
              marginBottom: spacing.lg,
            }}
          >
            <MaterialIcons name="info" size={20} color={colors.primaryTeal} style={{ marginRight: spacing.sm }} />
            <View style={{ flex: 1 }}>
              <Text style={{ ...typography.caption, color: colors.textPrimary }}>
                By submitting this application, you agree to all terms and will be directed to complete the payment process.
              </Text>
            </View>
          </View>

          {/* Navigation Buttons */}
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.primaryTeal,
                paddingVertical: spacing.md,
                borderRadius: radii.md,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: colors.primaryTeal, fontSize: 16, fontWeight: '600' }}>
                Back
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={{
                flex: 1,
                backgroundColor: isSubmitting ? colors.borderSubtle : colors.primaryTeal,
                paddingVertical: spacing.md,
                borderRadius: radii.md,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: spacing.sm }} />
                  <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
                    Submitting...
                  </Text>
                </>
              ) : (
                <>
                  <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginRight: spacing.sm }}>
                    Submit Application
                  </Text>
                  <MaterialIcons name="check-circle" size={16} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
