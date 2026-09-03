import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, radii, typography } from '../../theme';

type AvailabilityRecord = {
  id: number;
  date: string;
  is_available: boolean;
  availability_type: string | null;
  time_slots: string[] | null;
  notes: string | null;
};

type Props = {
  availability: AvailabilityRecord[] | undefined;
  availabilityLoading: boolean;
  name: string;
  whatsappUrl: string | null;
  emailUrl: string | null;
  handleOpenUrl: (url?: string | null) => void;
  goToQuoteRequest: () => void;
};

const formatAvailabilityDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};

const VendorCalendarTab = React.memo(function VendorCalendarTab({
  availability,
  availabilityLoading,
  name,
  whatsappUrl,
  emailUrl,
  handleOpenUrl,
  goToQuoteRequest,
}: Props) {
  return (
    <View style={{ marginBottom: spacing.lg, padding: spacing.lg, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
        <MaterialIcons name="calendar-today" size={18} color={colors.textPrimary} />
        <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginLeft: spacing.sm }}>Availability Calendar</Text>
      </View>
      {availabilityLoading ? (
        <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}><ActivityIndicator color={colors.textPrimary} /></View>
      ) : availability && availability.length > 0 ? (
        <View style={{ gap: spacing.sm }}>
          {availability.map((entry) => {
            const isAvailable = entry.is_available;
            return (
              <View key={entry.id} style={{ borderRadius: radii.md, padding: spacing.md, borderWidth: 1, borderColor: isAvailable ? '#BBF7D0' : '#FECACA', backgroundColor: isAvailable ? '#DCFCE7' : '#FEE2E2' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md }}>
                  <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary, flex: 1 }}>{formatAvailabilityDate(entry.date)}</Text>
                  <Text style={{ ...typography.captionBold, color: isAvailable ? '#166534' : '#991B1B' }}>{isAvailable ? 'Available' : 'Unavailable'}</Text>
                </View>
                {entry.availability_type ? <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs }}>{entry.availability_type}</Text> : null}
                {Array.isArray(entry.time_slots) && entry.time_slots.length > 0 ? <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs }}>{entry.time_slots.join(', ')}</Text> : null}
                {entry.notes ? <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs }}>{entry.notes}</Text> : null}
              </View>
            );
          })}
        </View>
      ) : (
        <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
          <MaterialIcons name="event-busy" size={48} color={colors.textMuted} />
          <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary, marginTop: spacing.md }}>Availability will be updated soon</Text>
          <Text style={{ ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs }}>Contact {name} directly while calendar slots are being updated.</Text>
        </View>
      )}
      <TouchableOpacity
        onPress={() => (whatsappUrl ? handleOpenUrl(whatsappUrl) : emailUrl ? handleOpenUrl(emailUrl) : goToQuoteRequest())}
        style={{ marginTop: spacing.md, backgroundColor: colors.cta, paddingVertical: spacing.md, borderRadius: radii.md, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
      >
        <MaterialIcons name="calendar-today" size={16} color="#FFFFFF" />
        <Text style={{ ...typography.bodySemiBold, color: '#FFFFFF', marginLeft: spacing.sm }}>Contact for Availability</Text>
      </TouchableOpacity>
    </View>
  );
});

export default VendorCalendarTab;