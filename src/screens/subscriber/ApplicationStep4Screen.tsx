import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radii, typography } from '../../theme';
import { useApplicationForm } from '../../context/ApplicationFormContext';
import { validateStep4 } from '../../utils/formValidation';
import { ApplicationProgress } from '../../components/ApplicationProgress';
import { getSubscriptionTiers } from '../../lib/subscription';
import { submitApplication, uploadFileToStorage, updateUserRoleToVendor } from '../../lib/applicationService';
import { createGalleryMediaRecord } from '../../lib/mediaUpload';
import { useAuth } from '../../auth/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import ThemedAlert from '../../components/ThemedAlert';
import { useIsDesktop } from '../../hooks/useIsDesktop';

type ProfileStackParamList = {
  AccountMain: undefined;
  ApplicationStep3: undefined;
  ApplicationStep4: undefined;
  ApplicationStatus: undefined;
  SubscriptionCheckout: {
    tierName: string;
    billing: 'monthly' | 'yearly' | '6_month' | '12_month';
    priceLabel: string;
    isFree: boolean;
    productType?: 'vendor' | 'venue';
    planKey?: string;
  };
  Payment: undefined;
  PortfolioProfile: undefined;
  UpdateVenuePortfolio: undefined;
  UpdateVendorPortfolio: undefined;
  ListerPortfolio: undefined;
  LegalDocument: { documentId: string };
};

