import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Dimensions, Image, Linking, Platform, ScrollView, Share, Text, TouchableOpacity, View } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import type { ICarouselInstance } from 'react-native-reanimated-carousel';
import ThemedAlert from '../components/ThemedAlert';
import NetworkImage from '../components/NetworkImage';
import ImageZoomModal, { type GalleryItem } from '../components/ImageZoomModal';
import VideoThumbnail from '../components/VideoThumbnail';
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
import { useIsDesktop } from '../hooks/useIsDesktop';
import { PrimaryButton } from '../components/ui';

const headerTitleLarge = { ...typography.titleLarge, fontFamily: 'Montserrat_700Bold' as const };
const headerTitleMedium = { ...typography.titleMedium, fontFamily: 'Montserrat_600SemiBold' as const };

const GOOGLE_MAPS_API_KEY = 'AIzaSyBjd1KYtTaAzxzdw5ayGwwMu5Sex-gKQLI';

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

type GalleryMedia = {
  id: number;
  media_url: string;
  media_type: 'image' | 'video';
  sort_order: number;
};

export default function VenueProfileScreen({ route, navigation }: Props) {
  const { venueId } = route.params;
  const [activeTab, setActiveTab] = useState<'about' | 'amenities' | 'reviews' | 'calendar'>('about');
  const [mapImageFailed, setMapImageFailed] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const carouselRef = useRef<ICarouselInstance>(null);
  const [zoomVisible, setZoomVisible] = useState(false);
  const [zoomInitialIndex, setZoomInitialIndex] = useState(0);
  const [galleryContainerWidth, setGalleryContainerWidth] = useState(Dimensions.get('window').width);
  const [favouriteIds, setFavouriteIds] = useState<{ vendorIds: number[]; venueIds: number[] }>({
    vendorIds: [],
    venueIds: [],
  });
  const [alertState, setAlertState] = useState<{visible: boolean; title: string; message: string} | null>(null);
  const { user } = useAuth();
  const isDesktop = useIsDesktop();

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
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      return (data as VenueReview[]) ?? [];
    },
    enabled: typeof venueId === 'number',
  });

  const hasReviews = !!reviews && reviews.length > 0;
  const averageRating = hasReviews && reviews
    ? reviews.reduce((sum, r) => sum + (r?.rating ?? 0), 0) / reviews.length
    : null;
  const reviewCount = hasReviews ? reviews!.length : 0;
  const ratingBreakdown = useMemo(() => {
    const base = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) return base;
    return reviews.reduce((acc, review) => {
      const r = review.rating as 1 | 2 | 3 | 4 | 5;
      if (r >= 1 && r <= 5) acc[r]++;
      return acc;
    }, { ...base });
  }, [reviews]);
  const ratingSummaryValue = averageRating ? averageRating.toFixed(1) : '0.0';
  const ratingSummaryCount = reviewCount || 0;
  const ratingCategories = [
    { label: 'Venue Condition', value: averageRating ?? 0 },
    { label: 'Cleanliness', value: averageRating ?? 0 },
    { label: 'Ambiance & Atmosphere', value: averageRating ?? 0 },
    { label: 'Staff Professionalism', value: averageRating ?? 0 },
    { label: 'Value for Money', value: averageRating ?? 0 },
    { label: 'Location & Accessibility', value: averageRating ?? 0 },
    { label: 'Overall Experience', value: averageRating ?? 0 },
  ];

  const {
    data: galleryMedia,
    isLoading: galleryMediaLoading,
  } = useQuery<GalleryMedia[]>({
    queryKey: ['venue-gallery-media', venueId],
    enabled: typeof venueId === 'number',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gallery_media')
        .select('id, media_url, media_type, sort_order')
        .eq('venue_id', venueId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.warn('gallery_media query failed, falling back to additional_photos:', error);
        return [];
      }

      return (data as GalleryMedia[]) ?? [];
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
    const hasStreetAddress = Boolean(venue?.address_line_1?.trim());

    if (hasStreetAddress) {
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

  const mapSearchTarget = mapQuery || physicalAddress;

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

  const galleryItems = useMemo<GalleryItem[]>(() => {
    const legacyImages = [venue?.image_url, ...(venue?.additional_photos ?? [])].filter(Boolean) as string[];
    const legacyItems = legacyImages.map((url) => ({ url, type: 'image' as const }));
    const mediaItems = (galleryMedia ?? []).map((m) => ({ url: m.media_url, type: m.media_type }));
    const merged = [...legacyItems, ...mediaItems];
    const seen = new Set<string>();
    const deduped = merged.filter((item) => {
      if (seen.has(item.url)) return false;
      seen.add(item.url);
      return true;
    });
    return deduped.sort((a, b) => {
      if (a.type === 'video' && b.type !== 'video') return 1;
      if (a.type !== 'video' && b.type === 'video') return -1;
      return 0;
    });
  }, [galleryMedia, venue?.image_url, venue?.additional_photos]);

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
        setAlertState({ visible: true, title: 'Sign in required', message: 'Please sign in to save favourites.' });
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
      setAlertState({ visible: true, title: 'Favourite update failed', message });
    }
  };

  const isFavourite = venue ? favouriteIds.venueIds.includes(venue.id) : false;

  const handleShare = async () => {
    if (!venue) return;
    const url = `https://funxon-web.vercel.app/venue/${venue.id}`;
    const message = encodeURIComponent(`Check out ${venue.name} on Funxon: ${url}`);
    const whatsappUrl = Platform.select({
      ios: `https://wa.me/?text=${message}`,
      android: `whatsapp://send?text=${message}`,
      default: `https://wa.me/?text=${message}`,
    });
    try {
      const supported = await Linking.canOpenURL(whatsappUrl);
      if (supported) {
        await Linking.openURL(whatsappUrl);
      } else {
        await Share.share({ message: `Check out ${venue.name} on Funxon! ${url}`, title: venue.name });
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleOpenMap = () => {
    if (!mapCoordinates && !physicalAddress && !mapQuery) return;
    const mapsUrl = mapCoordinates
      ? `https://www.google.com/maps/search/?api=1&query=${mapCoordinates.latitude},${mapCoordinates.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapSearchTarget ?? '')}`;
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

  const { session } = useAuth();

  const handleRequestQuote = () => {
    if (!venue) return;
    if (!session) {
      (navigation as any).getParent()?.getParent()?.navigate('Auth', { screen: 'SignIn' });
      return;
    }
    navigation.navigate('QuoteRequest', {
      vendorId: venue.id,
      vendorName: venue.name,
      type: 'venue'
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
        <Text style={{ ...headerTitleMedium, color: colors.textPrimary }}>Failed to load venue.</Text>
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
        <Text style={{ ...headerTitleMedium, color: colors.textPrimary }}>Venue not found.</Text>
      </View>
    );
  }

  const renderBulletSection = (title: string, items?: string[] | null) => {
    if (!items || items.length === 0) return null;
    return (
      <View style={{ marginBottom: spacing.md }}>
        <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary, marginBottom: spacing.xs }}>
          {title}
        </Text>
        {items.map((item) => (
          <View key={item} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: colors.cta,
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

  const renderMainContent = () => (
    <>
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
            <Text style={{ ...(isDesktop ? typography.headlineMd : headerTitleLarge), color: colors.primary }}>{venue.name}</Text>
          </View>
          {/* Only show fav/share buttons in header on mobile; desktop has them in sidebar */}
          {!isDesktop && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <TouchableOpacity
                onPress={handleShare}
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
                <MaterialIcons name="share" size={22} color={colors.textMuted} />
              </TouchableOpacity>
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
                  color={isFavourite ? colors.coral : colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          )}
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
        onLayout={(e) => setGalleryContainerWidth(e.nativeEvent.layout.width)}
      >
        {isDesktop ? (
          /* Desktop: single hero image */
          galleryItems.length > 0 ? (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => { setZoomInitialIndex(0); setZoomVisible(true); }}
              style={{ height: 320 }}
            >
              {galleryItems[0].type === 'video' ? (
                <VideoThumbnail
                  uri={galleryItems[0].url}
                  style={{ width: '100%', height: '100%' }}
                  playIconSize={36}
                />
              ) : (
                <NetworkImage
                  uri={galleryItems[0].url}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              )}
              {galleryItems.length > 1 && (
                <View style={{ position: 'absolute', bottom: spacing.md, right: spacing.md, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' }}>
                  <MaterialIcons name="photo-library" size={16} color="#FFFFFF" />
                  <Text style={{ ...typography.bodySemiBold, color: '#FFFFFF' }}>View all photos</Text>
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <View style={{ height: 320, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceMuted }}>
              <MaterialIcons name="image" size={48} color={colors.textMuted} />
              <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.sm }}>No images available</Text>
            </View>
          )
        ) : (
          /* Mobile: carousel only */
          <>
            <View style={{ height: 220, backgroundColor: colors.surfaceMuted }}>
              {galleryItems.length > 0 ? (
                <>
                  <Carousel
                    ref={carouselRef}
                    width={galleryContainerWidth || Dimensions.get('window').width}
                    height={220}
                    data={galleryItems}
                    loop={galleryItems.length > 1}
                    pagingEnabled={false}
                    snapEnabled
                    onSnapToItem={(index) => setGalleryIndex(index)}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => {
                          setZoomInitialIndex(galleryIndex);
                          setZoomVisible(true);
                        }}
                        style={{ width: '100%', height: '100%' }}
                      >
                        {item.type === 'video' ? (
                          <VideoThumbnail
                            uri={item.url}
                            style={{ width: '100%', height: '100%' }}
                            playIconSize={32}
                          />
                        ) : (
                          <NetworkImage uri={item.url} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                        )}
                      </TouchableOpacity>
                    )}
                  />
                  {galleryItems.length > 1 && (
                    <>
                      <TouchableOpacity
                        onPress={() => carouselRef.current?.prev()}
                        style={{
                          position: 'absolute',
                          left: spacing.md,
                          top: '50%',
                          marginTop: -18,
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: 'rgba(0,0,0,0.5)',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <MaterialIcons name="chevron-left" size={24} color="#FFFFFF" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => carouselRef.current?.next()}
                        style={{
                          position: 'absolute',
                          right: spacing.md,
                          top: '50%',
                          marginTop: -18,
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: 'rgba(0,0,0,0.5)',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <MaterialIcons name="chevron-right" size={24} color="#FFFFFF" />
                      </TouchableOpacity>
                      <View
                        style={{
                          position: 'absolute',
                          bottom: spacing.md,
                          left: 0,
                          right: 0,
                          flexDirection: 'row',
                          justifyContent: 'center',
                          gap: 6,
                        }}
                      >
                        {galleryItems.map((_, idx) => (
                          <View
                            key={idx}
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: idx === galleryIndex ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
                            }}
                          />
                        ))}
                      </View>
                    </>
                  )}
                </>
              ) : (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialIcons name="image" size={48} color={colors.textMuted} />
                  <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.sm }}>
                    No images available
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </View>

      {/* Zoom / Video Modal */}
      <ImageZoomModal
        visible={zoomVisible}
        items={galleryItems}
        initialIndex={zoomInitialIndex}
        onClose={() => setZoomVisible(false)}
      />

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
                backgroundColor: isActive ? colors.coral : 'transparent',
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
                  ...headerTitleMedium,
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
                  ...headerTitleMedium,
                  color: colors.textPrimary,
                  marginBottom: spacing.sm,
                }}
              >
                About - {venue.name}
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

          {/* Features & Hall Capacities */}
          {(venue.venue_type || venue.venue_capacity || venue.event_types?.length || halls.length > 0) ? (
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
              <Text style={{ ...headerTitleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>
                Features & Hall Capacities
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
                  {halls.length > 0 && (
                    <View style={{ marginBottom: spacing.sm }}>
                      <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs }}>
                        Hall Capacities
                      </Text>
                      {halls.map((hall, idx) => (
                        <Text key={idx} style={{ ...typography.body, color: colors.textPrimary }}>
                          {hall.name ? `${hall.name}: ` : ''}{hall.capacity || 'TBC'}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
                <View style={{ width: '50%', paddingLeft: spacing.sm }}>
                  {renderBulletSection('Event Types', venue.event_types)}
                </View>
              </View>
            </View>
          ) : null}

          {/* Action Buttons */}
          <View style={{ marginBottom: spacing.lg, gap: spacing.sm }}>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('VenueCatalogueView', { venueId: venue.id, venueName: venue.name })
              }
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: spacing.md,
                borderRadius: radii.lg,
                backgroundColor: colors.cta,
                gap: spacing.sm,
              }}
            >
              <MaterialIcons name="inventory-2" size={20} color="#FFFFFF" />
              <Text style={{ ...typography.bodyBold, color: '#FFFFFF' }}>View Catalogue</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleRequestQuote}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: spacing.md,
                borderRadius: radii.lg,
                backgroundColor: colors.primary,
                gap: spacing.sm,
              }}
            >
              <MaterialIcons name="request-quote" size={20} color="#FFFFFF" />
              <Text style={{ ...typography.bodyBold, color: '#FFFFFF' }}>Request a Quote</Text>
            </TouchableOpacity>

            {canBookTours && (
              <TouchableOpacity
                onPress={() => navigation.navigate('BookTour', { venueId: venue.id, venueName: venue.name })}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: spacing.md,
                  borderRadius: radii.lg,
                  backgroundColor: colors.accent,
                  gap: spacing.sm,
                }}
              >
                <MaterialIcons name="tour" size={20} color="#FFFFFF" />
                <Text style={{ ...typography.bodyBold, color: '#FFFFFF' }}>Book a Tour</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => setActiveTab('reviews')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: spacing.md,
                borderRadius: radii.lg,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                gap: spacing.sm,
              }}
            >
              <MaterialIcons name="reviews" size={20} color={colors.textPrimary} />
              <Text style={{ ...typography.bodyBold, color: colors.textPrimary }}>View Reviews & Ratings</Text>
            </TouchableOpacity>
          </View>

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
              <Text style={{ ...headerTitleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>
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
                    <Text style={{ ...typography.bodySemiBold, color: '#FFFFFF', marginLeft: spacing.sm }}>Contact via WhatsApp</Text>
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
                    <Text style={{ ...typography.bodySemiBold, color: '#FFFFFF', marginLeft: spacing.sm }}>Contact via Email</Text>
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
                <MaterialIcons name="place" size={18} color={colors.textPrimary} />
                <Text style={{ ...headerTitleMedium, color: colors.textPrimary, marginLeft: spacing.sm }}>
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
                  <MaterialIcons name="phone" size={16} color={colors.textPrimary} />
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
                    <TouchableOpacity
                      onPress={handleOpenMap}
                      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.md }}
                    >
                      <MaterialIcons name="place" size={32} color={colors.primary} />
                      {physicalAddress ? (
                        <Text style={{ ...typography.caption, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs }}>
                          {physicalAddress}
                        </Text>
                      ) : null}
                      <Text style={{ ...typography.caption, color: colors.primary, marginTop: spacing.xs }}>
                        Open in Google Maps
                      </Text>
                    </TouchableOpacity>
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
                  borderColor: colors.primary,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                }}
              >
                <MaterialIcons name="map" size={16} color={colors.textPrimary} />
                <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary, marginLeft: spacing.sm }}>
                  Open in Google Maps
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {activeTab === 'amenities' && (
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
              <Text style={{ ...headerTitleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>
                Halls & Spaces
              </Text>
              {halls.map((hall, idx) => (
                <View
                  key={idx}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: spacing.sm,
                    paddingVertical: spacing.sm,
                    borderBottomWidth: idx < halls.length - 1 ? 1 : 0,
                    borderBottomColor: colors.borderSubtle,
                  }}
                >
                  <Text style={{ ...typography.body, color: colors.textPrimary, flex: 1 }}>
                    {hall.name || `Hall ${idx + 1}`}
                  </Text>
                  <Text style={{ ...typography.body, color: colors.textSecondary }}>
                    {hall.capacity || 'Capacity TBC'}
                  </Text>
                </View>
              ))}
            </View>
          )}

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
              <Text style={{ ...headerTitleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>
                Amenities
              </Text>
              {venue.amenities?.map((item) => (
                <View key={item} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                   <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: colors.cta,
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
          {/* Overall Rating + Breakdown (compact) */}
          {hasReviews && (
            <>
              <View
                style={{
                  marginBottom: spacing.md,
                  padding: spacing.md,
                  borderRadius: radii.lg,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                }}
              >
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ ...typography.titleLarge, color: colors.textPrimary }}>{ratingSummaryValue}</Text>
                  <View style={{ flexDirection: 'row', marginVertical: 2 }}>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <MaterialIcons
                        key={index}
                        name={averageRating && averageRating >= index + 1 ? 'star' : 'star-border'}
                        size={14}
                        color="#F59E0B"
                      />
                    ))}
                  </View>
                  <Text style={{ ...typography.caption, color: colors.textMuted, fontSize: 11 }}>
                    {ratingSummaryCount} review{ratingSummaryCount === 1 ? '' : 's'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = ratingBreakdown[rating as 1 | 2 | 3 | 4 | 5] ?? 0;
                    const progress = reviewCount ? count / reviewCount : 0;
                    return (
                      <View key={rating} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
                        <Text style={{ ...typography.caption, color: colors.textMuted, width: 12, fontSize: 11 }}>{rating}</Text>
                        <MaterialIcons name="star" size={10} color="#F59E0B" />
                        <View
                          style={{
                            flex: 1,
                            height: 5,
                            backgroundColor: colors.surfaceMuted,
                            borderRadius: 999,
                            marginHorizontal: spacing.xs,
                            overflow: 'hidden',
                          }}
                        >
                          <View style={{ width: `${progress * 100}%`, height: '100%', backgroundColor: colors.coral }} />
                        </View>
                        <Text style={{ ...typography.caption, color: colors.textMuted, width: 16, textAlign: 'right', fontSize: 11 }}>
                          {count}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              <View
                style={{
                  marginBottom: spacing.md,
                  padding: spacing.md,
                  borderRadius: radii.lg,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                }}
              >
                <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary, marginBottom: spacing.sm }}>
                  Rating Breakdown
                </Text>
                <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm, fontSize: 11 }}>
                  Average ratings by category
                </Text>
                {ratingCategories.map((category) => (
                  <View key={category.label} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={{ ...typography.caption, color: colors.textPrimary, flex: 1, fontSize: 12 }}>{category.label}</Text>
                    <View style={{ flexDirection: 'row', marginRight: spacing.xs }}>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <MaterialIcons
                          key={index}
                          name={category.value >= index + 1 ? 'star' : 'star-border'}
                          size={12}
                          color="#F59E0B"
                        />
                      ))}
                    </View>
                    <Text style={{ ...typography.caption, color: colors.textMuted, fontSize: 11 }}>{category.value.toFixed(1)}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

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
              <Text style={{ ...headerTitleMedium, color: colors.textPrimary, marginBottom: spacing.sm }}>
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
                          <Text style={{ ...typography.captionSemiBold, color: '#166534' }}>
                            Verified
                          </Text>
                        </View>
                      ) : null}
                      {review.status === 'pending' ? (
                        <View
                          style={{
                            marginLeft: spacing.sm,
                            backgroundColor: '#FEF3C7',
                            paddingHorizontal: spacing.sm,
                            paddingVertical: 4,
                            borderRadius: radii.full,
                            borderWidth: 1,
                            borderColor: '#FDE68A',
                          }}
                        >
                          <Text style={{ ...typography.captionSemiBold, color: '#92400E' }}>
                            Pending
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  {review.title ? (
                    <Text
                      style={{
                        ...headerTitleMedium,
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
                      {new Date(review.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          )}

          {/* Ratings System Explanation */}
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
            <Text style={{ ...headerTitleMedium, color: colors.textPrimary, marginBottom: spacing.sm }}>
              Ratings System
            </Text>
            <View style={{ gap: spacing.xs }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons name="star" size={14} color="#F59E0B" />
                <Text style={{ ...typography.caption, color: colors.textSecondary, marginLeft: spacing.sm }}>
                  5 stars = Exceptional experience
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons name="star" size={14} color="#F59E0B" />
                <Text style={{ ...typography.caption, color: colors.textSecondary, marginLeft: spacing.sm }}>
                  4 stars = Very good experience
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons name="star" size={14} color="#F59E0B" />
                <Text style={{ ...typography.caption, color: colors.textSecondary, marginLeft: spacing.sm }}>
                  3 stars = Good experience
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons name="star" size={14} color="#F59E0B" />
                <Text style={{ ...typography.caption, color: colors.textSecondary, marginLeft: spacing.sm }}>
                  2 stars = Below average experience
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons name="star" size={14} color="#F59E0B" />
                <Text style={{ ...typography.caption, color: colors.textSecondary, marginLeft: spacing.sm }}>
                  1 star = Poor experience
                </Text>
              </View>
            </View>
          </View>

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
              <Text style={{ ...headerTitleMedium, color: colors.textPrimary, marginBottom: spacing.sm }}>
                Add a Review
              </Text>
              <Text style={{ ...typography.body, color: colors.textSecondary, marginBottom: spacing.md }}>
                Share your experience with this venue. Reviews help other users make informed decisions.
              </Text>
              <PrimaryButton
                title="Add a review"
                onPress={() =>
                  navigation.navigate('CreateReview', {
                    type: 'venue',
                    targetId: venue.id,
                    targetName: venue.name,
                  })
                }
              />
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
            <MaterialIcons name="calendar-today" size={18} color={colors.textPrimary} />
            <Text style={{ ...headerTitleMedium, color: colors.textPrimary, marginLeft: spacing.sm }}>
              Availability Calendar
            </Text>
          </View>
          {availabilityLoading ? (
            <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
              <ActivityIndicator color={colors.textPrimary} />
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
                      <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary, flex: 1 }}>
                        {formatAvailabilityDate(entry.date)}
                      </Text>
                      <Text style={{ ...typography.captionBold, color: isAvailable ? '#166534' : '#991B1B' }}>
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
              <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary, marginTop: spacing.md }}>
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
              backgroundColor: colors.cta,
              paddingVertical: spacing.md,
              borderRadius: radii.md,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
            }}
          >
            <MaterialIcons name="calendar-today" size={16} color="#FFFFFF" />
            <Text style={{ ...typography.bodySemiBold, color: '#FFFFFF', marginLeft: spacing.sm }}>
              Contact for Availability
            </Text>
          </TouchableOpacity>
        </View>
      )}

          </>
  );

