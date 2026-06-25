import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, radii, typography } from '../../theme';
import { supabase } from '../../lib/supabaseClient';
import { uploadFileToStorage } from '../../lib/applicationService';
import { getVendorPhotoLimit } from '../../lib/subscription';
import { useAuth } from '../../auth/AuthContext';
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
    UpdateVendorPortfolio: undefined;
    SubscriptionPlans: undefined;
    VendorCatalogue: undefined;
    VendorAnalytics: undefined;
};

type VendorListing = {
    id: number;
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
    price_range: string | null;
    email: string | null;
    whatsapp_number: string | null;
    website_url: string | null;
    instagram_url: string | null;
    subscription_tier: string | null;
    subscription_status: string | null;
    service_options: string[] | null;
    amenities: string[] | null;
    vendor_tags: string[] | null;
    image_url: string | null;
    additional_photos: string[] | null;
    photo_count: number | null;
};

export default function UpdateVendorPortfolioScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [vendor, setVendor] = useState<VendorListing | null>(null);
    const [canEditLinks, setCanEditLinks] = useState(true);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [additionalPhotos, setAdditionalPhotos] = useState<string[]>([]);
    const [photoLimit, setPhotoLimit] = useState<number>(8);
    const [uploadingImage, setUploadingImage] = useState(false);
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
        price_range: '',
        email: '',
        whatsapp_number: '',
        website_url: '',
        instagram_url: '',
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

    const loadVendor = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const { data: vendorData, error } = await supabase
                .from('vendors')
                .select('id, name, description, location, address_line_1, address_line_2, suburb, city, province, postal_code, country, latitude, longitude, price_range, email, whatsapp_number, website_url, instagram_url, subscription_tier, subscription_status, service_options, amenities, vendor_tags, image_url, additional_photos, photo_count')
                .eq('user_id', user.id)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') {
                // PGRST116 = no rows, which is fine
                console.error('Error loading vendor:', error);
            }

            if (vendorData) {
                setVendor(vendorData as VendorListing);
                const tier = String((vendorData as any).subscription_tier ?? '').toLowerCase();
                const status = String((vendorData as any).subscription_status ?? '').toLowerCase();
                setCanEditLinks(tier !== 'free' && tier !== '' && status === 'active');
                setImageUrl((vendorData as VendorListing).image_url || null);
                setAdditionalPhotos((vendorData as VendorListing).additional_photos || []);
                const limit = await getVendorPhotoLimit((vendorData as VendorListing).id);
                setPhotoLimit(limit);
                setForm({
                    name: vendorData.name || '',
                    description: vendorData.description || '',
                    location: vendorData.location || '',
                    address_line_1: (vendorData as VendorListing).address_line_1 || '',
                    address_line_2: (vendorData as VendorListing).address_line_2 || '',
                    suburb: (vendorData as VendorListing).suburb || '',
                    city: (vendorData as VendorListing).city || '',
                    province: (vendorData as VendorListing).province || '',
                    postal_code: (vendorData as VendorListing).postal_code || '',
                    country: (vendorData as VendorListing).country || 'South Africa',
                    latitude: (vendorData as VendorListing).latitude != null ? String((vendorData as VendorListing).latitude) : '',
                    longitude: (vendorData as VendorListing).longitude != null ? String((vendorData as VendorListing).longitude) : '',
                    price_range: vendorData.price_range || '',
                    email: vendorData.email || '',
                    whatsapp_number: vendorData.whatsapp_number || '',
                    website_url: vendorData.website_url || '',
                    instagram_url: vendorData.instagram_url || '',
                });
            }
        } catch (err) {
            console.error('Failed to load vendor:', err);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    const handleChange = (key: keyof typeof form, value: string) => {
        const isLinksField = key === 'website_url' || key === 'instagram_url';
        if (isLinksField && !canEditLinks) {
            return;
        }

        setForm((prev) => ({ ...prev, [key]: value }));
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
            if (url) setImageUrl(url);
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
                if (url) newUrls.push(url);
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

    useEffect(() => {
        loadVendor();
    }, [loadVendor]);

    const handleSave = async () => {
        if (!form.name.trim()) {
            setAlertState({ visible: true, title: 'Required', message: 'Business name is required.', buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
            return;
        }
        if (!form.description.trim()) {
            setAlertState({ visible: true, title: 'Required', message: 'Description is required.', buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
            return;
        }
        if (!imageUrl) {
            setAlertState({ visible: true, title: 'Required', message: 'A main image is required for your vendor portfolio.', buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
            return;
        }
        if (!user?.id) {
            setAlertState({ visible: true, title: 'Error', message: 'You must be signed in to save a portfolio.', buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
            return;
        }
        const latitude = parseCoordinate(form.latitude);
        const longitude = parseCoordinate(form.longitude);
        if ((form.latitude.trim() && latitude === null) || (form.longitude.trim() && longitude === null)) {
            setAlertState({ visible: true, title: 'Invalid coordinates', message: 'Latitude and longitude must be valid numbers.', buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
            return;
        }
        setSaving(true);
        try {
            const payload = {
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
                price_range: form.price_range.trim() || null,
                email: form.email.trim() || null,
                whatsapp_number: form.whatsapp_number.trim() || null,
                website_url: form.website_url.trim() || null,
                instagram_url: form.instagram_url.trim() || null,
                image_url: imageUrl,
                additional_photos: additionalPhotos.length > 0 ? additionalPhotos : null,
                photo_count: currentPhotoCount,
            };

            if (vendor) {
                const { error } = await supabase.from('vendors').update(payload).eq('id', vendor.id);
                if (error) throw error;
                setAlertState({ visible: true, title: 'Saved', message: 'Your portfolio has been updated.', buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
            } else {
                const { data, error } = await supabase
                    .from('vendors')
                    .insert({ ...payload, user_id: user.id })
                    .select('id')
                    .single();
                if (error) throw error;
                if (data) {
                    setVendor({
                        id: data.id,
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
                        price_range: form.price_range.trim() || null,
                        email: form.email.trim() || null,
                        whatsapp_number: form.whatsapp_number.trim() || null,
                        website_url: form.website_url.trim() || null,
                        instagram_url: form.instagram_url.trim() || null,
                        subscription_tier: null,
                        subscription_status: null,
                        service_options: null,
                        amenities: null,
                        vendor_tags: null,
                        image_url: imageUrl,
                        additional_photos: additionalPhotos.length > 0 ? additionalPhotos : null,
                        photo_count: currentPhotoCount,
                    });
                }
                setAlertState({ visible: true, title: 'Created', message: 'Your vendor portfolio has been created.', buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
            }
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
                placeholder={options?.disabled ? 'Upgrade to add this link' : (options?.placeholder || `Enter ${label.toLowerCase()}`)}
                placeholderTextColor={colors.textMuted}
                multiline={options?.multiline}
                numberOfLines={options?.multiline ? 4 : 1}
                keyboardType={options?.keyboardType}
                editable={!options?.disabled}
                style={{
                    borderWidth: 1,
                    borderColor: options?.disabled ? colors.borderSubtle : colors.borderSubtle,
                    borderRadius: radii.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    backgroundColor: options?.disabled ? colors.surfaceMuted : colors.surfaceMuted,
                    color: options?.disabled ? colors.textMuted : colors.textPrimary,
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
                <Text style={{ ...typography.body, color: colors.textMuted, marginTop: spacing.md }}>Loading portfolio...</Text>
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
                {/* Header */}
                <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md }}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}
                    >
                        <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
                        <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>Back</Text>
                    </TouchableOpacity>

                    <Text style={{ ...typography.displayMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
                        {vendor ? 'Update Vendor Portfolio' : 'Create Vendor Portfolio'}
                    </Text>
                    <Text style={{ ...typography.body, color: colors.textMuted }}>
                        {vendor ? 'Edit your business listing details' : 'Set up your business listing details'}
                    </Text>
                </View>

                <View style={{ paddingHorizontal: spacing.lg }}>
                    {!vendor && (
                        <View
                            style={{
                                backgroundColor: colors.surface,
                                borderRadius: radii.md,
                                padding: spacing.md,
                                marginBottom: spacing.lg,
                                borderWidth: 1,
                                borderColor: colors.borderSubtle,
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}
                        >
                            <MaterialIcons name="info" size={20} color={colors.textMuted} style={{ marginRight: spacing.sm }} />
                            <Text style={{ ...typography.body, color: colors.textSecondary, flex: 1 }}>
                                You haven't created a vendor portfolio yet. Fill in the details below and save to create one.
                            </Text>
                        </View>
                    )}
                        {vendor && (
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: colors.surface,
                                    borderRadius: radii.md,
                                    padding: spacing.md,
                                    marginBottom: spacing.lg,
                                    borderWidth: 1,
                                    borderColor: colors.borderSubtle,
                                }}
                            >
                                <MaterialIcons name="verified" size={20} color={colors.textPrimary} style={{ marginRight: spacing.sm }} />
                                <View style={{ flex: 1 }}>
                                    <Text style={{ ...typography.caption, color: colors.textMuted }}>Current Plan</Text>
                                    <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary }}>
                                        {(vendor.subscription_tier || 'Free').charAt(0).toUpperCase() + (vendor.subscription_tier || 'free').slice(1)}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => navigation.navigate('SubscriptionPlans')}
                                    style={{
                                        paddingHorizontal: spacing.md,
                                        paddingVertical: spacing.xs,
                                        borderRadius: radii.full,
                                        backgroundColor: colors.primary,
                                    }}
                                >
                                    <Text style={{ ...typography.captionSemiBold, color: '#FFFFFF' }}>Upgrade</Text>
                                </TouchableOpacity>
                            </View>
                        )}

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
                                        {currentPhotoCount} of {photoLimit} photos used
                                    </Text>
                                </View>
                                {vendor && (
                                    <TouchableOpacity
                                        onPress={() => navigation.navigate('SubscriptionPlans')}
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
                        </View>

                        {vendor && <View
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
                                        Add packages and pricing for your services
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => {
                                        if (!vendor) {
                                            setAlertState({ visible: true, title: 'Create profile first', message: 'Please create your vendor profile before adding catalogue items.', buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
                                            return;
                                        }
                                        navigation.navigate('VendorCatalogue');
                                    }}
                                    style={{
                                        paddingHorizontal: spacing.md,
                                        paddingVertical: spacing.xs,
                                        borderRadius: radii.full,
                                        backgroundColor: colors.primary,
                                    }}
                                >
                                    <Text style={{ ...typography.captionBold, color: '#FFFFFF' }}>
                                        Manage
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>}

                        {/* Analytics & Stats */}
                        {vendor && <View
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
                                        View your vendor activity summary
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => {
                                        if (!vendor) {
                                            setAlertState({ visible: true, title: 'Create profile first', message: 'Please create your vendor profile before viewing analytics.', buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
                                            return;
                                        }
                                        if (!canEditLinks) {
                                            navigation.navigate('SubscriptionPlans');
                                            return;
                                        }
                                        navigation.navigate('VendorAnalytics');
                                    }}
                                    style={{
                                        paddingHorizontal: spacing.md,
                                        paddingVertical: spacing.xs,
                                        borderRadius: radii.full,
                                        backgroundColor: canEditLinks ? colors.primary : colors.surfaceMuted,
                                        borderWidth: canEditLinks ? 0 : 1,
                                        borderColor: colors.borderSubtle,
                                    }}
                                >
                                    <Text
                                        style={{
                                            ...typography.captionBold,
                                            color: canEditLinks ? '#FFFFFF' : colors.textMuted,
                                        }}
                                    >
                                        {canEditLinks ? 'Open' : 'Upgrade'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            {!canEditLinks && (
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
                                        Analytics & stats are available on paid vendor plans.
                                    </Text>
                                </View>
                            )}
                        </View>}

                        {/* Edit Form */}
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
                                Business Details
                            </Text>
                            <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.lg }}>
                                Fields marked with <Text style={{ color: '#EF4444' }}>*</Text> are required.
                            </Text>
                            {renderField('Business Name', 'name', { required: true })}
                            {renderField('Description', 'description', { multiline: true, placeholder: 'Describe your services...', required: true })}
                            {renderField('Address Line 1', 'address_line_1', { placeholder: 'Street address' })}
                            {renderField('Address Line 2', 'address_line_2', { placeholder: 'Building, unit, suite (optional)' })}
                            {renderField('Suburb', 'suburb', { placeholder: 'e.g. Gardens' })}
                            {renderField('City', 'city', { placeholder: 'e.g. Cape Town' })}
                            {renderField('Province', 'province', { placeholder: 'e.g. Western Cape' })}
                            {renderField('Postal Code', 'postal_code', { placeholder: 'e.g. 8001', keyboardType: 'number-pad' })}
                            {renderField('Country', 'country', { placeholder: 'e.g. South Africa' })}
                            {renderField('Latitude', 'latitude', { placeholder: 'e.g. -33.9249', keyboardType: 'numeric' })}
                            {renderField('Longitude', 'longitude', { placeholder: 'e.g. 18.4241', keyboardType: 'numeric' })}
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
                            {renderField('Price Range', 'price_range', { placeholder: 'e.g. R500 - R5,000' })}
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
                            {renderField('Email', 'email', { keyboardType: 'email-address', placeholder: 'business@example.com' })}
                            {renderField('WhatsApp Number', 'whatsapp_number', { keyboardType: 'phone-pad', placeholder: '+27...' })}
                            {!canEditLinks && (
                                <TouchableOpacity
                                    onPress={() => navigation.navigate('SubscriptionPlans')}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        backgroundColor: '#FEF3C7',
                                        borderRadius: radii.md,
                                        paddingHorizontal: spacing.md,
                                        paddingVertical: spacing.sm,
                                        marginBottom: spacing.md,
                                        gap: spacing.sm,
                                    }}
                                >
                                    <MaterialIcons name="lock" size={16} color="#B45309" />
                                    <Text style={{ ...typography.caption, color: '#B45309', flex: 1 }}>
                                        Upgrade to add website and social media links.
                                    </Text>
                                    <Text style={{ ...typography.captionSemiBold, color: colors.primary }}>
                                        View Plans
                                    </Text>
                                </TouchableOpacity>
                            )}
                            {renderField('Website URL', 'website_url', { keyboardType: 'url', placeholder: 'https://...', disabled: !canEditLinks })}
                            {renderField('Instagram URL', 'instagram_url', { keyboardType: 'url', placeholder: 'https://instagram.com/...', disabled: !canEditLinks })}
                        </View>

                        {/* Tags display */}
                        {vendor && (vendor.service_options?.length || vendor.vendor_tags?.length) ? (
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
                                    Services & Tags
                                </Text>
                                {vendor.service_options && vendor.service_options.length > 0 && (
                                    <View style={{ marginBottom: spacing.sm }}>
                                        <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>
                                            Service Options
                                        </Text>
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                                            {vendor.service_options.map((opt, i) => (
                                                <View
                                                    key={i}
                                                    style={{
                                                        paddingHorizontal: spacing.sm,
                                                        paddingVertical: spacing.xs,
                                                        borderRadius: radii.full,
                                                        backgroundColor: colors.surfaceMuted,
                                                        borderWidth: 1,
                                                        borderColor: colors.borderSubtle,
                                                    }}
                                                >
                                                    <Text style={{ ...typography.caption, color: colors.textPrimary }}>{opt}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                )}
                                {vendor.vendor_tags && vendor.vendor_tags.length > 0 && (
                                    <View>
                                        <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>
                                            Tags
                                        </Text>
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                                            {vendor.vendor_tags.map((tag, i) => (
                                                <View
                                                    key={i}
                                                    style={{
                                                        paddingHorizontal: spacing.sm,
                                                        paddingVertical: spacing.xs,
                                                        borderRadius: radii.full,
                                                        backgroundColor: '#f2f7ff',
                                                        borderWidth: 1,
                                                        borderColor: colors.textPrimary,
                                                    }}
                                                >
                                                    <Text style={{ ...typography.caption, color: colors.textPrimary }}>{tag}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                )}
                            </View>
                        ) : null}

                        {/* Save Button */}
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
                                {saving ? 'Saving...' : (vendor ? 'Save Changes' : 'Create Portfolio')}
                            </Text>
                        </TouchableOpacity>
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
