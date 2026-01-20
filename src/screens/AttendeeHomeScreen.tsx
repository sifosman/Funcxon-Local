import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '../lib/supabaseClient';
import type { AttendeeStackParamList } from '../navigation/AttendeeNavigator';
import { colors, spacing, radii, typography } from '../theme';
import { OutlineButton, PrimaryButton, ThemedInput } from '../components/ui';
import * as Location from 'expo-location';
import { getFavourites, toggleFavourite } from '../lib/favourites';
import { useAuth } from '../auth/AuthContext';

export type VendorListItem = {
  id: number;
  name: string | null;
  price_range: string | null;
  rating: number | null;
  review_count: number | null;
  image_url: string | null;
  description?: string | null;
  province?: string | null;
  city?: string | null;
};

type ServiceType = 'Venues' | 'Vendors' | 'Service Providers' | 'All';

type DropdownOption = {
  id: number;
  type: 'event_type' | 'province' | 'capacity_band';
  code: string;
  label: string;
  sort_order: number | null;
};

type OpenPickerType = 'event_type' | 'province' | 'capacity_band' | null;

export default function AttendeeHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AttendeeStackParamList>>();
  const [search, setSearch] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('All');
  const [selectedEventType, setSelectedEventType] = useState<DropdownOption | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<DropdownOption | null>(null);
  const [selectedCapacity, setSelectedCapacity] = useState<DropdownOption | null>(null);
  const [openPicker, setOpenPicker] = useState<OpenPickerType>(null);
  const [singleDayEvent, setSingleDayEvent] = useState(false);
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [activeDatePicker, setActiveDatePicker] = useState<'from' | 'to' | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [detectedProvinceLabel, setDetectedProvinceLabel] = useState<string | null>(null);
  const [locationCity, setLocationCity] = useState<string | null>(null);
  const [locationRegion, setLocationRegion] = useState<string | null>(null);
  const [favouriteIds, setFavouriteIds] = useState<number[]>([]);
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery<VendorListItem[]>({
    queryKey: ['vendors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, name, price_range, rating, review_count, image_url, province, city')
        .limit(50);

      if (error) {
        throw error;
      }

      return data ?? [];
    },
  });

  const {
    data: dropdownData,
    isLoading: dropdownLoading,
    error: dropdownError,
  } = useQuery<DropdownOption[]>({
    queryKey: ['dropdown-options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dropdown_options')
        .select('id, type, code, label, sort_order')
        .in('type', ['event_type', 'province', 'capacity_band'])
        .order('sort_order', { ascending: true });

      if (error) {
        throw error;
      }

      return data ?? [];
    },
  });

  const eventTypeOptions = useMemo(
    () => (dropdownData ?? []).filter((option) => option.type === 'event_type'),
    [dropdownData],
  );

  const provinceOptions = useMemo(
    () => (dropdownData ?? []).filter((option) => option.type === 'province'),
    [dropdownData],
  );

  const capacityOptions = useMemo(
    () => (dropdownData ?? []).filter((option) => option.type === 'capacity_band'),
    [dropdownData],
  );

  const filteredVendors = useMemo(() => {
    if (!data) return [];
    const query = search.trim().toLowerCase();
    const provinceFilter = (selectedProvince?.label ?? '').trim().toLowerCase();

    return data.filter((vendor) => {
      const name = (vendor.name ?? '').toLowerCase();
      const matchesSearch = !query || name.includes(query);

      let matchesType = true;
      if (serviceType === 'Venues') {
        matchesType = name.includes('venue');
      } else if (serviceType === 'Vendors') {
        matchesType = true;
      } else if (serviceType === 'Service Providers') {
        matchesType = true;
      }

      const vendorProvince = (vendor.province ?? '').toLowerCase();
      const matchesProvince = !provinceFilter || vendorProvince.includes(provinceFilter);

      return matchesSearch && matchesType && matchesProvince;
    });
  }, [data, search, serviceType, selectedProvince]);

  const orderedVendors = useMemo(() => {
    if (!filteredVendors.length) return [];
    if (!locationCity && !locationRegion) return filteredVendors;

    const cityFilter = (locationCity ?? '').toLowerCase();
    const regionFilter = (locationRegion ?? '').toLowerCase();

    const score = (vendor: VendorListItem) => {
      const city = (vendor.city ?? '').toLowerCase();
      const province = (vendor.province ?? '').toLowerCase();

      if (cityFilter && city.includes(cityFilter)) return 0;
      if (regionFilter && province.includes(regionFilter)) return 1;
      return 2;
    };

    return [...filteredVendors].sort((a, b) => score(a) - score(b));
  }, [filteredVendors, locationCity, locationRegion]);

  const nearbyVendors = useMemo(() => {
    if (!orderedVendors.length || (!locationCity && !locationRegion)) return [];
    const cityFilter = (locationCity ?? '').toLowerCase();
    const regionFilter = (locationRegion ?? '').toLowerCase();

    return orderedVendors.filter((vendor) => {
      const city = (vendor.city ?? '').toLowerCase();
      const province = (vendor.province ?? '').toLowerCase();
      const matchesCity = cityFilter && city.includes(cityFilter);
      const matchesRegion = regionFilter && province.includes(regionFilter);
      return matchesCity || matchesRegion;
    });
  }, [orderedVendors, locationCity, locationRegion]);

  const featuredVendors = (orderedVendors.length ? orderedVendors : filteredVendors).slice(0, 10);

  useEffect(() => {
    let isMounted = true;
    if (!user?.id) {
      setFavouriteIds([]);
      return () => {
        isMounted = false;
      };
    }
    getFavourites(user).then((ids) => {
      if (isMounted) setFavouriteIds(ids);
    });
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const handleToggleFavourite = async (vendorId: number) => {
    if (!user?.id) {
      Alert.alert('Sign in required', 'Please sign in to save favourites.');
      return;
    }
    const next = await toggleFavourite(user, vendorId);
    setFavouriteIds(next);
  };

  async function handleUseMyLocation() {
    if (!provinceOptions || provinceOptions.length === 0) {
      Alert.alert('Locations not ready', 'Please wait a moment and try again.');
      return;
    }

    try {
      setDetectingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Location permission needed',
          'Enable location access in your settings to find vendors near you.',
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({});
      const places = await Location.reverseGeocodeAsync(position.coords);
      const first = places[0];
      const region = (first?.region ?? '').trim();
      const city = (first?.city ?? '').trim();
      const searchText = (region || city).toLowerCase();

      if (!searchText) {
        Alert.alert('Location not found', 'We could not determine your province from your location.');
        return;
      }

      setLocationCity(city || null);
      setLocationRegion(region || null);

      const match = provinceOptions.find((option) => {
        const label = option.label.toLowerCase();
        return label.includes(searchText) || searchText.includes(label);
      });

      if (match) {
        setSelectedProvince(match);
        setDetectedProvinceLabel(match.label);
      } else {
        Alert.alert('Province not recognised', 'We could not match your location to a province filter.');
      }
    } catch (err: any) {
      Alert.alert('Location error', err?.message ?? 'Failed to detect your location.');
    } finally {
      setDetectingLocation(false);
    }
  }

  if (isLoading || dropdownLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  const hasError = error instanceof Error || dropdownError instanceof Error;
  const errorMessage =
    (error instanceof Error && error.message) ||
    (dropdownError instanceof Error && dropdownError.message) ||
    '';

  if (hasError) {
    return (
      <View
        style={{
          flex: 1,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.lg,
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>Failed to load vendors.</Text>
        <Text style={{ marginTop: spacing.sm, ...typography.body, color: colors.textMuted }}>{errorMessage}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: spacing.xl }}
    >
      <View style={{ backgroundColor: colors.primary, paddingBottom: spacing.xl }}>
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xl }}>
          <Text
            style={{
              ...typography.displayMedium,
              color: '#FFFFFF',
              textAlign: 'center',
            }}
          >
            Connect, Collaborate, Celebrate
          </Text>
          <Text
            style={{
              ...typography.body,
              color: 'rgba(255,255,255,0.9)',
              textAlign: 'center',
              marginTop: spacing.sm,
            }}
          >
            Welcome to Funcxon! Your all in one Event Coordinator. Plan, browse, compare, get quotes, and
            book venues and service professionals in one place.
          </Text>

          <View
            style={{
              marginTop: spacing.lg,
              backgroundColor: colors.surface,
              borderRadius: radii.lg,
              padding: spacing.lg,
              borderWidth: 1,
              borderColor: '#D1D5DB',
              shadowColor: '#000',
              shadowOpacity: 0.12,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
            }}
          >
            <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs }}>
              Service type
            </Text>
            <View style={{ flexDirection: 'row', columnGap: spacing.sm }}>
              {(['Venues', 'Service Providers', 'All'] as ServiceType[]).map((type) => {
                const selected = serviceType === type;
                const label =
                  type === 'Service Providers' ? 'Vendor &\nService\nProfessionals' : type === 'Venues' ? 'Venue\nPortfolios' : 'All';
                return (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setServiceType(type)}
                    style={{
                      flex: 1,
                      paddingVertical: spacing.sm,
                      borderRadius: radii.md,
                      borderWidth: 1,
                      borderColor: selected ? colors.primary : '#D1D5DB',
                      backgroundColor: selected ? colors.primary : '#FFFFFF',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        ...typography.caption,
                        fontWeight: '600',
                        textAlign: 'center',
                        color: selected ? '#FFFFFF' : colors.textPrimary,
                      }}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={{ marginTop: spacing.md }}>
              <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs }}>
                Search by category
              </Text>
              <TouchableOpacity activeOpacity={0.9} onPress={() => setOpenPicker('event_type')}>
                <View
                  style={{
                    borderRadius: radii.md,
                    borderWidth: 1,
                    borderColor: '#D1D5DB',
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    backgroundColor: '#FFFFFF',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text style={{ ...typography.body, color: colors.textPrimary }}>
                    {selectedEventType?.label || 'Search by Category'}
                  </Text>
                  <Text style={{ ...typography.caption, color: colors.textMuted }}>▼</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: spacing.md }}>
              <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs }}>
                What are you looking for?
              </Text>
              <TouchableOpacity activeOpacity={0.9} onPress={() => setOpenPicker('capacity_band')}>
                <View
                  style={{
                    borderRadius: radii.md,
                    borderWidth: 1,
                    borderColor: '#D1D5DB',
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    backgroundColor: '#FFFFFF',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text style={{ ...typography.body, color: colors.textPrimary }}>
                    {selectedCapacity?.label || 'Event Capacity'}
                  </Text>
                  <Text style={{ ...typography.caption, color: colors.textMuted }}>▼</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: spacing.md }}>
              <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs }}>
                Location
              </Text>
              <TouchableOpacity activeOpacity={0.9} onPress={() => setOpenPicker('province')}>
                <View
                  style={{
                    borderRadius: radii.md,
                    borderWidth: 1,
                    borderColor: '#D1D5DB',
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    backgroundColor: '#FFFFFF',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text style={{ ...typography.body, color: colors.textPrimary }}>
                    {selectedProvince?.label || 'Select Provinces'}
                  </Text>
                  <Text style={{ ...typography.caption, color: colors.textMuted }}>▼</Text>
                </View>
              </TouchableOpacity>
              {provinceOptions.length > 0 && (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={handleUseMyLocation}
                  style={{
                    marginTop: spacing.xs,
                    alignSelf: 'flex-start',
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.xs,
                    borderRadius: radii.full,
                    backgroundColor: colors.accent,
                  }}
                >
                  <Text style={{ ...typography.caption, color: colors.textPrimary }}>
                    {detectingLocation
                      ? 'Detecting location...'
                      : detectedProvinceLabel
                      ? `Using ${detectedProvinceLabel}`
                      : 'Use my location'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View
              style={{
                marginTop: spacing.md,
                flexDirection: 'row',
                columnGap: spacing.md,
                justifyContent: 'center',
              }}
            >
              <View style={{ flex: 1 }}>
                <PrimaryButton title="Search" onPress={() => {}} />
              </View>
              <View style={{ width: 120 }}>
                <OutlineButton
                  title="Clear All"
                  onPress={() => {
                    setSearch('');
                    setServiceType('All');
                    setSelectedEventType(null);
                    setSelectedProvince(null);
                    setSelectedCapacity(null);
                    setDetectedProvinceLabel(null);
                    setLocationCity(null);
                    setLocationRegion(null);
                  }}
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', columnGap: spacing.sm, marginTop: spacing.md }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: '#D1D5DB',
                  borderRadius: radii.md,
                  paddingVertical: spacing.xs,
                  alignItems: 'center',
                }}
              >
                <Text style={{ ...typography.caption, color: colors.textSecondary }}>Filter</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: '#D1D5DB',
                  borderRadius: radii.md,
                  paddingVertical: spacing.xs,
                  alignItems: 'center',
                }}
              >
                <Text style={{ ...typography.caption, color: colors.textSecondary }}>Sort</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Categories */}
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xl }}>
        <Text style={{ ...typography.displayMedium, color: colors.textPrimary, marginBottom: spacing.md }}>
          Categories
        </Text>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
          }}
        >
          {[
            { label: 'Weddings', icon: 'celebration' as const },
            { label: 'Birthdays', icon: 'cake' as const },
            { label: 'Corporate', icon: 'business-center' as const },
            { label: 'Festivals', icon: 'festival' as const },
          ].map((item) => (
            <View
              key={item.label}
              style={{
                width: '23%',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: spacing.lg,
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 18,
                  backgroundColor: colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOpacity: 0.08,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 4 },
                }}
              >
                <MaterialIcons name={item.icon} size={28} color={colors.primary} />
              </View>
              <Text
                style={{
                  ...typography.caption,
                  color: colors.textPrimary,
                  marginTop: spacing.xs,
                  textAlign: 'center',
                }}
              >
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {nearbyVendors.length > 0 && (
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}>
          <Text
            style={{
              ...typography.displayMedium,
              color: colors.textPrimary,
              marginBottom: spacing.sm,
            }}
          >
            Near you
          </Text>
          {nearbyVendors.map((vendor) => (
            <TouchableOpacity
              key={vendor.id}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('VendorProfile', { vendorId: vendor.id })}
              style={{
                paddingVertical: spacing.sm,
                borderBottomWidth: 1,
                borderBottomColor: colors.borderSubtle,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, paddingRight: spacing.md }}>
                  <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
                    {vendor.name ?? 'Untitled vendor'}
                  </Text>
                  <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs }}>
                    {[vendor.city, vendor.province].filter(Boolean).join(', ') || 'Location not specified'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={(event) => {
                    event.stopPropagation();
                    handleToggleFavourite(vendor.id);
                  }}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialIcons
                    name={favouriteIds.includes(vendor.id) ? 'favorite' : 'favorite-border'}
                    size={18}
                    color={favouriteIds.includes(vendor.id) ? colors.primaryTeal : colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Featured Vendors */}
      <View style={{ paddingTop: spacing.xl, backgroundColor: colors.surface, marginTop: spacing.xl }}>
        <Text
          style={{
            ...typography.displayMedium,
            color: colors.textPrimary,
            marginBottom: spacing.sm,
            paddingHorizontal: spacing.lg,
          }}
        >
          Featured Vendors
        </Text>

        {featuredVendors.length === 0 ? (
          <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }}>
            <Text style={{ ...typography.body, color: colors.textMuted }}>
              No featured services yet. Add vendors in Supabase to see them here.
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }}
          >
            {featuredVendors.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => navigation.navigate('VendorProfile', { vendorId: item.id })}
                style={{
                  width: 260,
                  marginRight: spacing.md,
                  borderRadius: radii.xl,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  overflow: 'hidden',
                  shadowColor: '#000',
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 4 },
                }}
              >
                {item.image_url ? (
                  <View>
                    <Image
                      source={{ uri: item.image_url }}
                      style={{ width: '100%', height: 140 }}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      onPress={(event) => {
                        event.stopPropagation();
                        handleToggleFavourite(item.id);
                      }}
                      style={{
                        position: 'absolute',
                        top: spacing.sm,
                        right: spacing.sm,
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: '#FFFFFF',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: colors.borderSubtle,
                      }}
                    >
                      <MaterialIcons
                        name={favouriteIds.includes(item.id) ? 'favorite' : 'favorite-border'}
                        size={18}
                        color={favouriteIds.includes(item.id) ? colors.primaryTeal : colors.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View
                    style={{
                      width: '100%',
                      height: 140,
                      backgroundColor: colors.surfaceMuted,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ ...typography.caption, color: colors.textMuted }}>No image</Text>
                    <TouchableOpacity
                      onPress={(event) => {
                        event.stopPropagation();
                        handleToggleFavourite(item.id);
                      }}
                      style={{
                        position: 'absolute',
                        top: spacing.sm,
                        right: spacing.sm,
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: '#FFFFFF',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: colors.borderSubtle,
                      }}
                    >
                      <MaterialIcons
                        name={favouriteIds.includes(item.id) ? 'favorite' : 'favorite-border'}
                        size={18}
                        color={favouriteIds.includes(item.id) ? colors.primaryTeal : colors.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                )}
                <View style={{ padding: spacing.md }}>
                  <Text
                    style={{
                      ...typography.titleMedium,
                      color: colors.textPrimary,
                      marginBottom: spacing.xs,
                    }}
                  >
                    {item.name ?? 'Untitled vendor'}
                  </Text>

                  {/* Rating row */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
                    <Text style={{ ...typography.caption, color: colors.textSecondary, marginRight: spacing.xs }}>
                      ★
                    </Text>
                    <Text style={{ ...typography.caption, color: colors.textSecondary }}>
                      {typeof item.rating === 'number' ? item.rating.toFixed(1) : 'No rating yet'}
                      {typeof item.review_count === 'number' && item.review_count > 0
                        ? ` (${item.review_count})`
                        : ''}
                    </Text>
                  </View>

                  {/* Price + CTA row */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: spacing.xs,
                    }}
                  >
                    <Text style={{ ...typography.caption, color: colors.textSecondary }}>
                      {item.price_range ?? ''}
                    </Text>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('VendorProfile', { vendorId: item.id })}
                      style={{
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.xs,
                        borderRadius: radii.full,
                        backgroundColor: colors.primary,
                      }}
                    >
                      <Text
                        style={{
                          ...typography.caption,
                          color: '#FFFFFF',
                          fontWeight: '600',
                        }}
                      >
                        Book
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
      <Modal
        visible={openPicker !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setOpenPicker(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.3)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.lg,
              borderTopLeftRadius: radii.xl,
              borderTopRightRadius: radii.xl,
              maxHeight: '70%',
            }}
          >
            <Text
              style={{
                ...typography.titleMedium,
                color: colors.textPrimary,
                marginBottom: spacing.md,
              }}
            >
              {openPicker === 'event_type'
                ? 'What are you looking for?'
                : openPicker === 'province'
                ? 'Select Provinces'
                : openPicker === 'capacity_band'
                ? 'Event Capacity'
                : ''}
            </Text>
            <ScrollView>
              {(openPicker === 'event_type'
                ? eventTypeOptions
                : openPicker === 'province'
                ? provinceOptions
                : capacityOptions
              ).map((option) => (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => {
                    if (openPicker === 'event_type') {
                      setSelectedEventType(option);
                    } else if (openPicker === 'province') {
                      setSelectedProvince(option);
                    } else if (openPicker === 'capacity_band') {
                      setSelectedCapacity(option);
                    }
                    setOpenPicker(null);
                  }}
                  style={{
                    paddingVertical: spacing.sm,
                  }}
                >
                  <Text
                    style={{
                      ...typography.body,
                      color: colors.textPrimary,
                    }}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setOpenPicker(null)}
              style={{
                marginTop: spacing.md,
                alignSelf: 'flex-end',
              }}
            >
              <Text
                style={{
                  ...typography.body,
                  color: colors.textSecondary,
                }}
              >
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {activeDatePicker && (
        <DateTimePicker
          value={
            activeDatePicker === 'from'
              ? fromDate ?? new Date()
              : toDate ?? fromDate ?? new Date()
          }
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            if (event.type === 'set' && selectedDate) {
              if (activeDatePicker === 'from') {
                setFromDate(selectedDate);
                if (singleDayEvent) {
                  setToDate(selectedDate);
                }
              } else {
                setToDate(selectedDate);
              }
            }
            setActiveDatePicker(null);
          }}
        />
      )}
    </ScrollView>
  );
}
