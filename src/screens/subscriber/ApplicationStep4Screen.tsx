import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radii, typography } from '../../theme';
import { useApplicationForm } from '../../context/ApplicationFormContext';
import { validateStep4 } from '../../utils/formValidation';
import { ApplicationProgress } from '../../components/ApplicationProgress';
import { getSubscriptionTiers } from '../../lib/subscription';
import { submitApplication, uploadFileToStorage } from '../../lib/applicationService';
import { useAuth } from '../../auth/AuthContext';
import { supabase } from '../../lib/supabaseClient';

type ProfileStackParamList = {
  ApplicationStep3: undefined;
  ApplicationStep4: undefined;
  Payment: undefined;
  PortfolioProfile: undefined;
  UpdateVenuePortfolio: undefined;
  UpdateVendorPortfolio: undefined;
  LegalDocument: { documentId: string };
};

export default function ApplicationStep4Screen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { state, updateStep4 } = useApplicationForm();
  const { user } = useAuth();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tiers, setTiers] = useState<Array<{
    id: number;
    tier_name: string;
    photo_limit: number;
    price_monthly: number | null;
    price_yearly: number | null;
    features: Record<string, any> | null;
    is_active: boolean;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'yearly'>('monthly');

  const normalizeVendorTierKey = (rawTierName: string): string => {
    const t = (rawTierName ?? '').trim().toLowerCase();
    if (t === 'get started' || t === 'get_started' || t === 'free') return 'free';
    if (t === 'premium plus' || t === 'premium_plus' || t === 'premiumplus') return 'premium_plus';
    if (t === 'premium') return 'premium';
    return t.replace(/\s+/g, '_');
  };

  useEffect(() => {
    loadTiers();
  }, []);

  const loadTiers = async () => {
    try {
      const data = await getSubscriptionTiers();
      setTiers(data);
    } catch (error) {
      console.error('Failed to load tiers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be signed in to submit an application');
      return;
    }

    setIsSubmitting(true);

    const validation = validateStep4(state.step4);

    if (!validation.isValid) {
      setErrors(validation.errors);
      Alert.alert('Validation Error', 'Please fix the errors before continuing');
      return;
    }

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
        if (state.portfolioType === 'venues') {
          const parseCapacityNumber = (value: string): number | null => {
            const numbers = (value ?? '').match(/\d[\d,]*/g);
            if (!numbers || numbers.length === 0) return null;
            const last = numbers[numbers.length - 1];
            const parsed = parseInt(last.replace(/,/g, ''), 10);
            return Number.isFinite(parsed) ? parsed : null;
          };

          const halls = (state.step2.halls ?? []).map((h) => ({
            name: (h?.name ?? '').trim(),
            capacity: (h?.capacity ?? '').trim(),
          }));
          const hallCapacities = halls
            .map((h) => parseCapacityNumber(h.capacity))
            .filter((n): n is number => typeof n === 'number' && Number.isFinite(n));
          const maxHallCapacity = hallCapacities.length ? Math.max(...hallCapacities) : null;

          const listingName =
            state.step1.tradingName?.trim() ||
            state.step1.registeredBusinessName?.trim() ||
            'Venue Listing';

          try {
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
            };

            await supabase
              .from('venue_listings')
              .upsert(
                {
                  user_id: user.id,
                  name: listingName,
                  description: state.step2.description?.trim() || null,
                  venue_type: state.step2.venueType ?? null,
                  venue_capacity: state.step2.venueCapacity ?? null,
                  capacity: maxHallCapacity,
                  features: nextFeatures,
                } as any,
                { onConflict: 'user_id' },
              );
          } catch (e) {
            console.warn('Failed to persist venue hall capacity details:', e);
          }
        }

        // Send application submission confirmation email
        await sendApplicationConfirmationEmail(submission);
        
        Alert.alert(
          'Application Submitted!',
          'Your application has been submitted successfully. We will review it and get back to you within 3-5 business days.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Reset form and navigate to portfolio profile
                updateStep4({ subscriptionPlan: '', termsAccepted: false, privacyAccepted: false, marketingConsent: false });
                if (state.portfolioType === 'venues') {
                  navigation.navigate('UpdateVenuePortfolio');
                } else {
                  navigation.navigate('UpdateVendorPortfolio');
                }
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

  const sendApplicationConfirmationEmail = async (submission: any) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.log('No user found, cannot send confirmation email');
        return;
      }

      // Get user details from vendors table or user metadata
      const { data: vendor } = await supabase
        .from('vendors')
        .select('name, email')
        .eq('user_id', user.id)
        .maybeSingle();

      const fullName = vendor?.name || user.user_metadata?.full_name || 'Valued Applicant';
      const businessName = submission.company_details?.tradingName || submission.company_details?.registeredBusinessName || vendor?.name || '';

      // Call the Supabase Edge Function to send confirmation email
      const { data, error } = await supabase.functions.invoke('send-vendor-welcome-email', {
        body: {
          email: user.email,
          fullName: fullName,
          businessName: businessName || undefined,
          tierName: submission.subscription_tier || 'Vendor',
          applicationUrl: 'https://funcxon.com/vendor-dashboard',
        },
      });

      if (error) {
        console.error('Error sending application confirmation email:', error);
        return;
      }

      console.log('Application confirmation email sent successfully:', data);
      
      // Send admin notification about new application
      await sendAdminNotification(submission, fullName, businessName, user.email);
    } catch (err) {
      console.error('Failed to send application confirmation email:', err);
    }
  };

  const sendAdminNotification = async (submission: any, fullName: string, businessName: string, vendorEmail: string | undefined) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-admin-notification', {
        body: {
          type: 'vendor-application-submitted',
          vendorName: fullName,
          vendorEmail: vendorEmail,
          businessName: businessName || submission.company_details?.businessName,
          tierName: submission.subscription_tier,
          serviceCategories: submission.service_categories?.categories || [],
          provinces: submission.coverage_provinces || [],
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

          {/* Billing Toggle */}
          <View style={{ flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radii.full, padding: 4, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.borderSubtle }}>
            <TouchableOpacity
              style={{ flex: 1, paddingVertical: spacing.sm, borderRadius: radii.full, alignItems: 'center', backgroundColor: selectedBilling === 'monthly' ? colors.primary : 'transparent' }}
              onPress={() => setSelectedBilling('monthly')}
            >
              <Text style={{ ...typography.caption, color: selectedBilling === 'monthly' ? colors.primaryForeground : colors.textMuted, fontWeight: '500' }}>
                Monthly
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flex: 1, paddingVertical: spacing.sm, borderRadius: radii.full, alignItems: 'center', backgroundColor: selectedBilling === 'yearly' ? colors.primary : 'transparent' }}
              onPress={() => setSelectedBilling('yearly')}
            >
              <Text style={{ ...typography.caption, color: selectedBilling === 'yearly' ? colors.primaryForeground : colors.textMuted, fontWeight: '500' }}>
                Yearly (Save 20%)
              </Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={{ padding: spacing.xl, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.sm }}>Loading plans...</Text>
            </View>
          ) : (
            tiers.map((tier) => {
              const tierKey = normalizeVendorTierKey(tier.tier_name);
              const isSelected = state.step4.subscriptionPlan === tierKey;
              const price = selectedBilling === 'monthly' ? tier.price_monthly : tier.price_yearly;
              const isFree = !price || price === 0;
              const priceLabel = isFree ? 'Free' : `R${Number(price).toLocaleString()}`;
              const isPopular = tier.tier_name.toLowerCase() === 'premium';
              return (
                <TouchableOpacity
                  key={tier.id}
                  onPress={() => updateStep4({ subscriptionPlan: tierKey })}
                  style={{
                    padding: spacing.lg,
                    marginBottom: spacing.md,
                    borderRadius: radii.lg,
                    borderWidth: 2,
                    borderColor: isSelected ? colors.primaryTeal : isPopular ? '#8B5CF6' : colors.borderSubtle,
                    backgroundColor: isSelected ? '#E0F2F7' : colors.surface,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
                    <View>
                      <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>
                        {tier.tier_name.charAt(0).toUpperCase() + tier.tier_name.slice(1)}
                      </Text>
                      <Text style={{ ...typography.body, color: colors.textMuted, marginTop: 2 }}>
                        {priceLabel}/{selectedBilling.slice(0, -2)}ly
                      </Text>
                    </View>
                    {isSelected && <MaterialIcons name="check-circle" size={28} color={colors.primaryTeal} />}
                    {isPopular && !isSelected && (
                      <View style={{ backgroundColor: '#8B5CF6', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radii.sm }}>
                        <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>POPULAR</Text>
                      </View>
                    )}
                  </View>
                  <View style={{ gap: spacing.xs }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <MaterialIcons name="photo-library" size={16} color={colors.primaryTeal} style={{ marginRight: spacing.xs }} />
                      <Text style={{ ...typography.caption, color: colors.textPrimary }}>
                        {tier.photo_limit} photos
                      </Text>
                    </View>
                    {tier.features && Object.entries(tier.features).map(([key, value]) => (
                      <View key={key} style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <MaterialIcons name={value ? 'check' : 'cancel'} size={16} color={value ? colors.primaryTeal : colors.textMuted} style={{ marginRight: spacing.xs }} />
                        <Text style={{ ...typography.caption, color: value ? colors.textPrimary : colors.textMuted }}>
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
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
                  <Text
                    style={{ color: colors.primaryTeal, fontWeight: '600', textDecorationLine: 'underline' }}
                    onPress={() => navigation.navigate('LegalDocument', { documentId: 'terms-and-conditions' })}
                  >
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
                  <Text
                    style={{ color: colors.primaryTeal, fontWeight: '600', textDecorationLine: 'underline' }}
                    onPress={() => navigation.navigate('LegalDocument', { documentId: 'privacy-policy' })}
                  >
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
