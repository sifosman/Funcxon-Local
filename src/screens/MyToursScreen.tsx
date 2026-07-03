import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';
import { colors, spacing, radii, typography } from '../theme';
import type { AttendeeStackParamList } from '../navigation/AttendeeNavigator';

type Props = NativeStackScreenProps<AttendeeStackParamList, 'MyTours'>;

type BookingType = 'tour' | 'quote';

interface BookingItem {
  id: number | string;
  type: BookingType;
  title: string;
  targetId?: number | null;
  targetType?: 'vendor' | 'venue';
  requested_date?: string | null;
  requested_time?: string | null;
  countered_date?: string | null;
  countered_time?: string | null;
  status: string;
  created_at?: string;
  event_date?: string | null;
  budget?: string | null;
  quote_amount?: number | null;
  is_venue?: boolean;
}

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: keyof typeof MaterialIcons.glyphMap }> = {
  pending: { label: 'Pending', color: '#F59E0B', bg: '#F59E0B20', icon: 'schedule' },
  countered: { label: 'Alternative', color: '#3B82F6', bg: '#3B82F620', icon: 'event' },
  confirmed: { label: 'Confirmed', color: '#16A34A', bg: '#16A34A20', icon: 'check-circle' },
  cancelled: { label: 'Cancelled', color: '#DC2626', bg: '#DC262620', icon: 'cancel' },
  completed: { label: 'Completed', color: colors.primary, bg: `${colors.primary}20`, icon: 'check-circle' },
  finalised: { label: 'Finalised', color: colors.primary, bg: `${colors.primary}20`, icon: 'check-circle' },
  accepted: { label: 'Accepted', color: '#16A34A', bg: '#16A34A20', icon: 'check-circle' },
  rejected: { label: 'Rejected', color: '#DC2626', bg: '#DC262620', icon: 'cancel' },
};