const renderSidebar = () => (
    <View
      style={{
        flex: 1,
        gap: spacing.lg,
      } as any}
    >
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: colors.outlineVariant,
          padding: spacing.lg,
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 3 },
        }}
      >
        <View style={{ marginBottom: spacing.lg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, paddingRight: spacing.md }}>
              <Text style={{ ...typography.headlineMd, color: colors.primary }}>
                {venue.venue_capacity ? `Up to ${venue.venue_capacity} guests` : 'Request a quote'}
              </Text>
              <Text style={{ ...typography.body, color: colors.onSurfaceVariant }}>
                {venue.venue_type || 'Venue'}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.md }}>
            <TouchableOpacity
              onPress={handleToggleFavourite}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: colors.outlineVariant,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.surfaceBg,
              }}
            >
              <MaterialIcons
                name={isFavourite ? 'favorite' : 'favorite-border'}
                size={20}
                color={isFavourite ? colors.coral : colors.outline}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleShare}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: colors.outlineVariant,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.surfaceBg,
              }}
            >
              <MaterialIcons name="share" size={20} color={colors.outline} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ gap: spacing.sm }}>
          <TouchableOpacity
            onPress={handleRequestQuote}
            style={{
              backgroundColor: colors.primary,
              paddingVertical: spacing.md,
              borderRadius: radii.md,
              alignItems: 'center',
            }}
          >
            <Text style={{ ...typography.bodySemiBold, color: '#FFFFFF' }}>Request Quote</Text>
          </TouchableOpacity>
          {canBookTours && (
            <TouchableOpacity
              onPress={() => navigation.navigate('BookTour', { venueId: venue.id, venueName: venue.name })}
              style={{
                paddingVertical: spacing.md,
                borderRadius: radii.md,
                backgroundColor: colors.primary,
                alignItems: 'center',
              }}
            >
              <Text style={{ ...typography.bodyBold, color: '#FFFFFF' }}>Book a Tour</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ borderTopWidth: 1, borderTopColor: colors.outlineVariant, paddingTop: spacing.lg, marginTop: spacing.lg }}>
          {/* Venue identity row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md }}>
            {venue.image_url ? (
              <View style={{ width: 48, height: 48, borderRadius: 24, overflow: 'hidden', backgroundColor: colors.surfaceBg }}>
                <Image source={{ uri: venue.image_url }} style={{ width: '100%', height: '100%' }} />
              </View>
            ) : (
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surfaceBg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.outlineVariant }}>
                <MaterialIcons name="location-city" size={24} color={colors.outline} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary }}>{venue.name}</Text>
              {venue.venue_type ? (
                <Text style={{ ...typography.caption, color: colors.onSurfaceVariant }}>{venue.venue_type}</Text>
              ) : null}
            </View>
          </View>

          {/* Address */}
          {physicalAddress ? (
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.sm }}>
              <MaterialIcons name="place" size={16} color={colors.outline} style={{ marginTop: 2 } as any} />
              <Text style={{ ...typography.caption, color: colors.onSurfaceVariant, flex: 1, lineHeight: 18 }}>
                {physicalAddress}
              </Text>
            </View>
          ) : null}

          {/* Contact details */}
          <View style={{ gap: spacing.sm, marginTop: physicalAddress ? spacing.xs : 0 }}>
            {venue.whatsapp_number ? (
              <TouchableOpacity
                onPress={() => handleOpenUrl(whatsappUrl)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
              >
                <MaterialIcons name="phone" size={16} color={colors.primaryTeal} />
                <Text style={{ ...typography.caption, color: colors.primaryTeal }}>
                  {venue.whatsapp_number}
                </Text>
              </TouchableOpacity>
            ) : null}

            {venue.contact_email ? (
              <TouchableOpacity
                onPress={() => handleOpenUrl(emailUrl)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
              >
                <MaterialIcons name="email" size={16} color={colors.primary} />
                <Text style={{ ...typography.caption, color: colors.primary }}>
                  {venue.contact_email}
                </Text>
              </TouchableOpacity>
            ) : null}

            {venue.website_url ? (
              <TouchableOpacity
                onPress={() => handleOpenUrl(venue.website_url!)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
              >
                <MaterialIcons name="language" size={16} color={colors.primary} />
                <Text style={{ ...typography.caption, color: colors.primary }} numberOfLines={1}>
                  {venue.website_url.replace(/^https?:\/\//, '')}
                </Text>
              </TouchableOpacity>
            ) : null}

            {venue.instagram_url ? (
              <TouchableOpacity
                onPress={() => handleOpenUrl(venue.instagram_url!)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
              >
                <MaterialIcons name="photo-camera" size={16} color={colors.primary} />
                <Text style={{ ...typography.caption, color: colors.primary }} numberOfLines={1}>
                  {venue.instagram_url.replace(/^https?:\/\/(www\.)?instagram\.com\//, '@').replace(/\/$/, '')}
                </Text>
              </TouchableOpacity>
            ) : null}

            {!venue.whatsapp_number && !venue.contact_email && !venue.website_url && !venue.instagram_url ? (
              <Text style={{ ...typography.caption, color: colors.textMuted }}>No contact details available</Text>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: isDesktop ? colors.surfaceBg : colors.background }}
      contentContainerStyle={isDesktop ? { paddingHorizontal: 48, paddingBottom: spacing.lg, paddingTop: spacing.xl, maxWidth: 1200, width: '100%', alignSelf: 'center' } : { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm }}
    >
      {isDesktop ? null : (
        <TouchableOpacity
          onPress={handleBackNavigation}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}
        >
          <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
          <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>
            Back
          </Text>
        </TouchableOpacity>
      )}

      {isDesktop ? (
        <View style={{ flexDirection: 'row', gap: 24 } as any}>
          <View style={{ flex: 2 } as any}>
            {renderMainContent()}
          </View>
          {renderSidebar()}
        </View>
      ) : (
        <>
          {renderMainContent()}
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
                ...headerTitleMedium,
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
        </>
      )}

      {alertState && (
        <ThemedAlert
          visible={alertState.visible}
          title={alertState.title}
          message={alertState.message}
          buttons={[{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }]}
          onDismiss={() => setAlertState(null)}
        />
      )}
    </ScrollView>
  );
}
