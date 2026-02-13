import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../theme';
import { supabase } from '../lib/supabaseClient';
import { getFavourites, getShortlists, toggleFavourite, updateShortlistNotes } from '../lib/favourites';
import type { VendorListItem } from './AttendeeHomeScreen';
import { useAuth } from '../auth/AuthContext';

export default function FavouritesScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [favouriteIds, setFavouriteIds] = useState<{ vendorIds: number[], venueIds: number[] }>({ vendorIds: [], venueIds: [] });
  const [loadingIds, setLoadingIds] = useState(true);
  const [noteDrafts, setNoteDrafts] = useState<Record<number, string>>({});
  const [savingNotes, setSavingNotes] = useState<Record<number, boolean>>({});

  const loadFavourites = useCallback(async () => {
    setLoadingIds(true);
    const result = await getFavourites(user);
    setFavouriteIds(result);
    setLoadingIds(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadFavourites();
    }, [loadFavourites]),
  );

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
          .select('id, name, price_range, rating, review_count, image_url, description, city, province')
          .in('id', favouriteIds.vendorIds);
          
        if (vendorError) throw vendorError;
        
        if (vendors) {
          items.push(...vendors.map(v => ({ ...v, type: 'vendor' as const })));
        }
      }

      if (favouriteIds.venueIds.length > 0) {
        const { data: venues, error: venueError } = await supabase
          .from('venue_listings')
          .select('id, name, rating, image_url, description, city, province')
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.xl }}>
        <Text style={{ ...typography.displayMedium, color: colors.textPrimary, marginBottom: spacing.lg }}>
          My Favourites
        </Text>

        {loadingIds || isLoading || shortlistsLoading ? (
          <View style={{ paddingVertical: spacing.xl, alignItems: 'center' }}>
            <ActivityIndicator />
          </View>
        ) : null}

        {(error instanceof Error || shortlistsError instanceof Error) && (
          <View style={{ paddingVertical: spacing.lg }}>
            <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>Unable to load favourites.</Text>
            <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.xs }}>
              {(error instanceof Error && error.message) || (shortlistsError instanceof Error && shortlistsError.message)}
            </Text>
            <TouchableOpacity
              onPress={() => {
                refetch();
                refetchShortlists();
              }}
              style={{ marginTop: spacing.md, alignSelf: 'flex-start' }}
            >
              <Text style={{ ...typography.caption, color: colors.primaryTeal }}>Try again</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loadingIds && !isLoading && !shortlistsLoading && hasFavourites && favouriteItems && (
          <View style={{ gap: spacing.md }}>
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
            {favouriteItems.map((item) => (
              (() => {
                const shortlistEntry = shortlistEntries?.find((entry) => 
                  item.type === 'venue' ? entry.venueId === item.id : entry.vendorId === item.id
                );
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
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  overflow: 'hidden',
                }}
              >
                {item.image_url ? (
                  <Image source={{ uri: item.image_url }} style={{ width: '100%', height: 160 }} />
                ) : (
                  <View
                    style={{
                      width: '100%',
                      height: 160,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: colors.surfaceMuted,
                    }}
                  >
                    <Text style={{ ...typography.caption, color: colors.textMuted }}>No image</Text>
                  </View>
                )}
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
                      <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>
                        {item.name ?? 'Untitled'}
                      </Text>
                      {item.description ? (
                        <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.xs }} numberOfLines={2}>
                          {item.description}
                        </Text>
                      ) : null}
                      {item.type === 'venue' && (
                         <Text style={{ ...typography.caption, color: colors.primaryTeal, marginTop: 4 }}>Venue</Text>
                      )}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <MaterialIcons name="star" size={14} color="#F59E0B" />
                      <Text style={{ ...typography.caption, color: colors.textSecondary, marginLeft: spacing.xs }}>
                        {typeof item.rating === 'number' ? item.rating.toFixed(1) : 'No rating yet'}
                        {typeof item.review_count === 'number' && item.review_count > 0
                          ? ` (${item.review_count})`
                          : ''}
                      </Text>
                    </View>
                  </View>
                  {shortlistId != null ? (
                    <View
                      style={{
                        marginTop: spacing.md,
                        padding: spacing.md,
                        borderRadius: radii.md,
                        backgroundColor: colors.surfaceMuted,
                      }}
                    >
                      <Text style={{ ...typography.caption, color: colors.textSecondary, fontWeight: '600' }}>
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
                          borderColor: colors.borderSubtle,
                          backgroundColor: colors.surface,
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
                          backgroundColor: hasNoteChange && !isSaving ? colors.primaryTeal : colors.surfaceMuted,
                        }}
                      >
                        <Text style={{ ...typography.caption, color: hasNoteChange && !isSaving ? '#FFFFFF' : colors.textMuted }}>
                          {isSaving ? 'Saving...' : 'Save Notes'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('Home', {
                        screen: item.type === 'venue' ? 'VenueProfile' : 'VendorProfile',
                        params: item.type === 'venue' 
                          ? { venueId: item.id, from: 'Favourites' }
                          : { vendorId: item.id, from: 'Favourites' },
                      })
                    }
                    style={{
                      marginTop: spacing.md,
                      paddingVertical: spacing.sm,
                      borderRadius: radii.md,
                      borderWidth: 1,
                      borderColor: colors.borderSubtle,
                      alignItems: 'center',
                      backgroundColor: colors.surface,
                    }}
                  >
                    <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
                      View Details
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
                );
              })()
            ))}
          </View>
        )}

        {!loadingIds && !isLoading && !hasFavourites && (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: spacing.xxl,
              backgroundColor: colors.surface,
              borderRadius: radii.lg,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
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
              <MaterialIcons name="favorite-border" size={40} color={colors.primaryTeal} />
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
            <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Discover', { category: 'venues' })}
                style={{
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.sm,
                  borderRadius: radii.md,
                  backgroundColor: colors.primary,
                }}
              >
                <Text style={{ ...typography.body, color: '#FFFFFF', fontWeight: '600', textAlign: 'center' }}>Discover Venues</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Discover', { category: 'all' })}
                style={{
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.sm,
                  borderRadius: radii.md,
                  backgroundColor: colors.primary,
                }}
              >
                <Text style={{ ...typography.body, color: '#FFFFFF', fontWeight: '600', textAlign: 'center' }}>Discover Vendors</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Discover', { category: 'all' })}
                style={{
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.sm,
                  borderRadius: radii.md,
                  backgroundColor: colors.primary,
                }}
              >
                <Text style={{ ...typography.body, color: '#FFFFFF', fontWeight: '600', textAlign: 'center' }}>Discover Service Professionals</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
