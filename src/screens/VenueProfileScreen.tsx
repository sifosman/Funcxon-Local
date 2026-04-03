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
const GOOGLE_MAPS_API_KEY = 'AIzaSyBjd1KYtTaAzxzdw5ayGwwMu5Sex-gKQLI';
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
  address_line_1: string | null;
  address_line_2: string | null;
  suburb: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
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

type AvailabilityRecord = {
  id: number;
  date: string;
  is_available: boolean;
  availability_type: string | null;
  time_slots: string[] | null;
  notes: string | null;
};

export default function VenueProfileScreen({ route, navigation }: Props) {
  const { venueId } = route.params;
  const [activeTab, setActiveTab] = useState<'about' | 'amenities' | 'reviews' | 'calendar'>('about');
  const [mapImageFailed, setMapImageFailed] = useState(false);
  const [favouriteIds, setFavouriteIds] = useState<{ vendorIds: number[]; venueIds: number[] }>({
    vendorIds: [],
    venueIds: [],
  });
  const { user } = useAuth();

  const cameFromFavourites = route.params?.from === 'Favourites';
  const cameFromQuotes = route.params?.from === 'Quotes';

  const handleBackNavigation = useCallback(() => {
    if (cameFromFavourites) {
      const tabNav = navigation.getParent();
      navigation.popToTop();
      tabNav?.navigate('Favourites' as never);
      return;
    }

    if (cameFromQuotes) {
      const tabNav = navigation.getParent();
      navigation.popToTop();
      tabNav?.navigate('Quotes' as never);
      return;
    }

    navigation.goBack();
  }, [cameFromFavourites, cameFromQuotes, navigation]);

  useEffect(() => {
    if (!cameFromFavourites && !cameFromQuotes) return;

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
  }, [cameFromFavourites, cameFromQuotes, handleBackNavigation, navigation]);

  useFocusEffect(
    useCallback(() => {
      if (!cameFromFavourites && !cameFromQuotes) return;

      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        handleBackNavigation();
        return true;
      });

      return () => sub.remove();
    }, [cameFromFavourites, cameFromQuotes, handleBackNavigation]),
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

  const {
    data: availability,
    isLoading: availabilityLoading,
  } = useQuery<AvailabilityRecord[]>({
    queryKey: ['venue-availability', venueId],
    enabled: typeof venueId === 'number',
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from('venue_availability_calendar')
        .select('id, date, is_available, availability_type, time_slots, notes')
        .eq('venue_id', venueId)
        .gte('date', today)
        .order('date', { ascending: true })
        .limit(12);

      if (error) {
        throw error;
      }

      return (data as AvailabilityRecord[]) ?? [];
    },
  });

  const mapQuery = useMemo(() => {
    if (venue?.location?.trim()) {
      return venue.location.trim();
    }
    const city = venue?.city?.trim() ?? '';
    const province = venue?.province?.trim() ?? '';
    if (city || province) {
      return `${city}${city && province ? ', ' : ''}${province}`;
    }
    return '';
  }, [venue?.location, venue?.city, venue?.province]);

  const physicalAddress = useMemo(() => {
    const structured = [
      venue?.address_line_1,
      venue?.address_line_2,
      venue?.suburb,
      venue?.city,
      venue?.province,
      venue?.postal_code,
      venue?.country,
    ]
      .map((part) => part?.trim() ?? '')
      .filter(Boolean)
      .join(', ');

    if (structured) {
      return structured;
    }

    if (venue?.location?.trim()) {
      return venue.location.trim();
    }

    const city = venue?.city?.trim() ?? '';
    const province = venue?.province?.trim() ?? '';
    const fallback = [city, province].filter(Boolean).join(', ');
    return fallback || null;
  }, [venue?.address_line_1, venue?.address_line_2, venue?.city, venue?.country, venue?.location, venue?.postal_code, venue?.province, venue?.suburb]);

  const mapCoordinates = useMemo(() => {
    const lat = venue?.latitude;
    const lng = venue?.longitude;
    
    const latitude = typeof lat === 'number' ? lat : typeof lat === 'string' ? parseFloat(lat) : null;
    const longitude = typeof lng === 'number' ? lng : typeof lng === 'string' ? parseFloat(lng) : null;

    if (latitude == null || longitude == null || isNaN(latitude) || isNaN(longitude)) {
      return null;
    }

    return { latitude, longitude };
  }, [venue?.latitude, venue?.longitude]);

  const mapSearchTarget = physicalAddress ?? mapQuery;

  useEffect(() => {
    setMapImageFailed(false);
  }, [mapCoordinates?.latitude, mapCoordinates?.longitude, mapQuery]);

  const nativeMapHtml = useMemo(() => {
    if (!mapCoordinates && !mapSearchTarget) return null;
    const safeQuery = String(mapSearchTarget || 'South Africa').replace(/"/g, '\\"');
    const safeTitle = String(venue?.name || 'Location').replace(/"/g, '\\"');
    const encodedQuery = encodeURIComponent(mapSearchTarget || 'South Africa');
    const coordinateSource = mapCoordinates ? `{ lat: ${mapCoordinates.latitude}, lng: ${mapCoordinates.longitude} }` : null;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>html,body,#map{margin:0;padding:0;width:100%;height:100%;}</style>
      </head>
      <body>
        <div id="map" style="width:100%;height:100%;"></div>
        <script>
          function initMap() {
            const fallbackEmbed = 'https://maps.google.com/maps?q=${encodedQuery}&t=&z=16&ie=UTF8&iwloc=&output=embed';
            const mountFallback = () => {
              document.getElementById('map').innerHTML = '<iframe width="100%" height="100%" frameborder="0" style="border:0" src="' + fallbackEmbed + '" allowfullscreen></iframe>';
            };

            if (${coordinateSource ?? 'null'}) {
              const location = ${coordinateSource ?? 'null'};
              const map = new google.maps.Map(document.getElementById('map'), {
                center: location,
                zoom: 16,
                disableDefaultUI: true,
                zoomControl: true,
                gestureHandling: 'greedy',
              });

              new google.maps.Marker({
                position: location,
                map,
                title: "${safeTitle}",
              });
              return;
            }

            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ address: "${safeQuery}" }, (results, status) => {
              if (status === 'OK' && results && results.length > 0) {
                const location = results[0].geometry.location;
                const map = new google.maps.Map(document.getElementById('map'), {
                  center: location,
                  zoom: 16,
                  disableDefaultUI: true,
                  zoomControl: true,
                  gestureHandling: 'greedy',
                });

                new google.maps.Marker({
                  position: location,
                  map,
                  title: "${safeTitle}",
                });
              } else {
                mountFallback();
              }
            });
          }

          function handleMapError() {
            document.getElementById('map').innerHTML = '<iframe width="100%" height="100%" frameborder="0" style="border:0" src="https://maps.google.com/maps?q=${encodedQuery}&t=&z=16&ie=UTF8&iwloc=&output=embed" allowfullscreen></iframe>';
          }
        </script>
        <script src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap" onerror="handleMapError()" async defer></script>
      </body>
      </html>
    `;
  }, [mapCoordinates, mapSearchTarget, venue?.name]);

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

    const previous = favouriteIds;
    const isCurrentlyFavourite = previous.venueIds.includes(venue.id);
    const optimisticNext = {
      ...previous,
      venueIds: isCurrentlyFavourite
        ? previous.venueIds.filter((venueId) => venueId !== venue.id)
        : [...previous.venueIds, venue.id],
    };

    setFavouriteIds(optimisticNext);

    try {
      const next = await toggleFavourite(user, venue.id, 'venue');
      setFavouriteIds(next);
    } catch (error) {
      setFavouriteIds(previous);
      const message = error instanceof Error ? error.message : 'We could not update favourites right now.';
      Alert.alert('Favourite update failed', message);
    }
  };

  const isFavourite = venue ? favouriteIds.venueIds.includes(venue.id) : false;

  const handleOpenMap = () => {
    if (!mapCoordinates && !physicalAddress && !mapQuery) return;
    const mapsUrl = mapCoordinates
      ? `https://www.google.com/maps/search/?api=1&query=${mapCoordinates.latitude},${mapCoordinates.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapSearchTarget)}`;
    Linking.openURL(mapsUrl).catch(() => null);
  };

  const handleOpenUrl = (url?: string | null) => {
    if (!url) return;
    Linking.openURL(url).catch(() => null);
  };

  const whatsappUrl = venue?.whatsapp_number
    ? `https://wa.me/${venue.whatsapp_number.replace(/[^0-9]/g, '')}`
    : null;
  const contactNumber = venue?.whatsapp_number?.trim() || null;
  const emailUrl = venue?.contact_email ? `mailto:${venue.contact_email}` : null;
  const webMapEmbedUrl = mapCoordinates
    ? `https://www.google.com/maps?q=${mapCoordinates.latitude},${mapCoordinates.longitude}&z=16&output=embed`
    : mapSearchTarget
    ? `https://www.google.com/maps?q=${encodeURIComponent(mapSearchTarget)}&z=16&output=embed`
    : null;
  const staticMapUrl = mapCoordinates
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${mapCoordinates.latitude},${mapCoordinates.longitude}&zoom=16&size=1200x600&scale=2&markers=color:red%7C${mapCoordinates.latitude},${mapCoordinates.longitude}&key=${GOOGLE_MAPS_API_KEY}`
    : mapSearchTarget
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(mapSearchTarget)}&zoom=16&size=1200x600&scale=2&markers=color:red%7C${encodeURIComponent(mapSearchTarget)}&key=${GOOGLE_MAPS_API_KEY}`
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

  const formatAvailabilityDate = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return parsed.toLocaleDateString('en-ZA', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
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
            {physicalAddress || 'Location not specified'}
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
          {(mapQuery || physicalAddress) && (
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
              {physicalAddress && (
                <Text style={{ ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm }}>
                  {physicalAddress}
                </Text>
              )}
              {contactNumber && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                  <MaterialIcons name="phone" size={16} color={colors.primaryTeal} />
                  <Text style={{ ...typography.body, color: colors.textSecondary, marginLeft: spacing.sm }}>
                    {contactNumber}
                  </Text>
                </View>
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
                ) : nativeMapHtml ? (
                  !mapImageFailed && staticMapUrl ? (
                    <Image
                      source={{ uri: staticMapUrl }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode="cover"
                      onError={() => setMapImageFailed(true)}
                    />
                  ) : (
                    <WebView
                      source={{ html: nativeMapHtml }}
                      style={{ width: '100%', height: '100%' }}
                      originWhitelist={['*']}
                      javaScriptEnabled
                      domStorageEnabled
                      setSupportMultipleWindows={false}
                      startInLoadingState
                      scrollEnabled={false}
                    />
                  )
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
          {availabilityLoading ? (
            <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
              <ActivityIndicator color={colors.primaryTeal} />
            </View>
          ) : availability && availability.length > 0 ? (
            <View style={{ gap: spacing.sm }}>
              {availability.map((entry) => {
                const isAvailable = entry.is_available;
                return (
                  <View
                    key={entry.id}
                    style={{
                      borderRadius: radii.md,
                      padding: spacing.md,
                      borderWidth: 1,
                      borderColor: isAvailable ? '#BBF7D0' : '#FECACA',
                      backgroundColor: isAvailable ? '#DCFCE7' : '#FEE2E2',
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md }}>
                      <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600', flex: 1 }}>
                        {formatAvailabilityDate(entry.date)}
                      </Text>
                      <Text style={{ ...typography.caption, color: isAvailable ? '#166534' : '#991B1B', fontWeight: '700' }}>
                        {isAvailable ? 'Available' : 'Unavailable'}
                      </Text>
                    </View>
                    {entry.availability_type ? (
                      <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs }}>
                        {entry.availability_type}
                      </Text>
                    ) : null}
                    {Array.isArray(entry.time_slots) && entry.time_slots.length > 0 ? (
                      <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs }}>
                        {entry.time_slots.join(', ')}
                      </Text>
                    ) : null}
                    {entry.notes ? (
                      <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs }}>
                        {entry.notes}
                      </Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
              <MaterialIcons name="event-busy" size={48} color={colors.textMuted} />
              <Text style={{ ...typography.body, color: colors.textPrimary, marginTop: spacing.md, fontWeight: '600' }}>
                Availability will be updated soon
              </Text>
              <Text style={{ ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs }}>
                Contact {venue.name} directly while calendar slots are being updated.
              </Text>
            </View>
          )}
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
