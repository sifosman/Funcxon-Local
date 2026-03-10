import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radii, typography } from '../../theme';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../auth/AuthContext';

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
};

export default function UpdateVendorPortfolioScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [vendor, setVendor] = useState<VendorListing | null>(null);
    const [canEditLinks, setCanEditLinks] = useState(true);
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
                .select('id, name, description, location, address_line_1, address_line_2, suburb, city, province, postal_code, country, latitude, longitude, price_range, email, whatsapp_number, website_url, instagram_url, subscription_tier, subscription_status, service_options, amenities, vendor_tags')
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
            Alert.alert(
                'Upgrade Required',
                'Website & social media links are available on paid vendor plans. Please upgrade to add these links.',
                [
                    { text: 'Not now', style: 'cancel' },
                    { text: 'View Plans', onPress: () => navigation.navigate('SubscriptionPlans') },
                ],
            );
            return;
        }

        setForm((prev) => ({ ...prev, [key]: value }));
    };

    useEffect(() => {
        loadVendor();
    }, [loadVendor]);

    const handleSave = async () => {
        if (!vendor) return;
        if (!form.name.trim()) {
            Alert.alert('Required', 'Business name is required.');
            return;
        }
        const latitude = parseCoordinate(form.latitude);
        const longitude = parseCoordinate(form.longitude);
        if ((form.latitude.trim() && latitude === null) || (form.longitude.trim() && longitude === null)) {
            Alert.alert('Invalid coordinates', 'Latitude and longitude must be valid numbers.');
            return;
        }
        setSaving(true);
        try {
            const { error } = await supabase
                .from('vendors')
                .update({
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
                })
                .eq('id', vendor.id);

            if (error) throw error;
            Alert.alert('Saved', 'Your portfolio has been updated.');
        } catch (err: any) {
            Alert.alert('Error', err?.message ?? 'Failed to save changes.');
        } finally {
            setSaving(false);
        }
    };

    const renderField = (
        label: string,
        key: keyof typeof form,
        options?: { multiline?: boolean; placeholder?: string; keyboardType?: any },
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
                style={{
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                    borderRadius: radii.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    backgroundColor: colors.surfaceMuted,
                    color: colors.textPrimary,
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
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
                {/* Header */}
                <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.md }}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}
                    >
                        <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
                        <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>Back</Text>
                    </TouchableOpacity>

                    <Text style={{ ...typography.displayMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
                        Update Vendor Portfolio
                    </Text>
                    <Text style={{ ...typography.body, color: colors.textMuted }}>
                        Edit your business listing details
                    </Text>
                </View>

                {!vendor ? (
                    <View style={{ paddingHorizontal: spacing.lg, alignItems: 'center', paddingTop: spacing.xl }}>
                        <MaterialIcons name="storefront" size={48} color={colors.textMuted} />
                        <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginTop: spacing.md, textAlign: 'center' }}>
                            No Vendor Portfolio Found
                        </Text>
                        <Text style={{ ...typography.body, color: colors.textMuted, marginTop: spacing.sm, textAlign: 'center' }}>
                            You haven't created a vendor portfolio yet.
                        </Text>
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={{
                                marginTop: spacing.lg,
                                paddingHorizontal: spacing.xl,
                                paddingVertical: spacing.md,
                                borderRadius: radii.md,
                                backgroundColor: colors.primary,
                            }}
                        >
                            <Text style={{ ...typography.body, color: '#FFFFFF', fontWeight: '600' }}>Go Back</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={{ paddingHorizontal: spacing.lg }}>
                        {/* Current Plan Badge */}
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
                            <MaterialIcons name="verified" size={20} color={colors.primaryTeal} style={{ marginRight: spacing.sm }} />
                            <View style={{ flex: 1 }}>
                                <Text style={{ ...typography.caption, color: colors.textMuted }}>Current Plan</Text>
                                <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
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
                                <Text style={{ ...typography.caption, color: '#FFFFFF', fontWeight: '600' }}>Upgrade</Text>
                            </TouchableOpacity>
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
                                        Add packages and pricing for your services
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => {
                                        if (!vendor) {
                                            Alert.alert('Create profile first', 'Please create your vendor profile before adding catalogue items.');
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
                                    <Text style={{ ...typography.caption, color: '#FFFFFF', fontWeight: '700' }}>
                                        Manage
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

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
                            <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>
                                Business Details
                            </Text>
                            {renderField('Business Name', 'name')}
                            {renderField('Description', 'description', { multiline: true, placeholder: 'Describe your services...' })}
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
                            {renderField('Website URL', 'website_url', { keyboardType: 'url', placeholder: 'https://...' })}
                            {renderField('Instagram URL', 'instagram_url', { keyboardType: 'url', placeholder: 'https://instagram.com/...' })}
                        </View>

                        {/* Tags display */}
                        {(vendor.service_options?.length || vendor.vendor_tags?.length) ? (
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
                                                        backgroundColor: '#E0F2F7',
                                                        borderWidth: 1,
                                                        borderColor: colors.primaryTeal,
                                                    }}
                                                >
                                                    <Text style={{ ...typography.caption, color: colors.primaryTeal }}>{tag}</Text>
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
                            <Text style={{ ...typography.body, color: '#FFFFFF', fontWeight: '600' }}>
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}
