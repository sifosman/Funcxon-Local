import React from 'react';
import { Image, Linking, Platform, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, radii, typography } from '../../theme';
import { PrimaryButton } from '../ui';

type Props = {
  venue: {
    name: string;
    description: string | null;
    venue_type: string | null;
    venue_capacity: string | null;
    event_types: string[] | null;
    features: Record<string, any> | null;
    website_url: string | null;
    instagram_url: string | null;
    whatsapp_number: string | null;
    contact_email: string | null;
  };
  halls: { name: string; capacity: string }[];
  maxHallCapacity: number | null;
  physicalAddress: string | null;
  contactNumber: string | null;
  mapQuery: string;
  whatsappUrl: string | null;
  emailUrl: string | null;
  venueContactEmail: string | null;
  webMapEmbedUrl: string | null;
  mapCoordinates: { latitude: number; longitude: number } | null;
  mapSearchTarget: string;
  nativeMapHtml: string | null;
  staticMapUrl: string | null;
  mapImageFailed: boolean;
  canBookTours: boolean;
  handleOpenUrl: (url?: string | null) => void;
  handleOpenMap: () => void;
  setMapImageFailed: (v: boolean) => void;
  handleRequestQuote: () => void;
  setActiveTab: (tab: 'about' | 'amenities' | 'reviews' | 'catalogue') => void;
  navigation: any;
  venueId: number;
};

const headerTitleMedium = { ...typography.titleMedium, fontFamily: 'Montserrat_600SemiBold' as const };

const renderBulletSection = (title: string, items?: string[] | null) => {
  if (!items || items.length === 0) return null;
  return (
    <View style={{ marginBottom: spacing.sm }}>
      <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary, marginBottom: spacing.xs }}>{title}</Text>
      {items.map((item) => (
        <View key={item} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.cta, marginRight: spacing.sm }} />
          <Text style={{ ...typography.caption, color: colors.textPrimary }}>{item}</Text>
        </View>
      ))}
    </View>
  );
};

