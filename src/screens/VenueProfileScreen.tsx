import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, Image, Linking, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { supabase } from '../lib/supabaseClient';
import type { AttendeeStackParamList } from '../navigation/AttendeeNavigator';
import { colors, spacing, radii, typography } from '../theme';
import { getFavourites, toggleFavourite } from '../lib/favourites';
import { useAuth } from '../auth/AuthContext';

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
  capacity: number | null;
  venue_type: string | null;
  amenities: string[] | null;
  website_url: string | null;
  instagram_url: string | null;
  whatsapp_number: string | null;
  email: string | null;
  additional_photos: string[] | null;
  subscription_status: string | null;
  subscription_plan: string | null;
  features: Record<string, any> | null;
};

export default function VenueProfileScreen({ route, navigation }: Props) {
  const { venueId } = route.params;
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'about' | 'amenities' | 'contact'>('about');
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

  const mapModule = useMemo(() => {
    if (Platform.OS === 'web') return null;
    try {
      return require('react-native-maps');
    } catch (error) {
      return null;
    }
  }, []);
  const MapViewComponent = mapModule?.default;
  const MarkerComponent = mapModule?.Marker;
  const GoogleProvider = mapModule?.PROVIDER_GOOGLE;

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

    const resolveLocation = async () => {
      if (!mapQuery || mapQuery.trim() === ', ') {
        setMapRegion(null);
        return;
      }

      try {
        const results = await Location.geocodeAsync(mapQuery);
        if (!isMounted) return;
        if (results.length > 0) {
          const { latitude, longitude } = results[0];
          setMapRegion({
            latitude,
            longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          });
        }
      } catch (error) {
        if (!isMounted) return;
        setMapError('Unable to load map location.');
      }
    };

    resolveLocation();
    return () => {
      isMounted = false;
    };
  }, [mapQuery]);

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

  const handleRequestQuote = () => {
    if (!venue) return;
    navigation.navigate('QuoteRequest', { 
      vendorId: venue.id, 
      vendorName: venue.name,
      type: 'venue' // Pass type to differentiate
    });
  };

  const handleBookTour = () => {
    if (!venue) return;
    navigation.navigate('BookTour', { 
      venueId: venue.id, 
      venueName: venue.name 
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

  const webMapEmbedUrl = mapQuery
    ? `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`
    : null;

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

        {venue.capacity && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs }}>
            <MaterialIcons name="people" size={16} color={colors.textMuted} />
            <Text style={{ ...typography.body, color: colors.textSecondary, marginLeft: 6 }}>
              Up to {venue.capacity} guests
            </Text>
          </View>
        )}

        {!venue.capacity && maxHallCapacity && (
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

      {/* Actions */}
      <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg }}>
        <TouchableOpacity
          onPress={handleRequestQuote}
          style={{
            flex: 1,
            backgroundColor: colors.primary,
            paddingVertical: spacing.md,
            borderRadius: radii.md,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Request Quote</Text>
        </TouchableOpacity>
        
        {canBookTours && (
          <TouchableOpacity
            onPress={handleBookTour}
            style={{
              flex: 1,
              backgroundColor: colors.primaryTeal,
              paddingVertical: spacing.md,
              borderRadius: radii.md,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Book Tour</Text>
          </TouchableOpacity>
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
          { key: 'contact', label: 'Contact' },
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
              {mapError && (
                <Text style={{ ...typography.caption, color: '#EF4444', marginBottom: spacing.sm }}>
                  {mapError}
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
                    <WebView source={{ uri: webMapEmbedUrl }} style={{ flex: 1 }} />
                  ) : (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ ...typography.caption, color: colors.textMuted }}>Map unavailable</Text>
                    </View>
                  )
                ) : mapRegion && MapViewComponent ? (
                  <MapViewComponent
                    style={{ flex: 1 }}
                    region={mapRegion}
                    provider={Platform.OS === 'android' ? GoogleProvider : undefined}
                  >
                    {MarkerComponent && (
                      <MarkerComponent
                        coordinate={{ latitude: mapRegion.latitude, longitude: mapRegion.longitude }}
                        title={venue.name}
                      />
                    )}
                  </MapViewComponent>
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
              {venue.amenities.map((item) => (
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

      {activeTab === 'contact' && (
        <View>
          {(venue.whatsapp_number || venue.email || (canShowLinks && (venue.website_url || venue.instagram_url))) ? (
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
                Contact Information
              </Text>
              <View style={{ gap: spacing.sm }}>
                {venue.whatsapp_number && (
                   <TouchableOpacity
                    onPress={() => handleOpenUrl(`https://wa.me/${venue.whatsapp_number?.replace(/[^0-9]/g, '')}`)}
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
                    <Text style={{ color: '#FFFFFF', fontWeight: '600', marginLeft: spacing.sm }}>WhatsApp</Text>
                  </TouchableOpacity>
                )}
                {venue.email && (
                  <TouchableOpacity
                    onPress={() => handleOpenUrl(`mailto:${venue.email}`)}
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
                    <Text style={{ color: '#FFFFFF', fontWeight: '600', marginLeft: spacing.sm }}>Email</Text>
                  </TouchableOpacity>
                )}
                {canShowLinks && venue.website_url && (
                   <TouchableOpacity
                    onPress={() => handleOpenUrl(venue.website_url)}
                    style={{
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.borderSubtle,
                      paddingVertical: spacing.md,
                      borderRadius: radii.md,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MaterialIcons name="language" size={18} color={colors.textPrimary} />
                    <Text style={{ color: colors.textPrimary, fontWeight: '600', marginLeft: spacing.sm }}>Website</Text>
                  </TouchableOpacity>
                )}
                {canShowLinks && venue.instagram_url && (
                   <TouchableOpacity
                    onPress={() => handleOpenUrl(venue.instagram_url)}
                    style={{
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.borderSubtle,
                      paddingVertical: spacing.md,
                      borderRadius: radii.md,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MaterialIcons name="photo-camera" size={18} color={colors.textPrimary} />
                    <Text style={{ color: colors.textPrimary, fontWeight: '600', marginLeft: spacing.sm }}>Instagram</Text>
                  </TouchableOpacity>
                )}
              </View>
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
              <Text style={{ ...typography.body, color: colors.textMuted }}>No direct contact information available.</Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}