export default function ApplicationStep4Screen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { state, updateStep4, resetForm, saveDraft } = useApplicationForm();
  const { user } = useAuth();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertState, setAlertState] = useState<{visible: boolean; title: string; message: string; buttons?: any[]} | null>(null);
  const isDesktop = useIsDesktop();
  const cardSurface = isDesktop ? colors.surfaceContainerLowest : colors.surface;
  const cardBorder = isDesktop ? colors.outlineVariant : colors.borderSubtle;
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

  const normalizeTierKey = (rawTierName: string): string => {
    const t = (rawTierName ?? '').trim().toLowerCase();
    // Vendor tier names
    if (t === 'get started' || t === 'get_started' || t === 'free') return 'get_started';
    if (t === 'premium plus' || t === 'premium_plus' || t === 'premiumplus') return 'premium_plus';
    if (t === 'premium') return 'premium';
    // Venue plan keys (already normalised in DB, e.g. 'get_started', 'monthly', '6_month', '12_month')
    return t.replace(/\s+/g, '_');
  };

  useEffect(() => {
    loadTiers();
  }, [state.portfolioType]);

  const selectedTier = tiers.find((tier) => normalizeTierKey(tier.tier_name) === normalizeTierKey(state.step4.subscriptionPlan));
  // Venue plans are monthly-period (6_month/12_month are multi-month lumps, still
  // priced via price_monthly). Prefer price_monthly; fall back to yearly only if monthly missing.
  const selectedTierPrice = selectedTier?.price_monthly ?? selectedTier?.price_yearly ?? null;
  const selectedTierPriceLabel = selectedTierPrice ? `R${Number(selectedTierPrice).toLocaleString()}` : 'Free';
  const isSelectedTierFree = !selectedTierPrice || selectedTierPrice === 0;

  const loadTiers = async () => {
    try {
      if (state.portfolioType === 'venues') {
        // Load venue subscription plans
        const { data, error } = await supabase
          .from('venue_subscription_plans')
          .select('id, plan_key, plan_name, price_monthly, price_yearly, photo_upload_limit, video_upload_limit, features, is_active')
          .eq('is_active', true)
          .order('price_monthly', { ascending: true, nullsFirst: true });
        if (error) {
          console.warn('venue_subscription_plans query failed, using fallback:', error);
        }
        // Map venue plan shape to the shared tier shape used in this screen
        let mapped = (data || []).map((p: any) => ({
          id: p.id,
          tier_name: p.plan_key as string,    // use plan_key so normalizeTierKey matches
          photo_limit: p.photo_upload_limit ?? 5,
          price_monthly: p.price_monthly ?? null,
          price_yearly: p.price_yearly ?? null,
          features: p.features ?? null,
          is_active: p.is_active,
        }));
        // Fallback to hardcoded plans if DB table is empty or missing
        if (mapped.length === 0) {
          mapped = [
            { id: 1, tier_name: 'get_started', photo_limit: 5, price_monthly: 0, price_yearly: 0, features: { video_upload_limit: 0 }, is_active: true },
            { id: 2, tier_name: 'monthly', photo_limit: 40, price_monthly: 1750, price_yearly: null, features: { video_upload_limit: 4 }, is_active: true },
            { id: 3, tier_name: '6_month', photo_limit: 40, price_monthly: 9750, price_yearly: null, features: { video_upload_limit: 4 }, is_active: true },
            { id: 4, tier_name: '12_month', photo_limit: 40, price_monthly: 18000, price_yearly: null, features: { video_upload_limit: 4 }, is_active: true },
          ];
        }
        setTiers(mapped);
        // Auto-select free 'get_started' plan if no plan is selected yet (prevents Page 4 error)
        if (!state.step4.subscriptionPlan) {
          const free = mapped.find((t) => normalizeTierKey(t.tier_name) === 'get_started');
          if (free) {
            updateStep4({ subscriptionPlan: free.tier_name, billingPeriod: 'monthly' });
          }
        }
      } else {
        // Load vendor subscription tiers
        const data = await getSubscriptionTiers();
        setTiers(data);
        // Auto-select free 'get_started' plan if no plan is selected yet
        if (!state.step4.subscriptionPlan && data.length > 0) {
          const free = data.find((t) => normalizeTierKey(t.tier_name) === 'get_started');
          if (free) {
            updateStep4({ subscriptionPlan: free.tier_name, billingPeriod: 'monthly' });
          }
        }
      }
    } catch (error) {
      console.error('Failed to load tiers:', error);
      // Fall back to hardcoded vendor tiers so the user can always select a plan
      if (state.portfolioType !== 'venues') {
        setTiers([
          { id: 1, tier_name: 'get_started', photo_limit: 5, price_monthly: 0, price_yearly: 0, features: { video_upload_limit: 0 }, is_active: true },
          { id: 2, tier_name: 'premium', photo_limit: 25, price_monthly: 299, price_yearly: 3289, features: { video_upload_limit: 5 }, is_active: true },
          { id: 3, tier_name: 'premium_plus', photo_limit: 50, price_monthly: 399, price_yearly: 4389, features: { video_upload_limit: 10 }, is_active: true },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      setAlertState({ visible: true, title: 'Error', message: 'You must be signed in to submit an application' });
      return;
    }

    const validation = validateStep4(state.step4);

    if (!validation.isValid) {
      setErrors(validation.errors);
      const missingFields: string[] = [];
      if (validation.errors.subscriptionPlan) missingFields.push('Subscription plan');
      if (validation.errors.termsAccepted) missingFields.push('Terms & Conditions');
      if (validation.errors.privacyAccepted) missingFields.push('Privacy Policy');
      const message = missingFields.length > 0
        ? `Please complete the following before submitting: ${missingFields.join(', ')}.`
        : 'Please fix the errors before continuing';
      setAlertState({ visible: true, title: 'Incomplete', message });
      return;
    }

    // For paid plans, navigate to SubscriptionCheckout first
    if (!isSelectedTierFree && selectedTier) {
      const billingPeriod = state.step4.billingPeriod || 'monthly';
      const priceLabel = selectedTierPriceLabel;
      const productType = state.portfolioType === 'venues' ? 'venue' : 'vendor';
      const planKey = state.step4.subscriptionPlan;
      const tierName = selectedTier.tier_name;

      // Save form draft before leaving for checkout
      await saveDraft();

      navigation.navigate('SubscriptionCheckout', {
        tierName: tierName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        billing: billingPeriod,
        priceLabel,
        isFree: false,
        productType,
        planKey,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload files to Supabase Storage first
      const uploadedImages = [];
      const uploadedVideos = [];
      const uploadedDocuments = [];
      const uploadErrors = [];

      // Upload images
      for (const image of state.step3.images) {
        const result = await uploadFileToStorage('portfolio-images', image, user.id);
        if (result.success && result.url) {
          uploadedImages.push(result.url);
        } else {
          uploadErrors.push(`Image "${image.name}": ${result.error || 'Upload failed'}`);
        }
      }

      // Upload videos
      for (const video of state.step3.videos) {
        const result = await uploadFileToStorage('portfolio-videos', video, user.id);
        if (result.success && result.url) {
          uploadedVideos.push(result.url);
        } else {
          uploadErrors.push(`Video "${video.name}": ${result.error || 'Upload failed'}`);
        }
      }

      // Upload business documents
      for (const doc of state.step3.documents) {
        const isImage = doc.type.startsWith('image/');
        const bucket = isImage ? 'portfolio-images' : 'business-documents';
        const result = await uploadFileToStorage(bucket, doc, user.id);
        if (result.success && result.url) {
          uploadedDocuments.push(result.url);
        } else {
          uploadErrors.push(`Document "${doc.name}": ${result.error || 'Upload failed'}`);
        }
      }

      // If any uploads failed, show error and prevent submission
      if (uploadErrors.length > 0) {
        console.error('Upload errors:', uploadErrors);
        setAlertState({ visible: true, title: 'Upload Failed', message: `Some files could not be uploaded:\n\n${uploadErrors.join('\n')}\n\nPlease try again or contact support.`, buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
        return;
      }

      console.log(`Successfully uploaded ${uploadedImages.length} images, ${uploadedVideos.length} videos, ${uploadedDocuments.length} documents`);

      // Submit application to database
      const portfolioType = state.portfolioType === 'venues' ? 'venue' as const : 'vendor' as const;
      
      const submission = {
        existing_application_id: state.editingApplicationId,
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
        let createdListingId: string | number | null = null;
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
              venueTypes: state.step2.venueType,
            };

            const { data: upsertedListing, error: listingError } = await supabase
              .from('venue_listings')
              .upsert(
                {
                  user_id: user.id,
                  name: listingName,
                  description: state.step2.description?.trim() || null,
                  location: state.step1.businessPhysicalAddress?.trim() || null,
                  address_line_1: state.step1.businessPhysicalAddress?.trim() || null,
                  city: state.step2.cities?.[0] || null,
                  province: state.step2.provinces?.[0] || null,
                  country: 'South Africa',
                  contact_email: state.step1.email?.trim() || state.step1.userEmail?.trim() || null,
                  whatsapp_number: state.step1.userWhatsapp?.trim() || state.step1.contactPhoneNumber?.trim() || null,
                  instagram_url: state.step1.instagram?.trim() || null,
                  facebook_url: state.step1.facebook?.trim() || null,
                  tiktok_url: state.step1.tiktok?.trim() || null,
                  venue_type: state.step2.venueType.join(', ') || null,
                  venue_capacity: state.step2.venueCapacity ?? null,
                  amenities: state.step2.amenities,
                  event_types: state.step2.eventTypes,
                  provinces: state.step2.provinces,
                  cities: state.step2.cities,
                  features: nextFeatures,
                  image_url: uploadedImages[0] || null,
                  subscription_plan: state.step4.subscriptionPlan,
                  subscription_status: 'active',
                } as any,
                { onConflict: 'user_id' },
              )
              .select('id')
              .single();

            if (listingError) {
              console.error('Venue listing upsert error:', listingError);
              throw listingError;
            }

            const venueId = upsertedListing?.id;
            createdListingId = venueId ?? null;
            if (venueId) {
              for (const imageUrl of uploadedImages) {
                await createGalleryMediaRecord(imageUrl, 'image', { venueId });
              }
              for (const videoUrl of uploadedVideos) {
                await createGalleryMediaRecord(videoUrl, 'video', { venueId });
              }
            }
          } catch (e: any) {
            console.error('Failed to create venue listing from application:', e);
            setAlertState({ visible: true, title: 'Portfolio Setup Issue', message: 'Your application was submitted, but we could not fully set up your venue listing. You can update it manually from your account.', buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
          }
        }

        // Create vendor/venue record directly (for both free and paid plans)
        let portfolioCreated = false;
        try {
          if (state.portfolioType === 'venues' && user?.id) {
            const venueListingName =
              state.step1.tradingName?.trim() ||
              state.step1.registeredBusinessName?.trim() ||
              'Venue Listing';

            const { error: venueRecordError } = await supabase.from('venues').upsert(
              {
                user_id: user.id,
                name: venueListingName,
                description: state.step2.description?.trim() || null,
                location: state.step1.businessPhysicalAddress?.trim() || null,
                subscription_plan_key: state.step4.subscriptionPlan,
                subscription_status: 'active',
                billing_period: state.step4.billingPeriod || 'monthly',
                billing_email: state.step1.email?.trim() || null,
                billing_name: state.step1.ownersName?.trim() || null,
                billing_phone: state.step1.contactPhoneNumber?.trim() || null,
                subscription_started_at: new Date().toISOString(),
              },
              { onConflict: 'user_id' },
            );

            if (venueRecordError) {
              console.error('Venues table upsert error:', venueRecordError);
              throw venueRecordError;
            }
            portfolioCreated = true;
          } else if (user?.id) {
            // Build rich vendor record from application data
            const listingName =
              state.step1.tradingName?.trim() ||
              state.step1.registeredBusinessName?.trim() ||
              'Vendor Listing';

            const vendorPayload = {
              user_id: user.id,
              name: listingName,
              description: state.step2.description?.trim() || null,
              location: state.step1.businessPhysicalAddress?.trim() || null,
              email: state.step1.email?.trim() || null,
              whatsapp_number: state.step1.contactPhoneNumber?.trim() || null,
              instagram_url: state.step1.instagram?.trim() || null,
              facebook_url: state.step1.facebook?.trim() || null,
              tiktok_url: state.step1.tiktok?.trim() || null,
              image_url: uploadedImages[0] || null,
              subscription_tier: normalizeTierKey(state.step4.subscriptionPlan),
              subscription_status: 'active',
              billing_period: state.step4.billingPeriod || 'monthly',
              billing_email: state.step1.email?.trim() || null,
              billing_name: state.step1.ownersName?.trim() || null,
              billing_phone: state.step1.contactPhoneNumber?.trim() || null,
              subscription_started_at: new Date().toISOString(),
              service_options: state.step2.serviceCategories ?? [],
              vendor_tags: state.step2.serviceSubcategories ?? [],
            };

            // Use select-then-insert/update for maximum compatibility
            const { data: existingVendor } = await supabase
              .from('vendors')
              .select('id')
              .eq('user_id', user.id)
              .maybeSingle();

            let vendorId: number | null = existingVendor?.id ?? null;
            createdListingId = vendorId;

            if (vendorId) {
              const { error: updateError } = await supabase
                .from('vendors')
                .update(vendorPayload)
                .eq('id', vendorId);
              if (updateError) throw updateError;
            } else {
              const { data: insertedVendor, error: insertError } = await supabase
                .from('vendors')
                .insert(vendorPayload)
                .select('id')
                .single();
              if (insertError) throw insertError;
              vendorId = insertedVendor?.id ?? null;
            }

            if (vendorId) {
              for (const imageUrl of uploadedImages) {
                await createGalleryMediaRecord(imageUrl, 'image', { vendorId });
              }
              for (const videoUrl of uploadedVideos) {
                await createGalleryMediaRecord(videoUrl, 'video', { vendorId });
              }
            }

            portfolioCreated = true;
          }
        } catch (e: any) {
          console.error('Failed to create portfolio record:', e);
          setAlertState({ visible: true, title: 'Portfolio Created', message: 'Your application was submitted successfully, but we had a minor issue setting up your portfolio. You can retry from your account screen.', buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
        }

        if (portfolioCreated) {
          try {
            await updateUserRoleToVendor();
          } catch (e) {
            console.error('Failed to update user role after portfolio creation:', e);
          }
        }

        // Send application submission confirmation email (after portfolio creation so we can include listing ID)
        await sendApplicationConfirmationEmail(submission, createdListingId);

        // Reset form and navigate to the Lister Portfolio Dashboard on success.
        // Navigate to the Account tab first so the user lands on the Lister Portfolio
        // screen in the correct tab stack, then reset the Profile stack to
        // ListerPortfolio. The Profile stack navigator's parent IS the RootNavigator
        // (bottom Tab navigator), so getParent() returns the tab navigator.
        const tabNav = (navigation as any).getParent?.() as any;
        resetForm();
        if (tabNav?.navigate) {
          tabNav.navigate('Account', { screen: 'ListerPortfolio' });
        }
        // Also reset the Profile stack so back from ListerPortfolio doesn't go
        // back to Step 4.
        navigation.reset({
          index: 0,
          routes: [{ name: 'ListerPortfolio' }],
        });
      } else {
        setAlertState({ visible: true, title: 'Submission Failed', message: result.error || 'Failed to submit application. Please try again.' });
      }
    } catch (error) {
      console.error('Submit application error:', error);
      setAlertState({ visible: true, title: 'Error', message: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendApplicationConfirmationEmail = async (submission: any, listingId?: string | number | null) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.log('No user found, cannot send confirmation email');
        return;
      }

      // Get user details from the appropriate table based on portfolio type
      let profileRecord: { name?: string; email?: string } | null = null;
      if (state.portfolioType === 'venues') {
        const { data } = await supabase
          .from('venue_listings')
          .select('name')
          .eq('user_id', user.id)
          .maybeSingle();
        profileRecord = data ? { name: (data as any).name } : null;
      } else {
        const { data } = await supabase
          .from('vendors')
          .select('name, email')
          .eq('user_id', user.id)
          .maybeSingle();
        profileRecord = data;
      }

      const fullName = profileRecord?.name || user.user_metadata?.full_name || 'Valued Applicant';
      const businessName = submission.company_details?.tradingName || submission.company_details?.registeredBusinessName || profileRecord?.name || '';

      // Call the Supabase Edge Function to send confirmation email
      const isVenue = state.portfolioType === 'venues';
      const catalogueUrl = isVenue ? 'https://funxon.co.za/venue-catalogue' : 'https://funxon.co.za/vendor-catalogue';

      const { data, error } = await supabase.functions.invoke('send-application-status-email', {
        body: {
          email: user.email,
          fullName: fullName,
          businessName: businessName || undefined,
          tierName: submission.subscription_tier || (isVenue ? 'Venue' : 'Vendor'),
          applicationUrl: 'https://funxon.co.za/account/application-status',
          status: 'approved',
          catalogueUrl,
        },
      });

      if (error) {
        console.error('Error sending application confirmation email:', error);
        return;
      }

      console.log('Application confirmation email sent successfully:', data);
      
      // Send admin notification about new application
      await sendAdminNotification(submission, fullName, businessName, user.email, listingId);
    } catch (err) {
      console.error('Failed to send application confirmation email:', err);
    }
  };

  const sendAdminNotification = async (submission: any, fullName: string, businessName: string, vendorEmail: string | undefined, listingId?: string | number | null) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-admin-notification', {
        body: {
          type: state.portfolioType === 'venues' ? 'venue-application-submitted' : 'vendor-application-submitted',
          vendorName: fullName,
          vendorEmail: vendorEmail,
          businessName: businessName || submission.company_details?.businessName,
          tierName: submission.subscription_tier,
          serviceCategories: submission.service_categories?.categories || [],
          provinces: submission.coverage_provinces || [],
          portfolioType: state.portfolioType === 'venues' ? 'venue' : 'vendor',
          listingId: listingId ?? undefined,
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

  const desktopContainerStyle = {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center' as const,
    paddingHorizontal: 48,
    paddingBottom: spacing.xxl * 6,
  };

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
          <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}
            >
              <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
              <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>
                Back
              </Text>
            </TouchableOpacity>

          <View style={{ marginBottom: spacing.lg, maxWidth: isDesktop ? 800 : undefined, width: isDesktop ? '100%' : undefined, alignSelf: isDesktop ? 'center' as const : undefined }}>
            <View style={{ marginBottom: spacing.md, alignSelf: 'flex-start' }}>
              <ApplicationProgress currentStep={4} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
              <MaterialIcons name="card-membership" size={32} color={colors.textPrimary} />
              <View style={{ flex: 1 }}>
                <Text style={isDesktop ? { ...typography.headlineMd, color: colors.primary } as any : { ...typography.titleMedium, color: colors.textPrimary }}>
                  Subscription & Legal
                </Text>
                <Text style={isDesktop ? { ...typography.bodyMd, color: colors.onSurfaceVariant } as any : { ...typography.caption, color: colors.textMuted }}>
                  Page 4 of 4
                </Text>
              </View>
            </View>
          </View>

          <View style={{ maxWidth: isDesktop ? 800 : undefined, width: isDesktop ? '100%' : undefined, alignSelf: isDesktop ? 'center' as const : undefined }}>
          {/* Subscription Package Selection */}
          <View
            style={{
              backgroundColor: cardSurface,
              borderRadius: radii.lg,
              padding: spacing.lg,
              marginBottom: spacing.lg,
              borderWidth: 1,
              borderColor: cardBorder,
              shadowColor: '#000',
              shadowOpacity: 0.05,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            }}
          >
            <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
              Subscription Package *
            </Text>
            <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.lg }}>
              Select the plan that best fits your business needs
            </Text>

            {loading ? (
              <View style={{ padding: spacing.xl, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.sm }}>Loading plans...</Text>
              </View>
            ) : tiers.length === 0 ? (
              <View
                style={{
                  padding: spacing.lg,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: '#F59E0B',
                  backgroundColor: '#FFFBEB',
                }}
              >
                <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary }}>
                  No plans available
                </Text>
              </View>
            ) : (
              <View style={{ gap: spacing.sm }}>
                {tiers.map((tier) => {
                  const isSelected = normalizeTierKey(state.step4.subscriptionPlan) === normalizeTierKey(tier.tier_name);
                  const price = tier.price_monthly ?? tier.price_yearly ?? 0;
                  const isFree = price === 0;
                  return (
                    <TouchableOpacity
                      key={tier.id}
                      onPress={() => {
                        const billing = state.portfolioType === 'venues'
                          ? (tier.tier_name === 'get_started' ? 'monthly' : tier.tier_name as any)
                          : 'monthly';
                        updateStep4({ subscriptionPlan: tier.tier_name, billingPeriod: billing });
                        if (errors.subscriptionPlan) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.subscriptionPlan;
                            return next;
                          });
                        }
                      }}
                      activeOpacity={0.9}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: spacing.md,
                        borderRadius: radii.lg,
                        borderWidth: 2,
                        borderColor: isSelected ? colors.cta : cardBorder,
                        backgroundColor: isSelected ? '#f2f7ff' : cardSurface,
                      }}
                    >
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          borderWidth: 2,
                          borderColor: isSelected ? colors.cta : colors.borderStrong,
                          backgroundColor: isSelected ? colors.cta : cardSurface,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: spacing.md,
                        }}
                      >
                        {isSelected && <MaterialIcons name="check" size={16} color="#FFFFFF" />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary }}>
                          {tier.tier_name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                        </Text>
                        <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: 2 }}>
                          {isFree ? 'Free' : `R${Number(price).toLocaleString()}`} — {tier.photo_limit} photos
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
            {errors.subscriptionPlan && (
              <Text style={{ ...typography.caption, fontSize: 12, color: '#EF4444', marginTop: spacing.xs }}>
                {errors.subscriptionPlan}
              </Text>
            )}
          </View>

          {/* Legal Agreements */}
          <View
            style={{
              backgroundColor: cardSurface,
              borderRadius: radii.lg,
              padding: spacing.lg,
              marginBottom: spacing.lg,
              borderWidth: 1,
              borderColor: cardBorder,
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
                  borderColor: errors.termsAccepted ? '#EF4444' : state.step4.termsAccepted ? colors.cta : cardBorder,
                  backgroundColor: state.step4.termsAccepted ? colors.cta : cardSurface,
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
                    style={{ ...typography.captionSemiBold, color: colors.textPrimary, textDecorationLine: 'underline' }}
                    onPress={() => navigation.navigate('LegalDocument', { documentId: 'terms-and-conditions' })}
                  >
                    Terms and Conditions
                  </Text>{' '}
                  *
                </Text>
                {errors.termsAccepted && (
                  <Text style={{ ...typography.caption, fontSize: 12, color: '#EF4444', marginTop: 4 }}>
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
                  borderColor: errors.privacyAccepted ? '#EF4444' : state.step4.privacyAccepted ? colors.cta : cardBorder,
                  backgroundColor: state.step4.privacyAccepted ? colors.cta : cardSurface,
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
                    style={{ ...typography.captionSemiBold, color: colors.textPrimary, textDecorationLine: 'underline' }}
                    onPress={() => navigation.navigate('LegalDocument', { documentId: 'privacy-policy' })}
                  >
                    Privacy Policy
                  </Text>{' '}
                  *
                </Text>
                {errors.privacyAccepted && (
                  <Text style={{ ...typography.caption, fontSize: 12, color: '#EF4444', marginTop: 4 }}>
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
                  borderColor: state.step4.marketingConsent ? colors.cta : cardBorder,
                  backgroundColor: state.step4.marketingConsent ? colors.cta : cardSurface,
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
              backgroundColor: '#f2f7ff',
              borderRadius: radii.md,
              padding: spacing.md,
              flexDirection: 'row',
              marginBottom: spacing.lg,
            }}
          >
            <MaterialIcons name="info" size={20} color={colors.textPrimary} style={{ marginRight: spacing.sm }} />
            <View style={{ flex: 1 }}>
              <Text style={{ ...typography.caption, color: colors.textPrimary }}>
                By continuing, you confirm your selected subscription plan and agree to the terms below. Free plans go live immediately; paid plans require checkout first.
              </Text>
            </View>
          </View>

          {/* Navigation Buttons */}
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                flex: 1,
                backgroundColor: cardSurface,
                borderWidth: 1,
                borderColor: colors.primary,
                paddingVertical: spacing.md,
                borderRadius: radii.md,
                alignItems: 'center',
              }}
            >
              <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary, fontSize: 13 }}>
                Back
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={{
                flex: 1,
                backgroundColor: isSubmitting ? cardBorder : colors.cta,
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
                  <Text style={{ ...typography.bodySemiBold, color: '#FFFFFF', fontSize: 13 }}>
                    {isSelectedTierFree ? 'Submitting...' : 'Processing...'}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={{ ...typography.bodySemiBold, color: '#FFFFFF', fontSize: 13, marginRight: spacing.xs }}>
                    {isSelectedTierFree ? 'Submit Application' : 'Checkout'}
                  </Text>
                  <MaterialIcons name={isSelectedTierFree ? 'check-circle' : 'shopping-cart'} size={14} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>
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
