import { useEffect, useMemo, useState, useRef } from 'react';
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
import { provinces, getCitiesByProvince } from '../config/locations';
import MapRadiusSelector from '../components/MapRadiusSelector';

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
  category_id?: number | null;
};

type ServiceType = 'Venues' | 'Vendors' | 'Service Providers' | 'All';

type DropdownOption = {
  id: number;
  type: 'event_type' | 'province' | 'capacity_band';
  code: string;
  label: string;
  sort_order: number | null;
};

type OpenPickerType = 'event_type' | 'province' | 'city' | 'capacity_band' | 'distance' | null;

export default function AttendeeHomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AttendeeStackParamList>>();
  const scrollViewRef = useRef<ScrollView>(null);
  const featuredVendorsRef = useRef<View>(null);
  const [search, setSearch] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('All');
  const [selectedEventType, setSelectedEventType] = useState<DropdownOption | null>(null);
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [distanceKm, setDistanceKm] = useState<string>('');
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
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'price' | 'distance'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showSortModal, setShowSortModal] = useState(false);
  const [showMapRadiusSelector, setShowMapRadiusSelector] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapRadius, setMapRadius] = useState<number>(20);
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery<VendorListItem[]>({
    queryKey: ['vendors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, name, price_range, rating, review_count, image_url, province, city, description, category_id')
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

  // Create a mapping of event types to icons
  const getEventIcon = (eventType: string) => {
    const lowerEvent = eventType.toLowerCase();
    
    // Specific event types with unique icons
    if (lowerEvent.includes('wedding') || lowerEvent.includes('marriage')) return 'favorite';
    if (lowerEvent.includes('engagement')) return 'diamond';
    if (lowerEvent.includes('birthday') || lowerEvent.includes('party')) return 'cake';
    if (lowerEvent.includes('kids') || lowerEvent.includes('children') || lowerEvent.includes('child')) return 'child-care';
    if (lowerEvent.includes('corporate') || lowerEvent.includes('business') || lowerEvent.includes('meeting')) return 'business-center';
    if (lowerEvent.includes('conference') || lowerEvent.includes('seminar') || lowerEvent.includes('workshop')) return 'groups';
    if (lowerEvent.includes('festival') || lowerEvent.includes('concert') || lowerEvent.includes('music')) return 'music-note';
    if (lowerEvent.includes('sports') || lowerEvent.includes('game') || lowerEvent.includes('tournament')) return 'sports-basketball';
    if (lowerEvent.includes('food') || lowerEvent.includes('dining') || lowerEvent.includes('restaurant')) return 'restaurant';
    if (lowerEvent.includes('art') || lowerEvent.includes('exhibition') || lowerEvent.includes('gallery')) return 'palette';
    if (lowerEvent.includes('charity') || lowerEvent.includes('fundraiser') || lowerEvent.includes('donation')) return 'volunteer-activism';
    if (lowerEvent.includes('education') || lowerEvent.includes('training') || lowerEvent.includes('school')) return 'school';
    if (lowerEvent.includes('family') || lowerEvent.includes('reunion')) return 'people';
    if (lowerEvent.includes('outdoor') || lowerEvent.includes('adventure') || lowerEvent.includes('nature')) return 'park';
    if (lowerEvent.includes('beach') || lowerEvent.includes('pool') || lowerEvent.includes('water')) return 'pool';
    if (lowerEvent.includes('holiday') || lowerEvent.includes('christmas') || lowerEvent.includes('xmas')) return 'celebration';
    if (lowerEvent.includes('graduation') || lowerEvent.includes('commencement')) return 'school';
    if (lowerEvent.includes('anniversary')) return 'favorite';
    if (lowerEvent.includes('baby') || lowerEvent.includes('shower')) return 'pregnant-woman';
    if (lowerEvent.includes('retirement')) return 'elderly';
    if (lowerEvent.includes('cultural') || lowerEvent.includes('heritage')) return 'public';
    if (lowerEvent.includes('religious') || lowerEvent.includes('church') || lowerEvent.includes('temple')) return 'church';
    if (lowerEvent.includes('tech') || lowerEvent.includes('technology') || lowerEvent.includes('digital')) return 'devices';
    if (lowerEvent.includes('fashion') || lowerEvent.includes('style') || lowerEvent.includes('clothing')) return 'checkroom';
    if (lowerEvent.includes('health') || lowerEvent.includes('wellness') || lowerEvent.includes('medical')) return 'local-hospital';
    if (lowerEvent.includes('travel') || lowerEvent.includes('vacation') || lowerEvent.includes('trip')) return 'flight';
    if (lowerEvent.includes('movie') || lowerEvent.includes('film') || lowerEvent.includes('cinema')) return 'movie';
    if (lowerEvent.includes('book') || lowerEvent.includes('reading') || lowerEvent.includes('literary')) return 'menu-book';
    if (lowerEvent.includes('gaming') || lowerEvent.includes('video game') || lowerEvent.includes('esports')) return 'sports-esports';
    if (lowerEvent.includes('comedy') || lowerEvent.includes('stand-up') || lowerEvent.includes('laugh')) return 'mood';
    if (lowerEvent.includes('dance') || lowerEvent.includes('ballroom') || lowerEvent.includes('ballet')) return 'nightlife';
    if (lowerEvent.includes('photography') || lowerEvent.includes('photo') || lowerEvent.includes('camera')) return 'photo-camera';
    if (lowerEvent.includes('cooking') || lowerEvent.includes('culinary') || lowerEvent.includes('chef')) return 'restaurant-menu';
    if (lowerEvent.includes('gardening') || lowerEvent.includes('plants') || lowerEvent.includes('garden')) return 'local-florist';
    if (lowerEvent.includes('pet') || lowerEvent.includes('animal') || lowerEvent.includes('dog')) return 'pets';
    if (lowerEvent.includes('science') || lowerEvent.includes('lab') || lowerEvent.includes('research')) return 'science';
    if (lowerEvent.includes('history') || lowerEvent.includes('museum') || lowerEvent.includes('historical')) return 'museum';
    if (lowerEvent.includes('theater') || lowerEvent.includes('drama') || lowerEvent.includes('play')) return 'theater-comedy';
    if (lowerEvent.includes('magic') || lowerEvent.includes('illusion') || lowerEvent.includes('trick')) return 'auto-fix-high';
    
    // Default fallback icons for common patterns
    if (lowerEvent.includes('party')) return 'celebration';
    if (lowerEvent.includes('event')) return 'event';
    if (lowerEvent.includes('gathering')) return 'groups';
    if (lowerEvent.includes('social')) return 'people';
    
    return 'event'; // Ultimate default
  };

  const handleLocationSelected = (location: { latitude: number; longitude: number }, radius: number) => {
    setMapCenter(location);
    setMapRadius(radius);
    // Convert radius to string for display
    setDistanceKm(radius.toString());
  };

  const filteredVendors = useMemo(() => {
    if (!data) return [];
    const query = search.trim().toLowerCase();

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

      // Add event type filtering - now using category_id mapping
      let matchesEventType = true;
      if (selectedEventType && vendor.category_id) {
        // Map event types to category IDs for proper matching
        const eventTypeToCategoryId: Record<string, number> = {
          'wedding': 11,
          'engagement': 12,
          'birthday': 13,
          'kids_party': 14,
          'baby': 15,
          'bridal': 16,
          'matric': 17,
          'corporate': 18,
          'conference': 19
        };
        
        const eventCode = selectedEventType.code.toLowerCase();
        const expectedCategoryId = eventTypeToCategoryId[eventCode];
        
        if (expectedCategoryId) {
          matchesEventType = vendor.category_id === expectedCategoryId;
        } else {
          // Fallback to keyword matching for any other event types
          const eventTypeKeywords = selectedEventType.label.toLowerCase();
          const vendorName = (vendor.name ?? '').toLowerCase();
          const vendorDescription = (vendor.description ?? '').toLowerCase();
          
          matchesEventType = vendorName.includes(eventTypeKeywords) || 
                            vendorDescription.includes(eventTypeKeywords);
        }
      }

      const vendorProvince = (vendor.province ?? '').toLowerCase();
      const vendorCity = (vendor.city ?? '').toLowerCase();
      
      const matchesProvince = selectedProvinces.length === 0 || 
        selectedProvinces.some(p => vendorProvince.includes(p.toLowerCase()));
      
      const matchesCity = selectedCities.length === 0 || 
        selectedCities.some(c => vendorCity.includes(c.toLowerCase()));

      return matchesSearch && matchesType && matchesEventType && matchesProvince && matchesCity;
    });
  }, [data, search, serviceType, selectedEventType, selectedProvinces, selectedCities]);

  const orderedVendors = useMemo(() => {
    if (!filteredVendors.length) return [];
    
    let vendors = [...filteredVendors];
    
    // Apply sorting
    vendors.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          const nameA = (a.name ?? '').toLowerCase();
          const nameB = (b.name ?? '').toLowerCase();
          comparison = nameA.localeCompare(nameB);
          break;
          
        case 'rating':
          const ratingA = a.rating ?? 0;
          const ratingB = b.rating ?? 0;
          comparison = ratingA - ratingB;
          break;
          
        case 'price':
          // Extract numeric values from price range for comparison
          const extractPrice = (priceRange: string | null) => {
            if (!priceRange) return 0;
            const numbers = priceRange.match(/[\d,]+/g);
            if (!numbers || numbers.length === 0) return 0;
            // Use the highest number in the range for comparison
            return parseInt(numbers[numbers.length - 1].replace(/,/g, ''), 10);
          };
          const priceA = extractPrice(a.price_range);
          const priceB = extractPrice(b.price_range);
          comparison = priceA - priceB;
          break;
          
        case 'distance':
          // Priority: same city, then same province, then others
          const cityFilter = (locationCity ?? '').toLowerCase();
          const regionFilter = (locationRegion ?? '').toLowerCase();
          
          const getDistanceScore = (vendor: VendorListItem) => {
            const city = (vendor.city ?? '').toLowerCase();
            const province = (vendor.province ?? '').toLowerCase();
            
            if (cityFilter && city.includes(cityFilter)) return 0;
            if (regionFilter && province.includes(regionFilter)) return 1;
            return 2;
          };
          
          comparison = getDistanceScore(a) - getDistanceScore(b);
          break;
          
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return vendors;
  }, [filteredVendors, sortBy, sortOrder, locationCity, locationRegion]);

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

      const matchingProvince = provinces.find((p) => {
        const name = p.name.toLowerCase();
        return name.includes(searchText) || searchText.includes(name);
      });

      if (matchingProvince) {
        setSelectedProvinces([matchingProvince.name]);
        setDetectedProvinceLabel(matchingProvince.name);
        if (city) {
          setSelectedCities([city]);
        }
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
      ref={scrollViewRef}
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
                Search Area
              </Text>
              <TouchableOpacity 
                activeOpacity={0.9} 
                onPress={() => setShowMapRadiusSelector(true)}
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
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialIcons name="map" size={16} color={colors.primary} />
                  <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>
                    {mapCenter ? `${mapRadius}km radius` : 'Select search area'}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: spacing.md }}>
              <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs }}>
                Provinces
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
                  <Text style={{ ...typography.body, color: colors.textPrimary, flex: 1 }} numberOfLines={1}>
                    {selectedProvinces.length > 0 ? selectedProvinces.join(', ') : 'Select Provinces'}
                  </Text>
                  <Text style={{ ...typography.caption, color: colors.textMuted }}>▼</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: spacing.md }}>
              <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs }}>
                Cities
              </Text>
              <TouchableOpacity activeOpacity={0.9} onPress={() => setOpenPicker('city')}>
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
                  <Text style={{ ...typography.body, color: colors.textPrimary, flex: 1 }} numberOfLines={1}>
                    {selectedCities.length > 0 ? selectedCities.join(', ') : 'Select Cities'}
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

            <View style={{ flexDirection: 'row', columnGap: spacing.md, justifyContent: 'center' }}>
              <View style={{ flex: 1 }}>
                <PrimaryButton 
                  title="Search" 
                  onPress={() => {
                    // Scroll to featured vendors section
                    setTimeout(() => {
                      scrollViewRef.current?.scrollTo({ y: 800, animated: true });
                    }, 100);
                  }} 
                />
              </View>
              <View style={{ width: 120 }}>
                <OutlineButton
                  title="Clear All"
                  onPress={() => {
                    setSearch('');
                    setServiceType('All');
                    setSelectedEventType(null);
                    setSelectedProvinces([]);
                    setSelectedCities([]);
                    setDistanceKm('');
                    setSelectedCapacity(null);
                    setDetectedProvinceLabel(null);
                    setLocationCity(null);
                    setLocationRegion(null);
                    setSortBy('name');
                    setSortOrder('asc');
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
                  flexDirection: 'row',
                  justifyContent: 'center',
                }}
                onPress={() => setShowSortModal(true)}
              >
                <MaterialIcons name="sort" size={16} color={colors.textSecondary} />
                <Text style={{ ...typography.caption, color: colors.textSecondary, marginLeft: spacing.xs }}>
                  Sort: {sortBy === 'name' ? 'Name' : sortBy === 'rating' ? 'Rating' : sortBy === 'price' ? 'Price' : 'Distance'} ({sortOrder === 'asc' ? '↑' : '↓'})
                </Text>
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
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={{ 
            paddingRight: spacing.lg + 40, // Extra padding so last item gets cut off
            paddingVertical: spacing.xs,
          }}
        >
          {eventTypeOptions.map((event) => {
            const isSelected = selectedEventType?.id === event.id;
            return (
              <TouchableOpacity
                key={event.id}
                onPress={() => {
                  setSelectedEventType(event);
                  // Scroll to featured vendors section after a short delay to ensure the filter is applied
                  setTimeout(() => {
                    // Use a fixed position scroll for more reliable behavior
                    scrollViewRef.current?.scrollTo({ y: 800, animated: true });
                  }, 300);
                }}
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: spacing.lg,
                  minWidth: 80,
                }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 18,
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#000',
                    shadowOpacity: 0.08,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 4 },
                    borderWidth: isSelected ? 2 : 0,
                    borderColor: isSelected ? colors.primary : 'transparent',
                  }}
                >
                  <MaterialIcons name={getEventIcon(event.label) as any} size={28} color={isSelected ? '#FFFFFF' : colors.primary} />
                </View>
                <Text
                  style={{
                    ...typography.caption,
                    color: isSelected ? colors.primary : colors.textPrimary,
                    fontWeight: isSelected ? '600' : 'normal',
                    marginTop: spacing.xs,
                    textAlign: 'center',
                    maxWidth: 80,
                  }}
                  numberOfLines={2}
                >
                  {event.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
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
      <View ref={featuredVendorsRef} style={{ paddingTop: spacing.xl, backgroundColor: colors.surface, marginTop: spacing.xl }}>
        {selectedEventType && (
          <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.primary + '20',
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.xs,
              borderRadius: radii.full,
              alignSelf: 'flex-start'
            }}>
              <MaterialIcons name="filter-list" size={16} color={colors.primary} />
              <Text style={{ 
                ...typography.caption, 
                color: colors.primary, 
                marginLeft: spacing.xs,
                fontWeight: '600'
              }}>
                Filtered by: {selectedEventType.label}
              </Text>
            </View>
          </View>
        )}
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
            {selectedEventType ? (
              <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
                <MaterialIcons name="search-off" size={48} color={colors.textMuted} />
                <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginTop: spacing.md, textAlign: 'center' }}>
                  No vendors found for "{selectedEventType.label}"
                </Text>
                <Text style={{ ...typography.body, color: colors.textMuted, marginTop: spacing.sm, textAlign: 'center' }}>
                  Try selecting a different category or adjust your filters
                </Text>
              </View>
            ) : (
              <Text style={{ ...typography.body, color: colors.textMuted }}>
                No featured services yet. Add vendors in Supabase to see them here.
              </Text>
            )}
          </View>
        ) : (
          <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }}>
            {featuredVendors.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => navigation.navigate('VendorProfile', { vendorId: item.id })}
                style={{
                  width: '100%',
                  marginBottom: spacing.md,
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
          </View>
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
                ? 'Select Provinces (Multi-select)'
                : openPicker === 'city'
                ? 'Select Cities (Multi-select)'
                : openPicker === 'capacity_band'
                ? 'Event Capacity'
                : openPicker === 'distance'
                ? 'Select Distance'
                : ''}
            </Text>
            <ScrollView>
              {openPicker === 'event_type' ? (
                eventTypeOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    onPress={() => {
                      setSelectedEventType(option);
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
                ))
              ) : openPicker === 'province' ? (
                provinces.map((province) => {
                  const isSelected = selectedProvinces.includes(province.name);
                  return (
                    <TouchableOpacity
                      key={province.name}
                      onPress={() => {
                        if (isSelected) {
                          setSelectedProvinces(selectedProvinces.filter(p => p !== province.name));
                        } else {
                          setSelectedProvinces([...selectedProvinces, province.name]);
                        }
                      }}
                      style={{
                        paddingVertical: spacing.sm,
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}
                    >
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 4,
                          borderWidth: 2,
                          borderColor: isSelected ? colors.primary : '#D1D5DB',
                          backgroundColor: isSelected ? colors.primary : '#FFFFFF',
                          marginRight: spacing.sm,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isSelected && (
                          <MaterialIcons name="check" size={16} color="#FFFFFF" />
                        )}
                      </View>
                      <Text
                        style={{
                          ...typography.body,
                          color: colors.textPrimary,
                        }}
                      >
                        {province.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              ) : openPicker === 'city' ? (
                (() => {
                  const availableCities = selectedProvinces.length > 0
                    ? selectedProvinces.flatMap(p => getCitiesByProvince(p))
                    : provinces.flatMap(p => p.cities);
                  
                  return availableCities.sort().map((city) => {
                    const isSelected = selectedCities.includes(city);
                    return (
                      <TouchableOpacity
                        key={city}
                        onPress={() => {
                          if (isSelected) {
                            setSelectedCities(selectedCities.filter(c => c !== city));
                          } else {
                            setSelectedCities([...selectedCities, city]);
                          }
                        }}
                        style={{
                          paddingVertical: spacing.sm,
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}
                      >
                        <View
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: 4,
                            borderWidth: 2,
                            borderColor: isSelected ? colors.primary : '#D1D5DB',
                            backgroundColor: isSelected ? colors.primary : '#FFFFFF',
                            marginRight: spacing.sm,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isSelected && (
                            <MaterialIcons name="check" size={16} color="#FFFFFF" />
                          )}
                        </View>
                        <Text
                          style={{
                            ...typography.body,
                            color: colors.textPrimary,
                          }}
                        >
                          {city}
                        </Text>
                      </TouchableOpacity>
                    );
                  });
                })()
              ) : openPicker === 'capacity_band' ? (
                capacityOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    onPress={() => {
                      setSelectedCapacity(option);
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
                ))
              ) : openPicker === 'distance' ? (
                // Distance options
                ['20', '50', '100', '200'].map((distance) => (
                  <TouchableOpacity
                    key={distance}
                    onPress={() => {
                      setDistanceKm(distance);
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
                      {distance} km
                    </Text>
                  </TouchableOpacity>
                ))
              ) : null}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setOpenPicker(null)}
              style={{
                marginTop: spacing.md,
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.lg,
                backgroundColor: colors.primary,
                borderRadius: radii.md,
                alignSelf: 'center',
              }}
            >
              <Text
                style={{
                  ...typography.body,
                  color: '#FFFFFF',
                  fontWeight: '600',
                }}
              >
                Done
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
      
      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSortModal(false)}
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
              Sort Results
            </Text>
            
            <ScrollView>
              {/* Sort By Options */}
              <View style={{ marginBottom: spacing.lg }}>
                <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm }}>
                  Sort by
                </Text>
                {[
                  { key: 'name' as const, label: 'Name (A-Z)', icon: 'sort' },
                  { key: 'rating' as const, label: 'Rating', icon: 'star' },
                  { key: 'price' as const, label: 'Price', icon: 'attach-money' },
                  { key: 'distance' as const, label: 'Distance', icon: 'location-on' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    onPress={() => {
                      setSortBy(option.key);
                      setShowSortModal(false);
                    }}
                    style={{
                      paddingVertical: spacing.sm,
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: sortBy === option.key ? colors.primary + '20' : 'transparent',
                      borderRadius: radii.md,
                      paddingHorizontal: spacing.sm,
                    }}
                  >
                    <MaterialIcons name={option.icon as any} size={20} color={colors.primary} />
                    <Text
                      style={{
                        ...typography.body,
                        color: colors.textPrimary,
                        marginLeft: spacing.sm,
                        fontWeight: sortBy === option.key ? '600' : 'normal',
                      }}
                    >
                      {option.label}
                    </Text>
                    {sortBy === option.key && (
                      <MaterialIcons name="check" size={20} color={colors.primary} style={{ marginLeft: 'auto' }} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* Sort Order Options */}
              <View style={{ marginBottom: spacing.lg }}>
                <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm }}>
                  Order
                </Text>
                {[
                  { key: 'asc' as const, label: 'Ascending (A-Z, 1-10)', icon: 'arrow-upward' },
                  { key: 'desc' as const, label: 'Descending (Z-A, 10-1)', icon: 'arrow-downward' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    onPress={() => {
                      setSortOrder(option.key);
                      setShowSortModal(false);
                    }}
                    style={{
                      paddingVertical: spacing.sm,
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: sortOrder === option.key ? colors.primary + '20' : 'transparent',
                      borderRadius: radii.md,
                      paddingHorizontal: spacing.sm,
                    }}
                  >
                    <MaterialIcons name={option.icon as any} size={20} color={colors.primary} />
                    <Text
                      style={{
                        ...typography.body,
                        color: colors.textPrimary,
                        marginLeft: spacing.sm,
                        fontWeight: sortOrder === option.key ? '600' : 'normal',
                      }}
                    >
                      {option.label}
                    </Text>
                    {sortOrder === option.key && (
                      <MaterialIcons name="check" size={20} color={colors.primary} style={{ marginLeft: 'auto' }} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            
            <TouchableOpacity
              onPress={() => setShowSortModal(false)}
              style={{
                marginTop: spacing.md,
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.lg,
                backgroundColor: colors.primary,
                borderRadius: radii.md,
                alignSelf: 'center',
              }}
            >
              <Text
                style={{
                  ...typography.body,
                  color: '#FFFFFF',
                  fontWeight: '600',
                }}
              >
                Done
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Map Radius Selector */}
      <MapRadiusSelector
        visible={showMapRadiusSelector}
        onClose={() => setShowMapRadiusSelector(false)}
        onLocationSelected={handleLocationSelected}
        initialRadius={mapRadius}
      />
    </ScrollView>
  );
}
