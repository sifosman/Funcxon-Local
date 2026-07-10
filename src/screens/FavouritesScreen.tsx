import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../theme';
import { useIsDesktop } from '../hooks/useIsDesktop';
import { supabase } from '../lib/supabaseClient';
import { getFavourites, getShortlists, toggleFavourite, updateShortlistNotes } from '../lib/favourites';
import type { VendorListItem } from './AttendeeHomeScreen';
import { useAuth } from '../auth/AuthContext';
import NetworkImage from '../components/NetworkImage';
import { formatCardAddress } from '../utils/location';

export default function FavouritesScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const isDesktop = useIsDesktop();

  const cardImageHeight = Math.max(120, Math.round(Dimensions.get('window').height / 2.5 - 220));
  const [favouriteIds, setFavouriteIds] = useState<{ vendorIds: number[], venueIds: number[] }>({ vendorIds: [], venueIds: [] });
  const [loadingIds, setLoadingIds] = useState(true);
  const [noteDrafts, setNoteDrafts] = useState<Record<number, string>>({});
  const [savingNotes, setSavingNotes] = useState<Record<number, boolean>>({});
  const scrollViewRef = useRef<ScrollView>(null);
  const lastOffsetRef = useRef(0);
  const pendingRestoreRef = useRef(false);

  const loadFavourites = useCallback(async () => {
    setLoadingIds(true);
    const result = await getFavourites(user);
    setFavouriteIds(result);
    setLoadingIds(false);
  }, [user]);

  const {
    data: shortlistEntries,
    isLoading: shortlistsLoading,
    error: shortlistsError,
    refetch: refetchShortlists,
  } = useQuery({
    queryKey: ['shortlists', user?.id],
    queryFn: () => getShortlists(user),
    enabled: !!user?.id,
  });

  useFocusEffect(
    useCallback(() => {
      loadFavourites();
      refetchShortlists();
    }, [loadFavourites, refetchShortlists]),
  );

  const {
    data: favouriteItems,
    isLoading,
    error,
    refetch,
  } = useQuery<VendorListItem[]>({
    queryKey: ['favourites-items', user?.id, favouriteIds],
    queryFn: async () => {
      if (!user?.id || (favouriteIds.vendorIds.length === 0 && favouriteIds.venueIds.length === 0)) return [];
      
      const items: VendorListItem[] = [];

      if (favouriteIds.vendorIds.length > 0) {
        const { data: vendors, error: vendorError } = await supabase
          .from('vendors')
          .select('id, name, price_range, rating, review_count, image_url, description, city, province, address_line_1, location')
          .in('id', favouriteIds.vendorIds);

        if (vendorError) throw vendorError;

        if (vendors) {
          items.push(...vendors.map(v => ({ ...v, type: 'vendor' as const })));
        }
      }

      if (favouriteIds.venueIds.length > 0) {
        const { data: venues, error: venueError } = await supabase
          .from('venue_listings')
          .select('id, name, rating, image_url, description, city, province, address_line_1, location')
          .in('id', favouriteIds.venueIds);

        if (venueError) throw venueError;

        if (venues) {
          items.push(...venues.map(v => ({
            id: v.id,
            name: v.name,
            price_range: null,
            rating: v.rating,
            review_count: 0,
            image_url: v.image_url,
            description: v.description,
            province: v.province,
            city: v.city,
            location: v.location,
            address_line_1: v.address_line_1 ?? null,
            category_id: null,
            type: 'venue' as const
          })));
        }
      }

      return items;
    },
    enabled: !!user?.id && (favouriteIds.vendorIds.length > 0 || favouriteIds.venueIds.length > 0),
  });

  const hasFavourites = favouriteIds.vendorIds.length > 0 || favouriteIds.venueIds.length > 0;

  useEffect(() => {
    if (pendingRestoreRef.current && !loadingIds && !isLoading && !shortlistsLoading && favouriteItems) {
      pendingRestoreRef.current = false;
      requestAnimationFrame(() => {
        scrollViewRef.current?.scrollTo({ y: lastOffsetRef.current, animated: false });
      });
    }
  }, [loadingIds, isLoading, shortlistsLoading, favouriteItems]);

  const handleRemove = async (id: number, type: 'vendor' | 'venue') => {
    if (!user?.id) return;
    const next = await toggleFavourite(user, id, type);
    setFavouriteIds(next);
  };


  const handleNoteChange = (shortlistId: number, value: string) => {
    setNoteDrafts((prev) => ({ ...prev, [shortlistId]: value }));
  };

  const handleSaveNotes = async (shortlistId: number, currentNotes: string | null) => {
    if (!user?.id) return;
    const draft = (noteDrafts[shortlistId] ?? currentNotes ?? '').trim();
    const nextNotes = draft.length > 0 ? draft : null;
    setSavingNotes((prev) => ({ ...prev, [shortlistId]: true }));
    try {
      await updateShortlistNotes(user, shortlistId, nextNotes);
      await refetchShortlists();
      setNoteDrafts((prev) => ({ ...prev, [shortlistId]: nextNotes ?? '' }));
    } finally {
      setSavingNotes((prev) => ({ ...prev, [shortlistId]: false }));
    }
  };

  const renderCard = (item: VendorListItem) => {
    const shortlistEntry = shortlistEntries?.find((entry) => {
      const entryId = item.type === 'venue' ? entry.venueId : entry.vendorId;
      return entryId != null && Number(entryId) === Number(item.id);
    });
    const shortlistId = shortlistEntry?.id;
    const noteValue = shortlistId != null
      ? noteDrafts[shortlistId] ?? shortlistEntry?.notes ?? ''
      : '';
    const hasNoteChange = shortlistId != null && noteValue.trim() !== (shortlistEntry?.notes ?? '').trim();
    const isSaving = shortlistId != null ? !!savingNotes[shortlistId] : false;
    return (
      <View
        key={`${item.type}-${item.id}`}
        style={{
          borderRadius: radii.lg,
          backgroundColor: isDesktop ? colors.surfaceContainerLowest : colors.surface,
          borderWidth: 1,
          borderColor: isDesktop ? colors.outlineVariant : colors.borderSubtle,
          overflow: 'hidden',
          width: isDesktop ? 'calc(33.333% - 16px)' : '100%',
        } as any}
      >
        <NetworkImage
          uri={item.image_url}
          style={{ width: '100%', height: isDesktop ? 200 : cardImageHeight }}
        />
        <TouchableOpacity
          onPress={() => handleRemove(item.id, item.type)}
          style={{
            position: 'absolute',
            top: spacing.sm,
            right: spacing.sm,
            width: 36,
            height: 36,
            borderRadius: 8,
            backgroundColor: '#EF4444',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialIcons name="delete" size={18} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ padding: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, paddingRight: spacing.md }}>
              <Text style={isDesktop ? { ...typography.headlineSm, color: colors.textPrimary } : { ...typography.titleMedium, color: colors.textPrimary }}>
                {item.name ?? 'Untitled'}
              </Text>
              {item.description ? (
                <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textMuted, marginTop: spacing.xs } : { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs }} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}
              {item.type === 'venue' && (
                 <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textPrimary, marginTop: 4 } : { ...typography.caption, color: colors.textPrimary, marginTop: 4 }}>Venue</Text>
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialIcons name="star" size={14} color="#F59E0B" />
              <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textSecondary, marginLeft: spacing.xs } : { ...typography.caption, color: colors.textSecondary, marginLeft: spacing.xs }}>
                {typeof item.rating === 'number' ? item.rating.toFixed(1) : 'No rating yet'}
                {typeof item.review_count === 'number' && item.review_count > 0
                  ? ` (${item.review_count})`
                  : ''}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs }}>
            <MaterialIcons name="place" size={16} color={colors.textSecondary} />
            <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textSecondary, marginLeft: spacing.xs, flex: 1 } : { ...typography.caption, color: colors.textSecondary, marginLeft: spacing.xs, flex: 1 }} numberOfLines={2}>
              {formatCardAddress(item)}
            </Text>
          </View>
          {shortlistId != null ? (
            <View
              style={{
                marginTop: spacing.md,
                padding: spacing.md,
                borderRadius: radii.md,
                backgroundColor: isDesktop ? colors.surfaceContainerLow : colors.surfaceMuted,
                borderWidth: 1,
                borderColor: isDesktop ? colors.outlineVariant : colors.borderSubtle,
              }}
            >
              <Text style={isDesktop ? { ...typography.labelMd, color: colors.textSecondary } : { ...typography.captionSemiBold, color: colors.textSecondary }}>
                Your Notes:
              </Text>
              <TextInput
                value={noteValue}
                onChangeText={(value) => handleNoteChange(shortlistId, value)}
                placeholder={`Add a note about this ${item.type}`}
                placeholderTextColor={colors.textMuted}
                multiline
                style={{
                  marginTop: spacing.xs,
                  padding: spacing.sm,
                  borderRadius: radii.sm,
                  borderWidth: 1,
                  borderColor: isDesktop ? colors.outlineVariant : colors.borderSubtle,
                  backgroundColor: isDesktop ? colors.surfaceContainerLowest : colors.surface,
                  minHeight: 64,
                  textAlignVertical: 'top',
                  color: colors.textPrimary,
                }}
              />
              <TouchableOpacity
                onPress={() => handleSaveNotes(shortlistId, shortlistEntry?.notes ?? null)}
                disabled={!hasNoteChange || isSaving}
                style={{
                  marginTop: spacing.sm,
                  paddingVertical: spacing.sm,
                  borderRadius: radii.md,
                  alignItems: 'center',
                  backgroundColor: hasNoteChange && !isSaving ? colors.cta : colors.surfaceMuted,
                }}
              >
                <Text style={{ ...typography.caption, color: hasNoteChange && !isSaving ? '#FFFFFF' : colors.textMuted }}>
                  {isSaving ? 'Saving...' : 'Save Notes'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
          <TouchableOpacity
            onPress={() => {
              pendingRestoreRef.current = true;
              navigation.navigate('Home', {
                screen: item.type === 'venue' ? 'VenueProfile' : 'VendorProfile',
                params: item.type === 'venue'
                  ? { venueId: item.id, from: 'Favourites' }
                  : { vendorId: item.id, from: 'Favourites' },
              });
            }}
            style={{
              marginTop: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: radii.md,
              borderWidth: 1,
              borderColor: isDesktop ? colors.outlineVariant : colors.borderSubtle,
              alignItems: 'center',
              backgroundColor: isDesktop ? colors.surfaceContainerLowest : colors.surface,
            }}
          >
            <Text style={isDesktop ? { ...typography.labelMd, color: colors.textPrimary } : { ...typography.bodySemiBold, color: colors.textPrimary }}>
              View Details
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: isDesktop ? colors.surfaceBg : colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? spacing.lg : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        scrollEventThrottle={16}
        onScroll={(e) => {
          lastOffsetRef.current = e.nativeEvent.contentOffset.y;
        }}
        contentContainerStyle={isDesktop ? { flexGrow: 1, paddingHorizontal: 48, paddingTop: spacing.sm, paddingBottom: spacing.xl, maxWidth: 1200, width: '100%', alignSelf: 'center' } : { flexGrow: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xl }}
      >
        {isDesktop ? (
          <View style={{ marginBottom: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View>
              <Text style={{ ...typography.labelMd, color: colors.dustyRose, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.05 }}>
                Saved
              </Text>
              <Text style={{ ...typography.headlineMd, color: colors.primary }}>
                My Favourites
              </Text>
            </View>
            <View
              style={{
                borderRadius: radii.full,
                backgroundColor: colors.surfaceContainerLowest,
                borderWidth: 1,
                borderColor: colors.outlineVariant,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs,
              }}
            >
              <Text style={{ ...typography.labelMd, color: colors.textSecondary }}>
                All ({favouriteItems?.length ?? 0})
              </Text>
            </View>
          </View>
        ) : (
          <Text style={{ ...typography.displayMedium, color: colors.textPrimary, marginBottom: spacing.lg }}>
            My Favourites
          </Text>
        )}

        {loadingIds || isLoading || shortlistsLoading ? (
          <View style={{ paddingVertical: spacing.xl, alignItems: 'center' }}>
            <ActivityIndicator />
          </View>
        ) : null}

        {(error instanceof Error || shortlistsError instanceof Error) && (
          <View style={{ paddingVertical: spacing.lg }}>
            <Text style={isDesktop ? { ...typography.headlineSm, color: colors.textPrimary } : { ...typography.titleMedium, color: colors.textPrimary }}>Unable to load favourites.</Text>
            <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textMuted, marginTop: spacing.xs } : { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs }}>
              {(error instanceof Error && error.message) || (shortlistsError instanceof Error && shortlistsError.message)}
            </Text>
            <TouchableOpacity
              onPress={() => {
                refetch();
                refetchShortlists();
              }}
              style={{ marginTop: spacing.md, alignSelf: 'flex-start' }}
            >
              <Text style={isDesktop ? { ...typography.labelMd, color: colors.textPrimary } : { ...typography.caption, color: colors.textPrimary }}>Try again</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loadingIds && !isLoading && !shortlistsLoading && hasFavourites && favouriteItems && (
          <View style={isDesktop ? { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.gutter } as any : { gap: spacing.md }}>
            {isDesktop ? null : (
              <View style={{ flexDirection: 'row', marginBottom: spacing.sm }}>
                <View
                  style={{
                    borderRadius: radii.full,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.xs,
                  }}
                >
                  <Text style={{ ...typography.caption, color: colors.textSecondary }}>
                    All ({favouriteItems.length})
                  </Text>
                </View>
              </View>
            )}
            {favouriteItems.map((item) => renderCard(item))}
          </View>
        )}

        {!loadingIds && !isLoading && !hasFavourites && (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: spacing.xxl,
              backgroundColor: isDesktop ? colors.surfaceContainerLowest : colors.surface,
              borderRadius: radii.lg,
              borderWidth: 1,
              borderColor: isDesktop ? colors.outlineVariant : colors.borderSubtle,
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colors.accent,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: spacing.lg,
              }}
            >
              <MaterialIcons name="favorite-border" size={40} color={colors.textPrimary} />
            </View>
            <Text
              style={{
                ...typography.titleMedium,
                color: colors.textPrimary,
                marginBottom: spacing.sm,
                textAlign: 'center',
              }}
            >
              No Favourites Yet
            </Text>
            <Text style={{ ...typography.body, color: colors.textMuted, textAlign: 'center', maxWidth: 300 }}>
              {user
                ? 'As you explore vendors, tap the heart icon to add them to your favourites.'
                : 'Sign in to save vendors to your favourites list.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
