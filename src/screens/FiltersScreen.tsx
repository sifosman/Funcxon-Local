import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing, radii, typography } from '../theme';
import { VENDOR_CATEGORIES } from './AttendeeHomeScreen';
import { venueTypes, amenitiesList, venueCapacityOptions } from '../config/venueTypes';
import { allVendorTags } from '../config/vendorTags';
import { provinces } from '../config/locations';
import MapRadiusSelector from '../components/MapRadiusSelector';
import * as ExpoLocation from 'expo-location';
import {
  type CategoryFilter,
  type FilterState,
  getSharedFilterState,
  setSharedFilterState,
} from '../lib/sharedFilterState';
import type { AttendeeStackParamList } from '../navigation/AttendeeNavigator';

type FiltersNavigation = NativeStackNavigationProp<AttendeeStackParamList, 'Filters'>;

export default function FiltersScreen() {
  const navigation = useNavigation<FiltersNavigation>();
  const insets = useSafeAreaInsets();

  const initial = getSharedFilterState();

  const [category, setCategory] = useState<CategoryFilter>(initial?.category ?? 'all');
  const [minRating, setMinRating] = useState<number | null>(initial?.minRating ?? null);
  const [onlyWithPrice, setOnlyWithPrice] = useState(initial?.onlyWithPrice ?? false);
  const [featuredOnly, setFeaturedOnly] = useState(initial?.featuredOnly ?? false);
  const [selectedVenueTypes, setSelectedVenueTypes] = useState<string[]>(initial?.selectedVenueTypes ?? []);
  const [selectedVenueAmenities, setSelectedVenueAmenities] = useState<string[]>(initial?.selectedVenueAmenities ?? []);
  const [selectedCapacity, setSelectedCapacity] = useState<string | null>(initial?.selectedCapacity ?? null);
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>(initial?.selectedProvinces ?? []);
  const [selectedCities, setSelectedCities] = useState<string[]>(initial?.selectedCities ?? []);
  const [selectedVendorCategories, setSelectedVendorCategories] = useState<number[]>(initial?.selectedVendorCategories ?? []);
  const [selectedVendorSubcategories, setSelectedVendorSubcategories] = useState<string[]>(initial?.selectedVendorSubcategories ?? []);
  const [selectedVendorTags, setSelectedVendorTags] = useState<string[]>(initial?.selectedVendorTags ?? []);
  const [selectedVendorProvinces, setSelectedVendorProvinces] = useState<string[]>(initial?.selectedVendorProvinces ?? []);
  const [selectedVendorCities, setSelectedVendorCities] = useState<string[]>(initial?.selectedVendorCities ?? []);
  const [selectedLocationProvince, setSelectedLocationProvince] = useState(initial?.selectedLocationProvince ?? '');

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [dropdownSearch, setDropdownSearch] = useState('');
  const [showMapRadiusSelector, setShowMapRadiusSelector] = useState(false);
  const [mapRadius, setMapRadius] = useState(20);

  const availableCities = useMemo(() => {
    if (selectedProvinces.length === 0) {
      return provinces.flatMap((p) => p.cities).sort();
    }
    return selectedProvinces
      .flatMap((p) => {
        const prov = provinces.find((pr) => pr.name === p);
        return prov ? prov.cities : [];
      })
      .sort();
  }, [selectedProvinces]);

  const availableVendorCities = useMemo(() => {
    if (selectedVendorProvinces.length === 0) {
      return provinces.flatMap((p) => p.cities).sort();
    }
    return selectedVendorProvinces
      .flatMap((p) => {
        const prov = provinces.find((pr) => pr.name === p);
        return prov ? prov.cities : [];
      })
      .sort();
  }, [selectedVendorProvinces]);

  const availableVendorSubcategories = useMemo(() => {
    const resolvedCategoryIds = selectedVendorCategories.length
      ? selectedVendorCategories
      : VENDOR_CATEGORIES.map((c) => c.id);

    const subcats = resolvedCategoryIds
      .map((id) => VENDOR_CATEGORIES.find((c) => c.id === id)?.subcategories ?? [])
      .flat();

    return Array.from(new Set(subcats.map((v) => String(v ?? '').trim()).filter(Boolean))).sort();
  }, [selectedVendorCategories]);

  const clearFilters = () => {
    setMinRating(null);
    setOnlyWithPrice(false);
    setFeaturedOnly(false);
    setCategory('all');
    setSelectedVenueTypes([]);
    setSelectedVenueAmenities([]);
    setSelectedCapacity(null);
    setSelectedProvinces([]);
    setSelectedCities([]);
    setSelectedVendorCategories([]);
    setSelectedVendorSubcategories([]);
    setSelectedVendorTags([]);
    setSelectedVendorProvinces([]);
    setSelectedVendorCities([]);
    setSelectedLocationProvince('');
    // Auto-apply cleared filters immediately so user sees all listings without
    // having to press "Show Results" after clearing.
    const emptyState: FilterState = {
      category: 'all',
      minRating: null,
      onlyWithPrice: false,
      featuredOnly: false,
      selectedVenueTypes: [],
      selectedVenueAmenities: [],
      selectedCapacity: null,
      selectedProvinces: [],
      selectedCities: [],
      selectedVendorCategories: [],
      selectedVendorSubcategories: [],
      selectedVendorTags: [],
      selectedVendorProvinces: [],
      selectedVendorCities: [],
      selectedLocationProvince: '',
    };
    setSharedFilterState(emptyState);
    navigation.goBack();
  };

  const handleShowResults = () => {
    const state: FilterState = {
      category,
      minRating,
      onlyWithPrice,
      featuredOnly,
      selectedVenueTypes,
      selectedVenueAmenities,
      selectedCapacity,
      selectedProvinces,
      selectedCities,
      selectedVendorCategories,
      selectedVendorSubcategories,
      selectedVendorTags,
      selectedVendorProvinces,
      selectedVendorCities,
      selectedLocationProvince,
    };
    setSharedFilterState(state);
    navigation.goBack();
  };

  const dropdownTitle =
    activeDropdown === 'venue_type'
      ? 'Select your preferred venue type'
      : activeDropdown === 'venue_amenities'
      ? 'Select your ideal venue amenities'
      : activeDropdown === 'capacity'
      ? 'Select venue capacity'
      : activeDropdown === 'province'
      ? 'Select preferred provinces'
      : activeDropdown === 'city'
      ? 'Select preferred cities'
      : activeDropdown === 'vendor_category'
      ? 'Select vendor category'
      : activeDropdown === 'vendor_subcategory'
      ? 'Select service type'
      : activeDropdown === 'vendor_tags'
      ? 'Select tags'
      : activeDropdown === 'vendor_province'
      ? 'Select preferred provinces'
      : activeDropdown === 'vendor_city'
      ? 'Select preferred cities'
      : '';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: spacing.lg,
          paddingTop: insets.top + spacing.sm,
          paddingBottom: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderSubtle,
        }}
      >
        <Text style={{ ...typography.titleLarge, color: colors.textPrimary }}>Filters</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xxl }}
      >
        {/* Browse by category */}
        <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>Browse by</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.sm, columnGap: spacing.sm, marginBottom: spacing.md }}>
          {[
            { key: 'all' as CategoryFilter, label: 'All' },
            { key: 'venues' as CategoryFilter, label: 'Venues' },
            { key: 'vendors' as CategoryFilter, label: 'Vendors & Services' },
          ].map((option) => {
            const selected = category === option.key;
            return (
              <TouchableOpacity
                key={option.key}
                onPress={() => setCategory(option.key)}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                  borderRadius: radii.full,
                  borderWidth: 1,
                  borderColor: selected ? colors.coral : colors.borderSubtle,
                  backgroundColor: selected ? colors.coral : colors.surface,
                }}
              >
                <Text style={{ ...typography.caption, color: selected ? '#FFFFFF' : colors.textPrimary }}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Venue-specific filters */}
        {(category === 'all' || category === 'venues') && (
          <>
            <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>Select your preferred venue type</Text>
            <TouchableOpacity
              onPress={() => { setDropdownSearch(''); setActiveDropdown('venue_type'); }}
              style={{
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                backgroundColor: colors.surfaceMuted,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                marginBottom: spacing.md,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text style={{ ...typography.body, color: selectedVenueTypes.length > 0 ? colors.textPrimary : colors.textMuted }} numberOfLines={1}>
                {selectedVenueTypes.length > 0 ? selectedVenueTypes.join(', ') : 'Any'}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>Select your ideal venue amenities</Text>
            <TouchableOpacity
              onPress={() => { setDropdownSearch(''); setActiveDropdown('venue_amenities'); }}
              style={{
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                backgroundColor: colors.surfaceMuted,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                marginBottom: spacing.md,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text style={{ ...typography.body, color: selectedVenueAmenities.length > 0 ? colors.textPrimary : colors.textMuted }} numberOfLines={1}>
                {selectedVenueAmenities.length > 0 ? selectedVenueAmenities.join(', ') : 'Any'}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>Select venue capacity</Text>
            <TouchableOpacity
              onPress={() => { setDropdownSearch(''); setActiveDropdown('capacity'); }}
              style={{
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                backgroundColor: colors.surfaceMuted,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                marginBottom: spacing.md,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text style={{ ...typography.body, color: selectedCapacity ? colors.textPrimary : colors.textMuted }}>
                {selectedCapacity ?? 'Any'}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>Select preferred provinces</Text>
            <TouchableOpacity
              onPress={() => { setDropdownSearch(''); setActiveDropdown('province'); }}
              style={{
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                backgroundColor: colors.surfaceMuted,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                marginBottom: spacing.md,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text style={{ ...typography.body, color: selectedProvinces.length > 0 ? colors.textPrimary : colors.textMuted }} numberOfLines={1}>
                {selectedProvinces.length > 0 ? selectedProvinces.join(', ') : 'Any'}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>Select preferred cities</Text>
            <TouchableOpacity
              onPress={() => { setDropdownSearch(''); setActiveDropdown('city'); }}
              style={{
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                backgroundColor: colors.surfaceMuted,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                marginBottom: spacing.md,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text style={{ ...typography.body, color: selectedCities.length > 0 ? colors.textPrimary : colors.textMuted }} numberOfLines={1}>
                {selectedCities.length > 0 ? selectedCities.join(', ') : 'Any'}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

                       {/* Map Radius */}
            <TouchableOpacity
              onPress={() => setShowMapRadiusSelector(true)}
              style={{
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: colors.primary,
                backgroundColor: colors.surface,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                marginBottom: spacing.md,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialIcons name="map" size={18} color={colors.primary} style={{ marginRight: spacing.xs }} />
              <Text style={{ ...typography.bodySemiBold, color: colors.primary }}>
                Select search area by map radius
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Vendor-specific filters */}
        {(category === 'all' || category === 'vendors' || category === 'services') && (
          <>
            <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>Select vendor category</Text>
            <TouchableOpacity
              onPress={() => { setDropdownSearch(''); setActiveDropdown('vendor_category'); }}
              style={{
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                backgroundColor: colors.surfaceMuted,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                marginBottom: spacing.md,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text style={{ ...typography.body, color: selectedVendorCategories.length > 0 ? colors.textPrimary : colors.textMuted }} numberOfLines={1}>
                {selectedVendorCategories.length > 0 ? selectedVendorCategories.map((id) => VENDOR_CATEGORIES.find((c) => c.id === id)?.label ?? id).join(', ') : 'Any'}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>Select service type</Text>
            <TouchableOpacity
              onPress={() => { setDropdownSearch(''); setActiveDropdown('vendor_subcategory'); }}
              style={{
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                backgroundColor: colors.surfaceMuted,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                marginBottom: spacing.md,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text style={{ ...typography.body, color: selectedVendorSubcategories.length > 0 ? colors.textPrimary : colors.textMuted }} numberOfLines={1}>
                {selectedVendorSubcategories.length > 0 ? selectedVendorSubcategories.join(', ') : 'Any'}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>Select tags</Text>
            <TouchableOpacity
              onPress={() => { setDropdownSearch(''); setActiveDropdown('vendor_tags'); }}
              style={{
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                backgroundColor: colors.surfaceMuted,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                marginBottom: spacing.md,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text style={{ ...typography.body, color: selectedVendorTags.length > 0 ? colors.textPrimary : colors.textMuted }} numberOfLines={1}>
                {selectedVendorTags.length > 0 ? selectedVendorTags.join(', ') : 'Any'}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </>
        )}

        {(category === 'vendors' || category === 'services') && (
          <>
            <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>Select preferred provinces</Text>
            <TouchableOpacity
              onPress={() => { setDropdownSearch(''); setActiveDropdown('vendor_province'); }}
              style={{
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                backgroundColor: colors.surfaceMuted,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                marginBottom: spacing.md,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text style={{ ...typography.body, color: selectedVendorProvinces.length > 0 ? colors.textPrimary : colors.textMuted }} numberOfLines={1}>
                {selectedVendorProvinces.length > 0 ? selectedVendorProvinces.join(', ') : 'Any'}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>Select preferred cities</Text>
            <TouchableOpacity
              onPress={() => { setDropdownSearch(''); setActiveDropdown('vendor_city'); }}
              style={{
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                backgroundColor: colors.surfaceMuted,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                marginBottom: spacing.md,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text style={{ ...typography.body, color: selectedVendorCities.length > 0 ? colors.textPrimary : colors.textMuted }} numberOfLines={1}>
                {selectedVendorCities.length > 0 ? selectedVendorCities.join(', ') : 'Any'}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            {/* Map Radius */}
            <TouchableOpacity
              onPress={() => setShowMapRadiusSelector(true)}
              style={{
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: colors.primary,
                backgroundColor: colors.surface,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                marginBottom: spacing.md,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialIcons name="map" size={18} color={colors.primary} style={{ marginRight: spacing.xs }} />
              <Text style={{ ...typography.bodySemiBold, color: colors.primary }}>
                Select search area by map radius
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Minimum rating */}
        <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>Minimum rating</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.sm, columnGap: spacing.sm, marginBottom: spacing.md }}>
          {[
            { label: 'Any', value: null },
            { label: '3.5+', value: 3.5 },
            { label: '4.0+', value: 4 },
            { label: '4.5+', value: 4.5 },
          ].map((option) => {
            const selected = minRating === option.value;
            return (
              <TouchableOpacity
                key={option.label}
                onPress={() => setMinRating(option.value)}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                  borderRadius: radii.full,
                  borderWidth: 1,
                  borderColor: selected ? colors.coral : colors.borderSubtle,
                  backgroundColor: selected ? colors.coral : colors.surface,
                }}
              >
                <Text style={{ ...typography.caption, color: selected ? '#FFFFFF' : colors.textPrimary }}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Toggles */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.sm, columnGap: spacing.sm, marginBottom: spacing.lg }}>
          <TouchableOpacity
            onPress={() => setOnlyWithPrice((prev) => !prev)}
            style={{
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.xs,
              borderRadius: radii.full,
              borderWidth: 1,
              borderColor: onlyWithPrice ? colors.coral : colors.borderSubtle,
              backgroundColor: onlyWithPrice ? colors.coral : colors.surface,
            }}
          >
            <Text style={{ ...typography.caption, color: onlyWithPrice ? '#FFFFFF' : colors.textPrimary }}>
              Only with price
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFeaturedOnly((prev) => !prev)}
            style={{
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.xs,
              borderRadius: radii.full,
              borderWidth: 1,
              borderColor: featuredOnly ? colors.coral : colors.borderSubtle,
              backgroundColor: featuredOnly ? colors.coral : colors.surface,
            }}
          >
            <Text style={{ ...typography.caption, color: featuredOnly ? '#FFFFFF' : colors.textPrimary }}>
              Featured focus
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom action bar */}
      <View
        style={{
          padding: spacing.lg,
          paddingBottom: insets.bottom + spacing.lg,
          borderTopWidth: 1,
          borderTopColor: colors.borderSubtle,
          flexDirection: 'row',
          columnGap: spacing.md,
        }}
      >
        <TouchableOpacity
          onPress={clearFilters}
          style={{
            flex: 1,
            paddingVertical: spacing.md,
            borderRadius: radii.full,
            borderWidth: 1.5,
            borderColor: colors.borderSubtle,
            backgroundColor: colors.surface,
            alignItems: 'center',
          }}
          accessibilityLabel="Clear filters"
        >
          <Text style={{ ...typography.buttonMedium, color: colors.textPrimary }}>Clear Filters</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleShowResults}
          style={{
            flex: 1,
            paddingVertical: spacing.md,
            borderRadius: radii.full,
            borderWidth: 1.5,
            borderColor: colors.primary,
            backgroundColor: colors.primary,
            alignItems: 'center',
          }}
          accessibilityLabel="Show results"
        >
          <Text style={{ ...typography.buttonMedium, color: colors.primaryForeground }}>Show results</Text>
        </TouchableOpacity>
      </View>

      {/* Dropdown Picker Modal */}
      <Modal visible={activeDropdown !== null} transparent animationType="slide" onRequestClose={() => setActiveDropdown(null)}>
        <KeyboardAvoidingView
          behavior="padding"
          style={{ flex: 1, justifyContent: 'flex-end' }}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' }}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setActiveDropdown(null)} />
            <View
              style={{
                backgroundColor: colors.surface,
                borderTopLeftRadius: radii.xl,
                borderTopRightRadius: radii.xl,
                padding: spacing.lg,
                maxHeight: '75%',
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
                <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>
                  {dropdownTitle}
                </Text>
                <TouchableOpacity onPress={() => setActiveDropdown(null)}>
                  <MaterialIcons name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {activeDropdown !== 'capacity' && (
                <TextInput
                  value={dropdownSearch}
                  onChangeText={setDropdownSearch}
                  placeholder="Search..."
                  placeholderTextColor={colors.textMuted}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                    borderRadius: radii.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    color: colors.textPrimary,
                    backgroundColor: colors.surfaceMuted,
                    marginBottom: spacing.md,
                    fontFamily: typography.body.fontFamily,
                  }}
                />
              )}

              <ScrollView
                keyboardShouldPersistTaps="handled"
                style={{ maxHeight: 400 }}
                contentContainerStyle={{ paddingBottom: spacing.xl }}
              >
                {(() => {
                  const isMulti = activeDropdown === 'venue_type' || activeDropdown === 'venue_amenities' || activeDropdown === 'province' || activeDropdown === 'city' || activeDropdown === 'vendor_category' || activeDropdown === 'vendor_subcategory' || activeDropdown === 'vendor_tags' || activeDropdown === 'vendor_province' || activeDropdown === 'vendor_city';
                  const isSingle = !isMulti;

                  let allOptions: string[] = [];
                  if (activeDropdown === 'venue_type') allOptions = venueTypes;
                  else if (activeDropdown === 'venue_amenities') allOptions = amenitiesList;
                  else if (activeDropdown === 'capacity') allOptions = venueCapacityOptions;
                  else if (activeDropdown === 'province') allOptions = provinces.map((p) => p.name);
                  else if (activeDropdown === 'city') allOptions = availableCities;
                  else if (activeDropdown === 'vendor_category') allOptions = VENDOR_CATEGORIES.map((c) => c.label);
                  else if (activeDropdown === 'vendor_subcategory') allOptions = availableVendorSubcategories;
                  else if (activeDropdown === 'vendor_tags') allOptions = allVendorTags;
                  else if (activeDropdown === 'vendor_province') allOptions = provinces.map((p) => p.name);
                  else if (activeDropdown === 'vendor_city') allOptions = availableVendorCities;

                  const filteredOptions = allOptions
                    .filter((opt) => opt.toLowerCase().includes(dropdownSearch.trim().toLowerCase()))
                    .sort((a, b) => a.localeCompare(b));

                  const anySelected =
                    activeDropdown === 'venue_type'
                      ? selectedVenueTypes.length === 0
                      : activeDropdown === 'venue_amenities'
                      ? selectedVenueAmenities.length === 0
                      : activeDropdown === 'capacity'
                      ? selectedCapacity === null
                      : activeDropdown === 'province'
                      ? selectedProvinces.length === 0
                      : activeDropdown === 'city'
                      ? selectedCities.length === 0
                      : activeDropdown === 'vendor_category'
                      ? selectedVendorCategories.length === 0
                      : activeDropdown === 'vendor_subcategory'
                      ? selectedVendorSubcategories.length === 0
                      : activeDropdown === 'vendor_tags'
                      ? selectedVendorTags.length === 0
                      : activeDropdown === 'vendor_province'
                      ? selectedVendorProvinces.length === 0
                      : activeDropdown === 'vendor_city'
                      ? selectedVendorCities.length === 0
                      : true;

                  const options = ['Any', ...filteredOptions];

                  return options.map((option) => {
                    if (option === 'Any') {
                      return (
                        <TouchableOpacity
                          key="any"
                          onPress={() => {
                            if (activeDropdown === 'venue_type') setSelectedVenueTypes([]);
                            else if (activeDropdown === 'venue_amenities') setSelectedVenueAmenities([]);
                            else if (activeDropdown === 'capacity') setSelectedCapacity(null);
                            else if (activeDropdown === 'province') setSelectedProvinces([]);
                            else if (activeDropdown === 'city') setSelectedCities([]);
                            else if (activeDropdown === 'vendor_category') { setSelectedVendorCategories([]); setSelectedVendorSubcategories([]); }
                            else if (activeDropdown === 'vendor_subcategory') setSelectedVendorSubcategories([]);
                            else if (activeDropdown === 'vendor_tags') setSelectedVendorTags([]);
                            else if (activeDropdown === 'vendor_province') { setSelectedVendorProvinces([]); setSelectedVendorCities((prev) => prev.filter((c) => provinces.flatMap((p) => p.cities).includes(c))); }
                            else if (activeDropdown === 'vendor_city') setSelectedVendorCities([]);
                            if (isSingle) setActiveDropdown(null);
                          }}
                          style={{ paddingVertical: spacing.sm, flexDirection: 'row', alignItems: 'center' }}
                        >
                          <View
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 4,
                              borderWidth: 2,
                              borderColor: anySelected ? colors.coral : '#D1D5DB',
                              backgroundColor: anySelected ? colors.coral : '#FFFFFF',
                              marginRight: spacing.sm,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {anySelected && <MaterialIcons name="check" size={16} color="#FFFFFF" />}
                          </View>
                          <Text style={{ ...typography.body, color: colors.textPrimary }}>Any</Text>
                        </TouchableOpacity>
                      );
                    }

                    const isSelected =
                      activeDropdown === 'venue_type'
                        ? selectedVenueTypes.includes(option)
                        : activeDropdown === 'venue_amenities'
                        ? selectedVenueAmenities.includes(option)
                        : activeDropdown === 'capacity'
                        ? selectedCapacity === option
                        : activeDropdown === 'province'
                        ? selectedProvinces.includes(option)
                        : activeDropdown === 'city'
                        ? selectedCities.includes(option)
                        : activeDropdown === 'vendor_category'
                        ? selectedVendorCategories.some((id) => VENDOR_CATEGORIES.find((c) => c.id === id)?.label === option)
                        : activeDropdown === 'vendor_subcategory'
                        ? selectedVendorSubcategories.includes(option)
                        : activeDropdown === 'vendor_tags'
                        ? selectedVendorTags.includes(option)
                        : activeDropdown === 'vendor_province'
                        ? selectedVendorProvinces.includes(option)
                        : activeDropdown === 'vendor_city'
                        ? selectedVendorCities.includes(option)
                        : false;

                    return (
                      <TouchableOpacity
                        key={option}
                        onPress={() => {
                          if (activeDropdown === 'venue_type') {
                            setSelectedVenueTypes((prev) =>
                              prev.includes(option) ? prev.filter((t) => t !== option) : [...prev, option]
                            );
                          } else if (activeDropdown === 'venue_amenities') {
                            setSelectedVenueAmenities((prev) =>
                              prev.includes(option) ? prev.filter((a) => a !== option) : [...prev, option]
                            );
                          } else if (activeDropdown === 'capacity') {
                            setSelectedCapacity(isSelected ? null : option);
                            setActiveDropdown(null);
                          } else if (activeDropdown === 'province') {
                            setSelectedProvinces((prev) => {
                              const next = prev.includes(option) ? prev.filter((p) => p !== option) : [...prev, option];
                              const validCities = next.length === 0
                                ? provinces.flatMap((p) => p.cities)
                                : next.flatMap((p) => {
                                    const prov = provinces.find((pr) => pr.name === p);
                                    return prov ? prov.cities : [];
                                  });
                              setSelectedCities((cityPrev) => cityPrev.filter((c) => validCities.includes(c)));
                              return next;
                            });
                          } else if (activeDropdown === 'city') {
                            setSelectedCities((prev) =>
                              prev.includes(option) ? prev.filter((c) => c !== option) : [...prev, option]
                            );
                          } else if (activeDropdown === 'vendor_category') {
                            const cat = VENDOR_CATEGORIES.find((c) => c.label === option);
                            if (!cat) return;
                            setSelectedVendorCategories((prev) => {
                              const next = prev.includes(cat.id) ? prev.filter((id) => id !== cat.id) : [...prev, cat.id];
                              setSelectedVendorSubcategories((subPrev) => {
                                const validSubcats = next
                                  .map((id) => VENDOR_CATEGORIES.find((c) => c.id === id)?.subcategories ?? [])
                                  .flat();
                                return subPrev.filter((s) => validSubcats.includes(s));
                              });
                              return next;
                            });
                          } else if (activeDropdown === 'vendor_subcategory') {
                            setSelectedVendorSubcategories((prev) =>
                              prev.includes(option) ? prev.filter((s) => s !== option) : [...prev, option]
                            );
                          } else if (activeDropdown === 'vendor_tags') {
                            setSelectedVendorTags((prev) =>
                              prev.includes(option) ? prev.filter((s) => s !== option) : [...prev, option]
                            );
                          } else if (activeDropdown === 'vendor_province') {
                            setSelectedVendorProvinces((prev) => {
                              const next = prev.includes(option) ? prev.filter((p) => p !== option) : [...prev, option];
                              const validCities = next.length === 0
                                ? provinces.flatMap((p) => p.cities)
                                : next.flatMap((p) => {
                                    const prov = provinces.find((pr) => pr.name === p);
                                    return prov ? prov.cities : [];
                                  });
                              setSelectedVendorCities((cityPrev) => cityPrev.filter((c) => validCities.includes(c)));
                              return next;
                            });
                          } else if (activeDropdown === 'vendor_city') {
                            setSelectedVendorCities((prev) =>
                              prev.includes(option) ? prev.filter((c) => c !== option) : [...prev, option]
                            );
                          }
                        }}
                        style={{ paddingVertical: spacing.sm, flexDirection: 'row', alignItems: 'center' }}
                      >
                        <View
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 4,
                            borderWidth: 2,
                            borderColor: isSelected ? colors.coral : '#D1D5DB',
                            backgroundColor: isSelected ? colors.coral : '#FFFFFF',
                            marginRight: spacing.sm,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isSelected && <MaterialIcons name="check" size={16} color="#FFFFFF" />}
                        </View>
                        <Text style={{ ...typography.body, color: colors.textPrimary, flex: 1 }}>{option}</Text>
                      </TouchableOpacity>
                    );
                  });
                })()}
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Map Radius Selector */}
      <MapRadiusSelector
        visible={showMapRadiusSelector}
        onClose={() => setShowMapRadiusSelector(false)}
        onLocationSelected={async (location, radius) => {
          setMapRadius(radius);
          setShowMapRadiusSelector(false);
          try {
            const places = await ExpoLocation.reverseGeocodeAsync(location);
            const region = (places[0]?.region ?? '').trim();
            if (region) {
              const searchText = region.toLowerCase();
              const matchingProvince = provinces.find((p) => {
                const name = p.name.toLowerCase();
                return name.includes(searchText) || searchText.includes(name);
              });
              if (matchingProvince) {
                if (category === 'venues') {
                  setSelectedProvinces([matchingProvince.name]);
                  const provCities = matchingProvince.cities;
                  setSelectedCities((prev) => prev.filter((c) => provCities.includes(c)));
                } else if (category === 'vendors' || category === 'services') {
                  setSelectedVendorProvinces([matchingProvince.name]);
                  const provCities = matchingProvince.cities;
                  setSelectedVendorCities((prev) => prev.filter((c) => provCities.includes(c)));
                } else {
                  setSelectedProvinces([matchingProvince.name]);
                  setSelectedVendorProvinces([matchingProvince.name]);
                  const provCities = matchingProvince.cities;
                  setSelectedCities((prev) => prev.filter((c) => provCities.includes(c)));
                  setSelectedVendorCities((prev) => prev.filter((c) => provCities.includes(c)));
                }
              }
            }
          } catch {
            // Silently ignore geocoding errors
          }
        }}
        onClearSelection={() => {
          setMapRadius(20);
        }}
        initialRadius={mapRadius}
      />
    </View>
  );
}
