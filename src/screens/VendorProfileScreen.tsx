import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Dimensions, Image, Linking, Platform, ScrollView, Share, Text, TouchableOpacity, View } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import type { ICarouselInstance } from 'react-native-reanimated-carousel';
import ThemedAlert from '../components/ThemedAlert';
import NetworkImage from '../components/NetworkImage';
import ImageZoomModal, { type GalleryItem } from '../components/ImageZoomModal';
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
  const [favouriteIds, setFavouriteIds] = useState<{ vendorIds: number[]; venueIds: number[] }>({
    vendorIds: [],
    venueIds: [],
  });
  const [alertState, setAlertState] = useState<{visible: boolean; title: string; message: string} | null>(null);
  const { user, session } = useAuth();

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
        .select('id, rating, status')
        .eq('vendor_id', vendorId)
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
    if (galleryMedia && galleryMedia.length > 0) {
      return galleryMedia.map((m) => ({ url: m.media_url, type: m.media_type }));
    }
    const legacyImages = [vendor?.image_url, ...(Array.isArray(vendor?.additional_photos) ? vendor.additional_photos : [])].filter(Boolean) as string[];
    return legacyImages.map((url) => ({ url, type: 'image' as const }));
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
    if (!url) return;
    Linking.openURL(url).catch(() => null);
  };

  const whatsappUrl = vendor?.whatsapp_number
    ? `https://wa.me/${String(vendor.whatsapp_number).replace(/[^0-9]/g, '')}`
    : null;
  const contactNumber = vendor?.whatsapp_number?.trim() || null;
  const emailUrl = vendor?.email ? `mailto:${vendor.email}` : null;
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
                backgroundColor: colors.textPrimary,
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

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm }}
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
            <Text style={{ ...typography.titleLarge, color: colors.primary }}>{name}</Text>
            {vendor.subscription_tier && (
              <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: 4 }}>
                Subscription: {vendor.subscription_tier}
              </Text>
            )}
          </View>
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
                color={favouriteIds.vendorIds.includes(vendor.id) ? colors.primaryTeal : colors.textMuted}
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
        </View>

        {physicalAddress && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm }}>
            <MaterialIcons name="place" size={16} color={colors.textMuted} />
            <Text style={{ ...typography.body, color: colors.textSecondary, marginLeft: 6 }}>{physicalAddress}</Text>
          </View>
        )}

        {averageRating !== null && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs }}>
            <MaterialIcons name="star" size={16} color="#F59E0B" />
            <Text style={{ ...typography.body, color: colors.textSecondary, marginLeft: 6 }}>
              {averageRating.toFixed(1)} / 5 · {reviewCount} review{reviewCount === 1 ? '' : 's'}
            </Text>
          </View>
        )}
        {vendor.price_range && (
          <Text style={{ marginTop: spacing.xs, ...typography.body, color: colors.textSecondary }}>
            Price range: {vendor.price_range}
          </Text>
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
          {galleryItems.length > 0 ? (
            <>
              <Carousel
                ref={carouselRef}
                width={Dimensions.get('window').width}
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
                      <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }}>
                        <NetworkImage
                          uri={item.url}
                          style={{ width: '100%', height: '100%', position: 'absolute' }}
                          resizeMode="cover"
                          placeholderIcon="videocam"
                          useLogoFallback={false}
                        />
                        <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}>
                          <MaterialIcons name="play-arrow" size={32} color="#FFFFFF" />
                        </View>
                      </View>
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
        {galleryItems.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ padding: spacing.md }}
            snapToInterval={80 + spacing.sm}
            decelerationRate="fast"
          >
            {galleryItems.map((item, idx) => (
              <TouchableOpacity
                key={item.url + idx}
                onPress={() => {
                  setGalleryIndex(idx);
                  carouselRef.current?.scrollTo({ index: idx });
                }}
                style={{ marginRight: spacing.sm }}
              >
                <View style={{ position: 'relative' }}>
                  <NetworkImage
                    uri={item.url}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: radii.md,
                      backgroundColor: colors.surfaceMuted,
                      borderWidth: idx === galleryIndex ? 2 : 0,
                      borderColor: colors.textPrimary,
                    }}
                    resizeMode="cover"
                    placeholderIcon={item.type === 'video' ? 'videocam' : 'image'}
                    useLogoFallback={false}
                  />
                  {item.type === 'video' && (
                    <View style={{ position: 'absolute', top: '50%', left: '50%', marginLeft: -10, marginTop: -10, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}>
                      <MaterialIcons name="play-arrow" size={14} color="#FFFFFF" />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
                backgroundColor: isActive ? colors.textPrimary : 'transparent',
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
          {/* About */}
          {description && (
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
                About - {name}
              </Text>
              <Text style={{ ...typography.body, color: colors.textSecondary, lineHeight: 20 }}>{description}</Text>
            </View>
          )}

          {/* Tags / highlights */}
          {tags.length > 0 && (
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
                {tags?.map((tag) => (
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
          {(whatsappUrl || emailUrl || vendor.website_url || vendor.instagram_url) && (
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
                {whatsappUrl && (
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
                {emailUrl && (
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
                  borderColor: colors.textPrimary,
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

      {activeTab === 'features' && (
        <View>
          {/* Service Options */}
          {renderBulletSection('Service Options', vendor.service_options)}

          {/* Vendor Tags / Specialties */}
          {renderBulletSection('Specialties', vendor.vendor_tags)}

          {/* Dietary Options */}
          {renderBulletSection('Dietary Options', vendor.dietary_options)}

          {/* Cuisine Types */}
          {renderBulletSection('Cuisine Types', vendor.cuisine_types)}

          {/* Amenities */}
          {renderBulletSection('Amenities', vendor.amenities)}

          {/* Coverage areas */}
          {(vendor.province || vendor.city) && (
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
                Coverage Area
              </Text>
              {vendor.province && (
                <Text style={{ ...typography.body, color: colors.textPrimary, marginBottom: spacing.xs }}>
                  Province: {vendor.province}
                </Text>
              )}
              {vendor.city && (
                <Text style={{ ...typography.body, color: colors.textPrimary, marginBottom: spacing.xs }}>
                  City: {vendor.city}
                </Text>
              )}
              {(vendor.city || vendor.province) && (
                <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.sm }}>
                  Willing to travel to selected coverage areas.
                </Text>
              )}
            </View>
          )}

          {/* Request Quote CTA */}
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
              Quote Options
            </Text>
            <TouchableOpacity
              onPress={goToQuoteRequest}
              style={{
                backgroundColor: colors.textPrimary,
                paddingVertical: spacing.md,
                borderRadius: radii.md,
                alignItems: 'center',
                marginBottom: spacing.sm,
              }}
            >
              <Text style={{ ...typography.bodySemiBold, color: '#FFFFFF' }}>Request Quote</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {activeTab === 'reviews' && (
        <View>
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
            <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.sm }}>
              Overall Rating
            </Text>
            <Text style={{ ...typography.displayLarge, color: colors.textPrimary }}>{ratingSummaryValue}</Text>
            <View style={{ flexDirection: 'row', marginVertical: spacing.xs }}>
              {Array.from({ length: 5 }).map((_, index) => (
                <MaterialIcons
                  key={index}
                  name={averageRating && averageRating >= index + 1 ? 'star' : 'star-border'}
                  size={20}
                  color="#F59E0B"
                />
              ))}
            </View>
            <Text style={{ ...typography.caption, color: colors.textMuted }}>
              Based on {ratingSummaryCount} review{ratingSummaryCount === 1 ? '' : 's'}
            </Text>
            <View style={{ marginTop: spacing.md, width: '100%' }}>
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = ratingBreakdown[rating as 1 | 2 | 3 | 4 | 5] ?? 0;
                const progress = reviewCount ? count / reviewCount : 0;
                return (
                  <View key={rating} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={{ ...typography.caption, color: colors.textMuted, width: 16 }}>{rating}</Text>
                    <MaterialIcons name="star" size={14} color="#F59E0B" />
                    <View
                      style={{
                        flex: 1,
                        height: 6,
                        backgroundColor: colors.surfaceMuted,
                        borderRadius: 999,
                        marginHorizontal: spacing.sm,
                        overflow: 'hidden',
                      }}
                    >
                      <View style={{ width: `${progress * 100}%`, height: '100%', backgroundColor: colors.textPrimary }} />
                    </View>
                    <Text style={{ ...typography.caption, color: colors.textMuted, width: 20, textAlign: 'right' }}>
                      {count}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

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
              Rating Breakdown
            </Text>
            <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.md }}>
              Average ratings by category
            </Text>
            {ratingCategories.map((category) => (
              <View key={category.label} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                <Text style={{ ...typography.caption, color: colors.textPrimary, flex: 1 }}>{category.label}</Text>
                <View style={{ flexDirection: 'row', marginRight: spacing.sm }}>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <MaterialIcons
                      key={index}
                      name={category.value >= index + 1 ? 'star' : 'star-border'}
                      size={14}
                      color="#F59E0B"
                    />
                  ))}
                </View>
                <Text style={{ ...typography.caption, color: colors.textMuted }}>{category.value.toFixed(1)}</Text>
              </View>
            ))}
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
              <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.sm }}>
                Leave a review
              </Text>
              <Text style={{ ...typography.body, color: colors.textSecondary, marginBottom: spacing.md }}>
                Share your experience with this vendor. Reviews help other users make informed decisions.
              </Text>
              <PrimaryButton
                title="Leave a review"
                onPress={() =>
                  navigation.navigate('CreateReview', {
                    type: 'vendor',
                    targetId: vendor.id,
                    targetName: name,
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

          {/* Review functionality removed - only users who have used the service can leave reviews */}
          {/* This feature will be re-implemented with proper booking verification */}
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
            <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginLeft: spacing.sm }}>
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
                Contact {name} directly while calendar slots are being updated.
              </Text>
            </View>
          )}
          <TouchableOpacity
            onPress={() =>
              whatsappUrl
                ? handleOpenUrl(whatsappUrl)
                : emailUrl
                  ? handleOpenUrl(emailUrl)
                  : goToQuoteRequest()
            }
            style={{
              marginTop: spacing.md,
              backgroundColor: colors.textPrimary,
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
      </View>

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
