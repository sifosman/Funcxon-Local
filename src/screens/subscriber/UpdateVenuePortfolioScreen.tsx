import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radii, typography } from '../../theme';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../auth/AuthContext';
import { getMyVenueEntitlement, isVenueFeatureEnabled } from '../../lib/venueSubscription';

type ProfileStackParamList = {
  SubscriberProfile: undefined;
  UpdateVenuePortfolio: undefined;
  VenueListingPlans: undefined;
  VenueCatalogue: undefined;
  VenueQuoteRequests: undefined;
  VenueTourBookings: undefined;
  VenueAnalytics: undefined;
};

type VenueListing = {
  id: number;
  user_id: string;
  name: string;
  description: string | null;
  location: string | null;
  contact_email: string | null;
  whatsapp_number: string | null;
  website_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  linkedin_url: string | null;
  venue_type: string | null;
  venue_capacity: string | null;
};

export default function UpdateVenuePortfolioScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [listing, setListing] = useState<VenueListing | null>(null);
  const [canEditVenueLinks, setCanEditVenueLinks] = useState(true);
  const [canUseCatalogue, setCanUseCatalogue] = useState(true);
  const [canUseQuoteRequests, setCanUseQuoteRequests] = useState(true);
  const [canUseTourBookings, setCanUseTourBookings] = useState(true);
  const [canUseAnalytics, setCanUseAnalytics] = useState(true);

  const [form, setForm] = useState({
    name: '',
    description: '',
    location: '',
    contact_email: '',
    whatsapp_number: '',
    website_url: '',
    instagram_url: '',
    facebook_url: '',
    tiktok_url: '',
    linkedin_url: '',
    venue_type: '',
    venue_capacity: '',
  });

  const linksLocked = useMemo(() => !canEditVenueLinks, [canEditVenueLinks]);

  const loadEntitlement = useCallback(async () => {
    if (!user?.id) return;
    const ent = await getMyVenueEntitlement(user.id);
    setCanEditVenueLinks(isVenueFeatureEnabled(ent, 'website_social_links'));
    setCanUseCatalogue(isVenueFeatureEnabled(ent, 'catalogue_pricelist'));
    setCanUseQuoteRequests(isVenueFeatureEnabled(ent, 'quote_requests'));
    setCanUseTourBookings(isVenueFeatureEnabled(ent, 'instant_tour_bookings'));
    setCanUseAnalytics(isVenueFeatureEnabled(ent, 'analytics'));
  }, [user?.id]);

  const loadListing = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('venue_listings')
        .select(
          'id, user_id, name, description, location, contact_email, whatsapp_number, website_url, instagram_url, facebook_url, tiktok_url, linkedin_url, venue_type, venue_capacity',
        )
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && (error as any).code !== 'PGRST116') {
        console.error('Error loading venue listing:', error);
      }

      if (data) {
        setListing(data as VenueListing);
        setForm({
          name: data.name || '',
          description: data.description || '',
          location: data.location || '',
          contact_email: data.contact_email || '',
          whatsapp_number: data.whatsapp_number || '',
          website_url: data.website_url || '',
          instagram_url: data.instagram_url || '',
          facebook_url: data.facebook_url || '',
          tiktok_url: data.tiktok_url || '',
          linkedin_url: data.linkedin_url || '',
          venue_type: data.venue_type || '',
          venue_capacity: data.venue_capacity || '',
        });
      } else {
        setListing(null);
      }
    } catch (err) {
      console.error('Failed to load venue listing:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadEntitlement();
    loadListing();
  }, [loadEntitlement, loadListing]);

  const handleChange = (key: keyof typeof form, value: string) => {
    const isLinksField =
      key === 'website_url' ||
      key === 'instagram_url' ||
      key === 'facebook_url' ||
      key === 'tiktok_url' ||
      key === 'linkedin_url';

    if (isLinksField && linksLocked) {
      Alert.alert(
        'Upgrade Required',
        'Website & social media links are available on paid venue plans. Please upgrade to add these links.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'View Plans', onPress: () => navigation.navigate('VenueListingPlans') },
        ],
      );
      return;
    }

    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!user?.id) return;
    if (!form.name.trim()) {
      Alert.alert('Required', 'Venue name is required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        name: form.name.trim(),
        description: form.description.trim() || null,
        location: form.location.trim() || null,
        contact_email: form.contact_email.trim() || null,
        whatsapp_number: form.whatsapp_number.trim() || null,
        website_url: linksLocked ? null : (form.website_url.trim() || null),
        instagram_url: linksLocked ? null : (form.instagram_url.trim() || null),
        facebook_url: linksLocked ? null : (form.facebook_url.trim() || null),
        tiktok_url: linksLocked ? null : (form.tiktok_url.trim() || null),
        linkedin_url: linksLocked ? null : (form.linkedin_url.trim() || null),
        venue_type: form.venue_type.trim() || null,
        venue_capacity: form.venue_capacity.trim() || null,
      };

      const { data, error } = await supabase
        .from('venue_listings')
        .upsert(payload, { onConflict: 'user_id' })
        .select(
          'id, user_id, name, description, location, contact_email, whatsapp_number, website_url, instagram_url, facebook_url, tiktok_url, linkedin_url, venue_type, venue_capacity',
        )
        .single();

      if (error) throw error;

      setListing(data as VenueListing);
      Alert.alert('Saved', 'Your venue listing has been updated.');
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const renderField = (
    label: string,
    key: keyof typeof form,
    options?: { multiline?: boolean; placeholder?: string; keyboardType?: any; disabled?: boolean },
  ) => (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>{label}</Text>
      <TextInput
        value={form[key]}
        onChangeText={(v) => handleChange(key, v)}
        placeholder={options?.placeholder || `Enter ${label.toLowerCase()}`}
        placeholderTextColor={colors.textMuted}
        multiline={options?.multiline}
        numberOfLines={options?.multiline ? 4 : 1}
        keyboardType={options?.keyboardType}
        editable={!options?.disabled}
        style={{
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          borderRadius: radii.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          backgroundColor: options?.disabled ? colors.surfaceMuted : colors.surface,
          color: colors.textPrimary,
          opacity: options?.disabled ? 0.7 : 1,
          ...(options?.multiline ? { minHeight: 80, textAlignVertical: 'top' as const } : {}),
        }}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ ...typography.body, color: colors.textMuted, marginTop: spacing.md }}>Loading venue listing...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.md }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}
          >
            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
            <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>Back</Text>
          </TouchableOpacity>

          <Text style={{ ...typography.displayMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
            Update Venue Portfolio
          </Text>
          <Text style={{ ...typography.body, color: colors.textMuted }}>
            Edit your venue listing details
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
            }}
          >
            <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>
              Venue Details
            </Text>
            {renderField('Venue Name', 'name', { placeholder: 'Your venue name' })}
            {renderField('Description', 'description', { multiline: true, placeholder: 'Describe your venue...' })}
            {renderField('Location', 'location', { placeholder: 'e.g. Cape Town, Western Cape' })}
            {renderField('Venue Type', 'venue_type', { placeholder: 'e.g. Wedding venue' })}
            {renderField('Venue Capacity', 'venue_capacity', { placeholder: 'e.g. 50 - 100' })}
          </View>

          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radii.lg,
              padding: spacing.lg,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              marginTop: spacing.md,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>
                  Catalogue / Pricelist
                </Text>
                <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: 2 }}>
                  Add packages and pricing for your venue
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  if (!listing) {
                    Alert.alert('Create listing first', 'Please create your venue listing before adding catalogue items.');
                    return;
                  }

                  if (!canUseCatalogue) {
                    navigation.navigate('VenueListingPlans');
                    return;
                  }

                  navigation.navigate('VenueCatalogue');
                }}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                  borderRadius: radii.full,
                  backgroundColor: canUseCatalogue ? colors.primary : colors.surfaceMuted,
                  borderWidth: canUseCatalogue ? 0 : 1,
                  borderColor: colors.borderSubtle,
                }}
              >
                <Text style={{ ...typography.caption, color: canUseCatalogue ? '#FFFFFF' : colors.textMuted, fontWeight: '700' }}>
                  {canUseCatalogue ? 'Manage' : 'Upgrade'}
                </Text>
              </TouchableOpacity>
            </View>

            {!canUseCatalogue && (
              <View
                style={{
                  marginTop: spacing.md,
                  padding: spacing.md,
                  borderRadius: radii.md,
                  backgroundColor: '#FFF7ED',
                  borderWidth: 1,
                  borderColor: '#FDBA74',
                }}
              >
                <Text style={{ ...typography.caption, color: '#9A3412', fontWeight: '600' }}>
                  Upgrade required
                </Text>
                <Text style={{ ...typography.caption, color: '#9A3412', marginTop: 2 }}>
                  Catalogue / Pricelist is available on paid venue plans.
                </Text>
              </View>
            )}
          </View>

          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radii.lg,
              padding: spacing.lg,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              marginTop: spacing.md,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>
                  Analytics & Stats
                </Text>
                <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: 2 }}>
                  View your venue activity summary
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  if (!listing) {
                    Alert.alert('Create listing first', 'Please create your venue listing before viewing analytics.');
                    return;
                  }

                  if (!canUseAnalytics) {
                    navigation.navigate('VenueListingPlans');
                    return;
                  }

                  navigation.navigate('VenueAnalytics');
                }}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                  borderRadius: radii.full,
                  backgroundColor: canUseAnalytics ? colors.primary : colors.surfaceMuted,
                  borderWidth: canUseAnalytics ? 0 : 1,
                  borderColor: colors.borderSubtle,
                }}
              >
                <Text
                  style={{
                    ...typography.caption,
                    color: canUseAnalytics ? '#FFFFFF' : colors.textMuted,
                    fontWeight: '700',
                  }}
                >
                  {canUseAnalytics ? 'Open' : 'Upgrade'}
                </Text>
              </TouchableOpacity>
            </View>

            {!canUseAnalytics && (
              <View
                style={{
                  marginTop: spacing.md,
                  padding: spacing.md,
                  borderRadius: radii.md,
                  backgroundColor: '#FFF7ED',
                  borderWidth: 1,
                  borderColor: '#FDBA74',
                }}
              >
                <Text style={{ ...typography.caption, color: '#9A3412', fontWeight: '600' }}>
                  Upgrade required
                </Text>
                <Text style={{ ...typography.caption, color: '#9A3412', marginTop: 2 }}>
                  Analytics & stats are available on paid venue plans.
                </Text>
              </View>
            )}
          </View>

          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radii.lg,
              padding: spacing.lg,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              marginTop: spacing.md,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>
                  Tour Bookings
                </Text>
                <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: 2 }}>
                  Manage instant venue tour booking requests
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  if (!listing) {
                    Alert.alert('Create listing first', 'Please create your venue listing before viewing tour bookings.');
                    return;
                  }

                  if (!canUseTourBookings) {
                    navigation.navigate('VenueListingPlans');
                    return;
                  }

                  navigation.navigate('VenueTourBookings');
                }}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                  borderRadius: radii.full,
                  backgroundColor: canUseTourBookings ? colors.primary : colors.surfaceMuted,
                  borderWidth: canUseTourBookings ? 0 : 1,
                  borderColor: colors.borderSubtle,
                }}
              >
                <Text
                  style={{
                    ...typography.caption,
                    color: canUseTourBookings ? '#FFFFFF' : colors.textMuted,
                    fontWeight: '700',
                  }}
                >
                  {canUseTourBookings ? 'Open' : 'Upgrade'}
                </Text>
              </TouchableOpacity>
            </View>

            {!canUseTourBookings && (
              <View
                style={{
                  marginTop: spacing.md,
                  padding: spacing.md,
                  borderRadius: radii.md,
                  backgroundColor: '#FFF7ED',
                  borderWidth: 1,
                  borderColor: '#FDBA74',
                }}
              >
                <Text style={{ ...typography.caption, color: '#9A3412', fontWeight: '600' }}>
                  Upgrade required
                </Text>
                <Text style={{ ...typography.caption, color: '#9A3412', marginTop: 2 }}>
                  Instant venue tour bookings are available on paid venue plans.
                </Text>
              </View>
            )}
          </View>

          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radii.lg,
              padding: spacing.lg,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              marginTop: spacing.md,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>
                  Quote Requests
                </Text>
                <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: 2 }}>
                  Manage incoming online quote requests
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  if (!listing) {
                    Alert.alert('Create listing first', 'Please create your venue listing before viewing quote requests.');
                    return;
                  }

                  if (!canUseQuoteRequests) {
                    navigation.navigate('VenueListingPlans');
                    return;
                  }

                  navigation.navigate('VenueQuoteRequests');
                }}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                  borderRadius: radii.full,
                  backgroundColor: canUseQuoteRequests ? colors.primary : colors.surfaceMuted,
                  borderWidth: canUseQuoteRequests ? 0 : 1,
                  borderColor: colors.borderSubtle,
                }}
              >
                <Text
                  style={{
                    ...typography.caption,
                    color: canUseQuoteRequests ? '#FFFFFF' : colors.textMuted,
                    fontWeight: '700',
                  }}
                >
                  {canUseQuoteRequests ? 'Open' : 'Upgrade'}
                </Text>
              </TouchableOpacity>
            </View>

            {!canUseQuoteRequests && (
              <View
                style={{
                  marginTop: spacing.md,
                  padding: spacing.md,
                  borderRadius: radii.md,
                  backgroundColor: '#FFF7ED',
                  borderWidth: 1,
                  borderColor: '#FDBA74',
                }}
              >
                <Text style={{ ...typography.caption, color: '#9A3412', fontWeight: '600' }}>
                  Upgrade required
                </Text>
                <Text style={{ ...typography.caption, color: '#9A3412', marginTop: 2 }}>
                  Online quote requests & updates are available on paid venue plans.
                </Text>
              </View>
            )}
          </View>

          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radii.lg,
              padding: spacing.lg,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              marginTop: spacing.md,
            }}
          >
            <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>
              Contact Information
            </Text>
            {renderField('Contact Email', 'contact_email', { keyboardType: 'email-address', placeholder: 'venue@example.com' })}
            {renderField('WhatsApp Number', 'whatsapp_number', { keyboardType: 'phone-pad', placeholder: '+27...' })}

            {renderField('Website URL', 'website_url', { keyboardType: 'url', placeholder: 'https://...', disabled: linksLocked })}
            {renderField('Instagram URL', 'instagram_url', { keyboardType: 'url', placeholder: 'https://instagram.com/...', disabled: linksLocked })}
            {renderField('Facebook URL', 'facebook_url', { keyboardType: 'url', placeholder: 'https://facebook.com/...', disabled: linksLocked })}
            {renderField('TikTok URL', 'tiktok_url', { keyboardType: 'url', placeholder: 'https://tiktok.com/@...', disabled: linksLocked })}
            {renderField('LinkedIn URL', 'linkedin_url', { keyboardType: 'url', placeholder: 'https://linkedin.com/...', disabled: linksLocked })}

            {linksLocked && (
              <View
                style={{
                  marginTop: spacing.xs,
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
                  onPress={() => navigation.navigate('VenueListingPlans')}
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

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={{
              marginTop: spacing.lg,
              paddingVertical: spacing.md,
              borderRadius: radii.md,
              backgroundColor: saving ? colors.textMuted : colors.primary,
              alignItems: 'center',
            }}
          >
            <Text style={{ ...typography.body, color: '#FFFFFF', fontWeight: '600' }}>
              {saving ? 'Saving...' : listing ? 'Save Changes' : 'Create Listing'}
            </Text>
          </TouchableOpacity>

          {!listing && (
            <View style={{ marginTop: spacing.md, alignItems: 'center' }}>
              <Text style={{ ...typography.caption, color: colors.textMuted, textAlign: 'center' }}>
                You don't have a venue listing yet. Fill in the details above and tap Create Listing.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
