import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, Image, Linking, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WebView } from 'react-native-webview';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { supabase } from '../lib/supabaseClient';
import type { AttendeeStackParamList } from '../navigation/AttendeeNavigator';
import { colors, spacing, radii, typography } from '../theme';
import { getFavourites, toggleFavourite } from '../lib/favourites';
import { useAuth } from '../auth/AuthContext';
import { PrimaryButton } from '../components/ui';

let RNMaps: any = null;
let mapsAvailable = false;
if (Platform.OS !== 'web') {
  try {
    RNMaps = require('react-native-maps');
    mapsAvailable = !!RNMaps?.default;
  } catch (e) {
    console.warn('react-native-maps not available:', e);
  }
}

type Props = NativeStackScreenProps<AttendeeStackParamList, 'VenueProfile'>;

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

type VenueRecord = {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  city: string | null;
  province: string | null;
  location: string | null;
  venue_capacity: string | null;
  venue_type: string | null;
  amenities: string[] | null;
  event_types: string[] | null;
  website_url: string | null;
  instagram_url: string | null;
  whatsapp_number: string | null;
  contact_email: string | null;
  additional_photos: string[] | null;
  subscription_status: string | null;
  subscription_plan: string | null;
  features: Record<string, any> | null;
};

 type VenueReview = {
   id: number;
   rating: number;
   title: string | null;
   review_text: string | null;
   is_verified: boolean | null;
   created_at: string | null;
   status: string | null;
 };

