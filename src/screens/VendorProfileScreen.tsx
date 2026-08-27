import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Dimensions, Image, Linking, Platform, ScrollView, Share, Text, TouchableOpacity, View } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import type { ICarouselInstance } from 'react-native-reanimated-carousel';
import ThemedAlert from '../components/ThemedAlert';
import { openExternalUrl } from '../utils/openUrl';
import NetworkImage from '../components/NetworkImage';
import ImageZoomModal, { type GalleryItem } from '../components/ImageZoomModal';
import VideoThumbnail from '../components/VideoThumbnail';
import { useQuery} from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WebView } from 'react-native-webview';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { supabase } from '../lib/supabaseClient';
import type { AttendeeStackParamList } from '../navigation/AttendeeNavigator';
import { colors, spacing, radii, typography } from '../theme';
import { PrimaryButton } from '../components/ui';
import { getFavourites, toggleFavourite } from '../lib/favourites';
import { useAuth } from '../auth/AuthContext';
import { useIsDesktop } from '../hooks/useIsDesktop';

import VendorAboutTab from '../components/profile/VendorAboutTab';
import VendorFeaturesTab from '../components/profile/VendorFeaturesTab';
import VendorReviewsTab from '../components/profile/VendorReviewsTab';
import VendorCalendarTab from '../components/profile/VendorCalendarTab';

type Props = NativeStackScreenProps<AttendeeStackParamList, 'VendorProfile'>;

const GOOGLE_MAPS_API_KEY = 'AIzaSyBjd1KYtTaAzxzdw5ayGwwMu5Sex-gKQLI';

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

type VendorRecord = {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  logo_url: string | null;
  price_range: string | null;
  rating: number | null;
  review_count: number | null;
  dietary_options: string[] | null;
  cuisine_types: string[] | null;
  subscription_tier: string | null;
  location: string | null;
  google_maps_link: string | null;
  website_url: string | null;
  instagram_url: string | null;
  whatsapp_number: string | null;
  email: string | null;
  amenities: string[] | null;
  service_options: string[] | null;
  additional_photos: string[] | null;
  vendor_tags: string[] | null;
  venue_capacity: number | null;
  address_line_1: string | null;
  address_line_2: string | null;
  suburb: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
};

