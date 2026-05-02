import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '../lib/supabaseClient';
import { colors, spacing, radii, typography } from '../theme';
import type { VendorListItem } from './AttendeeHomeScreen';
import { getFavourites, toggleFavourite } from '../lib/favourites';
import { useAuth } from '../auth/AuthContext';
import type { AttendeeStackParamList } from '../navigation/AttendeeNavigator';

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

export default function DiscoverScreen() {
  const navigation = useNavigation<DiscoverNavigation>();
  const route = useRoute<DiscoverRoute>();
  const [search, setSearch] = useState(route.params?.initialSearch ?? '');
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
  const [showFilters, setShowFilters] = useState(false);
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [favouriteIds, setFavouriteIds] = useState<{ vendorIds: number[]; venueIds: number[] }>({
    vendorIds: [],
    venueIds: [],
  });
  const { user } = useAuth();

  const parseLocationParts = (location?: string | null) => {
    if (!location) {
      return { city: null as string | null, province: null as string | null };
    }

    const parts = location
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length >= 2) {
      return {
        city: parts[0] ?? null,
        province: parts[parts.length - 1] ?? null,
      };
    }

    return {
      city: parts[0] ?? null,
      province: null,
    };
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
    if (route.params?.searchTitle) {
      return route.params.searchTitle;
    }

    if (search.trim()) {
      return `Results for “${search.trim()}”`;
    }

    if (route.params?.presetFilter) {
      return presetTitles[route.params.presetFilter];
    }

    return 'Discover';
  };

  const getActiveSearchModeLabel = () => {
    if (route.params?.presetFilter) {
      return presetTitles[route.params.presetFilter];
    }

    if (route.params?.category === 'venues') {
      return 'Searching venues';
    }

    if (route.params?.category === 'vendors') {
      return 'Searching vendors';
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

    return 'Search venues, vendors, services, city, category...';
  };

  const { data, isLoading, error } = useQuery<VendorListItem[]>({
    queryKey: ['discover-unified-v2'],
    queryFn: async () => {
      const { data: vendors, error: vendorError } = await supabase
        .from('vendors')
        .select('id, name, price_range, rating, review_count, image_url, location, description, category_id, service_options, vendor_tags, featured_listing')
        .limit(60);

      if (vendorError) throw vendorError;

      const { data: venues, error: venueError } = await supabase
        .from('venue_listings')
        .select('id, name, rating, review_count, image_url, location, description, venue_type, amenities, features')
        .limit(60);

      if (venueError) throw venueError;

      const vendorItems: VendorListItem[] = (vendors ?? []).map((vendor: any) => {
        const locationParts = parseLocationParts(vendor.location);
        return {
          ...vendor,
          city: locationParts.city,
          province: locationParts.province,
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
          city: locationParts.city,
          province: locationParts.province,
          venue_type: venue.venue_type,
          amenities: venue.amenities,
          features: venue.features,
          type: 'venue',
        };
      });

      return [...vendorItems, ...venueItems];
    },
  });

  useLayoutEffect(() => {
    navigation.setOptions({ title: getDisplayTitle() });
  }, [navigation, route.params?.searchTitle, route.params?.presetFilter, search]);

  useEffect(() => {
    if (!route.params) {
      return;
    }

    setCategory(route.params.category ?? 'all');
    setSearch(route.params.initialSearch ?? '');
    setFeaturedOnly(route.params.presetFilter === 'featured');
    setLocationSearch(route.params.presetFilter === 'location' ? route.params.initialSearch ?? '' : '');
  }, [route.params]);

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
      const fields = [
        item.name ?? '',
        item.description ?? '',
        item.location ?? '',
        item.city ?? '',
        item.province ?? '',
        item.venue_type ?? '',
        ...(Array.isArray(item.amenities) ? item.amenities : []),
        ...(Array.isArray(item.service_options) ? item.service_options : []),
        ...(Array.isArray(item.vendor_tags) ? item.vendor_tags : []),
      ]
        .join(' ')
        .toLowerCase();

      const citySource = (item.city ?? item.location ?? '').toLowerCase();
      const provinceSource = (item.province ?? '').toLowerCase();
      const amenitiesText = (Array.isArray(item.amenities) ? item.amenities : [])
        .join(' ')
        .toLowerCase();

      const matchesSearch = queryTokens.length === 0 || queryTokens.every((token) => fields.includes(token));
      const matchesLocation = !locationQuery || [item.location, item.city, item.province].some((value) => (value ?? '').toLowerCase().includes(locationQuery));
      const matchesCity = !cityFilterQuery || citySource.includes(cityFilterQuery);
      const matchesProvince = !provinceFilterQuery || provinceSource.includes(provinceFilterQuery);
      const matchesAmenities = !amenitiesFilterQuery || amenitiesText.includes(amenitiesFilterQuery);
      const matchesCategoryText =
        !categoryTextFilterQuery ||
        [item.name, item.description, ...(Array.isArray(item.service_options) ? item.service_options : []), ...(Array.isArray(item.vendor_tags) ? item.vendor_tags : [])]
          .join(' ')
          .toLowerCase()
          .includes(categoryTextFilterQuery);
      const matchesRating = minRating == null || (typeof item.rating === 'number' && item.rating >= minRating);
      const matchesPrice = !onlyWithPrice || !!item.price_range;
      const matchesCategory = category === 'all' || itemCategory === category || (category === 'vendors' && item.type === 'vendor' && itemCategory !== 'services');
      const matchesFeatured = !featuredOnly || item.type === 'venue' || item.type === 'vendor';

      return (
        matchesSearch &&
        matchesLocation &&
        matchesCity &&
        matchesProvince &&
        matchesAmenities &&
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
      .sort((a, b) => ((b.rating ?? 0) - (a.rating ?? 0)) || ((b.review_count ?? 0) - (a.review_count ?? 0)))
      .slice(0, 6);
  }, [safeData]);

  const shouldShowFeatured = !hasActiveSearch && !showFilters && !locationQuery && !featuredOnly;
  const isLocationMode = route.params?.presetFilter === 'location';
  const activeSearchModeLabel = getActiveSearchModeLabel();

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
      style={{ marginRight: featuredCard ? spacing.md : 0, marginBottom: featuredCard ? 0 : spacing.md, width: featuredCard ? 250 : '100%' }}
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
          {item.image_url ? (
            <Image
              source={{ uri: item.image_url }}
              style={{ width: '100%', height: featuredCard ? 150 : 190 }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                width: '100%',
                height: featuredCard ? 150 : 190,
                backgroundColor: colors.surfaceMuted,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MaterialIcons name="image" size={28} color={colors.textMuted} />
            </View>
          )}
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
              <Text style={{ ...typography.caption, color: colors.primaryTeal, marginTop: 2 }}>
                {item.type === 'venue' ? 'Venue' : classifyCategory(item) === 'services' ? 'Service' : 'Vendor'}
              </Text>
            </View>
            {item.price_range ? (
              <View style={{ backgroundColor: colors.accent, paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radii.full }}>
                <Text style={{ ...typography.caption, color: colors.textPrimary }}>{item.price_range}</Text>
              </View>
            ) : null}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
            <MaterialIcons name="star" size={16} color={colors.primaryTeal} />
            <Text style={{ ...typography.caption, color: colors.textSecondary, marginLeft: spacing.xs }}>
              {typeof item.rating === 'number' ? item.rating.toFixed(1) : 'No rating yet'}
              {typeof item.review_count === 'number' && item.review_count > 0 ? ` · ${item.review_count} reviews` : ''}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
            <MaterialIcons name="place" size={16} color={colors.textSecondary} />
            <Text style={{ ...typography.caption, color: colors.textSecondary, marginLeft: spacing.xs }} numberOfLines={1}>
              {[item.city, item.province].filter(Boolean).join(', ') || item.location || 'Location available on profile'}
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

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xl }}
      keyboardShouldPersistTaps="handled"
    >
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radii.xl,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          marginBottom: spacing.lg,
        }}
      >
        <Text style={{ ...typography.displayMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
          {getDisplayTitle()}
        </Text>
        <Text style={{ ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg }}>
          Search beautifully curated venues, vendors, and services with fast smart matching and polished filters.
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.sm, columnGap: spacing.sm, marginBottom: spacing.md }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.accent,
              borderRadius: radii.full,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
            }}
          >
            <MaterialIcons
              name={isLocationMode ? 'place' : route.params?.presetFilter === 'services' ? 'miscellaneous-services' : route.params?.presetFilter === 'categories' ? 'category' : route.params?.presetFilter === 'amenities' ? 'hotel' : 'travel-explore'}
              size={16}
              color={colors.primaryTeal}
            />
            <Text style={{ ...typography.caption, color: colors.textPrimary, marginLeft: spacing.xs }}>
              {activeSearchModeLabel}
            </Text>
          </View>
          {category !== 'all' ? (
            <View
              style={{
                backgroundColor: colors.surfaceMuted,
                borderRadius: radii.full,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
              }}
            >
              <Text style={{ ...typography.caption, color: colors.textPrimary }}>{category}</Text>
            </View>
          ) : null}
        </View>

        {/* Location mode now uses text + filters only; map removed per design. */}

        <View
          style={{
            borderRadius: radii.full,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            backgroundColor: colors.surfaceMuted,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.md,
            marginBottom: spacing.md,
          }}
        >
          <MaterialIcons name="search" size={20} color={colors.textSecondary} style={{ marginRight: spacing.sm }} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={getSearchPlaceholder()}
            placeholderTextColor={colors.textMuted}
            style={{ flex: 1, paddingVertical: spacing.md, color: colors.textPrimary }}
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

        {isLocationMode ? (
          <View
            style={{
              borderRadius: radii.md,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              backgroundColor: colors.surfaceMuted,
              paddingHorizontal: spacing.md,
              marginBottom: spacing.md,
            }}
          >
            <TextInput
              value={locationSearch}
              onChangeText={setLocationSearch}
              placeholder="Filter by city or province"
              placeholderTextColor={colors.textMuted}
              style={{ paddingVertical: spacing.sm, color: colors.textPrimary }}
            />
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', columnGap: spacing.sm }}>
          <TouchableOpacity
            onPress={() => setShowFilters((prev) => !prev)}
            style={{
              width: 52,
              height: 52,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: showFilters ? colors.primary : colors.surface,
              borderColor: showFilters ? colors.primary : colors.borderSubtle,
              borderWidth: 1,
              borderRadius: radii.full,
            }}
            accessibilityLabel="Open filters"
          >
            <MaterialIcons name="tune" size={18} color={showFilters ? colors.primaryForeground : colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowSortOptions((prev) => !prev)}
            style={{
              width: 52,
              height: 52,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: showSortOptions ? colors.primary : colors.surface,
              borderColor: showSortOptions ? colors.primary : colors.borderSubtle,
              borderWidth: 1,
              borderRadius: radii.full,
            }}
            accessibilityLabel="Open sort options"
          >
            <MaterialIcons name="swap-vert" size={18} color={showSortOptions ? colors.primaryForeground : colors.textPrimary} />
          </TouchableOpacity>
          <View
            style={{
              flex: 1,
              backgroundColor: colors.surfaceMuted,
              borderRadius: radii.full,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              justifyContent: 'center',
              paddingHorizontal: spacing.md,
            }}
          >
            <Text style={{ ...typography.caption, color: colors.textSecondary }} numberOfLines={1}>
              {showFilters ? 'Filters open' : showSortOptions ? 'Sort options open' : activeSearchModeLabel}
            </Text>
          </View>
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

      <Modal visible={showFilters} transparent animationType="fade" onRequestClose={() => setShowFilters(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.28)', justifyContent: 'flex-end' }}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowFilters(false)} />
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: radii.xl,
              borderTopRightRadius: radii.xl,
              padding: spacing.lg,
              borderTopWidth: 1,
              borderColor: colors.borderSubtle,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <MaterialIcons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>Browse by</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.sm, columnGap: spacing.sm, marginBottom: spacing.md }}>
              {[
                { key: 'all' as CategoryFilter, label: 'All' },
                { key: 'venues' as CategoryFilter, label: 'Venues' },
                { key: 'vendors' as CategoryFilter, label: 'Vendors' },
                { key: 'services' as CategoryFilter, label: 'Services' },
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

            {!isLocationMode ? (
              <>
                <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>Location</Text>
                <View
                  style={{
                    borderRadius: radii.md,
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                    backgroundColor: colors.surfaceMuted,
                    paddingHorizontal: spacing.md,
                    marginBottom: spacing.md,
                  }}
                >
                  <TextInput
                    value={locationSearch}
                    onChangeText={setLocationSearch}
                    placeholder="Filter by city or province"
                    placeholderTextColor={colors.textMuted}
                    style={{ paddingVertical: spacing.sm, color: colors.textPrimary }}
                  />
                </View>
              </>
            ) : null}

            <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>City</Text>
            <View
              style={{
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                backgroundColor: colors.surfaceMuted,
                paddingHorizontal: spacing.md,
                marginBottom: spacing.md,
              }}
            >
              <TextInput
                value={cityFilter}
                onChangeText={setCityFilter}
                placeholder="Filter by city"
                placeholderTextColor={colors.textMuted}
                style={{ paddingVertical: spacing.sm, color: colors.textPrimary }}
              />
            </View>

            <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>Province / region</Text>
            <View
              style={{
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                backgroundColor: colors.surfaceMuted,
                paddingHorizontal: spacing.md,
                marginBottom: spacing.md,
              }}
            >
              <TextInput
                value={provinceFilter}
                onChangeText={setProvinceFilter}
                placeholder="Filter by province or state"
                placeholderTextColor={colors.textMuted}
                style={{ paddingVertical: spacing.sm, color: colors.textPrimary }}
              />
            </View>

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

            <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>Amenities</Text>
            <View
              style={{
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                backgroundColor: colors.surfaceMuted,
                paddingHorizontal: spacing.md,
                marginBottom: spacing.md,
              }}
            >
              <TextInput
                value={amenitiesFilter}
                onChangeText={setAmenitiesFilter}
                placeholder="e.g. garden, pool, chapel"
                placeholderTextColor={colors.textMuted}
                style={{ paddingVertical: spacing.sm, color: colors.textPrimary }}
              />
            </View>

            <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>Category keywords</Text>
            <View
              style={{
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                backgroundColor: colors.surfaceMuted,
                paddingHorizontal: spacing.md,
                marginBottom: spacing.lg,
              }}
            >
              <TextInput
                value={categoryTextFilter}
                onChangeText={setCategoryTextFilter}
                placeholder="e.g. photographer, decor, catering"
                placeholderTextColor={colors.textMuted}
                style={{ paddingVertical: spacing.sm, color: colors.textPrimary }}
              />
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
          </View>
        </View>
      </Modal>

      <Modal visible={showSortOptions} transparent animationType="fade" onRequestClose={() => setShowSortOptions(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.28)', justifyContent: 'flex-end' }}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowSortOptions(false)} />
          <View
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: radii.xl,
              borderTopRightRadius: radii.xl,
              padding: spacing.lg,
              borderTopWidth: 1,
              borderColor: colors.borderSubtle,
            }}
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
    </ScrollView>
  );
}
