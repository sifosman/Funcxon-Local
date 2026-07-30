import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../auth/AuthContext';
import { colors, spacing, radii, typography } from '../../theme';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import ThemedAlert from '../../components/ThemedAlert';
import type { ProfileStackParamList } from '../../navigation/ProfileNavigator';

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

type BookingRow = {
  id: number;
  name: string | null;
  email: string | null;
  contact_phone: string | null;
  event_type: string | null;
  event_date: string | null;
  end_date: string | null;
  status: string;
  quote_amount: number | null;
  details: string | null;
  created_at: string;
};

const STATUS_LABEL: Record<string, string> = {
  accepted: 'Accepted',
  finalised: 'Confirmed',
};

const STATUS_COLOR: Record<string, string> = {
  accepted: '#16A34A',
  finalised: '#166534',
};

export default function VendorBookingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const isDesktop = useIsDesktop();

  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [vendorName, setVendorName] = useState<string | null>(null);
  const [alertState, setAlertState] = useState<{ visible: boolean; title: string; message: string } | null>(null);

  const loadBookings = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data: userRow } = await supabase
        .from('users')
        .select('id, auth_user_id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      const listingUserId = userRow?.auth_user_id ?? user.id;

      const { data: vendorRow } = await supabase
        .from('vendors')
        .select('id, name')
        .eq('user_id', listingUserId)
        .maybeSingle();

      if (!vendorRow) {
        setBookings([]);
        setVendorName(null);
        return;
      }

      setVendorName(vendorRow.name);

      const { data: rows, error } = await supabase
        .from('quote_requests')
        .select('id, name, email, contact_phone, event_type, event_date, end_date, status, quote_amount, details, created_at')
        .eq('vendor_id', vendorRow.id)
        .in('status', ['accepted', 'finalised'])
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setBookings((rows || []) as BookingRow[]);
    } catch (err: any) {
      setAlertState({ visible: true, title: 'Error', message: err?.message ?? 'Failed to load bookings.' });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatCurrency = (amount: number | null) => {
    if (amount == null) return '—';
    return `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const renderBookingCard = (item: BookingRow) => {
    const statusColor = STATUS_COLOR[item.status] ?? colors.textMuted;
    const statusLabel = STATUS_LABEL[item.status] ?? item.status;

    return (
      <TouchableOpacity
        key={item.id}
        onPress={() => navigation.navigate('VendorQuoteHistory', { quoteRequestId: item.id })}
        activeOpacity={0.7}
        style={{
          backgroundColor: isDesktop ? colors.surfaceContainerLowest : colors.surface,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: isDesktop ? colors.outlineVariant : colors.borderSubtle,
          padding: spacing.lg,
          marginBottom: spacing.md,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
          <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary, fontSize: 16 }}>
            {item.name ?? 'Unnamed client'}
          </Text>
          <View style={{ backgroundColor: statusColor + '20', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radii.sm }}>
            <Text style={{ color: statusColor, fontSize: 12, fontWeight: '600' }}>{statusLabel}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md as any }}>
          {item.event_date && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialIcons name="event" size={14} color={colors.textMuted} />
              <Text style={{ ...typography.caption, color: colors.textSecondary, marginLeft: 4 }}>
                {formatDate(item.event_date)}
              </Text>
            </View>
          )}
          {item.event_type && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialIcons name="category" size={14} color={colors.textMuted} />
              <Text style={{ ...typography.caption, color: colors.textSecondary, marginLeft: 4 }}>
                {item.event_type}
              </Text>
            </View>
          )}
          {item.quote_amount != null && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialIcons name="payments" size={14} color={colors.textMuted} />
              <Text style={{ ...typography.caption, color: colors.textSecondary, marginLeft: 4 }}>
                {formatCurrency(item.quote_amount)}
              </Text>
            </View>
          )}
        </View>

        {item.details && (
          <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: spacing.sm }} numberOfLines={2}>
            {item.details}
          </Text>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm }}>
          <MaterialIcons name="chevron-right" size={16} color={colors.textMuted} />
          <Text style={{ ...typography.caption, color: colors.primary, marginLeft: 2 }}>Tap to view quote history</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ ...typography.body, color: colors.textMuted, marginTop: spacing.md }}>Loading bookings...</Text>
      </View>
    );
  }

  const desktopContainerStyle: View['props']['style'] = {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 48,
    paddingVertical: spacing.lg,
  };

  const content = (
    <>
      <View style={{ marginBottom: spacing.md }}>
        <Text style={isDesktop ? { ...typography.labelMd, color: colors.dustyRose, textTransform: 'uppercase', marginBottom: spacing.sm } as any : { display: 'none' } as any}>
          Bookings
        </Text>
        <Text style={isDesktop ? { ...typography.headlineMd, color: colors.primary } as any : { ...typography.displayMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
          Vendor Bookings
        </Text>
        <Text style={{ ...typography.bodyMd, color: isDesktop ? colors.onSurfaceVariant : colors.textMuted }}>
          {vendorName ? `${vendorName} — confirmed and accepted bookings` : 'Accepted and confirmed quote requests'}
        </Text>
      </View>

      {bookings.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: spacing.xxl }}>
          <MaterialIcons name="event-busy" size={48} color={colors.textMuted} />
          <Text style={{ ...typography.body, color: colors.textMuted, marginTop: spacing.md }}>
            No confirmed bookings yet.
          </Text>
          <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.xs }}>
            Accepted and finalised quote requests will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => `booking-${item.id}`}
          renderItem={({ item }) => renderBookingCard(item)}
          scrollEnabled={false}
        />
      )}
    </>
  );

  return (
    <View style={{ flex: 1, backgroundColor: isDesktop ? colors.surfaceBg : colors.background }}>
      {isDesktop ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={desktopContainerStyle}>
          {content}
        </ScrollView>
      ) : (
        <ScrollView style={{ flex: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg }}>
          {content}
        </ScrollView>
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
    </View>
  );
}
