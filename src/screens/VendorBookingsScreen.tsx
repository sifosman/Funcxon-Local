import { ActivityIndicator, FlatList, Text, View, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';

import { supabase } from '../lib/supabaseClient';
import { colors, spacing, radii, typography } from '../theme';

type BookingDeposit = {
    id: number;
    amount: number;
    payment_status: string;
    created_at: string;
    quote_request_id: number | null;
    user_id: number | null;
    quote_request?: {
        name: string | null;
        email: string | null;
        event_type: string | null;
        event_date: string | null;
    };
    user?: {
        full_name: string | null;
        email: string | null;
    };
};

export default function VendorBookingsScreen() {
    const vendorId = 1; // Hardcoded for now, should come from auth context

    const { data, isLoading, error } = useQuery<BookingDeposit[]>({
        queryKey: ['vendor-bookings', vendorId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('booking_deposits')
                .select(`
          id,
          amount,
          payment_status,
          created_at,
          quote_request_id,
          user_id,
          quote_requests (
            name,
            email,
            event_type,
            event_date
          ),
          users (
            full_name,
            email
          )
        `)
                .eq('vendor_id', vendorId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Transform the nested data
            return (data || []).map((booking: any) => ({
                id: booking.id,
                amount: booking.amount,
                payment_status: booking.payment_status,
                created_at: booking.created_at,
                quote_request_id: booking.quote_request_id,
                user_id: booking.user_id,
                quote_request: booking.quote_requests,
                user: booking.users
            }));
        },
    });

    if (isLoading) {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (error instanceof Error) {
        return (
            <View style={{ flex: 1, padding: spacing.lg, justifyContent: 'center', backgroundColor: colors.background }}>
                <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>Failed to load bookings.</Text>
                <Text style={{ marginTop: spacing.sm, ...typography.body, color: colors.textMuted }}>{error.message}</Text>
            </View>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid':
                return colors.primary;
            case 'pending':
                return colors.textMuted;
            case 'failed':
                return '#EF4444';
            default:
                return colors.textSecondary;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'paid':
                return 'check-circle';
            case 'pending':
                return 'schedule';
            case 'failed':
                return 'error';
            default:
                return 'help';
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={{ padding: spacing.lg, paddingBottom: spacing.sm }}>
                <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>
                    Bookings & Deposits
                </Text>
                <Text style={{ ...typography.body, color: colors.textSecondary, marginTop: spacing.xs }}>
                    Track your confirmed bookings and payment status.
                </Text>
            </View>

            {!data || data.length === 0 ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg }}>
                    <MaterialIcons name="event-available" size={48} color={colors.borderSubtle} />
                    <Text style={{ ...typography.body, color: colors.textMuted, marginTop: spacing.md, textAlign: 'center' }}>
                        No bookings yet. When customers accept quotes and pay deposits, they'll appear here.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={data}
                    keyExtractor={(item) => String(item.id)}
                    contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.sm }}
                    renderItem={({ item }) => {
                        const customerName = item.quote_request?.name || item.user?.full_name || 'Unknown Customer';
                        const customerEmail = item.quote_request?.email || item.user?.email || '';
                        const eventDate = item.quote_request?.event_date
                            ? new Date(item.quote_request.event_date).toLocaleDateString()
                            : null;
                        const bookingDate = new Date(item.created_at).toLocaleDateString();

                        return (
                            <TouchableOpacity
                                activeOpacity={0.7}
                                style={{
                                    padding: spacing.md,
                                    borderRadius: radii.lg,
                                    backgroundColor: colors.surface,
                                    borderWidth: 1,
                                    borderColor: colors.borderSubtle,
                                    marginBottom: spacing.sm,
                                }}
                            >
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
                                            {customerName}
                                        </Text>
                                        {customerEmail && (
                                            <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs }}>
                                                {customerEmail}
                                            </Text>
                                        )}
                                    </View>

                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={{ ...typography.body, fontSize: 18, color: colors.textPrimary, fontWeight: '700' }}>
                                            R {item.amount.toLocaleString()}
                                        </Text>
                                        <View style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            marginTop: spacing.xs,
                                            paddingHorizontal: spacing.sm,
                                            paddingVertical: 2,
                                            borderRadius: radii.full,
                                            backgroundColor: getStatusColor(item.payment_status) + '20'
                                        }}>
                                            <MaterialIcons
                                                name={getStatusIcon(item.payment_status)}
                                                size={14}
                                                color={getStatusColor(item.payment_status)}
                                            />
                                            <Text style={{
                                                ...typography.caption,
                                                color: getStatusColor(item.payment_status),
                                                marginLeft: 4,
                                                fontWeight: '600'
                                            }}>
                                                {item.payment_status}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={{
                                    marginTop: spacing.md,
                                    paddingTop: spacing.sm,
                                    borderTopWidth: 1,
                                    borderTopColor: colors.borderSubtle
                                }}>
                                    {eventDate && (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
                                            <MaterialIcons name="event" size={16} color={colors.textMuted} />
                                            <Text style={{ ...typography.caption, color: colors.textSecondary, marginLeft: spacing.xs }}>
                                                Event: {eventDate}
                                            </Text>
                                        </View>
                                    )}
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <MaterialIcons name="schedule" size={16} color={colors.textMuted} />
                                        <Text style={{ ...typography.caption, color: colors.textSecondary, marginLeft: spacing.xs }}>
                                            Booked: {bookingDate}
                                        </Text>
                                    </View>
                                    {item.quote_request?.event_type && (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs }}>
                                            <MaterialIcons name="category" size={16} color={colors.textMuted} />
                                            <Text style={{ ...typography.caption, color: colors.textSecondary, marginLeft: spacing.xs }}>
                                                {item.quote_request.event_type}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                />
            )}
        </View>
    );
}