const VenueAboutTab = React.memo(function VenueAboutTab({
  venue,
  halls,
  maxHallCapacity,
  physicalAddress,
  contactNumber,
  mapQuery,
  whatsappUrl,
  emailUrl,
  venueContactEmail,
  webMapEmbedUrl,
  mapCoordinates,
  nativeMapHtml,
  staticMapUrl,
  mapImageFailed,
  canBookTours,
  handleOpenUrl,
  handleOpenMap,
  setMapImageFailed,
  handleRequestQuote,
  setActiveTab,
  navigation,
  venueId,
}: Props) {
  const hasHallsOrCaps = Boolean(venue.venue_type || venue.venue_capacity || venue.event_types?.length || halls.length > 0);

  return (
    <View>
      {halls.length > 0 && (
        <View style={{ marginBottom: spacing.lg, padding: spacing.lg, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle }}>
          <Text style={{ ...headerTitleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>Halls & Capacities</Text>
          {halls.map((hall, idx) => (
            <View key={`${hall.name}-${idx}`} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm, gap: spacing.md }}>
              <Text style={{ ...typography.body, color: colors.textPrimary, flex: 1 }}>{hall.name || `Hall ${idx + 1}`}</Text>
              <Text style={{ ...typography.body, color: colors.textSecondary }}>{hall.capacity}</Text>
            </View>
          ))}
        </View>
      )}

      {venue.description ? (
        <View style={{ marginBottom: spacing.lg, padding: spacing.lg, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle }}>
          <Text style={{ ...headerTitleMedium, color: colors.textPrimary, marginBottom: spacing.sm }}>About - {venue.name}</Text>
          <Text style={{ ...typography.body, color: colors.textSecondary, lineHeight: 20 }}>{venue.description}</Text>
        </View>
      ) : (
        <View style={{ marginBottom: spacing.lg, padding: spacing.lg, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle }}>
          <Text style={{ ...typography.body, color: colors.textMuted }}>No description available.</Text>
        </View>
      )}

      {hasHallsOrCaps && (
        <View style={{ marginBottom: spacing.lg, padding: spacing.lg, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle }}>
          <Text style={{ ...headerTitleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>Features & Hall Capacities</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            <View style={{ width: '50%', paddingRight: spacing.sm }}>
              {venue.venue_type && (
                <View style={{ marginBottom: spacing.sm }}>
                  <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs }}>Venue Type</Text>
                  <Text style={{ ...typography.body, color: colors.textPrimary }}>{venue.venue_type}</Text>
                </View>
              )}
              {venue.venue_capacity && (
                <View style={{ marginBottom: spacing.sm }}>
                  <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs }}>Capacity</Text>
                  <Text style={{ ...typography.body, color: colors.textPrimary }}>{venue.venue_capacity} guests</Text>
                </View>
              )}
              {!venue.venue_capacity && maxHallCapacity && (
                <View style={{ marginBottom: spacing.sm }}>
                  <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs }}>Capacity</Text>
                  <Text style={{ ...typography.body, color: colors.textPrimary }}>Up to {maxHallCapacity} guests</Text>
                </View>
              )}
              {halls.length > 0 && (
                <View style={{ marginBottom: spacing.sm }}>
                  <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs }}>Hall Capacities</Text>
                  {halls.map((hall, idx) => (
                    <Text key={idx} style={{ ...typography.body, color: colors.textPrimary }}>{hall.name ? `${hall.name}: ` : ''}{hall.capacity || 'TBC'}</Text>
                  ))}
                </View>
              )}
            </View>
            <View style={{ width: '50%', paddingLeft: spacing.sm }}>
              {renderBulletSection('Event Types', venue.event_types)}
            </View>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={{ marginBottom: spacing.lg, gap: spacing.sm }}>
        <TouchableOpacity onPress={handleRequestQuote} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, borderRadius: radii.lg, backgroundColor: colors.primary, gap: spacing.sm }}>
          <MaterialIcons name="request-quote" size={20} color="#FFFFFF" />
          <Text style={{ ...typography.bodyBold, color: '#FFFFFF' }}>Request a Quote</Text>
        </TouchableOpacity>
        {canBookTours && (
          <TouchableOpacity onPress={() => navigation.navigate('BookTour', { venueId, venueName: venue.name })} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, borderRadius: radii.lg, backgroundColor: colors.accent, gap: spacing.sm }}>
            <MaterialIcons name="tour" size={20} color="#FFFFFF" />
            <Text style={{ ...typography.bodyBold, color: '#FFFFFF' }}>Book a Tour</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => setActiveTab('reviews')} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle, gap: spacing.sm }}>
          <MaterialIcons name="reviews" size={20} color={colors.textPrimary} />
          <Text style={{ ...typography.bodyBold, color: colors.textPrimary }}>View Reviews & Ratings</Text>
        </TouchableOpacity>
      </View>

      {/* Contact */}
      {(venue.whatsapp_number || venueContactEmail || venue.website_url || venue.instagram_url) && (
        <View style={{ marginBottom: spacing.lg, padding: spacing.lg, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle }}>
          <Text style={{ ...headerTitleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>Contact</Text>
          <View style={{ gap: spacing.sm }}>
            {venue.whatsapp_number && (
              <TouchableOpacity onPress={() => handleOpenUrl(whatsappUrl)} style={{ backgroundColor: '#22C55E', paddingVertical: spacing.md, borderRadius: radii.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="chat" size={18} color="#FFFFFF" />
                <Text style={{ ...typography.bodySemiBold, color: '#FFFFFF', marginLeft: spacing.sm }}>Contact via WhatsApp</Text>
              </TouchableOpacity>
            )}
            {venueContactEmail && (
              <TouchableOpacity onPress={() => handleOpenUrl(emailUrl)} style={{ backgroundColor: '#3B82F6', paddingVertical: spacing.md, borderRadius: radii.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="email" size={18} color="#FFFFFF" />
                <Text style={{ ...typography.bodySemiBold, color: '#FFFFFF', marginLeft: spacing.sm }}>Contact via Email</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Location & Map */}
      {(mapQuery || physicalAddress) && (
        <View style={{ marginBottom: spacing.lg, padding: spacing.lg, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
            <MaterialIcons name="place" size={18} color={colors.textPrimary} />
            <Text style={{ ...headerTitleMedium, color: colors.textPrimary, marginLeft: spacing.sm }}>Location</Text>
          </View>
          {physicalAddress && <Text style={{ ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm }}>{physicalAddress}</Text>}
          {contactNumber && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
              <MaterialIcons name="phone" size={16} color={colors.textPrimary} />
              <Text style={{ ...typography.body, color: colors.textSecondary, marginLeft: spacing.sm }}>{contactNumber}</Text>
            </View>
          )}
          <View style={{ height: 220, borderRadius: radii.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.borderSubtle, backgroundColor: colors.surfaceMuted, marginBottom: spacing.md }}>
            {Platform.OS === 'web' ? null : nativeMapHtml ? (
              !mapImageFailed && staticMapUrl ? (
                <Image source={{ uri: staticMapUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" onError={() => setMapImageFailed(true)} />
              ) : (
                <WebView source={{ html: nativeMapHtml }} style={{ width: '100%', height: '100%' }} originWhitelist={['*']} javaScriptEnabled domStorageEnabled setSupportMultipleWindows={false} startInLoadingState scrollEnabled={false} />
              )
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text style={{ ...typography.caption, color: colors.textMuted }}>Map unavailable</Text></View>
            )}
          </View>
          <TouchableOpacity onPress={handleOpenMap} style={{ paddingVertical: spacing.sm, borderRadius: radii.md, borderWidth: 1, borderColor: colors.primary, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
            <MaterialIcons name="map" size={16} color={colors.textPrimary} />
            <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary, marginLeft: spacing.sm }}>Open in Google Maps</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

export default VenueAboutTab;