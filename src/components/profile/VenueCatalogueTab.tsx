import React from 'react';
import { ActivityIndicator, Linking, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import NetworkImage from '../NetworkImage';
import { colors, spacing, radii, typography } from '../../theme';

type CatalogueItem = {
  id: number;
  title: string;
  description: string | null;
  price: number | null;
  currency: string;
  image_url: string | null;
};

type VenueDocument = {
  id: number;
  document_url: string;
  file_name: string | null;
};

type Props = {
  catalogueItems: CatalogueItem[] | undefined;
  cataloguePdfs: VenueDocument[] | undefined;
  catalogueLoading: boolean;
  handleRequestQuote: () => void;
  navigation: any;
  venueId: number;
  name: string;
};

const headerTitleMedium = { ...typography.titleMedium, fontFamily: 'Montserrat_600SemiBold' as const };

const VenueCatalogueTab = React.memo(function VenueCatalogueTab({
  catalogueItems,
  cataloguePdfs,
  catalogueLoading,
  handleRequestQuote,
  navigation,
  venueId,
  name,
}: Props) {
  const hasItems = catalogueItems && catalogueItems.length > 0;
  const hasPdfs = cataloguePdfs && cataloguePdfs.length > 0;

  return (
    <View style={{ marginBottom: spacing.lg, padding: spacing.lg, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
        <MaterialIcons name="inventory-2" size={18} color={colors.textPrimary} />
        <Text style={{ ...headerTitleMedium, color: colors.textPrimary, marginLeft: spacing.sm }}>Catalogue</Text>
      </View>

      {catalogueLoading ? (
        <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}><ActivityIndicator color={colors.textPrimary} /></View>
      ) : hasItems || hasPdfs ? (
        <>
          {hasItems && (
            <View style={{ gap: spacing.sm, marginBottom: hasPdfs ? spacing.lg : 0 }}>
              {catalogueItems!.map((item) => (
                <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.borderSubtle, gap: spacing.md }}>
                  {item.image_url ? (
                    <NetworkImage uri={item.image_url} style={{ width: 56, height: 56, borderRadius: radii.sm }} resizeMode="cover" />
                  ) : (
                    <View style={{ width: 56, height: 56, borderRadius: radii.sm, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
                      <MaterialIcons name="image" size={24} color={colors.textMuted} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary }}>{item.title}</Text>
                    {item.description ? <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: 2 }} numberOfLines={2}>{item.description}</Text> : null}
                    {item.price != null && <Text style={{ ...typography.bodyBold, color: colors.textPrimary, marginTop: spacing.xs }}>R{Number(item.price).toLocaleString()}</Text>}
                  </View>
                </View>
              ))}
            </View>
          )}

          {hasPdfs && (
            <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
              <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary, marginBottom: spacing.xs }}>PDF Catalogue</Text>
              {cataloguePdfs!.map((doc) => (
                <TouchableOpacity key={doc.id} onPress={() => doc.document_url && Linking.openURL(doc.document_url).catch(() => null)} style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.borderSubtle, gap: spacing.sm }}>
                  <MaterialIcons name="picture-as-pdf" size={24} color={colors.destructive} />
                  <Text style={{ ...typography.body, color: colors.textPrimary, flex: 1 }} numberOfLines={1}>{doc.file_name || 'Catalogue PDF'}</Text>
                  <MaterialIcons name="open-in-new" size={16} color={colors.textPrimary} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity
            onPress={() => navigation.navigate('VenueCatalogueView', { venueId, venueName: name })}
            style={{ backgroundColor: colors.cta, paddingVertical: spacing.md, borderRadius: radii.md, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: spacing.sm }}
          >
            <MaterialIcons name="request-quote" size={18} color="#FFFFFF" />
            <Text style={{ ...typography.bodyBold, color: '#FFFFFF' }}>View Full Catalogue & Request Quote</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
          <MaterialIcons name="inventory-2" size={48} color={colors.textMuted} />
          <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary, marginTop: spacing.md }}>No catalogue items available</Text>
          <Text style={{ ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs }}>{name} hasn't added catalogue items yet. Request a quote for custom pricing.</Text>
          <TouchableOpacity onPress={handleRequestQuote} style={{ marginTop: spacing.md, backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: radii.md, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: spacing.sm }}>
            <MaterialIcons name="request-quote" size={18} color="#FFFFFF" />
            <Text style={{ ...typography.bodyBold, color: '#FFFFFF' }}>Request a Quote</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

export default VenueCatalogueTab;