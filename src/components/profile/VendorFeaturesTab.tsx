import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, radii, typography } from '../../theme';

type VendorRecord = {
  id: number;
  service_options: string[] | null;
  vendor_tags: string[] | null;
  dietary_options: string[] | null;
  cuisine_types: string[] | null;
  amenities: string[] | null;
  province: string | null;
  city: string | null;
};

type Props = {
  vendor: VendorRecord;
  whatsappUrl: string | null;
  emailUrl: string | null;
  goToQuoteRequest: () => void;
  handleOpenUrl: (url?: string | null) => void;
  setAlertState: (s: { visible: boolean; title: string; message: string } | null) => void;
};

const renderBulletSection = (title: string, items?: string[] | null) => {
  if (!items || items.length === 0) return null;
  return (
    <View style={{ marginBottom: spacing.md }}>
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

const VendorFeaturesTab = React.memo(function VendorFeaturesTab({
  vendor,
  whatsappUrl,
  emailUrl,
  goToQuoteRequest,
  handleOpenUrl,
  setAlertState,
}: Props) {
  return (
    <View>
      {renderBulletSection('Service Options', vendor.service_options)}
      {renderBulletSection('Specialties', vendor.vendor_tags)}
      {renderBulletSection('Dietary Options', vendor.dietary_options)}
      {renderBulletSection('Cuisine Types', vendor.cuisine_types)}
      {renderBulletSection('Amenities', vendor.amenities)}
      {(vendor.province || vendor.city) && (
        <View style={{ marginBottom: spacing.lg, padding: spacing.lg, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle }}>
          <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>Coverage Area</Text>
          {vendor.province && <Text style={{ ...typography.body, color: colors.textPrimary, marginBottom: spacing.xs }}>Province: {vendor.province}</Text>}
          {vendor.city && <Text style={{ ...typography.body, color: colors.textPrimary, marginBottom: spacing.xs }}>City: {vendor.city}</Text>}
          {(vendor.city || vendor.province) && <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.sm }}>Willing to travel to selected coverage areas.</Text>}
        </View>
      )}
      <View style={{ marginBottom: spacing.lg, padding: spacing.lg, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle }}>
        <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>Quote Options</Text>
        <TouchableOpacity onPress={goToQuoteRequest} style={{ backgroundColor: colors.cta, paddingVertical: spacing.md, borderRadius: radii.md, alignItems: 'center', marginBottom: spacing.sm }}>
          <Text style={{ ...typography.bodySemiBold, color: '#FFFFFF' }}>Request Quote</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            if (whatsappUrl) handleOpenUrl(whatsappUrl);
            else if (emailUrl) handleOpenUrl(emailUrl);
            else setAlertState({ visible: true, title: 'Contact', message: 'No contact details available for this vendor.' });
          }}
          style={{ paddingVertical: spacing.md, borderRadius: radii.md, borderWidth: 2, borderColor: colors.cta, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
        >
          <MaterialIcons name="calendar-today" size={16} color={colors.cta} />
          <Text style={{ ...typography.bodySemiBold, color: colors.cta, marginLeft: spacing.sm }}>Contact for Availability</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

export default VendorFeaturesTab;