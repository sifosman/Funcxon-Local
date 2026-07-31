import { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from 'react';
import { ActivityIndicator, Animated, Dimensions, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '../lib/supabaseClient';
import { colors, spacing, radii, typography } from '../theme';
import type { VendorListItem } from './AttendeeHomeScreen';
import { VENDOR_CATEGORIES } from './AttendeeHomeScreen';
import { getFavourites, toggleFavourite } from '../lib/favourites';
import { useAuth } from '../auth/AuthContext';
import NetworkImage from '../components/NetworkImage';
import { formatCardAddress } from '../utils/location';
import type { AttendeeStackParamList } from '../navigation/AttendeeNavigator';
import { venueTypes, amenitiesList, venueCapacityOptions } from '../config/venueTypes';
import { provinces } from '../config/locations';
import MapRadiusSelector from '../components/MapRadiusSelector';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsDesktop } from '../hooks/useIsDesktop';
import { getSharedFilterState, setSharedFilterState, type FilterState } from '../lib/sharedFilterState';

type CategoryFilter = 'all' | 'venues' | 'vendors' | 'services';
type SortBy = 'best-match' | 'rating-desc' | 'reviews-desc' | 'price-asc' | 'alphabetical';
type DiscoverPresetFilter = 'location' | 'categories' | 'amenities' | 'services' | 'featured';

type DiscoverNavigation = NativeStackNavigationProp<AttendeeStackParamList, 'Discover'>;
type DiscoverRoute = RouteProp<AttendeeStackParamList, 'Discover'>;

const presetTitles: Record<DiscoverPresetFilter, string> = {
  location: 'Search by Location',
  categories: 'Search by Categories',
  amenities: 'Search by Venue Amenities',
  services: 'Search by Services',
  featured: 'Featured Listings',
};

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function DiscoverScreen() {
  const navigation = useNavigation<DiscoverNavigation>();
  const route = useRoute<DiscoverRoute>();
  const isDesktop = useIsDesktop();
  const [search, setSearch] = useState(route.params?.initialSearch ?? '');

  const [screenHeight, setScreenHeight] = useState(Dimensions.get('window').height);
  const cardImageHeight = Math.max(120, Math.round(screenHeight / 2.5 - 200));
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenHeight(window.height);
    });
    return () => subscription?.remove();
  }, []);

  const [minRating, setMinRating] = useState<number | null>(null);
  const [onlyWithPrice, setOnlyWithPrice] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(route.params?.presetFilter === 'featured');
  const [locationSearch, setLocationSearch] = useState(route.params?.presetFilter === 'location' ? route.params?.initialSearch ?? '' : '');
  const [cityFilter, setCityFilter] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('');
  const [amenitiesFilter, setAmenitiesFilter] = useState('');
  const [categoryTextFilter, setCategoryTextFilter] = useState('');
  const [category, setCategory] = useState<CategoryFilter>(route.params?.category ?? 'all');
  const [sortBy, setSortBy] = useState<SortBy>('best-match');
  const [showFilters, setShowFilters] = useState(route.params?.showFilters ?? false);
  const [showSortOptions, setShowSortOptions] = useState(false);
  const filterGlowAnim = useRef(new Animated.Value(1)).current;
  const [favouriteIds, setFavouriteIds] = useState<{ vendorIds: number[]; venueIds: number[] }>({
    vendorIds: [],
    venueIds: [],
  });

  // Venue-specific dropdown states
  const [selectedVenueTypes, setSelectedVenueTypes] = useState<string[]>([]);
  const [selectedVenueAmenities, setSelectedVenueAmenities] = useState<string[]>([]);
  const [selectedCapacity, setSelectedCapacity] = useState<string | null>(null);
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);

  // Vendor-specific dropdown states
  const [selectedVendorCategories, setSelectedVendorCategories] = useState<number[]>([]);
  const [selectedVendorSubcategories, setSelectedVendorSubcategories] = useState<string[]>([]);
  const [selectedVendorProvinces, setSelectedVendorProvinces] = useState<string[]>([]);
  const [selectedVendorCities, setSelectedVendorCities] = useState<string[]>([]);
  const [selectedLocationProvince, setSelectedLocationProvince] = useState('');

  // Dropdown picker modal
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [dropdownSearch, setDropdownSearch] = useState('');

  // Map radius
  const [showMapRadiusSelector, setShowMapRadiusSelector] = useState(false);
  const [mapRadius, setMapRadius] = useState(20);

  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, -60],
    extrapolate: 'clamp',
  });
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const parseLocationParts = (location?: string | null) => {
    if (!location) {
      return { city: null as string | null, province: null as string | null };
    }

    const parts = location
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);

    // Remove "South Africa" from the end if present
    const cleanParts = parts.filter((p) => p.toLowerCase() !== 'south africa');

    if (cleanParts.length >= 2) {
      return {
        city: cleanParts[0] ?? null,
        province: cleanParts[cleanParts.length - 1] ?? null,
      };
    }

    return {
      city: cleanParts[0] ?? null,
      province: null,
    };
  };

  // Lightweight fuzzy match: checks substring first, then character-order tolerance
  const fuzzyMatch = (text: string, query: string): boolean => {
    const t = text.toLowerCase();
    const q = query.toLowerCase().trim();
    if (!q) return true;
    if (t.includes(q)) return true;

    let tIdx = 0;
    let qIdx = 0;
    while (tIdx < t.length && qIdx < q.length) {
      if (t[tIdx] === q[qIdx]) qIdx++;
      tIdx++;
    }
    return qIdx === q.length;
  };

  const getVenueMaxCapacity = (item: VendorListItem): number | null => {
    const raw = item.venue_capacity ?? '';
    if (!raw) return null;
    const numbers = String(raw).match(/\d+/g);
    if (!numbers || numbers.length === 0) return null;
    return parseInt(numbers[numbers.length - 1], 10);
  };

  const getCapacityThreshold = (capacityLabel: string): number => {
    switch (capacityLabel) {
      case 'Under 50': return 50;
      case 'Under 200': return 200;
      case 'Under 500': return 500;
      case 'Under 1000': return 1000;
      case 'Under 2000': return 2000;
      case '2000 and More': return 2000;
      default: return 0;
    }
  };

  const classifyCategory = (item: VendorListItem): CategoryFilter => {
    if (item.type === 'venue') {
      return 'venues';
    }

    const vendorText = [
      item.name ?? '',
      item.description ?? '',
      ...(Array.isArray(item.service_options) ? item.service_options : []),
      ...(Array.isArray(item.vendor_tags) ? item.vendor_tags : []),
    ]
      .join(' ')
      .toLowerCase();

    if (
      vendorText.includes('photo') ||
      vendorText.includes('video') ||
      vendorText.includes('camera') ||
      vendorText.includes('content')
    ) {
      return 'services';
    }

    return 'vendors';
  };

  const getPriceValue = (priceRange?: string | null): number => {
    if (!priceRange) return Number.MAX_SAFE_INTEGER;
    const numbers = priceRange.match(/[\d,]+/g);
    if (!numbers || numbers.length === 0) return Number.MAX_SAFE_INTEGER;
    return parseInt(numbers[0].replace(/,/g, ''), 10);
  };

  const getDisplayTitle = () => {
    if (search.trim()) {
      return `Results for "${search.trim()}"`;
    }

    if (route.params?.presetFilter) {
      return presetTitles[route.params.presetFilter];
    }

    if (category === 'venues') return 'Discover Venues';
    if (category === 'vendors') return 'Discover Vendors';
    if (category === 'services') return 'Discover Services';
    return 'Discover Vendors';
  };

  const getActiveSearchModeLabel = () => {
    if (route.params?.presetFilter) {
      return presetTitles[route.params.presetFilter];
    }

    if (route.params?.category === 'venues') {
      return 'Searching venues';
    }

    if (route.params?.category === 'vendors') {
      return 'Searching vendors and services';
    }

    if (route.params?.category === 'services') {
      return 'Searching services';
    }

    return 'Searching all listings';
  };

  const getSearchPlaceholder = () => {
    const preset = route.params?.presetFilter;

    if (preset === 'location') {
      return 'Search venues and vendors near a city, area, or province';
    }

    if (preset === 'categories') {
      return 'Search by category, e.g. photographer, decor, catering';
    }

    if (preset === 'amenities') {
      return 'Search by amenity, e.g. garden, pool, chapel';
    }

    if (preset === 'services') {
      return 'Search services, e.g. photography, catering, decor';
    }

    const cat = route.params?.category ?? category;

    if (cat === 'venues') {
      return 'Quick search by venue name';
    }

    if (cat === 'vendors') {
      return 'Search vendors and services, city, province...';
    }

    if (cat === 'services') {
      return 'Search services, e.g. photography, catering, decor';
    }

    return 'Search venues, vendors, services, city, category...';
  };

  const { data, isLoading, error } = useQuery<VendorListItem[]>({
    queryKey: ['discover-unified-v2'],
    queryFn: async () => {
      const { data: vendors, error: vendorError } = await supabase
        .from('vendors')
        .select('id, name, rating, review_count, image_url, location, description, category_id, service_options, vendor_tags, featured_listing, address_line_1, city, province')
        .limit(200);

      if (vendorError) throw vendorError;

      const { data: venues, error: venueError } = await supabase
        .from('venue_listings')
        .select('id, name, rating, review_count, image_url, location, description, venue_type, venue_capacity, amenities, features, address_line_1, city, province')
        .limit(200);

      if (venueError) throw venueError;

      const vendorItems: VendorListItem[] = (vendors ?? []).map((vendor: any) => {
        const locationParts = parseLocationParts(vendor.location);
        return {
          ...vendor,
          city: vendor.city ?? locationParts.city,
          province: vendor.province ?? locationParts.province,
          address_line_1: vendor.address_line_1 ?? null,
          type: 'vendor',
        };
      });

      const venueItems: VendorListItem[] = (venues ?? []).map((venue: any) => {
        const locationParts = parseLocationParts(venue.location);
        return {
          id: venue.id,
          name: venue.name,
          price_range: null,
          rating: venue.rating,
          review_count: venue.review_count ?? 0,
          image_url: venue.image_url,
          description: venue.description,
          location: venue.location,
          city: venue.city ?? locationParts.city,
          province: venue.province ?? locationParts.province,
          address_line_1: venue.address_line_1 ?? null,
          venue_type: venue.venue_type,
          venue_capacity: venue.venue_capacity,
          amenities: venue.amenities,
          features: venue.features,
          featured_listing: Boolean(venue.features?.featured),
          type: 'venue',
        };
      });

      return [...vendorItems, ...venueItems];
    },
  });

  useLayoutEffect(() => {
    navigation.setOptions({ title: getDisplayTitle() });
  }, [navigation, route.params?.presetFilter, search, category]);

  useEffect(() => {
    if (!route.params) {
      return;
    }

    setCategory(route.params.category ?? 'all');
    setSearch(route.params.initialSearch ?? '');
    setFeaturedOnly(route.params.presetFilter === 'featured');
    setLocationSearch(route.params.presetFilter === 'location' ? route.params.initialSearch ?? '' : '');
    setShowFilters(route.params.showFilters ?? false);
    setSelectedLocationProvince(route.params.presetFilter === 'location' ? '' : '');
  }, [route.params]);

  // Apply shared filter state when returning from FiltersScreen
  useFocusEffect(
    useCallback(() => {
      const shared = getSharedFilterState();
      if (shared) {
        setCategory(shared.category);
        setMinRating(shared.minRating);
        setOnlyWithPrice(shared.onlyWithPrice);
        setFeaturedOnly(shared.featuredOnly);
        setSelectedVenueTypes(shared.selectedVenueTypes);
        setSelectedVenueAmenities(shared.selectedVenueAmenities);
        setSelectedCapacity(shared.selectedCapacity);
        setSelectedProvinces(shared.selectedProvinces);
        setSelectedCities(shared.selectedCities);
        setSelectedVendorCategories(shared.selectedVendorCategories);
        setSelectedVendorSubcategories(shared.selectedVendorSubcategories);
        setSelectedVendorProvinces(shared.selectedVendorProvinces);
        setSelectedVendorCities(shared.selectedVendorCities);
        setSelectedLocationProvince(shared.selectedLocationProvince);
      }
    }, [])
  );

  // Clear legacy text filters when switching to venues, vendors, or services (dropdowns take over)
  useEffect(() => {
    if (category === 'venues' || category === 'vendors' || category === 'services') {
      setCityFilter('');
      setProvinceFilter('');
      setAmenitiesFilter('');
      setCategoryTextFilter('');
    }
    // Reset vendor dropdowns when switching away from vendors/services
    if (category !== 'vendors' && category !== 'services') {
      setSelectedVendorCategories([]);
      setSelectedVendorSubcategories([]);
      setSelectedVendorProvinces([]);
      setSelectedVendorCities([]);
    }
  }, [category]);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(filterGlowAnim, { toValue: 1.15, duration: 900, useNativeDriver: true }),
        Animated.timing(filterGlowAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => {
      pulse.stop();
    };
  }, [filterGlowAnim]);

  useEffect(() => {
    let isMounted = true;
    if (!user?.id) {
      setFavouriteIds({ vendorIds: [], venueIds: [] });
      return () => {
        isMounted = false;
      };
    }

    getFavourites(user).then((result) => {
      if (isMounted) {
        setFavouriteIds(result);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const handleToggleFavourite = async (id: number, type: 'vendor' | 'venue') => {
    if (!user?.id) {
      return;
    }
    const next = await toggleFavourite(user, id, type);
    setFavouriteIds(next);
  };

  const safeData = data ?? [];
  const query = search.trim().toLowerCase();
  const queryTokens = query.split(/\s+/).filter(Boolean);
  const locationQuery = locationSearch.trim().toLowerCase();
  const cityFilterQuery = cityFilter.trim().toLowerCase();
  const provinceFilterQuery = provinceFilter.trim().toLowerCase();
  const amenitiesFilterQuery = amenitiesFilter.trim().toLowerCase();
  const categoryTextFilterQuery = categoryTextFilter.trim().toLowerCase();
  const hasActiveSearch = queryTokens.length > 0;

  const filtered = useMemo(() => {
    return safeData.filter((item) => {
      const itemCategory = classifyCategory(item);

      // Search: broad match across name, location, city, province, type, amenities, tags, category label
      let matchesSearch = true;
      if (queryTokens.length > 0) {
        const categoryLabel = item.type === 'vendor' && typeof item.category_id === 'number'
          ? VENDOR_CATEGORIES.find((c) => c.id === item.category_id)?.label ?? ''
          : '';
        const fields = [
          item.name ?? '',
          item.description ?? '',
          item.location ?? '',
          item.city ?? '',
          item.province ?? '',
          item.venue_type ?? '',
          categoryLabel,
          ...(Array.isArray(item.amenities) ? item.amenities : []),
          ...(Array.isArray(item.service_options) ? item.service_options : []),
          ...(Array.isArray(item.vendor_tags) ? item.vendor_tags : []),
        ]
          .join(' ')
          .toLowerCase();
        matchesSearch = queryTokens.every((token) => fields.includes(token));
      }

      const matchesLocation = !locationQuery || [item.location, item.city, item.province].some((value) => (value ?? '').toLowerCase().includes(locationQuery));

      // Venue-specific dropdown filters (only apply when item is a venue)
      let matchesVenueType = true;
      if (selectedVenueTypes.length > 0 && item.type === 'venue') {
        const vt = String(item.venue_type ?? '').toLowerCase();
        matchesVenueType = selectedVenueTypes.some((type) => vt === type.toLowerCase());
      }

      let matchesVenueAmenities = true;
      if (selectedVenueAmenities.length > 0 && item.type === 'venue') {
        const itemAmenities = Array.isArray(item.amenities) ? item.amenities.map((a) => String(a).toLowerCase()) : [];
        matchesVenueAmenities = selectedVenueAmenities.every((a) => itemAmenities.includes(a.toLowerCase()));
      }

      let matchesCapacity = true;
      if (selectedCapacity && item.type === 'venue') {
        const cap = getVenueMaxCapacity(item);
        const threshold = getCapacityThreshold(selectedCapacity);
        if (selectedCapacity === '2000 and More') {
          matchesCapacity = cap !== null && cap >= threshold;
        } else {
          matchesCapacity = cap !== null && cap <= threshold;
        }
      }

      const itemProvince = (item.province ?? '').toLowerCase();
      const itemCity = (item.city ?? '').toLowerCase();
      const matchesProvinceDropdown = selectedProvinces.length === 0 || selectedProvinces.some((p) => itemProvince === p.toLowerCase() || (itemProvince.includes(p.toLowerCase()) && p.length > 3));
      const matchesCityDropdown = selectedCities.length === 0 || selectedCities.some((c) => itemCity === c.toLowerCase() || (itemCity.includes(c.toLowerCase()) && c.length > 2));

      // Vendor-specific dropdown filters (only apply when item is a vendor)
      let matchesVendorCategory = true;
      if (selectedVendorCategories.length > 0 && item.type === 'vendor') {
        matchesVendorCategory = item.category_id != null && selectedVendorCategories.includes(item.category_id as number);
      }

      let matchesVendorSubcategory = true;
      if (selectedVendorSubcategories.length > 0 && item.type === 'vendor') {
        const options = Array.isArray(item.service_options) ? item.service_options : [];
        const tags = Array.isArray(item.vendor_tags) ? item.vendor_tags : [];
        const haystack = [...options, ...tags].map((v) => String(v ?? '').toLowerCase());
        const selectedSet = new Set(selectedVendorSubcategories.map((t) => t.toLowerCase()));
        matchesVendorSubcategory = haystack.some((v) => selectedSet.has(v));
      }

      const matchesVendorProvinceDropdown = selectedVendorProvinces.length === 0 || selectedVendorProvinces.some((p) => itemProvince === p.toLowerCase() || (itemProvince.includes(p.toLowerCase()) && p.length > 3));
      const matchesVendorCityDropdown = selectedVendorCities.length === 0 || selectedVendorCities.some((c) => itemCity === c.toLowerCase() || (itemCity.includes(c.toLowerCase()) && c.length > 2));

      const matchesLocationProvince =
        !selectedLocationProvince ||
        itemProvince === selectedLocationProvince.toLowerCase() ||
        (itemProvince.includes(selectedLocationProvince.toLowerCase()) && selectedLocationProvince.length > 3);

      // Fallback free-text filters (used for non-venue mode or when legacy filters still set)
      const citySource = (item.city ?? item.location ?? '').toLowerCase();
      const provinceSource = (item.province ?? '').toLowerCase();
      const amenitiesText = (Array.isArray(item.amenities) ? item.amenities : [])
        .join(' ')
        .toLowerCase();
      const matchesCityText = !cityFilterQuery || citySource.includes(cityFilterQuery);
      const matchesProvinceText = !provinceFilterQuery || provinceSource.includes(provinceFilterQuery);
      const matchesAmenitiesText = !amenitiesFilterQuery || amenitiesText.includes(amenitiesFilterQuery);
      const matchesCategoryText =
        !categoryTextFilterQuery ||
        [item.name, item.description, ...(Array.isArray(item.service_options) ? item.service_options : []), ...(Array.isArray(item.vendor_tags) ? item.vendor_tags : [])]
          .join(' ')
          .toLowerCase()
          .includes(categoryTextFilterQuery);

      const matchesRating = minRating == null || (typeof item.rating === 'number' && item.rating >= minRating);
      const matchesPrice = !onlyWithPrice || !!item.price_range;
      const matchesCategory =
        category === 'all' ||
        (category === 'venues' && item.type === 'venue') ||
        (category === 'vendors' && item.type === 'vendor') ||
        (category === 'services' && item.type === 'vendor' && classifyCategory(item) === 'services');
      const matchesFeatured = !featuredOnly || item.featured_listing === true;

      return (
        matchesSearch &&
        matchesLocation &&
        matchesVenueType &&
        matchesVenueAmenities &&
        matchesCapacity &&
        matchesProvinceDropdown &&
        matchesCityDropdown &&
        matchesVendorCategory &&
        matchesVendorSubcategory &&
        matchesVendorProvinceDropdown &&
        matchesVendorCityDropdown &&
        matchesLocationProvince &&
        matchesCityText &&
        matchesProvinceText &&
        matchesAmenitiesText &&
        matchesCategoryText &&
        matchesRating &&
        matchesPrice &&
        matchesCategory &&
        matchesFeatured
      );
    });
  }, [
    amenitiesFilterQuery,
    category,
    categoryTextFilterQuery,
    cityFilterQuery,
    featuredOnly,
    locationQuery,
    minRating,
    onlyWithPrice,
    provinceFilterQuery,
    queryTokens,
    safeData,
    selectedVenueTypes,
    selectedVenueAmenities,
    selectedCapacity,
    selectedProvinces,
    selectedCities,
    selectedVendorCategories,
    selectedVendorSubcategories,
    selectedVendorProvinces,
    selectedVendorCities,
    selectedLocationProvince,
  ]);

  const sorted = useMemo(() => {
    const scoreItem = (item: VendorListItem) => {
      const name = (item.name ?? '').toLowerCase();
      const description = (item.description ?? '').toLowerCase();
      const location = [item.location, item.city, item.province].filter(Boolean).join(' ').toLowerCase();
      let score = 0;

      if (query) {
        if (name === query) score += 140;
        if (name.startsWith(query)) score += 70;
        if (name.includes(query)) score += 35;
        if (description.includes(query)) score += 16;
        if (location.includes(query)) score += 14;
      }

      queryTokens.forEach((token) => {
        if (name.startsWith(token)) score += 16;
        if (name.includes(token)) score += 10;
        if (description.includes(token)) score += 6;
        if (location.includes(token)) score += 6;
      });

      if (typeof item.rating === 'number') score += item.rating * 4;
      if (typeof item.review_count === 'number') score += Math.min(item.review_count, 30) / 3;
      if (item.type === 'venue') score += 4;
      if (item.featured_listing) score += 50;

      return score;
    };

    return [...filtered].sort((a, b) => {
      if (sortBy === 'rating-desc') {
        return (b.rating ?? 0) - (a.rating ?? 0);
      }

      if (sortBy === 'reviews-desc') {
        return (b.review_count ?? 0) - (a.review_count ?? 0);
      }

      if (sortBy === 'price-asc') {
        return getPriceValue(a.price_range) - getPriceValue(b.price_range);
      }

      if (sortBy === 'alphabetical') {
        return (a.name ?? '').localeCompare(b.name ?? '');
      }

      return scoreItem(b) - scoreItem(a);
    });
  }, [filtered, query, queryTokens, sortBy]);

  const featuredItems = useMemo(() => {
    return [...safeData]
      .filter((item) => item.featured_listing === true)
      .sort((a, b) => ((b.rating ?? 0) - (a.rating ?? 0)) || ((b.review_count ?? 0) - (a.review_count ?? 0)))
      .slice(0, 6);
  }, [safeData]);

  const hasActiveFilters =
    hasActiveSearch ||
    showFilters ||
    !!locationQuery ||
    featuredOnly ||
    category !== 'all' ||
    minRating != null ||
    onlyWithPrice ||
    selectedVenueTypes.length > 0 ||
    selectedVenueAmenities.length > 0 ||
    !!selectedCapacity ||
    selectedProvinces.length > 0 ||
    selectedCities.length > 0 ||
    selectedVendorCategories.length > 0 ||
    selectedVendorSubcategories.length > 0 ||
    selectedVendorProvinces.length > 0 ||
    selectedVendorCities.length > 0 ||
    !!selectedLocationProvince ||
    !!cityFilter ||
    !!provinceFilter ||
    !!amenitiesFilter ||
    !!categoryTextFilter;
  const shouldShowFeatured = !hasActiveFilters;
  const isLocationMode = route.params?.presetFilter === 'location';
  const activeSearchModeLabel = getActiveSearchModeLabel();

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

  const resultCountLabel = `${sorted.length} ${sorted.length === 1 ? 'listing' : 'listings'}`;

  if (isLoading) {
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

  if (error instanceof Error) {
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
        <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>Failed to load discovery list.</Text>
        <Text style={{ marginTop: spacing.sm, ...typography.body, color: colors.textMuted }}>{error.message}</Text>
      </View>
    );
  }

  if (safeData.length === 0) {
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
        <Text style={{ textAlign: 'center', ...typography.body, color: colors.textPrimary }}>
          No listings available yet.
        </Text>
        <Text
          style={{
            textAlign: 'center',
            marginTop: spacing.sm,
            ...typography.body,
            color: colors.textMuted,
          }}
        >
          Add a few venues and vendors in Supabase to populate Discover.
        </Text>
      </View>
    );
  }

  const renderListingCard = (item: VendorListItem, featuredCard = false) => (
    <TouchableOpacity
      key={`${item.type}-${item.id}`}
      activeOpacity={0.92}
      onPress={() => {
        if (item.type === 'venue') {
          navigation.navigate('VenueProfile', { venueId: item.id });
          return;
        }

        navigation.navigate('VendorProfile', { vendorId: item.id });
      }}
      style={{ marginRight: featuredCard ? spacing.md : 0, marginBottom: featuredCard ? 0 : isDesktop ? 24 : spacing.md, width: featuredCard ? 280 : isDesktop ? 'calc(50% - 12px)' : '100%' } as any}
    >
      <View
        style={{
          borderRadius: radii.xl,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 3 },
          elevation: 2,
        }}
      >
        <View>
          <NetworkImage
            uri={item.image_url}
            style={{ width: '100%', height: featuredCard ? 150 : cardImageHeight }}
            resizeMode="cover"
          />
          <TouchableOpacity
            onPress={(event) => {
              event.stopPropagation();
              handleToggleFavourite(item.id, item.type);
            }}
            style={{
              position: 'absolute',
              top: spacing.sm,
              right: spacing.sm,
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: colors.borderSubtle,
            }}
          >
            <MaterialIcons
              name={
                (item.type === 'vendor' && favouriteIds.vendorIds.includes(item.id)) ||
                (item.type === 'venue' && favouriteIds.venueIds.includes(item.id))
                  ? 'favorite'
                  : 'favorite-border'
              }
              size={18}
              color={
                (item.type === 'vendor' && favouriteIds.vendorIds.includes(item.id)) ||
                (item.type === 'venue' && favouriteIds.venueIds.includes(item.id))
                  ? colors.primaryTeal
                  : colors.textMuted
              }
            />
          </TouchableOpacity>
        </View>

        <View style={{ padding: spacing.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xs }}>
            <View style={{ flex: 1, paddingRight: spacing.sm }}>
              <Text style={{ ...typography.titleMedium, color: colors.textPrimary }} numberOfLines={1}>
                {item.name ?? 'Untitled'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <Text style={{ ...typography.caption, color: colors.textPrimary }}>
                  {item.type === 'venue' ? 'Venue' : classifyCategory(item) === 'services' ? 'Service' : 'Vendor'}
                </Text>
                {item.featured_listing && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFD700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: radii.sm, marginLeft: spacing.xs }}>
                    <MaterialIcons name="star" size={10} color="#000000" />
                    <Text style={{ ...typography.captionBold, color: '#000000', fontSize: 9, marginLeft: 2 }}>FEATURED</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
            <MaterialIcons name="star" size={16} color={colors.textPrimary} />
            <Text style={{ ...typography.caption, color: colors.textSecondary, marginLeft: spacing.xs }}>
              {typeof item.rating === 'number' ? item.rating.toFixed(1) : 'No rating yet'}
              {typeof item.review_count === 'number' && item.review_count > 0 ? ` · ${item.review_count} reviews` : ''}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
            <MaterialIcons name="place" size={16} color={colors.textSecondary} />
            <Text style={{ ...typography.caption, color: colors.textSecondary, marginLeft: spacing.xs }} numberOfLines={2}>
              {formatCardAddress(item)}
            </Text>
          </View>

          {!!item.description && (
            <Text style={{ ...typography.body, color: colors.textSecondary }} numberOfLines={featuredCard ? 2 : 3}>
              {item.description}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const handleSearchChange = (text: string) => {
    setSearch(text);
    if (text.trim().length > 0 && featuredOnly) {
      setFeaturedOnly(false);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setMinRating(null);
    setOnlyWithPrice(false);
    setFeaturedOnly(false);
    setLocationSearch('');
    setCityFilter('');
    setProvinceFilter('');
    setAmenitiesFilter('');
    setCategoryTextFilter('');
    setCategory('all');
    setSortBy('best-match');
    setSelectedVenueTypes([]);
    setSelectedVenueAmenities([]);
    setSelectedCapacity(null);
    setSelectedProvinces([]);
    setSelectedCities([]);
    setSelectedVendorCategories([]);
    setSelectedVendorSubcategories([]);
    setSelectedVendorProvinces([]);
    setSelectedVendorCities([]);
    setSelectedLocationProvince('');
  };

  return (
    <Animated.ScrollView
      style={{ flex: 1, backgroundColor: isDesktop ? colors.surfaceBg : colors.background }}
      contentContainerStyle={isDesktop ? { paddingHorizontal: 48, paddingTop: spacing.xl, paddingBottom: spacing.xl, maxWidth: 1200, width: '100%', alignSelf: 'center' } : { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xl }}
      keyboardShouldPersistTaps="handled"
      scrollEventThrottle={16}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: true }
      )}
    >
      <Animated.View
        style={{
          transform: [{ translateY: headerTranslateY }],
          opacity: headerOpacity,
          marginBottom: spacing.sm,
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ flexDirection: 'row', alignItems: 'center' }}
        >
          <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
          <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.xs }}>Back</Text>
        </TouchableOpacity>
      </Animated.View>

      {isDesktop ? (
        /* ─── Desktop Layout: Sidebar + Results Grid ─── */
        <View style={{ flexDirection: 'row', gap: 24 } as any}>
          {/* Sidebar Filters */}
          <View style={{ width: 280, flexShrink: 0 } as any}>
            <View style={{ backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.lg, padding: 16, borderWidth: 1, borderColor: colors.surfaceContainerHighest } as any}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ fontSize: 24, fontWeight: '600', fontFamily: 'Montserrat_600SemiBold', color: colors.primary }}>Filters</Text>
                <TouchableOpacity onPress={clearFilters}>
                  <Text style={{ fontSize: 14, fontFamily: 'Montserrat_400Regular', color: colors.primary }}>Clear all</Text>
                </TouchableOpacity>
              </View>

              {/* Category tabs */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
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
                      style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.full, borderWidth: 1, borderColor: selected ? colors.primary : colors.outlineVariant, backgroundColor: selected ? colors.primary : colors.surface } as any}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '600', fontFamily: 'Montserrat_600SemiBold', color: selected ? '#FFFFFF' : colors.onSurface }}>{option.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Search */}
              <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.outlineVariant, borderRadius: radii.md, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 16 } as any}>
                <MaterialIcons name="search" size={18} color={colors.outline} />
                <TextInput
                  value={search}
                  onChangeText={handleSearchChange}
                  placeholder={getSearchPlaceholder()}
                  placeholderTextColor={colors.outline}
                  style={{ flex: 1, marginLeft: 8, fontSize: 14, fontFamily: 'Montserrat_400Regular', color: colors.onSurface } as any}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch('')}>
                    <MaterialIcons name="close" size={16} color={colors.outline} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Venue Type Dropdown */}
              {(category === 'all' || category === 'venues') && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', fontFamily: 'Montserrat_600SemiBold', color: colors.onSurfaceVariant, marginBottom: 8, letterSpacing: 0.05 }}>Venue Type</Text>
                  <TouchableOpacity onPress={() => { setDropdownSearch(''); setActiveDropdown('venue_type'); }} style={{ borderWidth: 1, borderColor: colors.outlineVariant, borderRadius: radii.md, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' } as any}>
                    <Text style={{ fontSize: 14, fontFamily: 'Montserrat_400Regular', color: selectedVenueTypes.length > 0 ? colors.onSurface : colors.outline }} numberOfLines={1}>{selectedVenueTypes.length > 0 ? selectedVenueTypes.join(', ') : 'Any'}</Text>
                    <MaterialIcons name="keyboard-arrow-down" size={20} color={colors.outline} />
                  </TouchableOpacity>
                </View>
              )}

              {/* Venue Amenities */}
              {(category === 'all' || category === 'venues') && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', fontFamily: 'Montserrat_600SemiBold', color: colors.onSurfaceVariant, marginBottom: 8, letterSpacing: 0.05 }}>Amenities</Text>
                  <TouchableOpacity onPress={() => { setDropdownSearch(''); setActiveDropdown('venue_amenities'); }} style={{ borderWidth: 1, borderColor: colors.outlineVariant, borderRadius: radii.md, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' } as any}>
                    <Text style={{ fontSize: 14, fontFamily: 'Montserrat_400Regular', color: selectedVenueAmenities.length > 0 ? colors.onSurface : colors.outline }} numberOfLines={1}>{selectedVenueAmenities.length > 0 ? selectedVenueAmenities.join(', ') : 'Any'}</Text>
                    <MaterialIcons name="keyboard-arrow-down" size={20} color={colors.outline} />
                  </TouchableOpacity>
                </View>
              )}

              {/* Capacity */}
              {(category === 'all' || category === 'venues') && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', fontFamily: 'Montserrat_600SemiBold', color: colors.onSurfaceVariant, marginBottom: 8, letterSpacing: 0.05 }}>Capacity</Text>
                  <TouchableOpacity onPress={() => { setDropdownSearch(''); setActiveDropdown('capacity'); }} style={{ borderWidth: 1, borderColor: colors.outlineVariant, borderRadius: radii.md, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' } as any}>
                    <Text style={{ fontSize: 14, fontFamily: 'Montserrat_400Regular', color: selectedCapacity ? colors.onSurface : colors.outline }}>{selectedCapacity ?? 'Any'}</Text>
                    <MaterialIcons name="keyboard-arrow-down" size={20} color={colors.outline} />
                  </TouchableOpacity>
                </View>
              )}

              {/* Province */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', fontFamily: 'Montserrat_600SemiBold', color: colors.onSurfaceVariant, marginBottom: 8, letterSpacing: 0.05 }}>Province</Text>
                <TouchableOpacity onPress={() => { setDropdownSearch(''); setActiveDropdown(category === 'vendors' || category === 'services' ? 'vendor_province' : 'province'); }} style={{ borderWidth: 1, borderColor: colors.outlineVariant, borderRadius: radii.md, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' } as any}>
                  <Text style={{ fontSize: 14, fontFamily: 'Montserrat_400Regular', color: (category === 'vendors' || category === 'services' ? selectedVendorProvinces : selectedProvinces).length > 0 ? colors.onSurface : colors.outline }} numberOfLines={1}>{(category === 'vendors' || category === 'services' ? selectedVendorProvinces : selectedProvinces).length > 0 ? (category === 'vendors' || category === 'services' ? selectedVendorProvinces : selectedProvinces).join(', ') : 'Any'}</Text>
                  <MaterialIcons name="keyboard-arrow-down" size={20} color={colors.outline} />
                </TouchableOpacity>
              </View>

              {/* City */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', fontFamily: 'Montserrat_600SemiBold', color: colors.onSurfaceVariant, marginBottom: 8, letterSpacing: 0.05 }}>City</Text>
                <TouchableOpacity onPress={() => { setDropdownSearch(''); setActiveDropdown(category === 'vendors' || category === 'services' ? 'vendor_city' : 'city'); }} style={{ borderWidth: 1, borderColor: colors.outlineVariant, borderRadius: radii.md, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' } as any}>
                  <Text style={{ fontSize: 14, fontFamily: 'Montserrat_400Regular', color: (category === 'vendors' || category === 'services' ? selectedVendorCities : selectedCities).length > 0 ? colors.onSurface : colors.outline }} numberOfLines={1}>{(category === 'vendors' || category === 'services' ? selectedVendorCities : selectedCities).length > 0 ? (category === 'vendors' || category === 'services' ? selectedVendorCities : selectedCities).join(', ') : 'Any'}</Text>
                  <MaterialIcons name="keyboard-arrow-down" size={20} color={colors.outline} />
                </TouchableOpacity>
              </View>

              {/* Vendor Category */}
              {(category === 'all' || category === 'vendors' || category === 'services') && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', fontFamily: 'Montserrat_600SemiBold', color: colors.onSurfaceVariant, marginBottom: 8, letterSpacing: 0.05 }}>Vendor Category</Text>
                  <TouchableOpacity onPress={() => { setDropdownSearch(''); setActiveDropdown('vendor_category'); }} style={{ borderWidth: 1, borderColor: colors.outlineVariant, borderRadius: radii.md, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' } as any}>
                    <Text style={{ fontSize: 14, fontFamily: 'Montserrat_400Regular', color: selectedVendorCategories.length > 0 ? colors.onSurface : colors.outline }} numberOfLines={1}>{selectedVendorCategories.length > 0 ? selectedVendorCategories.map((id) => VENDOR_CATEGORIES.find((c) => c.id === id)?.label ?? id).join(', ') : 'Any'}</Text>
                    <MaterialIcons name="keyboard-arrow-down" size={20} color={colors.outline} />
                  </TouchableOpacity>
                </View>
              )}

              {/* Service Type */}
              {(category === 'all' || category === 'vendors' || category === 'services') && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', fontFamily: 'Montserrat_600SemiBold', color: colors.onSurfaceVariant, marginBottom: 8, letterSpacing: 0.05 }}>Service Type</Text>
                  <TouchableOpacity onPress={() => { setDropdownSearch(''); setActiveDropdown('vendor_subcategory'); }} style={{ borderWidth: 1, borderColor: colors.outlineVariant, borderRadius: radii.md, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' } as any}>
                    <Text style={{ fontSize: 14, fontFamily: 'Montserrat_400Regular', color: selectedVendorSubcategories.length > 0 ? colors.onSurface : colors.outline }} numberOfLines={1}>{selectedVendorSubcategories.length > 0 ? selectedVendorSubcategories.join(', ') : 'Any'}</Text>
                    <MaterialIcons name="keyboard-arrow-down" size={20} color={colors.outline} />
                  </TouchableOpacity>
                </View>
              )}

              {/* Minimum rating */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', fontFamily: 'Montserrat_600SemiBold', color: colors.onSurfaceVariant, marginBottom: 8, letterSpacing: 0.05 }}>Minimum rating</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 } as any}>
                  {[
                    { label: 'Any', value: null },
                    { label: '3.5+', value: 3.5 },
                    { label: '4.0+', value: 4 },
                    { label: '4.5+', value: 4.5 },
                  ].map((option) => {
                    const selected = minRating === option.value;
                    return (
                      <TouchableOpacity key={option.label} onPress={() => setMinRating(option.value)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.full, borderWidth: 1, borderColor: selected ? colors.primary : colors.outlineVariant, backgroundColor: selected ? colors.primary : colors.surface } as any}>
                        <Text style={{ fontSize: 12, fontFamily: 'Montserrat_400Regular', color: selected ? '#FFFFFF' : colors.onSurface }}>{option.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Toggles */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 } as any}>
                <TouchableOpacity onPress={() => setOnlyWithPrice((prev) => !prev)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.full, borderWidth: 1, borderColor: onlyWithPrice ? colors.primary : colors.outlineVariant, backgroundColor: onlyWithPrice ? colors.primary : colors.surface } as any}>
                  <Text style={{ fontSize: 12, fontFamily: 'Montserrat_400Regular', color: onlyWithPrice ? '#FFFFFF' : colors.onSurface }}>Only with price</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setFeaturedOnly((prev) => !prev)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.full, borderWidth: 1, borderColor: featuredOnly ? colors.primary : colors.outlineVariant, backgroundColor: featuredOnly ? colors.primary : colors.surface } as any}>
                  <Text style={{ fontSize: 12, fontFamily: 'Montserrat_400Regular', color: featuredOnly ? '#FFFFFF' : colors.onSurface }}>Featured focus</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Results Grid */}
          <View style={{ flex: 1 } as any}>
            {/* Results header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.lg, padding: 16, borderWidth: 1, borderColor: colors.surfaceContainerHighest, marginBottom: 24 } as any}>
              <View>
                <Text style={{ fontSize: 24, fontWeight: '600', fontFamily: 'Montserrat_600SemiBold', color: colors.primary }}>{getDisplayTitle()}</Text>
                <Text style={{ fontSize: 14, fontFamily: 'Montserrat_400Regular', color: colors.onSurfaceVariant, marginTop: 4 }}>{resultCountLabel}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowSortOptions((prev) => !prev)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.outlineVariant, borderRadius: radii.md, paddingHorizontal: 12, paddingVertical: 8 } as any}>
                <MaterialIcons name="swap-vert" size={18} color={colors.onSurface} />
                <Text style={{ fontSize: 14, fontFamily: 'Montserrat_400Regular', color: colors.onSurface }}>{sortBy.replace('-', ' ')}</Text>
              </TouchableOpacity>
            </View>

            {shouldShowFeatured && (
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 20, fontWeight: '600', fontFamily: 'Montserrat_600SemiBold', color: colors.onSurface, marginBottom: 16 }}>Featured listings</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 24 } as any}>
                  {featuredItems.map((item) => renderListingCard(item, true))}
                </View>
              </View>
            )}

            {sorted.length === 0 ? (
              <View style={{ backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.surfaceContainerHighest, padding: 32, alignItems: 'center' } as any}>
                <Text style={{ fontSize: 18, fontWeight: '600', fontFamily: 'Montserrat_600SemiBold', color: colors.onSurface, marginBottom: 8 }}>No listings found</Text>
                <Text style={{ fontSize: 14, fontFamily: 'Montserrat_400Regular', color: colors.onSurfaceVariant, textAlign: 'center' }}>Try broadening your search, clearing a filter, or switching the selected category.</Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 24 } as any}>
                {sorted.map((item) => renderListingCard(item))}
              </View>
            )}
          </View>
        </View>
      ) : (
      <>
      {/* ─── Mobile Layout (unchanged) ─── */}
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radii.xl,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          marginBottom: spacing.lg,
        }}
      >
        <Text style={{ ...typography.displayMedium, color: colors.textPrimary, marginBottom: spacing.md }}>
          {getDisplayTitle()}
        </Text>

        {isLocationMode ? (
          <View style={{ marginBottom: spacing.md, flexDirection: 'row', flexWrap: 'wrap' }}>
            {['All', ...provinces.map((p) => p.name)].map((province, idx) => {
              const selected = province === 'All'
                ? selectedLocationProvince === ''
                : selectedLocationProvince === province;
              const isThirdInRow = (idx + 1) % 3 === 0;
              return (
                <TouchableOpacity
                  key={province}
                  onPress={() => {
                    setSelectedLocationProvince(province === 'All' ? '' : province);
                  }}
                  style={{
                    width: '32%',
                    marginRight: isThirdInRow ? 0 : '2%',
                    marginBottom: spacing.sm,
                    paddingHorizontal: spacing.xs,
                    paddingVertical: spacing.sm,
                    borderRadius: radii.full,
                    borderWidth: 1.5,
                    borderColor: selected ? colors.coral : colors.borderSubtle,
                    backgroundColor: selected ? colors.coral : colors.surface,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ ...typography.caption, color: selected ? '#FFFFFF' : colors.textPrimary, fontWeight: selected ? '600' : '400' }} numberOfLines={1}>
                    {province}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}

        <View
          style={{
            borderRadius: radii.full,
            borderWidth: 1.5,
            borderColor: colors.primary,
            backgroundColor: colors.surface,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.md,
            marginBottom: spacing.md,
          }}
        >
          <MaterialIcons name="search" size={20} color={colors.textSecondary} style={{ marginRight: spacing.sm }} />
          <TextInput
            value={search}
            onChangeText={handleSearchChange}
            placeholder={getSearchPlaceholder()}
            placeholderTextColor={colors.textMuted}
            style={{ flex: 1, paddingVertical: spacing.md, color: colors.textPrimary, fontFamily: typography.body.fontFamily }}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {search.length > 0 ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialIcons name="close" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {hasActiveSearch && (
          <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm }}>
            {sorted.length} result{sorted.length !== 1 ? 's' : ''} showing
          </Text>
        )}

        <View style={{ flexDirection: 'row', columnGap: spacing.md, alignItems: 'center', justifyContent: 'center' }}>
          <AnimatedTouchableOpacity
            onPress={() => {
              setSharedFilterState({
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
                selectedVendorProvinces,
                selectedVendorCities,
                selectedLocationProvince,
              });
              navigation.navigate('Filters');
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              columnGap: spacing.xs,
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.lg,
              backgroundColor: colors.primary,
              borderColor: colors.primary,
              borderWidth: 2,
              borderRadius: radii.full,
              transform: [{ scale: filterGlowAnim }],
              shadowColor: colors.primary,
              shadowOpacity: 0.45,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 0 },
              elevation: 10,
            }}
            accessibilityLabel="Open filters"
          >
            <MaterialIcons name="tune" size={20} color={colors.primaryForeground} />
            <Text style={{ ...typography.buttonMedium, color: colors.primaryForeground }}>Filters</Text>
          </AnimatedTouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowSortOptions((prev) => !prev)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              columnGap: spacing.xs,
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.lg,
              backgroundColor: showSortOptions ? colors.primary : colors.surface,
              borderColor: showSortOptions ? colors.primary : colors.borderSubtle,
              borderWidth: 1,
              borderRadius: radii.full,
            }}
            accessibilityLabel="Open sort options"
          >
            <MaterialIcons name="swap-vert" size={18} color={showSortOptions ? colors.primaryForeground : colors.textPrimary} />
            <Text style={{ ...typography.buttonMedium, color: showSortOptions ? colors.primaryForeground : colors.textPrimary }}>Sort by</Text>
          </TouchableOpacity>
        </View>
      </View>

      {shouldShowFeatured ? (
        <View style={{ marginBottom: spacing.xl }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
            <View>
              <Text style={{ ...typography.titleLarge, color: colors.textPrimary }}>Featured listings</Text>
              <Text style={{ ...typography.body, color: colors.textSecondary, marginTop: spacing.xs }}>
                A polished shortlist to inspire your next event.
              </Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {featuredItems.map((item) => renderListingCard(item, true))}
          </ScrollView>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
        <View>
          <Text style={{ ...typography.titleLarge, color: colors.textPrimary }}>
            {hasActiveSearch || locationQuery || featuredOnly || category !== 'all' ? 'Search results' : 'All listings'}
          </Text>
          <Text style={{ ...typography.body, color: colors.textSecondary, marginTop: spacing.xs }}>
            Showing {resultCountLabel}
          </Text>
        </View>
        <View style={{ backgroundColor: colors.accent, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.full }}>
          <Text style={{ ...typography.caption, color: colors.textPrimary }}>{sortBy.replace('-', ' ')}</Text>
        </View>
      </View>

      {sorted.length === 0 ? (
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radii.xl,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            padding: spacing.xl,
          }}
        >
          <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.sm }}>
            No listings found
          </Text>
          <Text style={{ ...typography.body, color: colors.textSecondary }}>
            Try broadening your search, clearing a filter, or switching the selected category.
          </Text>
        </View>
      ) : (
        sorted.map((item) => renderListingCard(item))
      )}
      </>
      )}

      {isDesktop && (
      <Modal visible={showFilters} transparent animationType="fade" onRequestClose={() => setShowFilters(false)}>
        <KeyboardAvoidingView
          behavior="padding"
          style={{ flex: 1 }}
        >
          <View style={isDesktop
            ? { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg }
            : { flex: 1, backgroundColor: 'rgba(0,0,0,0.28)', justifyContent: 'flex-end' }
          }>
            {isDesktop ? (
              <TouchableOpacity style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} activeOpacity={1} onPress={() => setShowFilters(false)} />
            ) : (
              <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowFilters(false)} />
            )}
            <View
              style={isDesktop
                ? {
                    backgroundColor: colors.surface,
                    borderRadius: radii.xl,
                    maxWidth: 640,
                    width: '100%',
                    maxHeight: '85%',
                    padding: spacing.xl,
                    shadowColor: '#000',
                    shadowOpacity: 0.2,
                    shadowRadius: 30,
                    shadowOffset: { width: 0, height: 8 },
                    elevation: 20,
                  }
                : {
                    backgroundColor: colors.surface,
                    borderTopLeftRadius: radii.xl,
                    borderTopRightRadius: radii.xl,
                    borderTopWidth: 1,
                    borderColor: colors.borderSubtle,
                    maxHeight: '92%',
                  }
              }
            >
              <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: spacing.md }}>
                  <TouchableOpacity onPress={() => setShowFilters(false)}>
                    <MaterialIcons name="close" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}>
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
                          borderColor: selected ? colors.primary : colors.borderSubtle,
                          backgroundColor: selected ? colors.primary : colors.surface,
                        }}
                      >
                        <Text style={{ ...typography.caption, color: selected ? colors.primaryForeground : colors.textPrimary }}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {(category === 'all' || category === 'venues') && (
                  <>
                    {/* Venue Type Dropdown */}
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

                    {/* Venue Amenities Dropdown */}
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

                    {/* Capacity Dropdown */}
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
                  </>
                )}

                {(category === 'all' || category === 'venues') && (
                  <>
                    {/* Province Dropdown */}
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

                    {/* City Dropdown */}
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
                      onPress={() => { setShowFilters(false); setShowMapRadiusSelector(true); }}
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

                {(category === 'all' || category === 'vendors' || category === 'services') && (
                  <>
                    {/* Vendor Category Dropdown */}
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

                    {/* Service Type / Subcategory Dropdown */}
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
                  </>
                )}

                {(category === 'vendors' || category === 'services') && (
                  <>
                    {/* Province Dropdown */}
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

                    {/* City Dropdown */}
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
                      onPress={() => { setShowFilters(false); setShowMapRadiusSelector(true); }}
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
                          borderColor: selected ? colors.primary : colors.borderSubtle,
                          backgroundColor: selected ? colors.primary : colors.surface,
                        }}
                      >
                        <Text style={{ ...typography.caption, color: selected ? colors.primaryForeground : colors.textPrimary }}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.sm, columnGap: spacing.sm }}>
                  <TouchableOpacity
                    onPress={() => setOnlyWithPrice((prev) => !prev)}
                    style={{
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.xs,
                      borderRadius: radii.full,
                      borderWidth: 1,
                      borderColor: onlyWithPrice ? colors.primary : colors.borderSubtle,
                      backgroundColor: onlyWithPrice ? colors.primary : colors.surface,
                    }}
                  >
                    <Text style={{ ...typography.caption, color: onlyWithPrice ? colors.primaryForeground : colors.textPrimary }}>
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
                      borderColor: featuredOnly ? colors.primary : colors.borderSubtle,
                      backgroundColor: featuredOnly ? colors.primary : colors.surface,
                    }}
                  >
                    <Text style={{ ...typography.caption, color: featuredOnly ? colors.primaryForeground : colors.textPrimary }}>
                      Featured focus
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>

              <View
                style={{
                  padding: spacing.lg,
                  paddingBottom: insets.bottom + spacing.lg,
                  borderTopWidth: 1,
                  borderTopColor: colors.borderSubtle,
                }}
              >
                <View style={{ flexDirection: 'row', columnGap: spacing.md }}>
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
                    onPress={() => setShowFilters(false)}
                    style={{
                      flex: 1,
                      paddingVertical: spacing.md,
                      borderRadius: radii.full,
                      borderWidth: 1.5,
                      borderColor: colors.primary,
                      backgroundColor: colors.primary,
                      alignItems: 'center',
                    }}
                    accessibilityLabel="Confirm filters"
                  >
                    <Text style={{ ...typography.buttonMedium, color: colors.primaryForeground }}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      )}

      <Modal visible={showSortOptions} transparent animationType="fade" onRequestClose={() => setShowSortOptions(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.28)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <TouchableOpacity style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} activeOpacity={1} onPress={() => setShowSortOptions(false)} />
          <View
            style={isDesktop
              ? {
                  backgroundColor: colors.surface,
                  borderRadius: radii.xl,
                  padding: spacing.lg,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  maxHeight: '60%',
                  width: '100%',
                  maxWidth: 480,
                  shadowColor: '#000',
                  shadowOpacity: 0.2,
                  shadowRadius: 30,
                  shadowOffset: { width: 0, height: 8 },
                  elevation: 20,
                }
              : {
                  backgroundColor: colors.surface,
                  borderRadius: radii.xl,
                  padding: spacing.lg,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  maxHeight: '60%',
                  width: '100%',
                  maxWidth: 420,
                }
            }
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>Sort options</Text>
              <TouchableOpacity onPress={() => setShowSortOptions(false)}>
                <MaterialIcons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.sm, columnGap: spacing.sm }}>
              {[
                { key: 'best-match' as SortBy, label: 'Best match' },
                { key: 'rating-desc' as SortBy, label: 'Highest rating' },
                { key: 'reviews-desc' as SortBy, label: 'Most reviews' },
                { key: 'price-asc' as SortBy, label: 'Price low to high' },
                { key: 'alphabetical' as SortBy, label: 'Alphabetical' },
              ].map((option) => {
                const selected = sortBy === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    onPress={() => {
                      setSortBy(option.key);
                      setShowSortOptions(false);
                    }}
                    style={{
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.xs,
                      borderRadius: radii.full,
                      borderWidth: 1,
                      borderColor: selected ? colors.primary : colors.borderSubtle,
                      backgroundColor: selected ? colors.primary : colors.surface,
                    }}
                  >
                    <Text style={{ ...typography.caption, color: selected ? colors.primaryForeground : colors.textPrimary }}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* Dropdown Picker Modal */}
      <Modal visible={activeDropdown !== null} transparent animationType={isDesktop ? 'fade' : 'slide'} onRequestClose={() => setActiveDropdown(null)}>
        <KeyboardAvoidingView
          behavior="padding"
          style={isDesktop ? { flex: 1 } : { flex: 1, justifyContent: 'flex-end' }}
        >
          <View style={isDesktop
            ? { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg }
            : { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' }
          }>
            {isDesktop ? (
              <TouchableOpacity style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} activeOpacity={1} onPress={() => setActiveDropdown(null)} />
            ) : (
              <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setActiveDropdown(null)} />
            )}
            <View
              style={isDesktop
                ? {
                    backgroundColor: colors.surface,
                    borderRadius: radii.xl,
                    maxWidth: 480,
                    width: '100%',
                    maxHeight: '75%',
                    padding: spacing.lg,
                    shadowColor: '#000',
                    shadowOpacity: 0.2,
                    shadowRadius: 30,
                    shadowOffset: { width: 0, height: 8 },
                    elevation: 20,
                  }
                : {
                    backgroundColor: colors.surface,
                    borderTopLeftRadius: radii.xl,
                    borderTopRightRadius: radii.xl,
                    padding: spacing.lg,
                    maxHeight: '75%',
                  }
              }
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
                <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>
                  {activeDropdown === 'venue_type'
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
                    : activeDropdown === 'vendor_province'
                    ? 'Select preferred provinces'
                    : activeDropdown === 'vendor_city'
                    ? 'Select preferred cities'
                    : ''}
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
                  const isMulti = activeDropdown === 'venue_type' || activeDropdown === 'venue_amenities' || activeDropdown === 'province' || activeDropdown === 'city' || activeDropdown === 'vendor_category' || activeDropdown === 'vendor_subcategory' || activeDropdown === 'vendor_province' || activeDropdown === 'vendor_city';
                  const isSingle = !isMulti;

                  let allOptions: string[] = [];
                  if (activeDropdown === 'venue_type') allOptions = venueTypes;
                  else if (activeDropdown === 'venue_amenities') allOptions = amenitiesList;
                  else if (activeDropdown === 'capacity') allOptions = venueCapacityOptions;
                  else if (activeDropdown === 'province') allOptions = provinces.map((p) => p.name);
                  else if (activeDropdown === 'city') allOptions = availableCities;
                  else if (activeDropdown === 'vendor_category') allOptions = VENDOR_CATEGORIES.map((c) => c.label);
                  else if (activeDropdown === 'vendor_subcategory') allOptions = availableVendorSubcategories;
                  else if (activeDropdown === 'vendor_province') allOptions = provinces.map((p) => p.name);
                  else if (activeDropdown === 'vendor_city') allOptions = availableVendorCities;

                  const filteredOptions = allOptions
                    .filter((opt) => opt.toLowerCase().includes(dropdownSearch.trim().toLowerCase()))
                    .sort((a, b) => a.localeCompare(b));

                  // Any option
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
                              borderColor: anySelected ? colors.primary : '#D1D5DB',
                              backgroundColor: anySelected ? colors.primary : '#FFFFFF',
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
                              // When provinces change, filter cities to only those in selected provinces
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
                              // Clear subcategories when categories change so stale subcats are removed
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
                          } else if (activeDropdown === 'vendor_province') {
                            setSelectedVendorProvinces((prev) => {
                              const next = prev.includes(option) ? prev.filter((p) => p !== option) : [...prev, option];
                              // When provinces change, filter cities to only those in selected provinces
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
                            borderColor: isSelected ? colors.primary : '#D1D5DB',
                            backgroundColor: isSelected ? colors.primary : '#FFFFFF',
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
          // Reverse geocode to auto-detect province
          try {
            const { reverseGeocodeAsync } = await import('expo-location');
            const places = await reverseGeocodeAsync(location);
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
    </Animated.ScrollView>
  );
}
