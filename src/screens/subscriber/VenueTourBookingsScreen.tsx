import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, spacing, radii, typography } from '../../theme';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../auth/AuthContext';
import ThemedAlert from '../../components/ThemedAlert';
import { getMyVenueEntitlement, isVenueFeatureEnabled } from '../../lib/venueSubscription';
import { createTourResponseNotification } from '../../lib/notifications';
import type { ProfileStackParamList } from '../../navigation/ProfileNavigator';

type VenueListingRow = {
  id: number;
  name: string;
};

type TourBookingRow = {
  id: number;
  listing_id: number;
  requester_user_id: string | null;
  requester_name: string | null;
  requester_email: string | null;
  requester_phone: string | null;
  requested_date: string | null;
  requested_time: string | null;
  message: string | null;
  countered_date: string | null;
  countered_time: string | null;
  countered_message: string | null;
  status: string;
  created_at: string;
};

const STATUS_ORDER: Record<string, number> = {
  pending: 0,
  countered: 1,
  confirmed: 2,
  completed: 3,
  cancelled: 4,
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  countered: 'Alternative proposed',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  completed: 'Completed',
};

export default function VenueTourBookingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alertState, setAlertState] = useState<{visible: boolean; title: string; message: string} | null>(null);

  const [listing, setListing] = useState<VenueListingRow | null>(null);
  const [bookings, setBookings] = useState<TourBookingRow[]>([]);
  const [canUseTours, setCanUseTours] = useState<boolean>(false);
  const [counterBooking, setCounterBooking] = useState<TourBookingRow | null>(null);
  const [counterDate, setCounterDate] = useState(new Date());
  const [counterTime, setCounterTime] = useState('');
  const [counterMessage, setCounterMessage] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const loadEntitlement = useCallback(async () => {
    if (!user?.id) return;
    const ent = await getMyVenueEntitlement(user.id);
    setCanUseTours(isVenueFeatureEnabled(ent, 'instant_tour_bookings'));
  }, [user?.id]);

  const loadListingAndBookings = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data: listingRow } = await supabase
        .from('venue_listings')
        .select('id, name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!listingRow) {
        setListing(null);
        setBookings([]);
        return;
      }

      setListing({ id: listingRow.id, name: listingRow.name });

      const { data: rows, error } = await supabase
        .from('venue_tour_bookings')
        .select('id, listing_id, requester_user_id, requester_name, requester_email, requester_phone, requested_date, requested_time, message, countered_date, countered_time, countered_message, status, created_at')
        .eq('listing_id', listingRow.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Failed to load tour bookings:', error);
        setBookings([]);
        return;
      }

      const sorted = (rows || []) as TourBookingRow[];
      sorted.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
      setBookings(sorted);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadEntitlement();
    loadListingAndBookings();
  }, [loadEntitlement, loadListingAndBookings]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const statusColor = useMemo(() => {
    return (status: string) => {
      switch (status) {
        case 'pending':
          return '#F59E0B';
        case 'countered':
          return '#3B82F6';
        case 'confirmed':
          return '#16A34A';
        case 'cancelled':
          return '#DC2626';
        case 'completed':
          return colors.textPrimary;
        default:
          return colors.textMuted;
      }
    };
  }, []);

  const updateBooking = async (booking: TourBookingRow, patch: Partial<TourBookingRow>) => {
    setSaving(true);
    try {
      const { error } = await supabase.from('venue_tour_bookings').update(patch).eq('id', booking.id);
      if (error) throw error;
      setBookings((prev) =>
        prev
          .map((b) => (b.id === booking.id ? { ...b, ...patch } : b))
          .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
      );
      if (patch.status && booking.requester_user_id && booking.requester_user_id !== user?.id) {
        await createTourResponseNotification(booking.requester_user_id, listing?.name || 'Venue', patch.status, booking.id).catch(() => {});
      }
    } catch (err: any) {
      setAlertState({ visible: true, title: 'Error', message: err?.message ?? 'Failed to update booking.' });
    } finally {
      setSaving(false);
    }
  };

  const openCounter = (booking: TourBookingRow) => {
    setCounterBooking(booking);
    setCounterDate(booking.requested_date ? new Date(booking.requested_date) : new Date());
    setCounterTime(booking.requested_time || '');
    setCounterMessage('');
  };

  const submitCounter = async () => {
    if (!counterBooking) return;
    await updateBooking(counterBooking, {
      status: 'countered',
      countered_date: counterDate.toISOString().slice(0, 10),
      countered_time: counterTime || null,
      countered_message: counterMessage || null,
    });
    setCounterBooking(null);
  };

  const onCounterDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setCounterDate(selectedDate);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ ...typography.body, color: colors.textMuted, marginTop: spacing.md }}>Loading tour bookings...</Text>
      </View>
    );
  }

  if (!canUseTours) {
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
              Tour Bookings
            </Text>
            <Text style={{ ...typography.body, color: colors.textMuted }}>
              This feature is available on paid venue plans.
            </Text>
          </View>

          <View style={{ paddingHorizontal: spacing.lg }}>
            <View
              style={{
                backgroundColor: '#FFF7ED',
                borderRadius: radii.lg,
                padding: spacing.lg,
                borderWidth: 1,
                borderColor: '#FDBA74',
              }}
            >
              <Text style={{ ...typography.titleMedium, color: '#9A3412', marginBottom: spacing.sm }}>
                Upgrade required
              </Text>
              <Text style={{ ...typography.body, color: '#9A3412', marginBottom: spacing.md }}>
                Upgrade your venue plan to enable instant venue tour bookings.
              </Text>

              <TouchableOpacity
                onPress={() => navigation.navigate('VenueListingPlans')}
                style={{
                  paddingVertical: spacing.sm,
                  borderRadius: radii.md,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                }}
              >
                <Text style={{ ...typography.bodyBold, color: '#FFFFFF' }}>View Venue Plans</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (!listing) {
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
              Tour Bookings
            </Text>
            <Text style={{ ...typography.body, color: colors.textMuted }}>
              Create your venue listing first.
            </Text>
          </View>

          <View style={{ paddingHorizontal: spacing.lg }}>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: radii.lg,
                padding: spacing.lg,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
              }}
            >
              <Text style={{ ...typography.body, color: colors.textPrimary }}>
                You don’t have a venue listing yet. Please create it in “Update Venue Portfolio” before managing tour bookings.
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('UpdateVenuePortfolio')}
                style={{
                  marginTop: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: colors.primary,
                  alignItems: 'center',
                }}
              >
                <Text style={{ ...typography.bodyBold, color: colors.primary }}>Go to Update Venue Portfolio</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
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
            Tour Bookings
          </Text>
          <Text style={{ ...typography.body, color: colors.textMuted }}>
            {listing.name}
          </Text>
        </View>

        <View style={{ paddingHorizontal: spacing.lg }}>
          {bookings.length === 0 ? (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: radii.lg,
                padding: spacing.xl,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                alignItems: 'center',
              }}
            >
              <MaterialIcons name="calendar-month" size={48} color={colors.textMuted} />
              <Text style={{ ...typography.body, color: colors.textMuted, marginTop: spacing.md, textAlign: 'center' }}>
                No tour bookings yet.
              </Text>
            </View>
          ) : (
            bookings.map((b) => (
              <View
                key={b.id}
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
                  <View style={{ flex: 1, paddingRight: spacing.md }}>
                    <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>
                      {b.requester_name || 'Visitor'}
                    </Text>
                    <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.xs }}>
                      Requested: {formatDate(b.created_at)}
                    </Text>
                    {b.requested_date ? (
                      <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.xs }}>
                        Date: {formatDate(b.requested_date)}
                      </Text>
                    ) : null}
                    {b.requested_time ? (
                      <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.xs }}>
                        Time: {b.requested_time}
                      </Text>
                    ) : null}
                  </View>

                  <View
                    style={{
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.xs,
                      borderRadius: radii.full,
                      backgroundColor: statusColor(b.status) + '20',
                    }}
                  >
                    <Text
                      style={{
                        ...typography.captionBold,
                        color: statusColor(b.status),
                        textTransform: 'uppercase',
                      }}
                    >
                      {STATUS_LABEL[b.status] || b.status}
                    </Text>
                  </View>
                </View>

                {(b.requester_email || b.requester_phone) && (
                  <View style={{ marginTop: spacing.md }}>
                    {b.requester_email ? (
                      <Text style={{ ...typography.body, color: colors.textPrimary }}>
                        Email: {b.requester_email}
                      </Text>
                    ) : null}
                    {b.requester_phone ? (
                      <Text style={{ ...typography.body, color: colors.textPrimary, marginTop: spacing.xs }}>
                        Phone: {b.requester_phone}
                      </Text>
                    ) : null}
                  </View>
                )}

                {b.message ? (
                  <View style={{ marginTop: spacing.md }}>
                    <Text style={{ ...typography.caption, color: colors.textMuted }}>Message</Text>
                    <Text style={{ ...typography.body, color: colors.textPrimary, marginTop: spacing.xs }}>
                      {b.message}
                    </Text>
                  </View>
                ) : null}

                {b.status === 'countered' && (
                  <View style={{ marginTop: spacing.md, padding: spacing.md, borderRadius: radii.md, backgroundColor: '#3B82F620', borderWidth: 1, borderColor: '#3B82F6' }}>
                    <Text style={{ ...typography.captionBold, color: '#3B82F6' }}>Your proposed alternative</Text>
                    <Text style={{ ...typography.body, color: colors.textPrimary, marginTop: spacing.xs }}>
                      {formatDate(b.countered_date)} {b.countered_time}
                    </Text>
                    {b.countered_message && (
                      <Text style={{ ...typography.body, color: colors.textSecondary, marginTop: spacing.xs }}>{b.countered_message}</Text>
                    )}
                    <Text style={{ ...typography.caption, color: '#3B82F6', marginTop: spacing.xs }}>Waiting for visitor response.</Text>
                  </View>
                )}

                <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
                  {b.status === 'pending' && (
                    <>
                      <TouchableOpacity
                        onPress={() => updateBooking(b, { status: 'confirmed' })}
                        disabled={saving}
                        style={{ flex: 1, paddingVertical: spacing.sm, borderRadius: radii.md, backgroundColor: '#16A34A', alignItems: 'center', opacity: saving ? 0.6 : 1 }}
                      >
                        <Text style={{ ...typography.bodyBold, color: '#FFFFFF' }}>Accept as-is</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => openCounter(b)}
                        disabled={saving}
                        style={{ flex: 1, paddingVertical: spacing.sm, borderRadius: radii.md, borderWidth: 1, borderColor: colors.primary, alignItems: 'center', opacity: saving ? 0.6 : 1 }}
                      >
                        <Text style={{ ...typography.bodyBold, color: colors.primary }}>Propose alternative</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {b.status === 'countered' && (
                    <>
                      <TouchableOpacity
                        onPress={() => updateBooking(b, { status: 'confirmed' })}
                        disabled={saving}
                        style={{ flex: 1, paddingVertical: spacing.sm, borderRadius: radii.md, backgroundColor: '#16A34A', alignItems: 'center', opacity: saving ? 0.6 : 1 }}
                      >
                        <Text style={{ ...typography.bodyBold, color: '#FFFFFF' }}>Accept as-is</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => updateBooking(b, { status: 'cancelled' })}
                        disabled={saving}
                        style={{ flex: 1, paddingVertical: spacing.sm, borderRadius: radii.md, borderWidth: 1, borderColor: '#DC2626', alignItems: 'center', opacity: saving ? 0.6 : 1 }}
                      >
                        <Text style={{ ...typography.bodyBold, color: '#DC2626' }}>Cancel</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {b.status === 'confirmed' && (
                    <>
                      <TouchableOpacity
                        onPress={() => updateBooking(b, { status: 'completed' })}
                        disabled={saving}
                        style={{ flex: 1, paddingVertical: spacing.sm, borderRadius: radii.md, backgroundColor: colors.primary, alignItems: 'center', opacity: saving ? 0.6 : 1 }}
                      >
                        <Text style={{ ...typography.bodyBold, color: '#FFFFFF' }}>Mark completed</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => updateBooking(b, { status: 'cancelled' })}
                        disabled={saving}
                        style={{ flex: 1, paddingVertical: spacing.sm, borderRadius: radii.md, borderWidth: 1, borderColor: '#DC2626', alignItems: 'center', opacity: saving ? 0.6 : 1 }}
                      >
                        <Text style={{ ...typography.bodyBold, color: '#DC2626' }}>Cancel</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {(b.status === 'cancelled' || b.status === 'completed') && (
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <Text style={{ ...typography.caption, color: colors.textMuted }}>This tour is {b.status}. No further action available.</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal
        visible={counterBooking !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setCounterBooking(null)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.background, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, padding: spacing.lg, paddingBottom: spacing.xl }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>Propose alternative date</Text>
              <TouchableOpacity onPress={() => setCounterBooking(null)}>
                <MaterialIcons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={{ ...typography.label, color: colors.textSecondary, marginBottom: spacing.xs }}>Date</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={{
                padding: spacing.md,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                borderRadius: radii.md,
                marginBottom: spacing.md,
                backgroundColor: colors.surface,
              }}
            >
              <Text style={{ ...typography.body, color: colors.textPrimary }}>
                {counterDate.toLocaleDateString('en-ZA')}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={counterDate}
                mode="date"
                display="default"
                onChange={onCounterDateChange}
                minimumDate={new Date()}
              />
            )}

            <Text style={{ ...typography.label, color: colors.textSecondary, marginBottom: spacing.xs }}>Time</Text>
            <TextInput
              value={counterTime}
              onChangeText={setCounterTime}
              placeholder="e.g. 10:00"
              placeholderTextColor={colors.textMuted}
              style={{
                padding: spacing.md,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                borderRadius: radii.md,
                marginBottom: spacing.md,
                backgroundColor: colors.surface,
                color: colors.textPrimary,
              }}
            />

            <Text style={{ ...typography.label, color: colors.textSecondary, marginBottom: spacing.xs }}>Message (optional)</Text>
            <TextInput
              value={counterMessage}
              onChangeText={setCounterMessage}
              placeholder="Explain why you’re proposing a different time..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{
                padding: spacing.md,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                borderRadius: radii.md,
                marginBottom: spacing.md,
                backgroundColor: colors.surface,
                color: colors.textPrimary,
                minHeight: 80,
              }}
            />

            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <TouchableOpacity
                onPress={() => setCounterBooking(null)}
                disabled={saving}
                style={{ flex: 1, paddingVertical: spacing.md, borderRadius: radii.md, borderWidth: 1, borderColor: colors.borderSubtle, alignItems: 'center', opacity: saving ? 0.6 : 1 }}
              >
                <Text style={{ ...typography.bodyBold, color: colors.textPrimary }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitCounter}
                disabled={saving}
                style={{ flex: 1, paddingVertical: spacing.md, borderRadius: radii.md, backgroundColor: colors.primary, alignItems: 'center', opacity: saving ? 0.6 : 1 }}
              >
                <Text style={{ ...typography.bodyBold, color: '#FFFFFF' }}>Send proposal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
