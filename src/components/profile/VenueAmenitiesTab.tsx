import React from 'react';
import { Text, View } from 'react-native';
import { colors, spacing, radii, typography } from '../../theme';

type Props = {
  halls: { name: string; capacity: string }[];
  amenities: string[] | null;
};

const headerTitleMedium = { ...typography.titleMedium, fontFamily: 'Montserrat_600SemiBold' as const };

const VenueAmenitiesTab = React.memo(function VenueAmenitiesTab({
  halls,
  amenities,
}: Props) {
  return (
    <View>
      {halls.length > 0 && (
        <View style={{ marginBottom: spacing.lg, padding: spacing.lg, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle }}>
          <Text style={{ ...headerTitleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>Halls & Spaces</Text>
          {halls.map((hall, idx) => (
            <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: idx < halls.length - 1 ? 1 : 0, borderBottomColor: colors.borderSubtle }}>
              <Text style={{ ...typography.body, color: colors.textPrimary, flex: 1 }}>{hall.name || `Hall ${idx + 1}`}</Text>
              <Text style={{ ...typography.body, color: colors.textSecondary }}>{hall.capacity || 'Capacity TBC'}</Text>
            </View>
          ))}
        </View>
      )}

      {amenities && amenities.length > 0 ? (
        <View style={{ marginBottom: spacing.lg, padding: spacing.lg, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle }}>
          <Text style={{ ...headerTitleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>Amenities</Text>
          {amenities.map((item) => (
            <View key={item} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.cta, marginRight: spacing.sm }} />
              <Text style={{ ...typography.body, color: colors.textPrimary }}>{item}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={{ marginBottom: spacing.lg, padding: spacing.lg, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle }}>
          <Text style={{ ...typography.body, color: colors.textMuted }}>No amenities listed.</Text>
        </View>
      )}
    </View>
  );
});

export default VenueAmenitiesTab;