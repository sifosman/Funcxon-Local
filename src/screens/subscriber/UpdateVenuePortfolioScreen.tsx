import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, radii, typography } from '../../theme';
import { supabase } from '../../lib/supabaseClient';
import { uploadFileToStorage } from '../../lib/applicationService';
import { useAuth } from '../../auth/AuthContext';
import { getMyVenueEntitlement, isVenueFeatureEnabled } from '../../lib/venueSubscription';
import { createGalleryMediaRecord } from '../../lib/mediaUpload';
import { normalizePhoneNumber } from '../../utils/phoneNormalization';
import ThemedAlert from '../../components/ThemedAlert';

function buildLegacyLocation(parts: Array<string | null | undefined>) {
  return parts.map((part) => part?.trim() ?? '').filter(Boolean).join(', ') || null;
}

function parseCoordinate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

type ProfileStackParamList = {
  SubscriberProfile: undefined;
  UpdateVenuePortfolio: undefined;
  VenueListingPlans: undefined;
  VenueCatalogue: undefined;
  VenueQuoteRequests: undefined;
  VenueTourBookings: undefined;
  VenueAnalytics: undefined;
  ListerPortfolio: undefined;
};

type VenueListing = {
  id: number;
  user_id: string;
  name: string;
  description: string | null;
  location: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  suburb: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  contact_email: string | null;
  whatsapp_number: string | null;
  website_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  linkedin_url: string | null;
  venue_type: string | null;
  venue_capacity: string | null;
  image_url: string | null;
  additional_photos: string[] | null;
};

export default function UpdateVenuePortfolioScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [listing, setListing] = useState<VenueListing | null>(null);
  const [canUseCatalogue, setCanUseCatalogue] = useState(true);
  const [canUseQuoteRequests, setCanUseQuoteRequests] = useState(true);
  const [canUseTourBookings, setCanUseTourBookings] = useState(true);
  const [canUseAnalytics, setCanUseAnalytics] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [additionalPhotos, setAdditionalPhotos] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [photoLimit, setPhotoLimit] = useState<number>(10);
  const [videoLimit, setVideoLimit] = useState<number>(1);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [alertState, setAlertState] = useState<{visible: boolean; title: string; message: string; buttons?: any[]} | null>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    location: '',
    address_line_1: '',
    address_line_2: '',
    suburb: '',
    city: '',
    province: '',
    postal_code: '',
    country: 'South Africa',
    latitude: '',
    longitude: '',
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

  const derivedLocationPreview = useMemo(
    () =>
      buildLegacyLocation([
        form.address_line_1,
        form.address_line_2,
        form.suburb,
        form.city,
        form.province,
        form.postal_code,
        form.country,
      ]) ?? form.location.trim() ?? null,
    [form.address_line_1, form.address_line_2, form.city, form.country, form.location, form.postal_code, form.province, form.suburb],
  );

  const loadEntitlement = useCallback(async () => {
    if (!user?.id) return;
    const ent = await getMyVenueEntitlement(user.id);
    setCanUseCatalogue(isVenueFeatureEnabled(ent, 'catalogue_pricelist'));
    setCanUseQuoteRequests(isVenueFeatureEnabled(ent, 'quote_requests'));
    setCanUseTourBookings(isVenueFeatureEnabled(ent, 'instant_tour_bookings'));
    setCanUseAnalytics(isVenueFeatureEnabled(ent, 'analytics'));
    setPhotoLimit(ent.photoUploadLimit);
    setVideoLimit(ent.videoUploadLimit);
  }, [user?.id]);

  const loadListing = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('venue_listings')
        .select(
          'id, user_id, name, description, location, address_line_1, address_line_2, suburb, city, province, postal_code, country, latitude, longitude, contact_email, whatsapp_number, website_url, instagram_url, facebook_url, tiktok_url, linkedin_url, venue_type, venue_capacity, image_url, additional_photos',
        )
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && (error as any).code !== 'PGRST116') {
        console.error('Error loading venue listing:', error);
      }

      if (data) {
        setListing(data as VenueListing);
        setImageUrl((data as VenueListing).image_url || null);
        setAdditionalPhotos((data as VenueListing).additional_photos || []);

        const { data: gallery } = await supabase
          .from('gallery_media')
          .select('media_url, media_type')
          .eq('venue_id', data.id)
          .order('created_at', { ascending: false });
        const videoUrls = (gallery || [])
          .filter((g: any) => g.media_type === 'video')
          .map((g: any) => g.media_url);
        setVideos(videoUrls);

        setForm({
          name: data.name || '',
          description: data.description || '',
          location: data.location || '',
          address_line_1: (data as VenueListing).address_line_1 || '',
          address_line_2: (data as VenueListing).address_line_2 || '',
          suburb: (data as VenueListing).suburb || '',
          city: (data as VenueListing).city || '',
          province: (data as VenueListing).province || '',
          postal_code: (data as VenueListing).postal_code || '',
          country: (data as VenueListing).country || 'South Africa',
          latitude: (data as VenueListing).latitude != null ? String((data as VenueListing).latitude) : '',
          longitude: (data as VenueListing).longitude != null ? String((data as VenueListing).longitude) : '',
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
        // Fallback: check legacy venues table for existing data
        const { data: venuesRow, error: venuesErr } = await supabase
          .from('venues')
          .select('id, user_id, name, description, location')
          .eq('user_id', user.id)
          .maybeSingle();

        if (venuesErr && (venuesErr as any).code !== 'PGRST116') {
          console.error('Error loading legacy venue:', venuesErr);
        }

        if (venuesRow) {
          // Pre-populate from venues table; listing stays null so user completes setup and saves to venue_listings
          setImageUrl(null);
          setAdditionalPhotos([]);
          setListing(null);
          setForm({
            name: venuesRow.name || '',
            description: venuesRow.description || '',
            location: venuesRow.location || '',
            address_line_1: '',
            address_line_2: '',
            suburb: '',
            city: '',
            province: '',
            postal_code: '',
            country: 'South Africa',
            latitude: '',
            longitude: '',
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
        } else {
          setImageUrl(null);
          setAdditionalPhotos([]);
          setListing(null);
        }
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
    const isPhoneField = key === 'whatsapp_number';
    const normalizedValue = isPhoneField ? normalizePhoneNumber(value) : value;
    setForm((prev) => ({ ...prev, [key]: normalizedValue }));
  };

  const currentPhotoCount = (imageUrl ? 1 : 0) + additionalPhotos.length;
  const remainingPhotoSlots = Math.max(0, photoLimit - currentPhotoCount);

  const requestImagePermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setAlertState({ visible: true, title: 'Permission Required', message: 'Please allow access to your photo library to upload images.', buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
      return false;
    }
    return true;
  };

  const uploadPickedImage = async (asset: ImagePicker.ImagePickerAsset): Promise<string | null> => {
    if (!user?.id) return null;
    const file = {
      uri: asset.uri,
      name: asset.fileName || `image_${Date.now()}.jpg`,
      type: asset.mimeType || 'image/jpeg',
    };
    const result = await uploadFileToStorage('portfolio-images', file, user.id);
    if (!result.success || !result.url) {
      throw new Error(result.error || 'Upload failed');
    }
    return result.url;
  };

  const handlePickMainImage = async () => {
    const permitted = await requestImagePermission();
    if (!permitted) return;
    try {
      setUploadingImage(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: false,
        allowsEditing: true,
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const url = await uploadPickedImage(result.assets[0]);
      if (url) {
        setImageUrl(url);
        if (listing?.id) {
          await createGalleryMediaRecord(url, 'image', { venueId: listing.id });
        }
      }
    } catch (err: any) {
      setAlertState({ visible: true, title: 'Upload failed', message: err?.message || 'Could not upload image.', buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePickAdditionalPhotos = async () => {
    if (remainingPhotoSlots <= 0) {
      setAlertState({ visible: true, title: 'Photo limit reached', message: `Your current plan allows up to ${photoLimit} photo(s).`, buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
      return;
    }
    const permitted = await requestImagePermission();
    if (!permitted) return;
    try {
      setUploadingImage(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        allowsEditing: false,
        quality: 0.8,
        selectionLimit: Math.max(1, Math.min(10, remainingPhotoSlots)),
      });
      if (result.canceled || !result.assets?.length) return;
      const newUrls: string[] = [];
      for (const asset of result.assets.slice(0, remainingPhotoSlots)) {
        const url = await uploadPickedImage(asset);
        if (url) {
          newUrls.push(url);
          if (listing?.id) {
            await createGalleryMediaRecord(url, 'image', { venueId: listing.id });
          }
        }
      }
      setAdditionalPhotos((prev) => [...prev, ...newUrls]);
    } catch (err: any) {
      setAlertState({ visible: true, title: 'Upload failed', message: err?.message || 'Could not upload images.', buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveAdditionalPhoto = (index: number) => {
    setAdditionalPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveMainImage = () => {
    setImageUrl(null);
  };

  const currentVideoCount = videos.length;
  const remainingVideoSlots = Math.max(0, videoLimit - currentVideoCount);

  const handlePickVideos = async () => {
    if (remainingVideoSlots <= 0) {
      setAlertState({ visible: true, title: 'Video limit reached', message: `Your current plan allows up to ${videoLimit} video(s).`, buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
      return;
    }
    const permitted = await requestImagePermission();
    if (!permitted) return;
    try {
      setUploadingVideo(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsMultipleSelection: true,
        allowsEditing: false,
        selectionLimit: Math.max(1, Math.min(5, remainingVideoSlots)),
      });
      if (result.canceled || !result.assets?.length || !user?.id || !listing?.id) return;
      const newUrls: string[] = [];
      for (const asset of result.assets.slice(0, remainingVideoSlots)) {
        const file = {
          uri: asset.uri,
          name: asset.fileName || `video_${Date.now()}.mp4`,
          type: asset.mimeType || 'video/mp4',
        };
        const uploadResult = await uploadFileToStorage('portfolio-videos', file, user.id);
        if (uploadResult.success && uploadResult.url) {
          await createGalleryMediaRecord(uploadResult.url, 'video', { venueId: listing.id });
          newUrls.push(uploadResult.url);
        }
      }
      setVideos((prev) => [...prev, ...newUrls]);
    } catch (err: any) {
      setAlertState({ visible: true, title: 'Upload failed', message: err?.message || 'Could not upload videos.', buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleRemoveVideo = (index: number) => {
    setVideos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setAlertState({ visible: true, title: 'Required', message: 'Venue name is required.', buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
      return;
    }
    if (!form.description.trim()) {
      setAlertState({ visible: true, title: 'Required', message: 'Description is required.', buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
      return;
    }
    if (!imageUrl) {
      setAlertState({ visible: true, title: 'Required', message: 'A main image is required for your venue listing.', buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
      return;
    }
    if (!user?.id) return;

    const latitude = parseCoordinate(form.latitude);
    const longitude = parseCoordinate(form.longitude);
    if ((form.latitude.trim() && latitude === null) || (form.longitude.trim() && longitude === null)) {
      setAlertState({ visible: true, title: 'Invalid coordinates', message: 'Latitude and longitude must be valid numbers.', buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        name: form.name.trim(),
        description: form.description.trim() || null,
        location: derivedLocationPreview || (form.location.trim() || null),
        address_line_1: form.address_line_1.trim() || null,
        address_line_2: form.address_line_2.trim() || null,
        suburb: form.suburb.trim() || null,
        city: form.city.trim() || null,
        province: form.province.trim() || null,
        postal_code: form.postal_code.trim() || null,
        country: form.country.trim() || null,
        latitude,
        longitude,
        contact_email: form.contact_email.trim() || null,
        whatsapp_number: form.whatsapp_number.trim() || null,
        website_url: form.website_url.trim() || null,
        instagram_url: form.instagram_url.trim() || null,
        facebook_url: form.facebook_url.trim() || null,
        tiktok_url: form.tiktok_url.trim() || null,
        linkedin_url: form.linkedin_url.trim() || null,
        venue_type: form.venue_type.trim() || null,
        venue_capacity: form.venue_capacity.trim() || null,
        image_url: imageUrl,
        additional_photos: additionalPhotos.length > 0 ? additionalPhotos : null,
      };

      const { data, error } = await supabase
        .from('venue_listings')
        .upsert(payload, { onConflict: 'user_id' })
        .select(
          'id, user_id, name, description, location, address_line_1, address_line_2, suburb, city, province, postal_code, country, latitude, longitude, contact_email, whatsapp_number, website_url, instagram_url, facebook_url, tiktok_url, linkedin_url, venue_type, venue_capacity, image_url, additional_photos',
        )
        .single();

      if (error) throw error;

      setListing(data as VenueListing);
      setAlertState({
        visible: true,
        title: 'Saved',
        message: 'Your venue listing has been updated.',
        buttons: [{ text: 'OK', style: 'default', onPress: () => { setAlertState(null); navigation.navigate('ListerPortfolio'); } }],
      });
    } catch (err: any) {
      setAlertState({ visible: true, title: 'Error', message: err?.message ?? 'Failed to save changes.', buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
    } finally {
      setSaving(false);
    }
  };

  const renderField = (
    label: string,
    key: keyof typeof form,
    options?: { multiline?: boolean; placeholder?: string; keyboardType?: any; disabled?: boolean; required?: boolean },
  ) => (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>
        {label}
        {options?.required ? <Text style={{ color: '#EF4444' }}> *</Text> : null}
      </Text>
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
          fontFamily: typography.body.fontFamily,
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
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? spacing.lg : 0}
    >
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}
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
            <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
              Venue Details
            </Text>
            <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.lg }}>
              Fields marked with <Text style={{ color: '#EF4444' }}>*</Text> are required.
            </Text>
            {renderField('Venue Name', 'name', { placeholder: 'Your venue name', required: true })}
            {renderField('Description', 'description', { multiline: true, placeholder: 'Describe your venue...', required: true })}
            {renderField('Address Line 1', 'address_line_1', { placeholder: 'Street address' })}
            {renderField('Address Line 2', 'address_line_2', { placeholder: 'Building, unit, suite (optional)' })}
            {renderField('Suburb', 'suburb', { placeholder: 'e.g. Stellenbosch Central' })}
            {renderField('City', 'city', { placeholder: 'e.g. Stellenbosch' })}
            {renderField('Province', 'province', { placeholder: 'e.g. Western Cape' })}
            {renderField('Postal Code', 'postal_code', { placeholder: 'e.g. 7600', keyboardType: 'number-pad' })}
            {renderField('Country', 'country', { placeholder: 'e.g. South Africa' })}
            {renderField('Latitude', 'latitude', { placeholder: 'e.g. -33.9321', keyboardType: 'numeric' })}
            {renderField('Longitude', 'longitude', { placeholder: 'e.g. 18.8602', keyboardType: 'numeric' })}
            <View style={{ marginBottom: spacing.md }}>
              <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>Location Preview</Text>
              <View
                style={{
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  borderRadius: radii.md,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  backgroundColor: colors.surfaceMuted,
                }}
              >
                <Text style={{ ...typography.body, color: colors.textPrimary }}>
                  {derivedLocationPreview || 'Complete the address fields to build the display location.'}
                </Text>
              </View>
            </View>
            {renderField('Venue Type', 'venue_type', { placeholder: 'e.g. Wedding venue' })}
            {renderField('Venue Capacity', 'venue_capacity', { placeholder: 'e.g. 50 - 100' })}
          </View>

          {/* Portfolio Photos - always visible */}
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
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <View style={{ flex: 1 }}>
                <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>
                  Portfolio Photos
                </Text>
                <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: 2 }}>
                  {currentPhotoCount} of {photoLimit} photos used. Your current subscription allows up to {photoLimit} photos.
                </Text>
              </View>
              {listing && (
                <TouchableOpacity
                  onPress={() => navigation.navigate('VenueListingPlans')}
                  style={{
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.xs,
                    borderRadius: radii.full,
                    backgroundColor: colors.primary,
                  }}
                >
                  <Text style={{ ...typography.captionSemiBold, color: '#FFFFFF' }}>Upgrade</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Main image */}
            <View style={{ marginBottom: spacing.md }}>
              <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>
                Main Image <Text style={{ color: '#EF4444' }}>*</Text>
              </Text>
              {imageUrl ? (
                <View style={{ position: 'relative' }}>
                  <Image
                    source={{ uri: imageUrl }}
                    style={{ width: '100%', height: 180, borderRadius: radii.md, backgroundColor: colors.surfaceMuted }}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    onPress={handleRemoveMainImage}
                    style={{
                      position: 'absolute',
                      top: spacing.xs,
                      right: spacing.xs,
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      borderRadius: radii.full,
                      padding: spacing.xs,
                    }}
                  >
                    <MaterialIcons name="delete" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={handlePickMainImage}
                  disabled={uploadingImage}
                  style={{
                    width: '100%',
                    height: 180,
                    borderRadius: radii.md,
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                    borderStyle: 'dashed',
                    backgroundColor: colors.surfaceMuted,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialIcons name="add-a-photo" size={32} color={colors.textMuted} />
                  <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.xs }}>Add main image</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Additional photos */}
            <View>
              <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>Additional Photos</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {additionalPhotos.map((url, idx) => (
                  <View key={`${url}-${idx}`} style={{ position: 'relative' }}>
                    <Image
                      source={{ uri: url }}
                      style={{ width: 80, height: 80, borderRadius: radii.md, backgroundColor: colors.surfaceMuted }}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      onPress={() => handleRemoveAdditionalPhoto(idx)}
                      style={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        borderRadius: radii.full,
                        padding: 2,
                      }}
                    >
                      <MaterialIcons name="delete" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
                {remainingPhotoSlots > 0 && (
                  <TouchableOpacity
                    onPress={handlePickAdditionalPhotos}
                    disabled={uploadingImage}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: radii.md,
                      borderWidth: 1,
                      borderColor: colors.borderSubtle,
                      borderStyle: 'dashed',
                      backgroundColor: colors.surfaceMuted,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MaterialIcons name="add" size={28} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {uploadingImage && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, gap: spacing.sm }}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={{ ...typography.caption, color: colors.textMuted }}>Uploading image...</Text>
              </View>
            )}

            {/* Videos */}
            <View style={{ marginTop: spacing.md }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ ...typography.caption, color: colors.textMuted }}>
                    Videos ({currentVideoCount} of {videoLimit})
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {videos.map((url, idx) => (
                  <View key={`${url}-${idx}`} style={{ position: 'relative' }}>
                    <View
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: radii.md,
                        backgroundColor: colors.background,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <MaterialIcons name="videocam" size={28} color={colors.textPrimary} />
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveVideo(idx)}
                      style={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        borderRadius: radii.full,
                        padding: 2,
                      }}
                    >
                      <MaterialIcons name="delete" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
                {remainingVideoSlots > 0 && (
                  <TouchableOpacity
                    onPress={handlePickVideos}
                    disabled={uploadingVideo}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: radii.md,
                      borderWidth: 1,
                      borderColor: colors.borderSubtle,
                      borderStyle: 'dashed',
                      backgroundColor: colors.surfaceMuted,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MaterialIcons name="videocam" size={28} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
              {uploadingVideo && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, gap: spacing.sm }}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={{ ...typography.caption, color: colors.textMuted }}>Uploading video...</Text>
                </View>
              )}
            </View>
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
                    setAlertState({ visible: true, title: 'Create listing first', message: 'Please create your venue listing before adding catalogue items.', buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
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
                <Text style={{ ...typography.captionBold, color: canUseCatalogue ? '#FFFFFF' : colors.textMuted }}>
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
                <Text style={{ ...typography.captionSemiBold, color: '#9A3412' }}>
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
                    setAlertState({ visible: true, title: 'Create listing first', message: 'Please create your venue listing before viewing analytics.', buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
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
                    ...typography.captionBold,
                    color: canUseAnalytics ? '#FFFFFF' : colors.textMuted,
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
                <Text style={{ ...typography.captionSemiBold, color: '#9A3412' }}>
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
                    setAlertState({ visible: true, title: 'Create listing first', message: 'Please create your venue listing before viewing tour bookings.', buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
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
                    ...typography.captionBold,
                    color: canUseTourBookings ? '#FFFFFF' : colors.textMuted,
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
                <Text style={{ ...typography.captionSemiBold, color: '#9A3412' }}>
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
                    setAlertState({ visible: true, title: 'Create listing first', message: 'Please create your venue listing before viewing quote requests.', buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
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
                    ...typography.captionBold,
                    color: canUseQuoteRequests ? '#FFFFFF' : colors.textMuted,
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
                <Text style={{ ...typography.captionSemiBold, color: '#9A3412' }}>
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

            {renderField('Website URL', 'website_url', { keyboardType: 'url', placeholder: 'https://...' })}
            {renderField('Instagram URL', 'instagram_url', { keyboardType: 'url', placeholder: 'https://instagram.com/...' })}
            {renderField('Facebook URL', 'facebook_url', { keyboardType: 'url', placeholder: 'https://facebook.com/...' })}
            {renderField('TikTok URL', 'tiktok_url', { keyboardType: 'url', placeholder: 'https://tiktok.com/@...' })}
            {renderField('LinkedIn URL', 'linkedin_url', { keyboardType: 'url', placeholder: 'https://linkedin.com/...' })}
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
            <Text style={{ ...typography.bodySemiBold, color: '#FFFFFF' }}>
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