export default function MyToursScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [items, setItems] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchItems();
  }, [user]);

  async function fetchItems() {
    setLoading(true);
    try {
      const [userRows, tourData, vendorSeedData, venueSeedData, vendorQuoteData, venueQuoteData] = await Promise.all([
        supabase.from('users').select('id, email').eq('auth_user_id', user?.id ?? '').maybeSingle(),
        supabase
          .from('venue_tour_bookings')
          .select('id, venue:listing_id(id, name), requested_date, requested_time, countered_date, countered_time, status, created_at')
          .eq('requester_email', user?.email)
          .order('created_at', { ascending: false }),
        supabase.from('vendors').select('id, name'),
        supabase.from('venue_listings').select('id, name'),
        supabase
          .from('quote_requests')
          .select('id, vendor_id, name, email, status, details, event_type, event_date, budget, quote_amount, created_at, requirements')
          .eq('requester_email', user?.email)
          .order('id', { ascending: false })
          .limit(50),
        supabase
          .from('venue_quote_requests')
          .select('id, listing_id, requester_name, requester_email, status, message, event_date, created_at, line_items')
          .eq('requester_email', user?.email)
          .order('id', { ascending: false })
          .limit(50),
      ]);

      const vendorNameMap = new Map((vendorSeedData.data || []).map((v: any) => [v.id, v.name]));
      const venueNameMap = new Map((venueSeedData.data || []).map((v: any) => [v.id, v.name]));

      const tours: BookingItem[] = (tourData.data || []).map((b: any) => ({
        id: b.id,
        type: 'tour',
        title: b.venue?.name || 'Venue Tour',
        targetId: b.venue?.id,
        targetType: 'venue',
        requested_date: b.requested_date,
        requested_time: b.requested_time,
        countered_date: b.countered_date,
        countered_time: b.countered_time,
        status: b.status,
        created_at: b.created_at,
      }));

      const vendorQuotes: BookingItem[] = (vendorQuoteData.data || []).map((q: any) => ({
        id: q.id,
        type: 'quote',
        title: vendorNameMap.get(q.vendor_id) || q.name || 'Vendor Quote',
        targetId: q.vendor_id,
        targetType: 'vendor',
        status: q.status,
        created_at: q.created_at,
        event_date: q.event_date,
        budget: q.budget,
        quote_amount: q.quote_amount,
      }));

      const venueQuotes: BookingItem[] = (venueQuoteData.data || []).map((q: any) => ({
        id: `venue-${q.id}`,
        type: 'quote',
        title: venueNameMap.get(q.listing_id) || 'Venue Quote',
        targetId: q.listing_id,
        targetType: 'venue',
        status: q.status,
        created_at: q.created_at,
        event_date: q.event_date,
        is_venue: true,
      }));

      const allItems = [...tours, ...vendorQuotes, ...venueQuotes].sort((a, b) => {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });
      setItems(allItems);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (s?: string | null) => s ? new Date(s).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

  const displayDate = (b: BookingItem) =>
    b.status === 'countered' && b.countered_date ? b.countered_date : (b.event_date || b.requested_date);
  const displayTime = (b: BookingItem) =>
    b.status === 'countered' && b.countered_time ? b.countered_time : b.requested_time;

  const upcoming = items
    .filter(b => b.status === 'confirmed' || b.status === 'countered' || b.status === 'pending' || b.status === 'accepted')
    .sort((a, b) => new Date(displayDate(a) || '').getTime() - new Date(displayDate(b) || '').getTime());
  const past = items
    .filter(b => b.status === 'completed' || b.status === 'finalised' || b.status === 'cancelled' || b.status === 'rejected')
    .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());

  const stats = {
    total: items.length,
    confirmed: items.filter(b => b.status === 'confirmed' || b.status === 'accepted').length,
    pending: items.filter(b => b.status === 'pending' || b.status === 'countered').length,
    completed: items.filter(b => b.status === 'completed' || b.status === 'finalised').length,
  };

  const handlePress = (item: BookingItem) => {
    if (item.type === 'tour') {
      navigation.navigate('BookingDetail', { bookingId: Number(item.id) });
      return;
    }
    if (item.targetType === 'venue' && item.targetId) {
      navigation.navigate('VenueProfile', { venueId: item.targetId, from: 'Quotes' });
    } else if (item.targetType === 'vendor' && item.targetId) {
      navigation.navigate('VendorProfile', { vendorId: item.targetId, from: 'Quotes' });
    }
  };

  const renderCard = (item: BookingItem) => {
    const meta = STATUS_META[item.status] || STATUS_META.pending;
    return (
      <TouchableOpacity
        key={`${item.type}-${item.id}`}
        onPress={() => handlePress(item)}
        activeOpacity={0.7}
        style={{
          backgroundColor: colors.surface,
          borderRadius: radii.lg,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          marginBottom: spacing.md,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Text style={{ ...typography.titleMedium, color: colors.textPrimary, flex: 1, marginRight: spacing.md }}>
            {item.title}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.xs,
              borderRadius: radii.full,
              backgroundColor: meta.bg,
            }}
          >
            <MaterialIcons name={meta.icon} size={14} color={meta.color} />
            <Text style={{ ...typography.captionBold, color: meta.color, textTransform: 'uppercase' }}>
              {meta.label}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm }}>
          <Text style={{ ...typography.body, color: colors.textSecondary }}>
            <MaterialIcons name={item.type === 'tour' ? 'calendar-today' : 'request-quote'} size={14} color={colors.textMuted} /> {formatDate(displayDate(item))}
          </Text>
          {displayTime(item) && (
            <Text style={{ ...typography.body, color: colors.textSecondary }}>
              <MaterialIcons name="access-time" size={14} color={colors.textMuted} /> {displayTime(item)}
            </Text>
          )}
        </View>
        {item.quote_amount !== undefined && item.quote_amount !== null && (
          <Text style={{ ...typography.caption, color: colors.textPrimary, marginTop: spacing.sm }}>
            Quote amount: R{item.quote_amount.toLocaleString('en-ZA')}
          </Text>
        )}
        {item.status === 'countered' && (
          <Text style={{ ...typography.caption, color: colors.primary, marginTop: spacing.sm }}>
            {item.type === 'tour' ? 'Venue proposed an alternative. Tap to respond.' : 'Alternative proposal received. Tap to view.'}
          </Text>
        )}
        {item.status === 'pending' && (
          <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.sm }}>
            {item.type === 'tour' ? 'Waiting for venue response.' : 'Waiting for quote response.'}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}
          >
            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
            <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>Back</Text>
          </TouchableOpacity>

          <Text style={{ ...typography.displayMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
            My Bookings
          </Text>
          <Text style={{ ...typography.body, color: colors.textMuted }}>
            Track your venue tours and quotes in one place.
          </Text>
        </View>

        <View style={{ paddingHorizontal: spacing.lg }}>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
            {[
              { label: 'Total', value: stats.total, color: colors.primary },
              { label: 'Confirmed', value: stats.confirmed, color: '#16A34A' },
              { label: 'Pending', value: stats.pending, color: '#F59E0B' },
              { label: 'Completed', value: stats.completed, color: colors.textPrimary },
            ].map((stat) => (
              <View
                key={stat.label}
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderRadius: radii.lg,
                  padding: spacing.md,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                }}
              >
                <Text style={{ ...typography.titleMedium, color: stat.color, fontWeight: '700' }}>{stat.value}</Text>
                <Text style={{ ...typography.caption, color: colors.textMuted }}>{stat.label}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('Discover', { category: 'all' })}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: spacing.sm,
              backgroundColor: colors.primary,
              paddingVertical: spacing.md,
              borderRadius: radii.md,
              marginBottom: spacing.lg,
            }}
          >
            <MaterialIcons name="search" size={18} color="#FFFFFF" />
            <Text style={{ ...typography.bodyBold, color: '#FFFFFF' }}>Browse</Text>
          </TouchableOpacity>

          {loading ? (
            <View style={{ padding: spacing.xl, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : items.length === 0 ? (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: radii.lg,
                padding: spacing.xl,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.borderSubtle,
              }}
            >
              <MaterialIcons name="calendar-month" size={48} color={colors.textMuted} />
              <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginTop: spacing.md }}>
                No bookings yet
              </Text>
              <Text style={{ ...typography.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs }}>
                Book a tour or request a quote to see it here.
              </Text>
            </View>
          ) : (
            <>
              {(upcoming.length > 0) && (
                <View style={{ marginBottom: spacing.lg }}>
                  <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>
                    Upcoming & Pending
                  </Text>
                  {upcoming.map(renderCard)}
                </View>
              )}
              {past.length > 0 && (
                <View>
                  <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>
                    Past Bookings
                  </Text>
                  {past.map(renderCard)}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