type Review = {
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

export default function VendorProfileScreen({ route, navigation }: Props) {
  const { vendorId } = route.params;
  const [activeTab, setActiveTab] = useState<'about' | 'features' | 'reviews' | 'calendar'>('about');
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [zoomVisible, setZoomVisible] = useState(false);
  const [zoomInitialIndex, setZoomInitialIndex] = useState(0);
  const carouselRef = useRef<ICarouselInstance>(null);
  const [mapImageFailed, setMapImageFailed] = useState(false);
  const [galleryContainerWidth, setGalleryContainerWidth] = useState(Dimensions.get('window').width);
  const [favouriteIds, setFavouriteIds] = useState<{ vendorIds: number[]; venueIds: number[] }>({
    vendorIds: [],
    venueIds: [],
  });
  const [alertState, setAlertState] = useState<{visible: boolean; title: string; message: string} | null>(null);
  const { user, session } = useAuth();
  const isDesktop = useIsDesktop();

  const goToQuoteRequest = () => {
    if (!vendor) return;
    if (!session) {
      (navigation as any).getParent()?.getParent()?.navigate('Auth', { screen: 'SignIn' });
      return;
    }
    navigation.navigate('QuoteRequest', {
      vendorId: vendor.id,
      vendorName: name,
    });
  };

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
    data: vendor,
    isLoading: vendorLoading,
    error: vendorError,
  } = useQuery<VendorRecord>({
    queryKey: ['vendor', vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', vendorId)
        .single();

      if (error) {
        throw error;
      }

      return data as VendorRecord;
    },
  });

  const {
    data: reviews,
    isLoading: reviewsLoading,
    error: reviewsError,
  } = useQuery<Review[]>({
    queryKey: ['reviews', vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('id, rating, title, review_text, is_verified, created_at, status')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        throw error;
      }

      return (data as Review[]) ?? [];
    },
  });

  const {
    data: galleryMedia,
    isLoading: galleryMediaLoading,
  } = useQuery<GalleryMedia[]>({
    queryKey: ['vendor-gallery-media', vendorId],
    enabled: !!vendorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gallery_media')
        .select('id, media_url, media_type, sort_order')
        .eq('vendor_id', vendorId)
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
    queryKey: ['vendor-availability', vendorId],
    enabled: !!vendorId,
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from('vendor_availability_calendar')
        .select('id, date, is_available, availability_type, time_slots, notes')
        .eq('vendor_id', vendorId)
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
    if (vendor?.location?.trim()) {
      return vendor.location.trim();
    }
    const city = vendor?.city?.trim() ?? '';
    const province = vendor?.province?.trim() ?? '';
    if (city || province) {
      return `${city}${city && province ? ', ' : ''}${province}`;
    }
    return '';
  }, [vendor?.location, vendor?.city, vendor?.province]);

  const physicalAddress = useMemo(() => {
    const hasStreetAddress = Boolean(vendor?.address_line_1?.trim());

    if (hasStreetAddress) {
      const structured = [
        vendor?.address_line_1,
        vendor?.address_line_2,
        vendor?.suburb,
        vendor?.city,
        vendor?.province,
        vendor?.postal_code,
        vendor?.country,
      ]
        .map((part) => part?.trim() ?? '')
        .filter(Boolean)
        .join(', ');

      if (structured) {
        return structured;
      }
    }

    if (vendor?.location?.trim()) {
      return vendor.location.trim();
    }

    const city = vendor?.city?.trim() ?? '';
    const province = vendor?.province?.trim() ?? '';
    const fallback = [city, province].filter(Boolean).join(', ');
    return fallback || null;
  }, [vendor?.address_line_1, vendor?.address_line_2, vendor?.city, vendor?.country, vendor?.location, vendor?.postal_code, vendor?.province, vendor?.suburb]);

  const mapCoordinates = useMemo(() => {
    const lat = vendor?.latitude;
    const lng = vendor?.longitude;
    
    const latitude = typeof lat === 'number' ? lat : typeof lat === 'string' ? parseFloat(lat) : null;
    const longitude = typeof lng === 'number' ? lng : typeof lng === 'string' ? parseFloat(lng) : null;

    if (latitude == null || longitude == null || isNaN(latitude) || isNaN(longitude)) {
      return null;
    }

    return { latitude, longitude };
  }, [vendor?.latitude, vendor?.longitude]);

  const mapSearchTarget = mapQuery || physicalAddress;

  useEffect(() => {
    setMapImageFailed(false);
  }, [mapCoordinates?.latitude, mapCoordinates?.longitude, mapQuery]);

  const nativeMapHtml = useMemo(() => {
    if (!mapCoordinates && !mapSearchTarget) return null;
    
    const safeQuery = String(mapSearchTarget || 'South Africa').replace(/"/g, '\\"');
    const safeTitle = String(vendor?.name || 'Location').replace(/"/g, '\\"');
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
            const fallbackEmbed = 'https://maps.google.com/maps?q=${encodedQuery}&t=&z=14&ie=UTF8&iwloc=&output=embed';
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
  }, [mapCoordinates, mapSearchTarget, vendor?.name]);

  const galleryItems = useMemo<GalleryItem[]>(() => {
    const legacyImages = [vendor?.image_url, ...(Array.isArray(vendor?.additional_photos) ? vendor.additional_photos : [])].filter(Boolean) as string[];
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
  }, [galleryMedia, vendor?.image_url, vendor?.additional_photos]);

  const tagArrays: string[][] = [
    Array.isArray(vendor?.vendor_tags) ? vendor.vendor_tags : [],
    Array.isArray(vendor?.dietary_options) ? vendor.dietary_options : [],
    Array.isArray(vendor?.cuisine_types) ? vendor.cuisine_types : [],
    Array.isArray(vendor?.amenities) ? vendor.amenities : [],
    Array.isArray(vendor?.service_options) ? vendor.service_options : [],
  ];
  const tags = Array.from(new Set(tagArrays.flat().filter(Boolean))) ?? [];

  const hasReviews = !!reviews && reviews.length > 0;
  const averageRating = typeof vendor?.rating === 'number'
    ? vendor.rating
    : hasReviews && reviews
      ? reviews.reduce((sum, r) => sum + (r?.rating ?? 0), 0) / reviews.length
      : null;
  const reviewCount = typeof vendor?.review_count === 'number'
    ? vendor.review_count
    : hasReviews && reviews
      ? reviews.length
      : 0;
  const ratingBreakdown = useMemo(() => {
    const base = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) return base;
    return reviews.reduce((acc, review) => {
      const rating = Math.round(review?.rating ?? 0) as 1 | 2 | 3 | 4 | 5;
      if (rating >= 1 && rating <= 5) {
        acc[rating] = (acc[rating] ?? 0) + 1;
      }
      return acc;
    }, { ...base });
  }, [reviews]);
  const ratingSummaryValue = averageRating ? averageRating.toFixed(1) : '0.0';
  const ratingSummaryCount = reviewCount || 0;
  const ratingCategories = [
    { label: 'Efficiency', value: averageRating ?? 0 },
    { label: 'Professionalism', value: averageRating ?? 0 },
    { label: 'Condition of Goods', value: averageRating ?? 0 },
    { label: 'Staff Competency', value: averageRating ?? 0 },
    { label: 'Cleanliness', value: averageRating ?? 0 },
    { label: 'Attention to Detail', value: averageRating ?? 0 },
    { label: 'Communication', value: averageRating ?? 0 },
  ];

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
    if (!vendor?.id) return;
    if (!user?.id) {
      setAlertState({ visible: true, title: 'Sign in required', message: 'Please sign in to save favourites.' });
      return;
    }

    const previous = favouriteIds;
    const isCurrentlyFavourite = previous.vendorIds.includes(vendor.id);
    const optimisticNext = {
      ...previous,
      vendorIds: isCurrentlyFavourite
        ? previous.vendorIds.filter((vendorId) => vendorId !== vendor.id)
        : [...previous.vendorIds, vendor.id],
    };

    setFavouriteIds(optimisticNext);

    try {
      const next = await toggleFavourite(user, vendor.id, 'vendor');
      setFavouriteIds(next);
    } catch (error) {
      setFavouriteIds(previous);
      const message = error instanceof Error ? error.message : 'We could not update favourites right now.';
      setAlertState({ visible: true, title: 'Favourite update failed', message });
    }
  };

  const handleShare = async () => {
    if (!vendor) return;
    const url = `https://funxon-web.vercel.app/vendor/${vendor.id}`;
    const message = encodeURIComponent(`Check out ${vendor.name} on Funxon: ${url}`);
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
        await Share.share({ message: `Check out ${vendor.name} on Funxon! ${url}`, title: vendor.name });
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const handleOpenMap = () => {
    if (!mapCoordinates && !physicalAddress && !vendor?.google_maps_link) return;
    const mapsUrl = vendor?.google_maps_link
      ? vendor.google_maps_link
      : mapCoordinates
        ? `https://www.google.com/maps/search/?api=1&query=${mapCoordinates.latitude},${mapCoordinates.longitude}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapSearchTarget ?? '')}`;
    Linking.openURL(mapsUrl).catch(() => null);
  };

  const handleOpenUrl = (url?: string | null) => {
    openExternalUrl(url);
  };

  const whatsappUrl = vendor?.whatsapp_number
    ? `https://wa.me/${String(vendor.whatsapp_number).replace(/[^0-9]/g, '')}`
    : null;
  const contactNumber = vendor?.whatsapp_number?.trim() || null;
  const contactEmail = vendor?.email?.trim() || (vendor as any)?.billing_email?.trim() || null;
  const emailUrl = contactEmail ? `mailto:${contactEmail}` : null;
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

  if (vendorLoading) {
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

  if (vendorError instanceof Error) {
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
        <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>Failed to load vendor.</Text>
        <Text style={{ marginTop: spacing.sm, ...typography.body, color: colors.textMuted }}>{vendorError.message}</Text>
      </View>
    );
  }

  if (!vendor) {
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
        <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>Vendor not found.</Text>
      </View>
    );
  }

  const name: string = vendor.name ?? 'Vendor';
  const description: string | null = vendor.description;

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
        <View style={{ flexDirection: 'row', alignItems: isDesktop ? 'flex-start' : 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: spacing.md }}>
            <Text style={{ ...(isDesktop ? typography.headlineMd : typography.titleLarge), color: colors.primary }}>{name}</Text>
          </View>
          {/* On desktop, fav/share are in the sidebar; on mobile show here */}
          {!isDesktop && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={handleToggleFavourite}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: spacing.sm,
                }}
              >
                <MaterialIcons
                  name={favouriteIds.vendorIds.includes(vendor.id) ? 'favorite' : 'favorite-border'}
                  size={18}
                  color={favouriteIds.vendorIds.includes(vendor.id) ? colors.coral : colors.textMuted}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleShare}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: vendor.logo_url ? spacing.sm : 0,
                }}
              >
                <MaterialIcons name="share" size={18} color={colors.textMuted} />
              </TouchableOpacity>
              {vendor.logo_url && (
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: colors.surfaceMuted,
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                  }}
                >
                  <Image source={{ uri: vendor.logo_url }} style={{ width: '100%', height: '100%' }} />
                </View>
              )}
            </View>
          )}
        </View>

        {physicalAddress && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm }}>
            <MaterialIcons name="place" size={16} color={colors.textMuted} />
            <Text style={{ ...typography.body, color: colors.textSecondary, marginLeft: 6 }}>{physicalAddress}</Text>
          </View>
        )}

        {/* Show rating row on mobile */}
        {!isDesktop && averageRating !== null && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs }}>
            <MaterialIcons name="star" size={16} color="#F59E0B" />
            <Text style={{ ...typography.body, color: colors.textSecondary, marginLeft: 6 }}>
              {averageRating.toFixed(1)} / 5 · {reviewCount} review{reviewCount === 1 ? '' : 's'}
            </Text>
          </View>
        )}
        {/* On desktop always show full rating below name */}
        {isDesktop && averageRating !== null && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs }}>
            <MaterialIcons name="star" size={16} color="#F59E0B" />
            <Text style={{ ...typography.body, color: colors.textSecondary, marginLeft: 6 }}>
              {averageRating.toFixed(1)} / 5 · {reviewCount} review{reviewCount === 1 ? '' : 's'}
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
          { key: 'features', label: 'Features' },
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
        <VendorAboutTab
          name={name}
          description={description}
          tags={tags}
          physicalAddress={physicalAddress}
          contactNumber={contactNumber}
          mapQuery={mapQuery}
          whatsappUrl={whatsappUrl}
          emailUrl={emailUrl}
          vendor={vendor}
          contactEmail={contactEmail}
          webMapEmbedUrl={webMapEmbedUrl}
          mapCoordinates={mapCoordinates}
          mapSearchTarget={mapSearchTarget ?? ''}
          nativeMapHtml={nativeMapHtml}
          staticMapUrl={staticMapUrl}
          mapImageFailed={mapImageFailed}
          handleOpenUrl={handleOpenUrl}
          handleOpenMap={handleOpenMap}
          setMapImageFailed={setMapImageFailed}
        />
      )}

            {activeTab === 'features' && (
        <VendorFeaturesTab
          vendor={vendor}
          whatsappUrl={whatsappUrl}
          emailUrl={emailUrl}
          goToQuoteRequest={goToQuoteRequest}
          handleOpenUrl={handleOpenUrl}
          setAlertState={setAlertState}
        />
      )}

            {activeTab === 'reviews' && (
        <VendorReviewsTab
          reviews={reviews}
          reviewsLoading={reviewsLoading}
          reviewsError={reviewsError ?? null}
          ratingSummaryValue={ratingSummaryValue}
          ratingSummaryCount={ratingSummaryCount}
          averageRating={averageRating}
          ratingBreakdown={ratingBreakdown}
          ratingCategories={ratingCategories}
          user={user ?? null}
          navigation={navigation}
          vendorId={vendor.id}
          name={name}
        />
      )}

            {activeTab === 'calendar' && (
        <VendorCalendarTab
          availability={availability}
          availabilityLoading={availabilityLoading}
          name={name}
          whatsappUrl={whatsappUrl}
          emailUrl={emailUrl}
          handleOpenUrl={handleOpenUrl}
          goToQuoteRequest={goToQuoteRequest}
        />
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
                Request a quote
              </Text>
              <Text style={{ ...typography.body, color: colors.onSurfaceVariant }}>
                Pricing details
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
                name={favouriteIds.vendorIds.includes(vendor.id) ? 'favorite' : 'favorite-border'}
                size={20}
                color={favouriteIds.vendorIds.includes(vendor.id) ? colors.coral : colors.outline}
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
            onPress={goToQuoteRequest}
            style={{
              backgroundColor: colors.primary,
              paddingVertical: spacing.md,
              borderRadius: radii.md,
              alignItems: 'center',
            }}
          >
            <Text style={{ ...typography.bodySemiBold, color: '#FFFFFF' }}>Request Quote</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (whatsappUrl) {
                handleOpenUrl(whatsappUrl);
              } else if (emailUrl) {
                handleOpenUrl(emailUrl);
              } else {
                setAlertState({ visible: true, title: 'Contact', message: 'No contact details available.' });
              }
            }}
            style={{
              paddingVertical: spacing.md,
              borderRadius: radii.md,
              borderWidth: 2,
              borderColor: colors.primary,
              alignItems: 'center',
            }}
          >
            <Text style={{ ...typography.bodySemiBold, color: colors.primary }}>Contact Vendor</Text>
          </TouchableOpacity>
        </View>

        <View style={{ borderTopWidth: 1, borderTopColor: colors.outlineVariant, paddingTop: spacing.lg, marginTop: spacing.lg }}>
          {/* Vendor identity row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md }}>
            {vendor.logo_url ? (
              <View style={{ width: 48, height: 48, borderRadius: 24, overflow: 'hidden', backgroundColor: colors.surfaceBg }}>
                <Image source={{ uri: vendor.logo_url }} style={{ width: '100%', height: '100%' }} />
              </View>
            ) : (
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surfaceBg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.outlineVariant }}>
                <MaterialIcons name="store" size={24} color={colors.outline} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary }}>{name}</Text>
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
            {vendor.whatsapp_number ? (
              <TouchableOpacity
                onPress={() => handleOpenUrl(whatsappUrl)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
              >
                <MaterialIcons name="phone" size={16} color={colors.primaryTeal} />
                <Text style={{ ...typography.caption, color: colors.primaryTeal }}>
                  {vendor.whatsapp_number}
                </Text>
              </TouchableOpacity>
            ) : null}

            {contactEmail ? (
              <TouchableOpacity
                onPress={() => handleOpenUrl(emailUrl)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
              >
                <MaterialIcons name="email" size={16} color={colors.primary} />
                <Text style={{ ...typography.caption, color: colors.primary }}>
                  {contactEmail}
                </Text>
              </TouchableOpacity>
            ) : null}

            {vendor.website_url ? (
              <TouchableOpacity
                onPress={() => handleOpenUrl(vendor.website_url!)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
              >
                <MaterialIcons name="language" size={16} color={colors.primary} />
                <Text style={{ ...typography.caption, color: colors.primary }} numberOfLines={1}>
                  {vendor.website_url.replace(/^https?:\/\//, '')}
                </Text>
              </TouchableOpacity>
            ) : null}

            {vendor.instagram_url ? (
              <TouchableOpacity
                onPress={() => handleOpenUrl(vendor.instagram_url!)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
              >
                <MaterialIcons name="photo-camera" size={16} color={colors.primary} />
                <Text style={{ ...typography.caption, color: colors.primary }} numberOfLines={1}>
                  {vendor.instagram_url.replace(/^https?:\/\/(www\.)?instagram\.com\//, '@').replace(/\/$/, '')}
                </Text>
              </TouchableOpacity>
            ) : null}

            {!vendor.whatsapp_number && !vendor.email && !vendor.website_url && !vendor.instagram_url ? (
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
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity
          onPress={handleBackNavigation}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}
        >
          <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
          <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>
            Back
          </Text>
        </TouchableOpacity>

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
                ...typography.titleMedium,
                color: colors.textPrimary,
                marginBottom: spacing.sm,
              }}
            >
              Request a quote
            </Text>
            <Text style={{ ...typography.body, color: colors.textSecondary, marginBottom: spacing.md }}>
              Share your event details and request a custom quote from this vendor.
            </Text>
            <PrimaryButton
              title="Request a quote"
              onPress={goToQuoteRequest}
            />
            <TouchableOpacity
              onPress={() => {
                if (whatsappUrl) {
                  handleOpenUrl(whatsappUrl);
                } else if (emailUrl) {
                  handleOpenUrl(emailUrl);
                } else {
                  setAlertState({ visible: true, title: 'Contact', message: 'No contact details available for this vendor.' });
                }
              }}
              style={{
                marginTop: spacing.sm,
                paddingVertical: spacing.md,
                borderRadius: radii.md,
                borderWidth: 2,
                borderColor: colors.cta,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
              }}
            >
              <MaterialIcons name="calendar-today" size={16} color={colors.cta} />
              <Text style={{ ...typography.bodySemiBold, color: colors.cta, marginLeft: spacing.sm }}>Contact for Availability</Text>
            </TouchableOpacity>
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
