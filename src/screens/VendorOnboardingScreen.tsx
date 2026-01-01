import { useState } from 'react';
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';

import { supabase } from '../lib/supabaseClient';
import { colors, spacing, radii, typography } from '../theme';
import { PrimaryButton, OutlineButton, ThemedInput } from '../components/ui';
import type { VendorStackParamList } from '../navigation/VendorNavigator';

type Props = NativeStackScreenProps<VendorStackParamList, 'VendorOnboarding'>;

type OnboardingStep = 1 | 2 | 3;

type FormData = {
  // Step 1: Business Information
  businessName: string;
  registeredCompanyName: string;
  businessType: string;
  companyRegNumber: string;
  idNumber: string;
  vatNumber: string;
  businessDescription: string;
  yearEstablished: string;

  // Contact Details
  officePhone: string;
  websiteUrl: string;
  instagramUrl: string;
  facebookUrl: string;
  primaryContactName: string;
  primaryContactMobile: string;
  primaryContactEmail: string;

  // Physical Details
  physicalAddress: string;
  city: string;
  province: string;
  postalCode: string;

  // Step 2: Services & Pricing
  serviceCategories: string[];
  detailedOfferings: string[];
  uniqueSellingPoints: string[];
  pricingStructure: string[];
  startingPriceFrom: string;
};

type UploadedDocument = {
  id: number;
  file_name: string | null;
  document_type: string;
};

type UploadedPortfolioItem = {
  path: string;
  file_name: string | null;
};

