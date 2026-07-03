import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';
import { colors, spacing, radii, typography } from '../theme';
import type { AttendeeStackParamList } from '../navigation/AttendeeNavigator';
import ThemedAlert from '../components/ThemedAlert';

type Props = NativeStackScreenProps<AttendeeStackParamList, 'BookingDetail'>;

interface BookingDetail {
  id: number;
  venue_name?: string;
  venue_id?: number;
  requester_name?: string | null;
  requester_email?: string | null;
  requester_phone?: string | null;
  requested_date?: string | null;
  requested_time?: string | null;
  status: string;
  message?: string | null;
  countered_date?: string | null;
  countered_time?: string | null;
  countered_message?: string | null;
}

export default function BookingDetailScreen({ route, navigation }: Props) {
  const { bookingId } = route.params;
  const { user } = useAuth();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{visible: boolean; title: string; message: string} | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchBooking();
  }, [user, bookingId]);

  async function fetchBooking() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('venue_tour_bookings')
        .select('id, venue:listing_id(id, name), requester_name, requester_email, requester_phone, requested_date, requested_time, status, message, countered_date, countered_time, countered_message')
        .eq('id', bookingId)
        .eq('requester_email', user?.email)
        .maybeSingle();

      if (error) throw error;
      const b = data as any;
      if (!b) {
        setBooking(null);
        return;
      }
      setBooking({
        id: b.id,
        venue_name: b.venue?.name,
        venue_id: b.venue?.id,
        requester_name: b.requester_name,
        requester_email: b.requester_email,
        requester_phone: b.requester_phone,
        requested_date: b.requested_date,
        requested_time: b.requested_time,
        status: b.status,
        message: b.message,
        countered_date: b.countered_date,
        countered_time: b.countered_time,
        countered_message: b.countered_message,
      });
    } catch (err) {
      console.error('Error fetching booking:', err);
    } finally {
      setLoading(false);
    }
  }

  const updateStatus = async (status: string) => {
    setSaving(true);
    try {
      const { error } = await supabase.from('venue_tour_bookings').update({ status }).eq('id', bookingId);
      if (error) throw error;
      setBooking((prev) => (prev ? { ...prev, status } : prev));
      setAlert({ visible: true, title: status === 'confirmed' ? 'Tour confirmed' : 'Tour declined', message: `The tour has been ${status}.` });
    } catch (err: any) {
      setAlert({ visible: true, title: 'Error', message: err?.message || 'Failed to update booking.' });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (s?: string | null) => s ? new Date(s).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

  const finalDate = booking?.status === 'confirmed' || booking?.status === 'completed'
    ? (booking?.countered_date || booking?.requested_date)
    : undefined;
  const finalTime = booking?.status === 'confirmed' || booking?.status === 'completed'
    ? (booking?.countered_time || booking?.requested_time)
    : undefined;

  const statusMeta = {
    confirmed: { label: 'Confirmed', color: '#16A34A', bg: '#16A34A20' },
    cancelled: { label: 'Cancelled', color: '#DC2626', bg: '#DC262620' },
    completed: { label: 'Completed', color: colors.primary, bg: `${colors.primary}20` },
    countered: { label: 'Alternative proposed', color: '#3B82F6', bg: '#3B82F620' },
    pending: { label: 'Pending', color: '#F59E0B', bg: '#F59E0B20' },
  }[booking?.status || 'pending'] || { label: 'Pending', color: '#F59E0B', bg: '#F59E0B20' };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: spacing.lg }}>
        <MaterialIcons name="calendar-month" size={48} color={colors.textMuted} />
        <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginTop: spacing.md }}>Booking not found</Text>
        <TouchableOpacity onPress={() => navigation.navigate('MyTours')} style={{ marginTop: spacing.md }}>
          <Text style={{ ...typography.body, color: colors.primary }}>Back to My Tours</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
            Tour Booking
          </Text>
          <Text style={{ ...typography.body, color: colors.textMuted }}>{booking.venue_name || 'Venue'}</Text>
        </View>

        <View style={{ paddingHorizontal: spacing.lg }}>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radii.lg,
              padding: spacing.lg,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              marginBottom: spacing.md,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>Status</Text>
              <View
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                  borderRadius: radii.full,
                  backgroundColor: statusMeta.bg,
                }}
              >
                <Text style={{ ...typography.captionBold, color: statusMeta.color, textTransform: 'uppercase' }}>
                  {statusMeta.label}
                </Text>
              </View>
            </View>

            {booking.status === 'confirmed' && (
              <View style={{ backgroundColor: '#16A34A20', borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.md }}>
                <Text style={{ ...typography.bodySemiBold, color: '#16A34A', textAlign: 'center' }}>Tour Confirmed</Text>
                <Text style={{ ...typography.body, color: '#16A34A', textAlign: 'center' }}>
                  {formatDate(finalDate)} {finalTime}
                </Text>
              </View>
            )}
            {booking.status === 'cancelled' && (
              <View style={{ backgroundColor: '#DC262620', borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.md }}>
                <Text style={{ ...typography.bodySemiBold, color: '#DC2626', textAlign: 'center' }}>Tour Cancelled</Text>
                <Text style={{ ...typography.body, color: '#DC2626', textAlign: 'center' }}>This tour request has been cancelled.</Text>
              </View>
            )}
            {booking.status === 'completed' && (
              <View style={{ backgroundColor: `${colors.primary}20`, borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.md }}>
                <Text style={{ ...typography.bodySemiBold, color: colors.primary, textAlign: 'center' }}>Tour Completed</Text>
                <Text style={{ ...typography.body, color: colors.textSecondary, textAlign: 'center' }}>
                  {formatDate(finalDate)} {finalTime}
                </Text>
              </View>
            )}

            <View style={{ marginBottom: spacing.md }}>
              <Text style={{ ...typography.caption, color: colors.textMuted }}>Requested Date</Text>
              <Text style={{ ...typography.body, color: colors.textPrimary, marginTop: spacing.xs }}>
                {formatDate(booking.requested_date)}
              </Text>
            </View>
            <View style={{ marginBottom: spacing.md }}>
              <Text style={{ ...typography.caption, color: colors.textMuted }}>Requested Time</Text>
              <Text style={{ ...typography.body, color: colors.textPrimary, marginTop: spacing.xs }}>
                {booking.requested_time || 'Any time'}
              </Text>
            </View>

            {booking.status === 'countered' && (
              <View style={{ backgroundColor: '#3B82F620', borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.md }}>
                <Text style={{ ...typography.bodySemiBold, color: '#3B82F6' }}>Venue proposed an alternative</Text>
                <Text style={{ ...typography.body, color: colors.textPrimary, marginTop: spacing.xs }}>
                  Date: {formatDate(booking.countered_date)}
                </Text>
                {booking.countered_time && (
                  <Text style={{ ...typography.body, color: colors.textPrimary, marginTop: spacing.xs }}>
                    Time: {booking.countered_time}
                  </Text>
                )}
                {booking.countered_message && (
                  <Text style={{ ...typography.body, color: colors.textSecondary, marginTop: spacing.xs }}>
                    {booking.countered_message}
                  </Text>
                )}
              </View>
            )}

            <View style={{ marginBottom: spacing.md }}>
              <Text style={{ ...typography.caption, color: colors.textMuted }}>Visitor</Text>
              <Text style={{ ...typography.body, color: colors.textPrimary, marginTop: spacing.xs }}>
                {booking.requester_name || '—'}
              </Text>
            </View>
            {booking.requester_email && (
              <View style={{ marginBottom: spacing.md }}>
                <Text style={{ ...typography.caption, color: colors.textMuted }}>Email</Text>
                <Text style={{ ...typography.body, color: colors.textPrimary, marginTop: spacing.xs }}>
                  {booking.requester_email}
                </Text>
              </View>
            )}
            {booking.requester_phone && (
              <View style={{ marginBottom: spacing.md }}>
                <Text style={{ ...typography.caption, color: colors.textMuted }}>Phone</Text>
                <Text style={{ ...typography.body, color: colors.textPrimary, marginTop: spacing.xs }}>
                  {booking.requester_phone}
                </Text>
              </View>
            )}
            {booking.message && (
              <View style={{ marginBottom: spacing.md }}>
                <Text style={{ ...typography.caption, color: colors.textMuted }}>Message</Text>
                <Text style={{ ...typography.body, color: colors.textPrimary, marginTop: spacing.xs }}>
                  {booking.message}
                </Text>
              </View>
            )}

            {booking.status === 'countered' && (
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
                <TouchableOpacity
                  onPress={() => updateStatus('confirmed')}
                  disabled={saving}
                  style={{
                    flex: 1,
                    paddingVertical: spacing.md,
                    borderRadius: radii.md,
                    backgroundColor: '#16A34A',
                    alignItems: 'center',
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  <Text style={{ ...typography.bodyBold, color: '#FFFFFF' }}>Accept alternative</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => updateStatus('cancelled')}
                  disabled={saving}
                  style={{
                    flex: 1,
                    paddingVertical: spacing.md,
                    borderRadius: radii.md,
                    borderWidth: 1,
                    borderColor: '#DC2626',
                    alignItems: 'center',
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  <Text style={{ ...typography.bodyBold, color: '#DC2626' }}>Decline</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('MyTours')}
            style={{
              paddingVertical: spacing.md,
              borderRadius: radii.md,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              alignItems: 'center',
              backgroundColor: colors.surface,
            }}
          >
            <Text style={{ ...typography.bodyBold, color: colors.textPrimary }}>Back to My Tours</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {alert && (
        <ThemedAlert
          visible={alert.visible}
          title={alert.title}
          message={alert.message}
          buttons={[{ text: 'OK', style: 'default', onPress: () => setAlert(null) }]}
          onDismiss={() => setAlert(null)}
        />
      )}
    </View>
  );
}
