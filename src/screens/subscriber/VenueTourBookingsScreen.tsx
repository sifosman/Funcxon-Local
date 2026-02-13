import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radii, typography } from '../../theme';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../auth/AuthContext';
import { getMyVenueEntitlement, isVenueFeatureEnabled } from '../../lib/venueSubscription';

type ProfileStackParamList = {
  UpdateVenuePortfolio: undefined;
  VenueTourBookings: undefined;
  VenueListingPlans: undefined;
};

type VenueListingRow = {
  id: number;
  name: string;
};

type TourBookingRow = {
  id: number;
  listing_id: number;
  requester_name: string | null;
  requester_email: string | null;
  requester_phone: string | null;
  requested_date: string | null;
  requested_time: string | null;
  message: string | null;
  status: string;
  created_at: string;
};

const STATUS_OPTIONS = ['new', 'scheduled', 'completed', 'closed'] as const;

export default function VenueTourBookingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [listing, setListing] = useState<VenueListingRow | null>(null);
  const [bookings, setBookings] = useState<TourBookingRow[]>([]);
  const [canUseTours, setCanUseTours] = useState<boolean>(false);

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
        .select('id, listing_id, requester_name, requester_email, requester_phone, requested_date, requested_time, message, status, created_at')
        .eq('listing_id', listingRow.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Failed to load tour bookings:', error);
        setBookings([]);
        return;
      }

      setBookings((rows || []) as TourBookingRow[]);
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
        case 'new':
          return '#3B82F6';
        case 'scheduled':
          return '#F59E0B';
        case 'completed':
          return '#16A34A';
        case 'closed':
          return colors.textMuted;
        default:
          return colors.textMuted;
      }
    };
  }, []);

  const updateStatus = async (booking: TourBookingRow) => {
    const currentIndex = STATUS_OPTIONS.indexOf(booking.status as any);
    const next = STATUS_OPTIONS[(currentIndex + 1) % STATUS_OPTIONS.length];

    setSaving(true);
    try {
      const { error } = await supabase.from('venue_tour_bookings').update({ status: next }).eq('id', booking.id);
      if (error) throw error;
      setBookings((prev) => prev.map((b) => (b.id === booking.id ? { ...b, status: next } : b)));
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to update status.');
    } finally {
      setSaving(false);
    }
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
          <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.md }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}
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
                <Text style={{ ...typography.body, color: '#FFFFFF', fontWeight: '700' }}>View Venue Plans</Text>
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
          <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.md }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}
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
                <Text style={{ ...typography.body, color: colors.primary, fontWeight: '700' }}>Go to Update Venue Portfolio</Text>
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
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.md }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}
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
                      {b.requester_name || 'New booking'}
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
                        ...typography.caption,
                        color: statusColor(b.status),
                        fontWeight: '700',
                        textTransform: 'uppercase',
                      }}
                    >
                      {b.status}
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

                <TouchableOpacity
                  onPress={() => updateStatus(b)}
                  disabled={saving}
                  style={{
                    marginTop: spacing.md,
                    paddingVertical: spacing.sm,
                    borderRadius: radii.md,
                    borderWidth: 1,
                    borderColor: colors.primary,
                    alignItems: 'center',
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  <Text style={{ ...typography.body, color: colors.primary, fontWeight: '700' }}>
                    Change status
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
