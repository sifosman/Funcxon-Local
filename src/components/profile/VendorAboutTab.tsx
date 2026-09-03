import React from 'react';
import { Image, Linking, Platform, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, radii, typography } from '../../theme';

type Props = {
  name: string;
  description: string | null;
  tags: string[];
  physicalAddress: string | null;
  contactNumber: string | null;
  mapQuery: string;
  whatsappUrl: string | null;
  emailUrl: string | null;
  vendor: { website_url?: string | null; instagram_url?: string | null };
  contactEmail: string | null;
  webMapEmbedUrl: string | null;
  mapCoordinates: { latitude: number; longitude: number } | null;
  mapSearchTarget: string;
  nativeMapHtml: string | null;
  staticMapUrl: string | null;
  mapImageFailed: boolean;
  handleOpenUrl: (url?: string | null) => void;
  handleOpenMap: () => void;
  setMapImageFailed: (v: boolean) => void;
};

const VendorAboutTab = React.memo(function VendorAboutTab({
  name,
  description,
  tags,
  physicalAddress,
  contactNumber,
  mapQuery,
  whatsappUrl,
  emailUrl,
  vendor,
  webMapEmbedUrl,
  mapCoordinates,
  nativeMapHtml,
  staticMapUrl,
  mapImageFailed,
  handleOpenUrl,
  handleOpenMap,
  setMapImageFailed,
}: Props) {
  return (
    <View>
      {description && (
        <View style={{ marginBottom: spacing.lg, padding: spacing.lg, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle }}>
          <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.sm }}>About - {name}</Text>
          <Text style={{ ...typography.body, color: colors.textSecondary, lineHeight: 20 }}>{description}</Text>
        </View>
      )}
      {tags.length > 0 && (
        <View style={{ marginBottom: spacing.lg, padding: spacing.lg, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle }}>
          <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.sm }}>Highlights</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {tags.map((tag) => (
              <View key={tag} style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radii.full, backgroundColor: colors.surfaceMuted, marginRight: spacing.sm, marginBottom: spacing.sm }}>
                <Text style={{ ...typography.caption, color: colors.textPrimary }}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      {(whatsappUrl || emailUrl || vendor.website_url || vendor.instagram_url) && (
        <View style={{ marginBottom: spacing.lg, padding: spacing.lg, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle }}>
          <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>Contact</Text>
          <View style={{ gap: spacing.sm }}>
            {whatsappUrl && (
              <TouchableOpacity onPress={() => handleOpenUrl(whatsappUrl)} style={{ backgroundColor: '#22C55E', paddingVertical: spacing.md, borderRadius: radii.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="chat" size={18} color="#FFFFFF" />
                <Text style={{ ...typography.bodySemiBold, color: '#FFFFFF', marginLeft: spacing.sm }}>Contact via WhatsApp</Text>
              </TouchableOpacity>
            )}
            {emailUrl && (
              <TouchableOpacity onPress={() => handleOpenUrl(emailUrl)} style={{ backgroundColor: '#3B82F6', paddingVertical: spacing.md, borderRadius: radii.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="email" size={18} color="#FFFFFF" />
                <Text style={{ ...typography.bodySemiBold, color: '#FFFFFF', marginLeft: spacing.sm }}>Contact via Email</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
      {(mapQuery || physicalAddress) && (
        <View style={{ marginBottom: spacing.lg, padding: spacing.lg, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
            <MaterialIcons name="place" size={18} color={colors.textPrimary} />
            <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginLeft: spacing.sm }}>Location</Text>
          </View>
          {physicalAddress && <Text style={{ ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm }}>{physicalAddress}</Text>}
          {contactNumber && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
              <MaterialIcons name="phone" size={16} color={colors.textPrimary} />
              <Text style={{ ...typography.body, color: colors.textSecondary, marginLeft: spacing.sm }}>{contactNumber}</Text>
            </View>
          )}
          <View style={{ height: 220, borderRadius: radii.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.borderSubtle, backgroundColor: colors.surfaceMuted, marginBottom: spacing.md }}>
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
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}
              >
                <MaterialIcons name="place" size={32} color={colors.primary} />
                {physicalAddress ? (
                  <Text style={{ ...typography.caption, color: colors.textSecondary, textAlign: 'center', marginTop: 4 }}>
                    {physicalAddress}
                  </Text>
                ) : null}
                <Text style={{ ...typography.caption, color: colors.primary, marginTop: 4 }}>
                  Open in Google Maps
                </Text>
              </TouchableOpacity>
            )
          ) : nativeMapHtml ? (
              !mapImageFailed && staticMapUrl ? (
                <Image source={{ uri: staticMapUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" onError={() => setMapImageFailed(true)} />
              ) : (
                <WebView source={{ html: nativeMapHtml }} style={{ width: '100%', height: '100%' }} originWhitelist={['*']} javaScriptEnabled domStorageEnabled setSupportMultipleWindows={false} startInLoadingState scrollEnabled={false} />
              )
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ ...typography.caption, color: colors.textMuted }}>Map unavailable</Text>
              </View>
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

export default VendorAboutTab;