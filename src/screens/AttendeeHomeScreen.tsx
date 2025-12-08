import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
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

export type VendorListItem = {
  id: number;
  name: string | null;
  price_range: string | null;
  rating: number | null;
  review_count: number | null;
  image_url: string | null;
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
  const sliderImages = [
    require('../../assets/slider_1.jpeg'),
    require('../../assets/slide_2.jpeg'),
    require('../../assets/slider_3.jpeg'),
  ];

  const screenWidth = Dimensions.get('window').width;
  const slideWidth = screenWidth - spacing.lg * 2;

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

  const sliderRef = useRef<ScrollView | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (sliderImages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => {
        const nextIndex = (prev + 1) % sliderImages.length;
        if (sliderRef.current) {
          sliderRef.current.scrollTo({ x: nextIndex * slideWidth, animated: true });
        }

        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();

        return nextIndex;
      });
    }, 7000);

    return () => clearInterval(interval);
  }, [sliderImages.length, slideWidth, fadeAnim]);

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
      {/* Header */}
      <View
        style={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.xl,
          paddingBottom: spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View>
          <Text
            style={{
              ...typography.body,
              color: colors.textMuted,
            }}
          >
            Welcome back!
          </Text>
          <Text
            style={{
              ...typography.displayMedium,
              color: colors.textPrimary,
              marginTop: spacing.xs,
            }}
          >
            Plan your perfect event
          </Text>
          {(locationCity || locationRegion) && (
            <View style={{ marginTop: spacing.xs }}>
              <Text
                style={{
                  ...typography.caption,
                  color: colors.textSecondary,
                }}
              >
                {locationCity && locationRegion
                  ? `Near ${locationCity}, ${locationRegion}`
                  : `Near ${locationCity || locationRegion}`}
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setOpenPicker('province')}
                style={{ marginTop: spacing.xs }}
              >
                <Text
                  style={{
                    ...typography.caption,
                    color: colors.textMuted,
                  }}
                >
                  Change location
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: colors.borderSubtle,
          }}
        >
          <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>U</Text>
        </View>
      </View>

      {/* Hero slider */}
      <View
        style={{
          paddingHorizontal: spacing.lg,
          marginBottom: spacing.lg,
        }}
      >
        <Animated.View
          style={{
            borderRadius: radii.lg,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            opacity: fadeAnim,
          }}
        >
          <ScrollView
            ref={sliderRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
          >
            {sliderImages.map((source, index) => (
              <View
                key={index}
                style={{
                  width: slideWidth,
                }}
              >
                <Image
                  source={source}
                  style={{ width: '100%', height: 80 }}
                  resizeMode="cover"
                />
              </View>
            ))}
          </ScrollView>
        </Animated.View>
      </View>

      {/* Search & filters card */}
      <View style={{ paddingHorizontal: spacing.lg }}>
        <View
          style={{
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            backgroundColor: colors.surface,
            padding: spacing.lg,
            shadowColor: '#000',
            shadowOpacity: 0.06,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
          }}
        >
          {/* Search pill */}
          <View
            style={{
              borderRadius: 999,
              backgroundColor: colors.surface,
              paddingHorizontal: spacing.md,
              height: 44,
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: spacing.md,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
            }}
          >
            <Text style={{ ...typography.body, color: colors.textMuted, marginRight: spacing.sm }}>🔍</Text>
            <TextInput
              placeholder="Search..."
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
              style={{
                flex: 1,
                fontSize: 14,
                color: colors.textPrimary,
              }}
            />
          </View>

          {/* Service type grid */}
          <View
            style={{
              marginTop: spacing.md,
              flexDirection: 'row',
              flexWrap: 'wrap',
              columnGap: spacing.sm,
              rowGap: spacing.sm,
            }}
          >
            {(['Venues', 'Vendors', 'Service Providers', 'All'] as ServiceType[]).map((type) => {
              const selected = serviceType === type;
              return (
                <TouchableOpacity
                  key={type}
                  onPress={() => setServiceType(type)}
                  style={{
                    flexBasis: '48%',
                    paddingVertical: spacing.sm,
                    paddingHorizontal: spacing.md,
                    borderRadius: radii.lg,
                    backgroundColor: selected ? colors.primaryTeal : colors.inputBackground,
                    borderWidth: selected ? 0 : 1,
                    borderColor: colors.borderSubtle,
                  }}
                >
                  <Text
                    style={{
                      ...typography.body,
                      fontSize: 13,
                      textAlign: 'center',
                      color: selected ? '#FFFFFF' : colors.textPrimary,
                    }}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Select dropdowns */}
          <View style={{ marginTop: spacing.md }}>
            <TouchableOpacity activeOpacity={0.9} onPress={() => setOpenPicker('event_type')}>
              <View
                style={{
                  marginBottom: spacing.sm,
                  borderRadius: radii.lg,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  backgroundColor: colors.surfaceMuted,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text style={{ ...typography.body, color: colors.textSecondary }}>
                  {selectedEventType?.label || 'What are you looking for?'}
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
                  backgroundColor: colors.backgroundAlt,
                }}
              >
                <Text
                  style={{
                    ...typography.caption,
                    color: colors.textPrimary,
                  }}
                >
                  {detectingLocation
                    ? 'Detecting location...'
                    : detectedProvinceLabel
                    ? `Using ${detectedProvinceLabel}`
                    : 'Use my location'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity activeOpacity={0.9} onPress={() => setOpenPicker('province')}>
              <View
                style={{
                  marginBottom: spacing.sm,
                  borderRadius: radii.lg,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  backgroundColor: colors.surfaceMuted,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text style={{ ...typography.body, color: colors.textSecondary }}>
                  {selectedProvince?.label || 'Select Provinces'}
                </Text>
                <Text style={{ ...typography.caption, color: colors.textMuted }}>▼</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.9} onPress={() => setOpenPicker('capacity_band')}>
              <View
                style={{
                  marginBottom: spacing.sm,
                  borderRadius: radii.lg,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  backgroundColor: colors.surfaceMuted,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text style={{ ...typography.body, color: colors.textSecondary }}>
                  {selectedCapacity?.label || 'Event Capacity'}
                </Text>
                <Text style={{ ...typography.caption, color: colors.textMuted }}>▼</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Date range */}
          <View
            style={{
              marginTop: spacing.sm,
              flexDirection: 'row',
              columnGap: spacing.md,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ ...typography.caption, color: colors.textMuted }}>Event Date: From</Text>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setActiveDatePicker('from')}
                style={{
                  marginTop: spacing.xs,
                  borderRadius: radii.lg,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  backgroundColor: colors.surfaceMuted,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  justifyContent: 'center',
                }}
              >
                <Text style={{ ...typography.caption, color: colors.textSecondary }}>
                  {fromDate ? fromDate.toLocaleDateString() : 'Select start date'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ ...typography.caption, color: colors.textMuted }}>To</Text>
              <TouchableOpacity
                activeOpacity={singleDayEvent ? 1 : 0.9}
                onPress={() => {
                  if (!singleDayEvent) setActiveDatePicker('to');
                }}
                style={{
                  marginTop: spacing.xs,
                  borderRadius: radii.lg,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  backgroundColor: colors.surfaceMuted,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  justifyContent: 'center',
                  opacity: singleDayEvent ? 0.6 : 1,
                }}
              >
                <Text style={{ ...typography.caption, color: colors.textSecondary }}>
                  {singleDayEvent
                    ? fromDate
                      ? fromDate.toLocaleDateString()
                      : 'Same day as start'
                    : toDate
                    ? toDate.toLocaleDateString()
                    : 'Select end date'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Single day toggle */}
          <TouchableOpacity
            onPress={() => setSingleDayEvent((prev) => !prev)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: spacing.sm,
            }}
          >
            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                backgroundColor: singleDayEvent ? colors.primaryTeal : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: spacing.xs,
              }}
            >
              {singleDayEvent && (
                <Text
                  style={{
                    ...typography.caption,
                    color: '#FFFFFF',
                  }}
                >
                  ✓
                </Text>
              )}
            </View>
            <Text style={{ ...typography.caption, color: colors.textSecondary }}>Event is on a single day</Text>
          </TouchableOpacity>

          {/* Search / Clear buttons */}
          <View
            style={{
              flexDirection: 'row',
              columnGap: spacing.md,
              marginTop: spacing.md,
            }}
          >
            <View style={{ flex: 1 }}>
              <PrimaryButton title="Search" onPress={() => {}} />
            </View>
            <View style={{ flex: 1 }}>
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

          {/* Filter / Sort row */}
          <View
            style={{
              marginTop: spacing.md,
              paddingTop: spacing.md,
              borderTopWidth: 1,
              borderTopColor: colors.borderSubtle,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TouchableOpacity>
              <Text style={{ ...typography.body, color: colors.textSecondary }}>Filter</Text>
            </TouchableOpacity>
            <View
              style={{
                width: 1,
                height: 20,
                marginHorizontal: spacing.lg,
                backgroundColor: colors.borderSubtle,
              }}
            />
            <TouchableOpacity>
              <Text style={{ ...typography.body, color: colors.textSecondary }}>Sort</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Categories */}
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}>
        <Text
          style={{
            ...typography.displayMedium,
            color: colors.textPrimary,
            marginBottom: spacing.md,
          }}
        >
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
              <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
                {vendor.name ?? 'Untitled vendor'}
              </Text>
              <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs }}>
                {[vendor.city, vendor.province].filter(Boolean).join(', ') || 'Location not specified'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Featured Services */}
      <View style={{ paddingTop: spacing.lg }}>
        <Text
          style={{
            ...typography.displayMedium,
            color: colors.textPrimary,
            marginBottom: spacing.sm,
            paddingHorizontal: spacing.lg,
          }}
        >
          Featured Services
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
                  <Image
                    source={{ uri: item.image_url }}
                    style={{ width: '100%', height: 140 }}
                    resizeMode="cover"
                  />
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
