import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '../lib/supabaseClient';
import { colors, spacing, radii, typography } from '../theme';
import type { VendorListItem } from './AttendeeHomeScreen';
import { getFavourites, toggleFavourite } from '../lib/favourites';
import { useAuth } from '../auth/AuthContext';

type CategoryFilter = 'all' | 'venues' | 'catering' | 'photography' | 'other';
type SortBy = 'default' | 'rating-desc' | 'reviews-desc' | 'price-asc';

export default function DiscoverScreen() {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const [minRating, setMinRating] = useState<number | null>(null);
  const [onlyWithPrice, setOnlyWithPrice] = useState(false);
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('default');
  const [favouriteIds, setFavouriteIds] = useState<{ vendorIds: number[]; venueIds: number[] }>({
    vendorIds: [],
    venueIds: [],
  });
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery<VendorListItem[]>({
    queryKey: ['discover-unified'],
    queryFn: async () => {
      // Fetch vendors
      const { data: vendors, error: vendorError } = await supabase
        .from('vendors')
        .select('id, name, price_range, rating, review_count, image_url, description')
        .limit(30);

      if (vendorError) throw vendorError;

      // Fetch venues
      const { data: venues, error: venueError } = await supabase
        .from('venue_listings')
        .select('id, name, rating, image_url, description')
        .limit(30);

      if (venueError) throw venueError;

      const vendorItems: VendorListItem[] = (vendors ?? []).map(v => ({ ...v, type: 'vendor' }));
      
      const venueItems: VendorListItem[] = (venues ?? []).map(v => ({
        id: v.id,
        name: v.name,
        price_range: null,
        rating: v.rating,
        review_count: 0,
        image_url: v.image_url,
        description: v.description,
        type: 'venue'
      }));

      return [...vendorItems, ...venueItems];
    },
  });

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

  if (!data || data.length === 0) {
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
          No vendors available yet.
        </Text>
        <Text
          style={{
            textAlign: 'center',
            marginTop: spacing.sm,
            ...typography.body,
            color: colors.textMuted,
          }}
        >
          Add a few vendors in Supabase to see them featured here.
        </Text>
      </View>
    );
  }

  const query = search.trim().toLowerCase();

  const classifyCategory = (item: VendorListItem): CategoryFilter => {
    if (item.type === 'venue') return 'venues';

    const name = (item.name ?? '').toLowerCase();

    if (name.includes('venue') || name.includes('hall') || name.includes('hotel')) {
      return 'venues';
    }

    if (name.includes('cater') || name.includes('food') || name.includes('chef')) {
      return 'catering';
    }

    if (name.includes('photo') || name.includes('video') || name.includes('film')) {
      return 'photography';
    }

    return 'other';
  };

  const getPriceValue = (priceRange?: string | null): number => {
    if (!priceRange) return Number.MAX_SAFE_INTEGER;
    const match = priceRange.match(/\d+/);
    return match ? parseInt(match[0], 10) : Number.MAX_SAFE_INTEGER;
  };

  const filtered = useMemo(() => {
    return data.filter((item) => {
      const name = (item.name ?? '').toLowerCase();
      const matchesSearch = !query || name.includes(query);

      const matchesRating =
        minRating == null || (typeof item.rating === 'number' && item.rating >= minRating);

      const matchesPrice = !onlyWithPrice || !!item.price_range;

      const itemCategory = classifyCategory(item);
      const matchesCategory = category === 'all' || category === itemCategory;

      return matchesSearch && matchesRating && matchesPrice && matchesCategory;
    });
  }, [data, query, minRating, onlyWithPrice, category]);

  const sorted = useMemo(() => {
    if (sortBy === 'default') return filtered;

    return [...filtered].sort((a, b) => {
      if (sortBy === 'rating-desc') {
        const ar = typeof a.rating === 'number' ? a.rating : 0;
        const br = typeof b.rating === 'number' ? b.rating : 0;
        return br - ar;
      }

      if (sortBy === 'reviews-desc') {
        const ac = typeof a.review_count === 'number' ? a.review_count : 0;
        const bc = typeof b.review_count === 'number' ? b.review_count : 0;
        return bc - ac;
      }

      if (sortBy === 'price-asc') {
        return getPriceValue(a.price_range) - getPriceValue(b.price_range);
      }

      return 0;
    });
  }, [filtered, sortBy]);

  useEffect(() => {
    let isMounted = true;
    if (!user?.id) {
      setFavouriteIds({ vendorIds: [], venueIds: [] });
      return () => {
        isMounted = false;
      };
    }
    getFavourites(user).then((result) => {
      if (isMounted) setFavouriteIds(result);
    });
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const handleToggleFavourite = async (id: number, type: 'vendor' | 'venue' = 'vendor') => {
    if (!user?.id) {
      return;
    }
    const next = await toggleFavourite(user, id, type);
    setFavouriteIds(next);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xl }}
    >
      <Text
        style={{
          ...typography.displayMedium,
          color: colors.textPrimary,
          marginBottom: spacing.xs,
        }}
      >
        Browse Vendors
      </Text>
      <Text
        style={{
          ...typography.body,
          color: colors.textSecondary,
          marginBottom: spacing.lg,
        }}
      >
        Explore a curated list of venues, caterers, and services for your event.
      </Text>

      <View style={{ flexDirection: 'row', columnGap: spacing.sm, marginBottom: spacing.lg }}>
        {[{ label: 'Filter' }, { label: 'Sort' }, { label: 'Map' }].map((item) => (
          <TouchableOpacity
            key={item.label}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: '#D1D5DB',
              borderRadius: radii.md,
              paddingVertical: spacing.sm,
              alignItems: 'center',
              backgroundColor: colors.surface,
            }}
          >
            <Text style={{ ...typography.caption, color: colors.textSecondary }}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Search */}
      <View
        style={{
          marginBottom: spacing.md,
          borderRadius: radii.md,
          borderWidth: 1,
          borderColor: '#D1D5DB',
          backgroundColor: colors.surface,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.md,
        }}
      >
        <MaterialIcons
          name="search"
          size={20}
          color={colors.textSecondary}
          style={{ marginRight: spacing.sm }}
        />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search vendors by name"
          placeholderTextColor={colors.textMuted}
          style={{ flex: 1, paddingVertical: spacing.sm, color: colors.textPrimary }}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Filters */}
      <View style={{ marginBottom: spacing.lg }}>
        {/* Category filter */}
        <Text
          style={{
            ...typography.caption,
            color: colors.textMuted,
            marginBottom: spacing.xs,
          }}
        >
          Category
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.sm, columnGap: spacing.sm }}>
          {[
            { key: 'all' as CategoryFilter, label: 'All' },
            { key: 'venues' as CategoryFilter, label: 'Venues' },
            { key: 'catering' as CategoryFilter, label: 'Catering' },
            { key: 'photography' as CategoryFilter, label: 'Photography' },
            { key: 'other' as CategoryFilter, label: 'Other' },
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
                <Text
                  style={{
                    ...typography.caption,
                    color: selected ? '#FFFFFF' : colors.textPrimary,
                  }}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Rating filter */}
        <Text
          style={{
            ...typography.caption,
            color: colors.textMuted,
            marginTop: spacing.md,
            marginBottom: spacing.xs,
          }}
        >
          Filter by rating
        </Text>
        <View style={{ flexDirection: 'row', columnGap: spacing.sm }}>
          {[
            { label: 'Any', value: null },
            { label: '4.0+', value: 4 },
            { label: '3.5+', value: 3.5 },
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
                <Text
                  style={{
                    ...typography.caption,
                    color: selected ? '#FFFFFF' : colors.textPrimary,
                  }}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Other filter toggles */}
        <View style={{ marginTop: spacing.sm, flexDirection: 'row' }}>
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
            <Text
              style={{
                ...typography.caption,
                color: onlyWithPrice ? '#FFFFFF' : colors.textPrimary,
              }}
            >
              Show only with price
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sort options */}
        <View style={{ marginTop: spacing.md }}>
          <Text
            style={{
              ...typography.caption,
              color: colors.textMuted,
              marginBottom: spacing.xs,
            }}
          >
            Sort by
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.sm, columnGap: spacing.sm }}>
            {[ 
              { key: 'default' as SortBy, label: 'Default' },
              { key: 'rating-desc' as SortBy, label: 'Highest rating' },
              { key: 'reviews-desc' as SortBy, label: 'Most reviews' },
              { key: 'price-asc' as SortBy, label: 'Price: low to high' },
            ].map((option) => {
              const selected = sortBy === option.key;
              return (
                <TouchableOpacity
                  key={option.key}
                  onPress={() => setSortBy(option.key)}
                  style={{
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.xs,
                    borderRadius: radii.full,
                    borderWidth: 1,
                    borderColor: selected ? colors.primary : colors.borderSubtle,
                    backgroundColor: selected ? colors.primary : colors.surface,
                  }}
                >
                  <Text
                    style={{
                      ...typography.caption,
                      color: selected ? '#FFFFFF' : colors.textPrimary,
                    }}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.md }}>
        Showing {sorted.length} vendors
      </Text>

      {sorted.length === 0 ? (
        <View style={{ paddingVertical: spacing.lg }}>
          <Text style={{ ...typography.body, color: colors.textMuted }}>
            No vendors match your search and filters yet.
          </Text>
        </View>
      ) : (
        sorted.map((item) => (
          <TouchableOpacity
            key={`${item.type}-${item.id}`}
            activeOpacity={0.9}
            onPress={() =>
              navigation.navigate('Home', {
                screen: item.type === 'venue' ? 'VenueProfile' : 'VendorProfile',
                params: item.type === 'venue' ? { venueId: item.id } : { vendorId: item.id },
              })
            }
            style={{ marginBottom: spacing.md }}
          >
            <View
              style={{
                borderRadius: radii.lg,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                overflow: 'hidden',
                shadowColor: '#000',
                shadowOpacity: 0.08,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 3 },
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
                      handleToggleFavourite(item.id, item.type);
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
                      handleToggleFavourite(item.id, item.type);
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
              )}
              <View style={{ padding: spacing.md }}>
                <Text
                  style={{
                    ...typography.titleMedium,
                    color: colors.textPrimary,
                    marginBottom: spacing.xs,
                  }}
                >
                  {item.name ?? 'Untitled'}
                </Text>
                {item.type === 'venue' && (
                   <Text style={{ ...typography.caption, color: colors.primaryTeal, marginBottom: spacing.xs }}>Venue</Text>
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
                  <Text
                    style={{
                      ...typography.caption,
                      color: colors.textSecondary,
                      marginRight: spacing.xs,
                    }}
                  >
                    ★
                  </Text>
                  <Text style={{ ...typography.caption, color: colors.textSecondary }}>
                    {typeof item.rating === 'number' ? item.rating.toFixed(1) : 'No rating yet'}
                    {typeof item.review_count === 'number' && item.review_count > 0
                      ? ` (${item.review_count})`
                      : ''}
                  </Text>
                </View>
                {item.price_range && (
                  <Text style={{ ...typography.caption, color: colors.textSecondary }}>
                    {item.price_range}
                  </Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}