export default function VenueProfileScreen({ route, navigation }: Props) {
  const { venueId } = route.params;
  const [activeTab, setActiveTab] = useState<'about' | 'amenities' | 'reviews' | 'calendar'>('about');
  const [favouriteIds, setFavouriteIds] = useState<{ vendorIds: number[]; venueIds: number[] }>({
    vendorIds: [],
    venueIds: [],
  });
  const { user } = useAuth();

  const cameFromFavourites = route.params?.from === 'Favourites';

  const handleBackNavigation = useCallback(() => {
    if (cameFromFavourites) {
      const tabNav = navigation.getParent();
      navigation.popToTop();
      tabNav?.navigate('Favourites' as never);
      return;
    }

    navigation.goBack();
  }, [cameFromFavourites, navigation]);

  useEffect(() => {
    if (!cameFromFavourites) return;

    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={handleBackNavigation}
          style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 }}
        >
          <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      ),
    });
  }, [cameFromFavourites, handleBackNavigation, navigation]);

  useFocusEffect(
    useCallback(() => {
      if (!cameFromFavourites) return;

      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        handleBackNavigation();
        return true;
      });

      return () => sub.remove();
    }, [cameFromFavourites, handleBackNavigation]),
  );

  const {
    data: venue,
    isLoading: venueLoading,
    error: venueError,
  } = useQuery<VenueRecord>({
    queryKey: ['venue', venueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venue_listings')
        .select('*')
        .eq('id', venueId)
        .single();

      if (error) {
        throw error;
      }

      return data as VenueRecord;
    },
  });

  const {
    data: reviews,
    isLoading: reviewsLoading,
    error: reviewsError,
  } = useQuery<VenueReview[]>({
    queryKey: ['venue-reviews', venueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('venue_reviews')
        .select('id, rating, title, review_text, is_verified, created_at, status')
        .eq('venue_id', venueId)
        .or('status.is.null,status.eq.approved')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      return (data as VenueReview[]) ?? [];
    },
    enabled: typeof venueId === 'number',
  });

  const {
    data: canLeaveReview,
    isLoading: eligibilityLoading,
  } = useQuery<boolean>({
    queryKey: ['venue-review-eligibility', venueId, user?.id],
    enabled: typeof venueId === 'number' && !!user?.id,
    queryFn: async () => {
      if (!user?.id) return false;

      const { count: quoteCount, error: quoteError } = await supabase
        .from('venue_quote_requests')
        .select('id', { count: 'exact', head: true })
        .eq('listing_id', venueId)
        .eq('requester_user_id', user.id)
        .in('status', ['accepted', 'finalised']);

      if (quoteError) throw quoteError;

      const { count: tourCount, error: tourError } = await supabase
        .from('venue_tour_bookings')
        .select('id', { count: 'exact', head: true })
        .eq('listing_id', venueId)
        .eq('requester_user_id', user.id)
        .in('status', ['accepted', 'finalised']);

      if (tourError) throw tourError;

      return (quoteCount ?? 0) > 0 || (tourCount ?? 0) > 0;
    },
  });

  const mapQuery = useMemo(() => {
    return venue?.location ?? `${venue?.city ?? ''}, ${venue?.province ?? ''}`;
  }, [venue?.location, venue?.city, venue?.province]);

  const galleryImages = useMemo(
    () => [venue?.image_url, ...(venue?.additional_photos ?? [])].filter(Boolean) as string[],
    [venue?.image_url, venue?.additional_photos],
  );

  const halls = useMemo(() => {
    const raw = (venue?.features as any)?.halls;
    if (!Array.isArray(raw)) return [] as Array<{ name: string; capacity: string }>;
    return raw
      .map((h: any) => ({ name: String(h?.name ?? ''), capacity: String(h?.capacity ?? '') }))
      .filter((h: any) => Boolean(h.name.trim()) || Boolean(h.capacity.trim()));
  }, [venue?.features]);

  const maxHallCapacity = useMemo(() => {
    const raw = (venue?.features as any)?.maxHallCapacity;
    return typeof raw === 'number' && Number.isFinite(raw) ? raw : null;
  }, [venue?.features]);

  // Feature checks
  const canBookTours = useMemo(() => {
    if (!venue?.features) return false;
    // Check for explicit flag or fallback to plan check if needed (though features column should be populated)
    return venue.features['instant_tour_bookings'] === true || 
           venue.features['tour_bookings'] === true; 
  }, [venue]);

  const canShowLinks = useMemo(() => {
    if (!venue?.features) return false;
    return venue.features['website_social_links'] === true || 
           venue.features['website_links'] === true;
  }, [venue]);

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

  const handleToggleFavourite = async () => {
    if (!venue || !user?.id) {
      if (!user?.id) {
        Alert.alert('Sign in required', 'Please sign in to save favourites.');
      }
      return;
    }
    const next = await toggleFavourite(user, venue.id, 'venue');
    setFavouriteIds(next);
  };

  const isFavourite = venue ? favouriteIds.venueIds.includes(venue.id) : false;

  const handleOpenMap = () => {
    if (!mapQuery) return;
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
    Linking.openURL(mapsUrl).catch(() => null);
  };

  const handleOpenUrl = (url?: string | null) => {
    if (!url) return;
    Linking.openURL(url).catch(() => null);
  };

  const whatsappUrl = venue?.whatsapp_number
    ? `https://wa.me/${venue.whatsapp_number.replace(/[^0-9]/g, '')}`
    : null;
  const emailUrl = venue?.contact_email ? `mailto:${venue.contact_email}` : null;
  const webMapEmbedUrl = mapQuery
    ? `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`
    : null;
  
  // Static map image for better mobile compatibility
  const staticMapUrl = mapQuery
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(mapQuery)}&zoom=14&size=640x480&scale=2&markers=color:red%7C${encodeURIComponent(mapQuery)}&key=AIzaSyBjd1KYtTaAzxzdw5ayGwwMu5Sex-gKQLI`
    : null;

  const handleRequestQuote = () => {
    if (!venue) return;
    navigation.navigate('QuoteRequest', { 
      vendorId: venue.id, 
      vendorName: venue.name,
      type: 'venue' // Pass type to differentiate
    });
  };

  if (venueLoading) {
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

  if (venueError instanceof Error) {
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
        <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>Failed to load venue.</Text>
        <Text style={{ marginTop: spacing.sm, ...typography.body, color: colors.textMuted }}>{venueError.message}</Text>
      </View>
    );
  }

  if (!venue) {
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
        <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>Venue not found.</Text>
      </View>
    );
  }

  const renderBulletSection = (title: string, items?: string[] | null) => {
    if (!items || items.length === 0) return null;
    return (
      <View style={{ marginBottom: spacing.md }}>
        <Text style={{ ...typography.body, color: colors.primaryTeal, fontWeight: '600', marginBottom: spacing.xs }}>
          {title}
        </Text>
        {items.map((item) => (
          <View key={item} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: colors.primaryTeal,
                marginRight: spacing.sm,
              }}
            />
            <Text style={{ ...typography.caption, color: colors.textPrimary }}>{item}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.lg }}
    >
      <TouchableOpacity
        onPress={handleBackNavigation}
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}
      >
        <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
        <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>
          Back
        </Text>
      </TouchableOpacity>

      {/* Header */}
      <View
        style={{
          marginBottom: spacing.lg,
          padding: spacing.lg,
          borderRadius: radii.xl,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: spacing.md }}>
            <Text style={{ ...typography.titleLarge, color: colors.textPrimary }}>{venue.name}</Text>
            {venue.venue_type && (
              <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: 4 }}>
                {venue.venue_type}
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={handleToggleFavourite}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.surface,
            }}
          >
            <MaterialIcons
              name={isFavourite ? 'favorite' : 'favorite-border'}
              size={24}
              color={isFavourite ? colors.primaryTeal : colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm }}>
          <MaterialIcons name="place" size={16} color={colors.textMuted} />
          <Text style={{ ...typography.body, color: colors.textSecondary, marginLeft: 6 }}>
            {[venue.city, venue.province].filter(Boolean).join(', ') || 'Location not specified'}
          </Text>
        </View>

        {venue.venue_capacity && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs }}>
            <MaterialIcons name="people" size={16} color={colors.textMuted} />
            <Text style={{ ...typography.body, color: colors.textSecondary, marginLeft: 6 }}>
              Up to {venue.venue_capacity} guests
            </Text>
          </View>
        )}

        {!venue.venue_capacity && maxHallCapacity && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs }}>
            <MaterialIcons name="people" size={16} color={colors.textMuted} />
            <Text style={{ ...typography.body, color: colors.textSecondary, marginLeft: 6 }}>
              Up to {maxHallCapacity} guests
            </Text>
          </View>
        )}
      </View>

      {/* Gallery */}
      <View
        style={{
          marginBottom: spacing.lg,
          borderRadius: radii.lg,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          overflow: 'hidden',
        }}
      >
        <View style={{ height: 220, backgroundColor: colors.surfaceMuted }}>
          {galleryImages[0] ? (
            <Image source={{ uri: galleryImages[0] }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <MaterialIcons name="image" size={48} color={colors.textMuted} />
              <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.sm }}>
                No images available
              </Text>
            </View>
          )}
        </View>
        {galleryImages.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ padding: spacing.md }}>
            {galleryImages.slice(1).map((imageUrl) => (
              <View key={imageUrl} style={{ marginRight: spacing.sm }}>
                <Image
                  source={{ uri: imageUrl }}
                  style={{ width: 80, height: 80, borderRadius: radii.md, backgroundColor: colors.surfaceMuted }}
                  resizeMode="cover"
                />
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Tabs */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: colors.surface,
          borderRadius: radii.full,
          padding: 4,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          marginBottom: spacing.lg,
        }}
      >
        {([
          { key: 'about', label: 'About' },
          { key: 'amenities', label: 'Amenities' },
          { key: 'reviews', label: 'Reviews' },
          { key: 'calendar', label: 'Calendar' },
        ] as const).map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                paddingVertical: spacing.sm,
                borderRadius: radii.full,
                backgroundColor: isActive ? colors.primaryTeal : 'transparent',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  ...typography.caption,
                  color: isActive ? '#FFFFFF' : colors.textMuted,
                  fontWeight: isActive ? '600' : '400',
                }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {activeTab === 'about' && (
        <View>
          {halls.length > 0 && (
            <View
              style={{
                marginBottom: spacing.lg,
                padding: spacing.lg,
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
                  marginBottom: spacing.md,
                }}
              >
                Halls & Capacities
              </Text>
              {halls.map((hall, idx) => (
                <View
                  key={`${hall.name}-${idx}`}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: spacing.sm,
                    gap: spacing.md,
                  }}
                >
                  <Text style={{ ...typography.body, color: colors.textPrimary, flex: 1 }}>
                    {hall.name || `Hall ${idx + 1}`}
                  </Text>
                  <Text style={{ ...typography.body, color: colors.textSecondary }}>
                    {hall.capacity}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* About */}
          {venue.description ? (
            <View
              style={{
                marginBottom: spacing.lg,
                padding: spacing.lg,
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
                About {venue.name}
              </Text>
              <Text style={{ ...typography.body, color: colors.textSecondary, lineHeight: 20 }}>{venue.description}</Text>
            </View>
          ) : (
             <View
              style={{
                marginBottom: spacing.lg,
                padding: spacing.lg,
                borderRadius: radii.lg,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
              }}
            >
              <Text style={{ ...typography.body, color: colors.textMuted }}>No description available.</Text>
            </View>
          )}

          {/* Features & Amenities */}
          {(venue.amenities?.length || venue.event_types?.length || venue.venue_type) ? (
            <View
              style={{
                marginBottom: spacing.lg,
                padding: spacing.lg,
                borderRadius: radii.lg,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
              }}
            >
              <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>
                Features & Amenities
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                <View style={{ width: '50%', paddingRight: spacing.sm }}>
                  {venue.venue_type && (
                    <View style={{ marginBottom: spacing.sm }}>
                      <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs }}>
                        Venue Type
                      </Text>
                      <Text style={{ ...typography.body, color: colors.textPrimary }}>{venue.venue_type}</Text>
                    </View>
                  )}
                  {venue.venue_capacity && (
                    <View style={{ marginBottom: spacing.sm }}>
                      <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs }}>
                        Capacity
                      </Text>
                      <Text style={{ ...typography.body, color: colors.textPrimary }}>{venue.venue_capacity} guests</Text>
                    </View>
                  )}
                  {renderBulletSection('Amenities', venue.amenities)}
                </View>
                <View style={{ width: '50%', paddingLeft: spacing.sm }}>
                  {renderBulletSection('Event Types', venue.event_types)}
                </View>
              </View>
            </View>
          ) : null}

          {/* Tags / highlights */}
          {venue.amenities && venue.amenities.length > 0 && (
            <View
              style={{
                marginBottom: spacing.lg,
                padding: spacing.lg,
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
                Highlights
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {venue.amenities?.map((tag) => (
                  <View
                    key={tag}
                    style={{
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.xs,
                      borderRadius: radii.full,
                      backgroundColor: colors.surfaceMuted,
                      marginRight: spacing.sm,
                      marginBottom: spacing.sm,
                    }}
                  >
                    <Text style={{ ...typography.caption, color: colors.textPrimary }}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Contact */}
          {(venue.whatsapp_number || venue.contact_email || venue.website_url || venue.instagram_url) && (
            <View
              style={{
                marginBottom: spacing.lg,
                padding: spacing.lg,
                borderRadius: radii.lg,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
              }}
            >
              <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>
                Contact
              </Text>
              <View style={{ gap: spacing.sm }}>
                {venue.whatsapp_number && (
                  <TouchableOpacity
                    onPress={() => handleOpenUrl(whatsappUrl)}
                    style={{
                      backgroundColor: '#22C55E',
                      paddingVertical: spacing.md,
                      borderRadius: radii.md,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MaterialIcons name="chat" size={18} color="#FFFFFF" />
                    <Text style={{ color: '#FFFFFF', fontWeight: '600', marginLeft: spacing.sm }}>Contact via WhatsApp</Text>
                  </TouchableOpacity>
                )}
                {venue.contact_email && (
                  <TouchableOpacity
                    onPress={() => handleOpenUrl(emailUrl)}
                    style={{
                      backgroundColor: '#3B82F6',
                      paddingVertical: spacing.md,
                      borderRadius: radii.md,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MaterialIcons name="email" size={18} color="#FFFFFF" />
                    <Text style={{ color: '#FFFFFF', fontWeight: '600', marginLeft: spacing.sm }}>Contact via Email</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Location & Map */}
          {(mapQuery || venue.location) && (
            <View
              style={{
                marginBottom: spacing.lg,
                padding: spacing.lg,
                borderRadius: radii.lg,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                <MaterialIcons name="place" size={18} color={colors.primaryTeal} />
                <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginLeft: spacing.sm }}>
                  Location
                </Text>
              </View>
              {venue.location && (
                <Text style={{ ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm }}>
                  {venue.location}
                </Text>
              )}
              <View
                style={{
                  height: 220,
                  borderRadius: radii.md,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  backgroundColor: colors.surfaceMuted,
                  marginBottom: spacing.md,
                }}
              >
                {Platform.OS === 'web' ? (
                  webMapEmbedUrl ? (
                    <iframe
                      title="Google Map"
                      style={{ width: '100%', height: '100%', border: 'none' } as any}
                      src={webMapEmbedUrl}
                      allowFullScreen
                    />
                  ) : (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ ...typography.caption, color: colors.textMuted }}>Map unavailable</Text>
                    </View>
                  )
                ) : staticMapUrl ? (
                  <Image
                    source={{ uri: staticMapUrl }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ ...typography.caption, color: colors.textMuted }}>Map unavailable</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                onPress={handleOpenMap}
                style={{
                  paddingVertical: spacing.sm,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: colors.primaryTeal,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                }}
              >
                <MaterialIcons name="map" size={16} color={colors.primaryTeal} />
                <Text style={{ color: colors.primaryTeal, marginLeft: spacing.sm, fontWeight: '600' }}>
                  Open in Google Maps
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {activeTab === 'amenities' && (
        <View>
          {venue.amenities && venue.amenities.length > 0 ? (
            <View
              style={{
                marginBottom: spacing.lg,
                padding: spacing.lg,
                borderRadius: radii.lg,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
              }}
            >
              <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>
                Amenities
              </Text>
              {venue.amenities?.map((item) => (
                <View key={item} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                   <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: colors.primaryTeal,
                      marginRight: spacing.sm,
                    }}
                  />
                  <Text style={{ ...typography.body, color: colors.textPrimary }}>{item}</Text>
                </View>
              ))}
            </View>
          ) : (
             <View
              style={{
                marginBottom: spacing.lg,
                padding: spacing.lg,
                borderRadius: radii.lg,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
              }}
            >
              <Text style={{ ...typography.body, color: colors.textMuted }}>No amenities listed.</Text>
            </View>
          )}
        </View>
      )}

      {activeTab === 'reviews' && (
        <View>
          {reviewsLoading ? (
            <View
              style={{
                marginBottom: spacing.lg,
                padding: spacing.lg,
                borderRadius: radii.lg,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ActivityIndicator />
            </View>
          ) : reviewsError instanceof Error ? (
            <View
              style={{
                marginBottom: spacing.lg,
                padding: spacing.lg,
                borderRadius: radii.lg,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
              }}
            >
              <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.sm }}>
                Failed to load reviews
              </Text>
              <Text style={{ ...typography.body, color: colors.textMuted }}>{reviewsError.message}</Text>
            </View>
          ) : !reviews || reviews.length === 0 ? (
            <View
              style={{
                marginBottom: spacing.lg,
                padding: spacing.lg,
                borderRadius: radii.lg,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                alignItems: 'center',
              }}
            >
              <MaterialIcons name="rate-review" size={48} color={colors.textMuted} />
              <Text
                style={{
                  ...typography.body,
                  color: colors.textSecondary,
                  marginTop: spacing.md,
                  textAlign: 'center',
                }}
              >
                No reviews yet.
              </Text>
            </View>
          ) : (
            <View style={{ gap: spacing.md, marginBottom: spacing.lg }}>
              {reviews.map((review) => (
                <View
                  key={review.id}
                  style={{
                    padding: spacing.lg,
                    borderRadius: radii.lg,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <MaterialIcons
                          key={idx}
                          name={review.rating >= idx + 1 ? 'star' : 'star-border'}
                          size={16}
                          color="#F59E0B"
                        />
                      ))}
                      {review.is_verified ? (
                        <View
                          style={{
                            marginLeft: spacing.sm,
                            backgroundColor: '#DCFCE7',
                            paddingHorizontal: spacing.sm,
                            paddingVertical: 4,
                            borderRadius: radii.full,
                            borderWidth: 1,
                            borderColor: '#BBF7D0',
                          }}
                        >
                          <Text style={{ ...typography.caption, color: '#166534', fontWeight: '600' }}>
                            Verified
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  {review.title ? (
                    <Text
                      style={{
                        ...typography.titleMedium,
                        color: colors.textPrimary,
                        marginTop: spacing.sm,
                      }}
                    >
                      {review.title}
                    </Text>
                  ) : null}

                  {review.review_text ? (
                    <Text style={{ ...typography.body, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 20 }}>
                      {review.review_text}
                    </Text>
                  ) : (
                    <Text style={{ ...typography.body, color: colors.textMuted, marginTop: spacing.sm }}>
                      No written review provided.
                    </Text>
                  )}

                  {review.created_at ? (
                    <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.sm }}>
                      {new Date(review.created_at).toLocaleDateString()}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          )}

          {user?.id ? (
            <View
              style={{
                marginBottom: spacing.lg,
                padding: spacing.lg,
                borderRadius: radii.lg,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
              }}
            >
              <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.sm }}>
                Leave a review
              </Text>
              <Text style={{ ...typography.body, color: colors.textSecondary, marginBottom: spacing.md }}>
                Reviews are available after you have used this venue.
              </Text>
              <PrimaryButton
                title={eligibilityLoading ? 'Checking eligibility...' : 'Leave a review'}
                disabled={!canLeaveReview || eligibilityLoading}
                onPress={() =>
                  navigation.navigate('CreateReview', {
                    type: 'venue',
                    targetId: venue.id,
                    targetName: venue.name,
                  })
                }
              />
              {!eligibilityLoading && !canLeaveReview ? (
                <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.sm }}>
                  You can leave a review once your tour booking or quote is accepted/finalised.
                </Text>
              ) : null}
            </View>
          ) : (
            <View
              style={{
                marginBottom: spacing.lg,
                padding: spacing.lg,
                borderRadius: radii.lg,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
              }}
            >
              <Text style={{ ...typography.body, color: colors.textSecondary }}>
                Sign in to leave a review.
              </Text>
            </View>
          )}
        </View>
      )}

      {activeTab === 'calendar' && (
        <View
          style={{
            marginBottom: spacing.lg,
            padding: spacing.lg,
            borderRadius: radii.lg,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
            <MaterialIcons name="calendar-today" size={18} color={colors.primaryTeal} />
            <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginLeft: spacing.sm }}>
              Availability Calendar
            </Text>
          </View>
          <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
            <MaterialIcons name="event" size={48} color={colors.textMuted} />
            <Text style={{ ...typography.body, color: colors.textPrimary, marginTop: spacing.md, fontWeight: '600' }}>
              Check Availability
            </Text>
            <Text style={{ ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs }}>
              View real-time availability and book directly with {venue.name}
            </Text>
          </View>
          <View style={{ gap: spacing.sm }}>
            <View
              style={{
                backgroundColor: '#DCFCE7',
                borderRadius: radii.md,
                padding: spacing.md,
                borderWidth: 1,
                borderColor: '#BBF7D0',
              }}
            >
              <Text style={{ ...typography.body, color: '#166534', fontWeight: '600', textAlign: 'center' }}>
                Available Dates
              </Text>
              <Text style={{ ...typography.caption, color: '#166534', textAlign: 'center', marginTop: 4 }}>
                Contact to confirm specific dates and pricing
              </Text>
            </View>
            <View
              style={{
                backgroundColor: '#FEE2E2',
                borderRadius: radii.md,
                padding: spacing.md,
                borderWidth: 1,
                borderColor: '#FECACA',
              }}
            >
              <Text style={{ ...typography.body, color: '#991B1B', fontWeight: '600', textAlign: 'center' }}>
                Booking Notice
              </Text>
              <Text style={{ ...typography.caption, color: '#991B1B', textAlign: 'center', marginTop: 4 }}>
                Popular dates require advance booking
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => {
              if (whatsappUrl) {
                handleOpenUrl(whatsappUrl);
              } else if (emailUrl) {
                handleOpenUrl(emailUrl);
              } else {
                handleRequestQuote();
              }
            }}
            style={{
              marginTop: spacing.md,
              backgroundColor: colors.primaryTeal,
              paddingVertical: spacing.md,
              borderRadius: radii.md,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
            }}
          >
            <MaterialIcons name="calendar-today" size={16} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontWeight: '600', marginLeft: spacing.sm }}>
              Contact for Availability
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Request Quote entry */}
      <View
        style={{
          paddingVertical: spacing.lg,
          borderTopWidth: 1,
          borderTopColor: colors.borderSubtle,
          marginTop: spacing.lg,
        }}
      >
        <Text
          style={{
            ...typography.titleMedium,
            color: colors.textPrimary,
            marginBottom: spacing.sm,
          }}
        >
          Request a quote
        </Text>
        <Text style={{ ...typography.body, color: colors.textSecondary, marginBottom: spacing.md }}>
          Share your event details and request a custom quote from this venue.
        </Text>
        <PrimaryButton title="Request a quote" onPress={handleRequestQuote} />
      </View>
    </ScrollView>
  );
}