export default function VendorOnboardingScreen({ navigation, route }: Props) {
  const { vendorId } = route.params;
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [formData, setFormData] = useState<FormData>({
    businessName: '',
    registeredCompanyName: '',
    businessType: '',
    companyRegNumber: '',
    idNumber: '',
    vatNumber: '',
    businessDescription: '',
    yearEstablished: '',
    officePhone: '',
    websiteUrl: '',
    instagramUrl: '',
    facebookUrl: '',
    primaryContactName: '',
    primaryContactMobile: '',
    primaryContactEmail: '',
    physicalAddress: '',
    city: '',
    province: '',
    postalCode: '',
    serviceCategories: [],
    detailedOfferings: [],
    uniqueSellingPoints: [],
    pricingStructure: [],
    startingPriceFrom: '',
  });

  const updateField = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as OnboardingStep);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as OnboardingStep);
    }
  };

  const [uploading, setUploading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
  const [selectedDocType, setSelectedDocType] = useState<string>('other');
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  const [portfolioItems, setPortfolioItems] = useState<UploadedPortfolioItem[]>([]);

  const handleSubmit = async () => {
    try {
      const payload = {
        vendor_id: vendorId,
        company_name: formData.businessName || null,
        registration_number: formData.companyRegNumber || null,
        owner_name: formData.registeredCompanyName || null,
        business_type: formData.businessType || null,
        vat_number: formData.vatNumber || null,
        business_description: formData.businessDescription || null,
        year_established: formData.yearEstablished
          ? Number.parseInt(formData.yearEstablished, 10)
          : null,
        contact_phone: formData.officePhone || null,
        website_url: formData.websiteUrl || null,
        instagram_url: formData.instagramUrl || null,
        facebook_url: formData.facebookUrl || null,
        primary_contact_name: formData.primaryContactName || null,
        primary_contact_mobile: formData.primaryContactMobile || null,
        primary_contact_email: formData.primaryContactEmail || null,
        billing_address: formData.physicalAddress || null,
        location_address: formData.physicalAddress || null,
        city: formData.city || null,
        province: formData.province || null,
        postal_code: formData.postalCode || null,
        starting_price_from: formData.startingPriceFrom
          ? Number.parseFloat(formData.startingPriceFrom)
          : null,
        onboarding_step: 3,
        onboarding_completed: true,
      };

      const { error } = await supabase
        .from('vendor_registrations')
        .upsert({ ...payload, id_number: formData.idNumber || '0000000000000' }, { onConflict: 'vendor_id' });

      if (error) {
        console.error('Failed to save vendor_registrations', error);
        return;
      }

      navigation.goBack();
    } catch (err) {
      console.error('Unexpected error submitting onboarding', err);
    }
  };

  const handlePickAndUploadDocument = async () => {
    try {
      setUploading(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setUploading(false);
        return;
      }

      const asset = result.assets[0];

      // Expo DocumentPicker gives us a URI; we need to fetch the file contents as a blob
      const response = await fetch(asset.uri);
      const blob = await response.blob();

      const fileExt = asset.name?.split('.').pop() ?? 'dat';
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${vendorId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('vendor-documents')
        .upload(filePath, blob, {
          contentType: asset.mimeType ?? 'application/octet-stream',
        });

      if (uploadError) {
        console.error('Upload error', uploadError);
        setUploading(false);
        return;
      }

      const { data: inserted, error: insertError } = await supabase
        .from('vendor_documents')
        .insert({
          vendor_id: vendorId,
          document_type: selectedDocType,
          document_url: filePath,
          file_name: asset.name ?? fileName,
          file_size_bytes: asset.size ?? null,
          mime_type: asset.mimeType ?? null,
        })
        .select('id, file_name, document_type')
        .single();

      if (insertError) {
        console.error('Insert vendor_documents error', insertError);
        setUploading(false);
        return;
      }

      setUploadedDocs((prev) => [...prev, inserted as UploadedDocument]);
    } catch (err) {
      console.error('Unexpected upload error', err);
    } finally {
      setUploading(false);
    }
  };

  const handlePickAndUploadPortfolioItem = async () => {
    try {
      setUploadingPortfolio(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'video/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setUploadingPortfolio(false);
        return;
      }

      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const blob = await response.blob();

      const fileExt = asset.name?.split('.').pop() ?? 'dat';
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${vendorId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('vendor-portfolio')
        .upload(filePath, blob, {
          contentType: asset.mimeType ?? 'application/octet-stream',
        });

      if (uploadError) {
        console.error('Portfolio upload error', uploadError);
        setUploadingPortfolio(false);
        return;
      }

      setPortfolioItems((prev) => [...prev, { path: filePath, file_name: asset.name ?? fileName }]);
    } catch (err) {
      console.error('Unexpected portfolio upload error', err);
    } finally {
      setUploadingPortfolio(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Progress Indicator */}
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.xl,
          paddingBottom: spacing.md,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderSubtle,
        }}
      >
        {[1, 2, 3].map((step) => (
          <View
            key={step}
            style={{
              flex: 1,
              marginHorizontal: spacing.xs,
            }}
          >
            <View
              style={{
                height: 4,
                borderRadius: radii.full,
                backgroundColor: step <= currentStep ? colors.primary : colors.borderSubtle,
              }}
            />
            <Text
              style={{
                marginTop: spacing.xs,
                ...typography.caption,
                color: step <= currentStep ? colors.textPrimary : colors.textMuted,
                textAlign: 'center',
              }}
            >
              {step === 1 ? 'Business' : step === 2 ? 'Services' : 'Legal'}
            </Text>
          </View>
        ))}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.xl,
        }}
      >
        {/* Step 1: Business Information */}
        {currentStep === 1 && (
          <View>
            <Text style={{ ...typography.titleLarge, color: colors.textPrimary, marginBottom: spacing.md }}>
              Business Information
            </Text>

            <Text style={{ ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg }}>
              Let's start with the basics about your business.
            </Text>

            <ThemedInput
              placeholder="Business/Trading Name *"
              value={formData.businessName}
              onChangeText={(text) => updateField('businessName', text)}
            />

            <ThemedInput
              placeholder="Registered Company Name"
              value={formData.registeredCompanyName}
              onChangeText={(text) => updateField('registeredCompanyName', text)}
            />

            <ThemedInput
              placeholder="Business Type (e.g., PTY LTD, Sole Proprietor)"
              value={formData.businessType}
              onChangeText={(text) => updateField('businessType', text)}
            />

            <ThemedInput
              placeholder="Company Registration Number"
              value={formData.companyRegNumber}
              onChangeText={(text) => updateField('companyRegNumber', text)}
            />

            <ThemedInput
              placeholder="ID Number *"
              value={formData.idNumber}
              onChangeText={(text) => updateField('idNumber', text)}
              keyboardType="numeric"
            />

            <ThemedInput
              placeholder="VAT Number (if applicable)"
              value={formData.vatNumber}
              onChangeText={(text) => updateField('vatNumber', text)}
            />

            <ThemedInput
              placeholder="Business Description *"
              value={formData.businessDescription}
              onChangeText={(text) => updateField('businessDescription', text)}
              multiline
              numberOfLines={4}
              style={{ height: 100, textAlignVertical: 'top' }}
            />

            <ThemedInput
              placeholder="Year Established"
              value={formData.yearEstablished}
              onChangeText={(text) => updateField('yearEstablished', text)}
              keyboardType="numeric"
            />

            <Text
              style={{
                ...typography.titleMedium,
                color: colors.textPrimary,
                marginTop: spacing.xl,
                marginBottom: spacing.md,
              }}
            >
              Contact Details
            </Text>

            <ThemedInput
              placeholder="Office Phone"
              value={formData.officePhone}
              onChangeText={(text) => updateField('officePhone', text)}
              keyboardType="phone-pad"
            />

            <ThemedInput
              placeholder="Website URL"
              value={formData.websiteUrl}
              onChangeText={(text) => updateField('websiteUrl', text)}
              keyboardType="url"
            />

            <ThemedInput
              placeholder="Instagram URL"
              value={formData.instagramUrl}
              onChangeText={(text) => updateField('instagramUrl', text)}
              keyboardType="url"
            />

            <ThemedInput
              placeholder="Facebook URL"
              value={formData.facebookUrl}
              onChangeText={(text) => updateField('facebookUrl', text)}
              keyboardType="url"
            />

            <Text
              style={{
                ...typography.titleMedium,
                color: colors.textPrimary,
                marginTop: spacing.xl,
                marginBottom: spacing.md,
              }}
            >
              Primary Contact Person
            </Text>

            <ThemedInput
              placeholder="Full Name *"
              value={formData.primaryContactName}
              onChangeText={(text) => updateField('primaryContactName', text)}
            />

            <ThemedInput
              placeholder="Mobile Number *"
              value={formData.primaryContactMobile}
              onChangeText={(text) => updateField('primaryContactMobile', text)}
              keyboardType="phone-pad"
            />

            <ThemedInput
              placeholder="Email Address *"
              value={formData.primaryContactEmail}
              onChangeText={(text) => updateField('primaryContactEmail', text)}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text
              style={{
                ...typography.titleMedium,
                color: colors.textPrimary,
                marginTop: spacing.xl,
                marginBottom: spacing.md,
              }}
            >
              Physical Details
            </Text>

            <ThemedInput
              placeholder="Physical Address"
              value={formData.physicalAddress}
              onChangeText={(text) => updateField('physicalAddress', text)}
              multiline
              numberOfLines={3}
              style={{ height: 80, textAlignVertical: 'top' }}
            />

            <ThemedInput
              placeholder="City"
              value={formData.city}
              onChangeText={(text) => updateField('city', text)}
            />

            <ThemedInput
              placeholder="Province"
              value={formData.province}
              onChangeText={(text) => updateField('province', text)}
            />

            <ThemedInput
              placeholder="Postal Code"
              value={formData.postalCode}
              onChangeText={(text) => updateField('postalCode', text)}
              keyboardType="numeric"
            />
          </View>
        )}

        {/* Step 2: Portfolio & Services */}
        {currentStep === 2 && (
          <View>
            <Text style={{ ...typography.titleLarge, color: colors.textPrimary, marginBottom: spacing.md }}>
              Portfolio & Services
            </Text>

            <Text style={{ ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg }}>
              Tell us about your services and what makes you unique.
            </Text>

            <Text
              style={{
                ...typography.titleMedium,
                color: colors.textPrimary,
                marginBottom: spacing.sm,
              }}
            >
              Portfolio Upload
            </Text>

            <View
              style={{
                padding: spacing.lg,
                borderRadius: radii.lg,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                marginBottom: spacing.lg,
              }}
            >
              <Text style={{ ...typography.body, color: colors.textPrimary, marginBottom: spacing.sm }}>
                Upload your logo, cover photos, gallery images, videos or portfolio PDFs.
              </Text>

              <TouchableOpacity
                onPress={handlePickAndUploadPortfolioItem}
                style={{
                  alignSelf: 'flex-start',
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: radii.full,
                  backgroundColor: colors.primary,
                }}
              >
                <Text style={{ ...typography.caption, color: '#FFFFFF' }}>
                  {uploadingPortfolio ? 'Uploading…' : 'Upload Portfolio Item'}
                </Text>
              </TouchableOpacity>

              {uploadingPortfolio && (
                <View style={{ marginTop: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={{ ...typography.caption, color: colors.textSecondary }}>Uploading portfolio item…</Text>
                </View>
              )}

              {portfolioItems.length > 0 && (
                <View style={{ marginTop: spacing.md }}>
                  <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs }}>
                    Uploaded portfolio items:
                  </Text>
                  {portfolioItems.map((item) => (
                    <Text key={item.path} style={{ ...typography.caption, color: colors.textPrimary }}>
                      • {item.file_name}
                    </Text>
                  ))}
                </View>
              )}
            </View>

            <Text
              style={{
                ...typography.titleMedium,
                color: colors.textPrimary,
                marginBottom: spacing.md,
              }}
            >
              Services & Tags
            </Text>

            <Text style={{ ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg }}>
              You'll be able to select service categories and tags in the next section.
            </Text>

            <ThemedInput
              placeholder="Starting Price (e.g., R 5000)"
              value={formData.startingPriceFrom}
              onChangeText={(text) => updateField('startingPriceFrom', text)}
              keyboardType="numeric"
            />
          </View>
        )}

        {/* Step 3: Banking & Legal */}
        {currentStep === 3 && (
          <View>
            <Text style={{ ...typography.titleLarge, color: colors.textPrimary, marginBottom: spacing.md }}>
              Banking & Legal
            </Text>

            <Text style={{ ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg }}>
              Final step! Complete your banking details and accept terms.
            </Text>

            <Text
              style={{
                ...typography.titleMedium,
                color: colors.textPrimary,
                marginBottom: spacing.sm,
              }}
            >
              Document Upload
            </Text>

            <View
              style={{
                padding: spacing.lg,
                borderRadius: radii.lg,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                marginBottom: spacing.lg,
              }}
            >
              <Text style={{ ...typography.body, color: colors.textPrimary, marginBottom: spacing.sm }}>
                Upload compliance documents (ID, CIPC, Bank confirmation, Certificates).
              </Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm }}>
                {[
                  { key: 'director_id', label: 'ID' },
                  { key: 'cipc_registration', label: 'CIPC' },
                  { key: 'bank_confirmation', label: 'Bank confirmation' },
                  { key: 'insurance_certificate', label: 'Insurance' },
                  { key: 'other', label: 'Other' },
                ].map((option) => {
                  const selected = selectedDocType === option.key;
                  const hasUploadedForType = uploadedDocs.some((doc) => doc.document_type === option.key);
                  return (
                    <TouchableOpacity
                      key={option.key}
                      onPress={() => setSelectedDocType(option.key)}
                      style={{
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.xs,
                        borderRadius: radii.full,
                        borderWidth: 1,
                        borderColor: selected ? colors.primary : colors.borderSubtle,
                        backgroundColor: selected ? colors.primary : colors.surfaceMuted,
                      }}
                    >
                      <Text
                        style={{
                          ...typography.caption,
                          color: selected ? '#FFFFFF' : colors.textPrimary,
                        }}
                      >
                        {option.label}
                        {hasUploadedForType ? ' ✓' : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity
                onPress={handlePickAndUploadDocument}
                style={{
                  marginTop: spacing.sm,
                  alignSelf: 'flex-start',
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: radii.full,
                  backgroundColor: colors.primary,
                }}
              >
                <Text style={{ ...typography.caption, color: '#FFFFFF' }}>
                  {uploading ? 'Uploading…' : 'Upload Document'}
                </Text>
              </TouchableOpacity>

              {uploading && (
                <View style={{ marginTop: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={{ ...typography.caption, color: colors.textSecondary }}>Uploading document…</Text>
                </View>
              )}

              {uploadedDocs.length > 0 && (
                <View style={{ marginTop: spacing.md }}>
                  <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs }}>
                    Uploaded documents:
                  </Text>
                  {uploadedDocs.map((doc) => (
                    <Text key={doc.id} style={{ ...typography.caption, color: colors.textPrimary }}>
                      • {doc.file_name ?? 'Document'} ({doc.document_type})
                    </Text>
                  ))}
                </View>
              )}
            </View>

            <Text
              style={{
                ...typography.titleMedium,
                color: colors.textPrimary,
                marginTop: spacing.xl,
                marginBottom: spacing.md,
              }}
            >
              Terms & Conditions
            </Text>

            <View
              style={{
                padding: spacing.lg,
                borderRadius: radii.lg,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                marginBottom: spacing.xl,
              }}
            >
              <Text style={{ ...typography.body, color: colors.textPrimary }}>
                ☑ I confirm all information is true
              </Text>
              <Text style={{ ...typography.body, color: colors.textPrimary, marginTop: spacing.sm }}>
                ☑ I agree to subscription terms
              </Text>
              <Text style={{ ...typography.body, color: colors.textPrimary, marginTop: spacing.sm }}>
                ☑ I agree to Funcxon T&Cs
              </Text>
              <Text style={{ ...typography.body, color: colors.textPrimary, marginTop: spacing.sm }}>
                ☑ I consent to data processing
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Navigation Buttons */}
      <View
        style={{
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.lg,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.borderSubtle,
          flexDirection: 'row',
          gap: spacing.md,
        }}
      >
        {currentStep > 1 && (
          <OutlineButton title="Back" onPress={handleBack} style={{ flex: 1 }} />
        )}
        <PrimaryButton
          title={currentStep === 3 ? 'Submit' : 'Next'}
          onPress={handleNext}
          style={{ flex: currentStep === 1 ? 1 : 2 }}
        />
      </View>
    </View>
  );
}
