import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radii, spacing, typography } from '../../theme';
import type { ProfileStackParamList } from '../../navigation/ProfileNavigator';
import { cancelApplication, getLatestUserApplication, isBlockingApplicationStatus, type SubscriberApplication } from '../../lib/applicationService';
import { useApplicationForm, type ApplicationFormState } from '../../context/ApplicationFormContext';

const formatStatusLabel = (status?: string | null) => {
  const normalized = String(status ?? 'pending').replace(/_/g, ' ').trim();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const getStatusTone = (status?: string | null) => {
  const normalized = String(status ?? 'pending').toLowerCase();
  if (normalized === 'approved') {
    return {
      bg: '#DCFCE7',
      border: '#86EFAC',
      text: '#166534',
      icon: 'check-circle' as const,
    };
  }

  if (normalized === 'rejected') {
    return {
      bg: '#FEE2E2',
      border: '#FCA5A5',
      text: '#991B1B',
      icon: 'cancel' as const,
    };
  }

  return {
    bg: '#FEF3C7',
    border: '#FCD34D',
    text: '#92400E',
    icon: 'schedule' as const,
  };
};

const formatDate = (value?: string | null) => {
  if (!value) return 'Recently submitted';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently submitted';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export default function ApplicationStatusScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { hydrateForm } = useApplicationForm();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [application, setApplication] = useState<SubscriberApplication | null>(null);

  const loadApplication = useCallback(async () => {
    const result = await getLatestUserApplication();
    if (result.success) {
      setApplication(result.data ?? null);
    } else {
      setApplication(null);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function run() {
        setLoading(true);
        await loadApplication();
        if (isActive) {
          setLoading(false);
        }
      }

      run();

      return () => {
        isActive = false;
      };
    }, [loadApplication]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadApplication();
    setRefreshing(false);
  };

  const statusTone = getStatusTone(application?.status);
  const tradingName = application?.company_details?.tradingName || application?.company_details?.registeredBusinessName || 'Your application';
  const packageName = application?.subscription_tier ? application.subscription_tier.replace(/_/g, ' ') : 'Not available';
  const statusLabel = formatStatusLabel(application?.status);
  const hasBlockingApplication = isBlockingApplicationStatus(application?.status);
  const needsChanges = String(application?.status ?? '').toLowerCase() === 'needs_changes';
  const adminNotes = typeof (application as { admin_notes?: string | null } | null)?.admin_notes === 'string'
    ? (application as { admin_notes?: string | null }).admin_notes ?? ''
    : '';

  const handleCancelApplication = () => {
    if (!application?.id || !hasBlockingApplication || cancelling) {
      return;
    }

    Alert.alert('Cancel Application', 'Are you sure you want to cancel your application?', [
      {
        text: 'Keep Application',
        style: 'cancel',
      },
      {
        text: 'Cancel Application',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          const result = await cancelApplication(application.id);
          setCancelling(false);

          if (!result.success) {
            Alert.alert('Cancellation failed', result.error || 'We could not cancel your application right now.');
            return;
          }

          await loadApplication();
          Alert.alert('Application cancelled', 'Your application has been cancelled. You can now create a new application.');
        },
      },
    ]);
  };

  const handleUpdateApplication = () => {
    if (!application || !needsChanges) {
      return;
    }

    const nextState: ApplicationFormState = {
      editingApplicationId: application.id,
      portfolioType: application.portfolio_type === 'venue' ? 'venues' : 'vendors',
      step1: {
        registeredBusinessName: application.company_details?.registeredBusinessName ?? '',
        tradingName: application.company_details?.tradingName ?? '',
        funcxonUserName: application.company_details?.funcxonUserName ?? '',
        userWhatsapp: application.company_details?.userWhatsapp ?? '',
        userEmail: application.company_details?.userEmail ?? '',
        ownersName: application.company_details?.ownersName ?? '',
        companyRegNumber: application.company_details?.companyRegNumber ?? '',
        vatNumber: application.company_details?.vatNumber ?? '',
        businessPhysicalAddress: application.company_details?.businessPhysicalAddress ?? '',
        billingAddress: application.company_details?.billingAddress ?? '',
        contactPhoneNumber: application.company_details?.contactPhoneNumber ?? '',
        alternatePhone1: application.company_details?.alternatePhone1 ?? '',
        alternatePhone2: application.company_details?.alternatePhone2 ?? '',
        email: application.company_details?.email ?? '',
        alternateEmail: application.company_details?.alternateEmail ?? '',
        instagram: application.company_details?.instagram ?? '',
        facebook: application.company_details?.facebook ?? '',
        tiktok: application.company_details?.tiktok ?? '',
        linkedin: application.company_details?.linkedin ?? '',
        website: application.company_details?.website ?? '',
        accountHolderName: application.company_details?.accountHolderName ?? '',
        bank: application.company_details?.bank ?? '',
        branch: application.company_details?.branch ?? '',
        branchCode: application.company_details?.branchCode ?? '',
        accountNumber: application.company_details?.accountNumber ?? '',
      },
      step2: {
        venueType: application.service_categories?.venueType ?? '',
        venueCapacity: application.service_categories?.venueCapacity ?? '',
        amenities: application.service_categories?.amenities ?? [],
        eventTypes: application.service_categories?.eventTypes ?? [],
        awardsAndNominations: application.service_categories?.awardsAndNominations ?? '',
        browserTags: application.service_categories?.browserTags ?? '',
        halls: application.service_categories?.halls ?? Array.from({ length: 5 }, () => ({ name: '', capacity: '' })),
        paymentTermsAndConditions: application.service_categories?.paymentTermsAndConditions ?? '',
        serviceCategories: application.service_categories?.serviceCategories ?? [],
        serviceSubcategories: application.service_categories?.serviceSubcategories ?? [],
        provinces: application.coverage_provinces ?? application.service_categories?.provinces ?? [],
        cities: application.coverage_cities ?? application.service_categories?.cities ?? [],
        specialFeatures: application.service_categories?.specialFeatures ?? [],
        description: application.business_description ?? application.service_categories?.description ?? '',
      },
      step3: {
        documents: [],
        images: [],
        videos: [],
      },
      step4: {
        subscriptionPlan: application.subscription_tier ?? '',
        termsAccepted: Boolean(application.terms_accepted),
        privacyAccepted: Boolean(application.privacy_accepted),
        marketingConsent: Boolean(application.marketing_consent),
      },
    };

    hydrateForm(nextState);
    navigation.navigate('ApplicationStep1');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primaryTeal} />}
      >
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xl }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('AccountMain')}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}
          >
            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
            <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>
              Back to My Account
            </Text>
          </TouchableOpacity>

          <View style={{ marginBottom: spacing.lg }}>
            <Text style={{ ...typography.displayMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
              Application Status
            </Text>
            <Text style={{ ...typography.body, color: colors.textMuted }}>
              Track your latest portfolio application and wait for approval before making changes.
            </Text>
          </View>

          {loading ? (
            <View style={{ paddingVertical: spacing.xxl, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={colors.primaryTeal} />
              <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.sm }}>
                Loading application status...
              </Text>
            </View>
          ) : !application ? (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: radii.lg,
                padding: spacing.lg,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
              }}
            >
              <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.sm }}>
                No application found
              </Text>
              <Text style={{ ...typography.body, color: colors.textMuted, marginBottom: spacing.lg }}>
                We could not find a submitted application for your account yet.
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('PortfolioType')}
                style={{
                  alignSelf: 'flex-start',
                  backgroundColor: colors.primaryTeal,
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.md,
                  borderRadius: radii.md,
                }}
              >
                <Text style={{ ...typography.body, color: '#FFFFFF', fontWeight: '600' }}>
                  Start Application
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {hasBlockingApplication ? (
                <View
                  style={{
                    backgroundColor: '#FFF7ED',
                    borderRadius: radii.lg,
                    padding: spacing.lg,
                    borderWidth: 1,
                    borderColor: '#FDBA74',
                    marginBottom: spacing.lg,
                  }}
                >
                  <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
                    Existing application in progress
                  </Text>
                  <Text style={{ ...typography.body, color: colors.textPrimary }}>
                    You already have an existing application that is pending. Please wait for feedback, or cancel it below if you want to submit a new one.
                  </Text>
                  <TouchableOpacity
                    onPress={handleCancelApplication}
                    disabled={cancelling}
                    style={{
                      alignSelf: 'flex-start',
                      backgroundColor: cancelling ? colors.textMuted : colors.primaryTeal,
                      paddingHorizontal: spacing.lg,
                      paddingVertical: spacing.md,
                      borderRadius: radii.md,
                    }}
                  >
                    <Text style={{ ...typography.body, color: '#FFFFFF', fontWeight: '600' }}>
                      {cancelling ? 'Cancelling...' : 'Cancel Application'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              <View
                style={{
                  backgroundColor: statusTone.bg,
                  borderRadius: radii.lg,
                  padding: spacing.lg,
                  borderWidth: 1,
                  borderColor: statusTone.border,
                  marginBottom: spacing.lg,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                  <MaterialIcons name={statusTone.icon} size={22} color={statusTone.text} />
                  <Text style={{ ...typography.titleMedium, color: statusTone.text, marginLeft: spacing.sm }}>
                    {statusLabel}
                  </Text>
                </View>
                <Text style={{ ...typography.body, color: colors.textPrimary }}>
                  {hasBlockingApplication
                    ? 'Your application is under review. While it is pending, you cannot edit or resubmit the application.'
                    : needsChanges
                      ? 'Your application needs a few updates before it can be approved. Review the admin notes below, update your details, and resubmit the application.'
                      : String(application.status ?? '').toLowerCase() === 'approved'
                        ? 'Your application has been approved. Your listing team will contact you if anything else is needed.'
                        : String(application.status ?? '').toLowerCase() === 'cancelled'
                          ? 'This application has been cancelled and will no longer be processed by the Funcxon team. You can start a new application when you are ready.'
                          : 'Your application has been reviewed. Please wait for further guidance from the Funcxon team.'}
                </Text>
              </View>

              {needsChanges && adminNotes ? (
                <View
                  style={{
                    backgroundColor: '#FFF7ED',
                    borderRadius: radii.lg,
                    padding: spacing.lg,
                    borderWidth: 1,
                    borderColor: '#FDBA74',
                    marginBottom: spacing.lg,
                  }}
                >
                  <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.sm }}>
                    Admin notes
                  </Text>
                  <Text style={{ ...typography.body, color: colors.textPrimary }}>
                    {adminNotes}
                  </Text>
                </View>
              ) : null}

              {needsChanges ? (
                <TouchableOpacity
                  onPress={handleUpdateApplication}
                  style={{
                    backgroundColor: colors.primaryTeal,
                    borderRadius: radii.lg,
                    paddingVertical: spacing.md,
                    alignItems: 'center',
                    marginBottom: spacing.lg,
                  }}
                >
                  <Text style={{ ...typography.body, color: '#FFFFFF', fontWeight: '700' }}>
                    Update Application
                  </Text>
                </TouchableOpacity>
              ) : null}

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
                <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>
                  Submission Summary
                </Text>
                <View style={{ gap: spacing.md }}>
                  <View>
                    <Text style={{ ...typography.caption, color: colors.textMuted }}>Business</Text>
                    <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>{tradingName}</Text>
                  </View>
                  <View>
                    <Text style={{ ...typography.caption, color: colors.textMuted }}>Portfolio Type</Text>
                    <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
                      {application.portfolio_type === 'venue' ? 'Venue' : 'Vendor / Service Professional'}
                    </Text>
                  </View>
                  <View>
                    <Text style={{ ...typography.caption, color: colors.textMuted }}>Selected Package</Text>
                    <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
                      {formatStatusLabel(packageName)}
                    </Text>
                  </View>
                  <View>
                    <Text style={{ ...typography.caption, color: colors.textMuted }}>Submitted</Text>
                    <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
                      {formatDate(application.created_at)}
                    </Text>
                  </View>
                </View>
              </View>

              <View
                style={{
                  backgroundColor: '#E0F2F7',
                  borderRadius: radii.lg,
                  padding: spacing.lg,
                  borderWidth: 1,
                  borderColor: '#B6E3EE',
                }}
              >
                <Text style={{ ...typography.body, color: colors.textPrimary }}>
                  We aim to review applications within 12 to 24 hours. You can return here any time to check the latest status.
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
