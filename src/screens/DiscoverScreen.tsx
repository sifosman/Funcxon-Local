import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '../lib/supabaseClient';
import { colors, spacing, radii, typography } from '../theme';
import type { VendorListItem } from './AttendeeHomeScreen';

type CategoryFilter = 'all' | 'venues' | 'catering' | 'photography' | 'other';
type SortBy = 'default' | 'rating-desc' | 'reviews-desc' | 'price-asc';

type TagCategory = {
  id: number;
  name: string;
  slug: string;
  vendor_type: string;
  parent_category_id: number | null;
};

export default function DiscoverScreen() {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const [minRating, setMinRating] = useState<number | null>(null);
  const [onlyWithPrice, setOnlyWithPrice] = useState(false);
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('default');
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [showTagFilters, setShowTagFilters] = useState(false);

  // Fetch tag categories for filtering
  const { data: tagCategories } = useQuery<TagCategory[]>({
    queryKey: ['tag_categories_filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tag_categories')
        .select('id, name, slug, vendor_type, parent_category_id')
        .eq('is_active', true)
        .not('parent_category_id', 'is', null)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as TagCategory[];
    },
  });

  const { data, isLoading, error } = useQuery<VendorListItem[]>({
    queryKey: ['discover-vendors', selectedTags],
    queryFn: async () => {
      let query = supabase
        .from('vendors')
        .select('id, name, price_range, rating, review_count, image_url')
        .limit(30);

      // Filter by tags if any selected
      if (selectedTags.length > 0) {
        const { data: taggedVendors, error: tagError } = await supabase
          .from('vendor_tags')
          .select('vendor_id')
          .in('tag_category_id', selectedTags);

        if (tagError) throw tagError;

        const vendorIds = [...new Set(taggedVendors.map((t) => t.vendor_id))];
        if (vendorIds.length > 0) {
          query = query.in('id', vendorIds);
        } else {
          return [];
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data as VendorListItem[]) ?? [];
    },
  });

  const query = search.trim().toLowerCase();

  const classifyCategory = (item: VendorListItem): CategoryFilter => {
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
    if (!data) return [];
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

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, paddingBottom: spacing.xl }}
    >
      <Text
        style={{
          ...typography.displayMedium,
          color: colors.textPrimary,
          marginBottom: spacing.sm,
        }}
      >
        Discover
      </Text>
      <Text
        style={{
          ...typography.body,
          color: colors.textSecondary,
          marginBottom: spacing.lg,
        }}
      >
        Explore a curated list of venues, caterers, and services to inspire your event.
      </Text>
      {/* Search */}
      <View
        style={{
          marginBottom: spacing.md,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
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
        <View style={{ marginTop: spacing.sm, flexDirection: 'row', gap: spacing.sm }}>
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

          <TouchableOpacity
            onPress={() => setShowTagFilters((prev) => !prev)}
            style={{
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.xs,
              borderRadius: radii.full,
              borderWidth: 1,
              borderColor: showTagFilters ? colors.primary : colors.borderSubtle,
              backgroundColor: showTagFilters ? colors.primary : colors.surface,
            }}
          >
            <Text
              style={{
                ...typography.caption,
                color: showTagFilters ? '#FFFFFF' : colors.textPrimary,
              }}
            >
              🏷️ Tags {selectedTags.length > 0 ? `(${selectedTags.length})` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tag Filters (expandable) */}
        {showTagFilters && tagCategories && tagCategories.length > 0 && (
          <View
            style={{
              marginTop: spacing.md,
              padding: spacing.md,
              borderRadius: radii.lg,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
            }}
          >
            <Text
              style={{
                ...typography.titleMedium,
                color: colors.textPrimary,
                marginBottom: spacing.sm,
              }}
            >
              Filter by Tags
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {tagCategories.slice(0, 20).map((tag) => {
                const isSelected = selectedTags.includes(tag.id);
                return (
                  <TouchableOpacity
                    key={tag.id}
                    onPress={() => {
                      setSelectedTags((prev) =>
                        isSelected ? prev.filter((id) => id !== tag.id) : [...prev, tag.id]
                      );
                    }}
                    style={{
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.xs,
                      borderRadius: radii.full,
                      borderWidth: 1,
                      borderColor: isSelected ? colors.primary : colors.borderSubtle,
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                    }}
                  >
                    <Text
                      style={{
                        ...typography.caption,
                        color: isSelected ? '#FFFFFF' : colors.textPrimary,
                      }}
                    >
                      {tag.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {selectedTags.length > 0 && (
              <TouchableOpacity
                onPress={() => setSelectedTags([])}
                style={{ marginTop: spacing.sm }}
              >
                <Text style={{ ...typography.caption, color: colors.primary }}>
                  Clear all tags
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

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

      {sorted.length === 0 ? (
        <View style={{ paddingVertical: spacing.lg }}>
          <Text style={{ ...typography.body, color: colors.textMuted }}>
            No vendors match your search and filters yet.
          </Text>
        </View>
      ) : (
        sorted.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.9}
            onPress={() =>
              navigation.navigate('Home', {
                screen: 'VendorProfile',
                params: { vendorId: item.id },
              })
            }
            style={{ marginBottom: spacing.md }}
          >
            <View
              style={{
                borderRadius: radii.xl,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                overflow: 'hidden',
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
