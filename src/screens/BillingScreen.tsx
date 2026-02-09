import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as WebBrowser from 'expo-web-browser';
import { colors, spacing, radii, typography } from '../theme';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';
import { buildPayFastPaymentData, getPayFastCheckoutUrl } from '../config/payfast';
import type { ProfileStackParamList } from '../navigation/ProfileNavigator';

type BillingInfo = {
    vendor_id: number;
    vendor_name: string;
    subscription_tier: string;
    subscription_status: string;
    billing_period: string | null;
    billing_email: string | null;
    billing_name: string | null;
    billing_phone: string | null;
    subscription_started_at: string | null;
    subscription_expires_at: string | null;
    next_payment_due: string | null;
    last_payment_at: string | null;
    price_monthly: number | null;
    price_yearly: number | null;
};

type Invoice = {
    id: string;
    invoice_number: string;
    amount: number;
    currency: string;
    tier_name: string;
    billing_period: string;
    status: string;
    payment_date: string | null;
    period_start: string;
    period_end: string;
    created_at: string;
};

export default function BillingScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [billing, setBilling] = useState<BillingInfo | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [payingNow, setPayingNow] = useState(false);

    const loadBillingData = useCallback(async () => {
        if (!user?.id) return;
        try {
            // Get vendor data with subscription info
            const { data: vendorData, error: vendorError } = await supabase
                .from('vendors')
                .select(`
                    id, name, subscription_tier, subscription_status,
                    billing_period, billing_email, billing_name, billing_phone,
                    subscription_started_at, subscription_expires_at,
                    next_payment_due, last_payment_at, email
                `)
                .eq('user_id', user.id)
                .maybeSingle();

            if (vendorError || !vendorData) {
                setLoading(false);
                return;
            }

            // Get tier pricing
            const { data: tierData } = await supabase
                .from('subscription_tiers')
                .select('price_monthly, price_yearly')
                .eq('tier_name', vendorData.subscription_tier || 'free')
                .maybeSingle();

            setBilling({
                vendor_id: vendorData.id,
                vendor_name: vendorData.name,
                subscription_tier: vendorData.subscription_tier || 'free',
                subscription_status: vendorData.subscription_status || 'inactive',
                billing_period: vendorData.billing_period,
                billing_email: vendorData.billing_email || vendorData.email,
                billing_name: vendorData.billing_name,
                billing_phone: vendorData.billing_phone,
                subscription_started_at: vendorData.subscription_started_at,
                subscription_expires_at: vendorData.subscription_expires_at,
                next_payment_due: vendorData.next_payment_due,
                last_payment_at: vendorData.last_payment_at,
                price_monthly: tierData?.price_monthly ? Number(tierData.price_monthly) : null,
                price_yearly: tierData?.price_yearly ? Number(tierData.price_yearly) : null,
            });

            // Load invoices
            const { data: invoiceData } = await supabase
                .from('subscription_invoices')
                .select('*')
                .eq('vendor_id', vendorData.id)
                .order('created_at', { ascending: false })
                .limit(20);

            setInvoices(invoiceData || []);
        } catch (err) {
            console.error('Failed to load billing data:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    useFocusEffect(
        useCallback(() => {
            loadBillingData();
        }, [loadBillingData]),
    );

    const handleRefresh = () => {
        setRefreshing(true);
        loadBillingData();
    };

    const handlePayNow = async () => {
        if (!billing) return;
        const isFree = billing.subscription_tier === 'free';
        if (isFree) {
            Alert.alert('Free Plan', 'Your plan is free and does not require payment. Upgrade to a paid plan for more features.');
            return;
        }

        const price = billing.billing_period === 'yearly'
            ? billing.price_yearly
            : billing.price_monthly;

        if (!price || price <= 0) {
            Alert.alert('Error', 'Could not determine the payment amount.');
            return;
        }

        setPayingNow(true);
        try {
            const nameParts = (billing.billing_name || billing.vendor_name || '').split(' ');
            const paymentData = buildPayFastPaymentData({
                amount: price,
                itemName: `Funcxon ${billing.subscription_tier} Plan (${billing.billing_period || 'monthly'})`,
                itemDescription: `${billing.subscription_tier} subscription renewal`,
                firstName: nameParts[0] || '',
                lastName: nameParts.slice(1).join(' ') || '',
                email: billing.billing_email || '',
                phone: billing.billing_phone || '',
                returnUrl: 'https://funcxon.com/payment/success',
                cancelUrl: 'https://funcxon.com/payment/cancel',
                notifyUrl: 'https://funcxon.com/api/payfast/notify',
            });

            const checkoutUrl = getPayFastCheckoutUrl(paymentData);
            await WebBrowser.openBrowserAsync(checkoutUrl);

            // After returning, refresh billing data
            loadBillingData();
        } catch (err) {
            Alert.alert('Payment Error', 'Could not open PayFast checkout. Please try again.');
        } finally {
            setPayingNow(false);
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-ZA', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const getDaysUntilExpiry = () => {
        if (!billing?.subscription_expires_at) return null;
        const now = new Date();
        const expiry = new Date(billing.subscription_expires_at);
        const diffMs = expiry.getTime() - now.getTime();
        return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    };

    const getExpiryColor = () => {
        const days = getDaysUntilExpiry();
        if (days === null) return colors.textMuted;
        if (days <= 0) return '#DC2626';
        if (days <= 5) return '#F59E0B';
        return '#16A34A';
    };

    const getExpiryLabel = () => {
        const days = getDaysUntilExpiry();
        if (days === null) return 'No expiry set';
        if (days <= 0) return 'Expired';
        if (days === 1) return 'Expires tomorrow';
        return `Expires in ${days} days`;
    };

    const getTierColor = (tier: string) => {
        switch (tier.toLowerCase()) {
            case 'free': return colors.textMuted;
            case 'basic': return colors.primary;
            case 'premium': return '#8B5CF6';
            case 'enterprise': return '#DC2626';
            default: return colors.textPrimary;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active': return '#16A34A';
            case 'trial': return '#3B82F6';
            case 'inactive': return colors.textMuted;
            case 'expired': return '#DC2626';
            case 'cancelled': return '#F59E0B';
            default: return colors.textMuted;
        }
    };

    const getInvoiceStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'paid': return '#16A34A';
            case 'pending': return '#F59E0B';
            case 'failed': return '#DC2626';
            case 'refunded': return '#3B82F6';
            case 'cancelled': return colors.textMuted;
            default: return colors.textMuted;
        }
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{ ...typography.body, color: colors.textMuted, marginTop: spacing.md }}>Loading billing...</Text>
            </View>
        );
    }

    if (!billing) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.background }}>
                <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xl }}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}
                    >
                        <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
                        <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>Back</Text>
                    </TouchableOpacity>
                </View>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
                    <MaterialIcons name="receipt-long" size={48} color={colors.textMuted} />
                    <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginTop: spacing.md, textAlign: 'center' }}>
                        No Billing Account
                    </Text>
                    <Text style={{ ...typography.body, color: colors.textMuted, marginTop: spacing.sm, textAlign: 'center' }}>
                        You need to be a registered vendor to view billing information.
                    </Text>
                </View>
            </View>
        );
    }

    const isFree = billing.subscription_tier === 'free';
    const currentPrice = billing.billing_period === 'yearly' ? billing.price_yearly : billing.price_monthly;

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <ScrollView
                contentContainerStyle={{ paddingBottom: spacing.xl }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
            >
                {/* Header */}
                <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.md }}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}
                    >
                        <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
                        <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>Back</Text>
                    </TouchableOpacity>

                    <Text style={{ ...typography.displayMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
                        Billing & Subscription
                    </Text>
                    <Text style={{ ...typography.body, color: colors.textMuted }}>
                        Manage your subscription and view payment history
                    </Text>
                </View>

                {/* Current Plan Card */}
                <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
                    <View style={{
                        backgroundColor: colors.surface,
                        borderRadius: radii.lg,
                        padding: spacing.lg,
                        borderWidth: 2,
                        borderColor: getTierColor(billing.subscription_tier),
                    }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md }}>
                            <View style={{ flex: 1 }}>
                                <Text style={{ ...typography.caption, color: colors.textMuted }}>Current Plan</Text>
                                <Text style={{ ...typography.displayLarge, color: getTierColor(billing.subscription_tier), fontWeight: '700' }}>
                                    {billing.subscription_tier.charAt(0).toUpperCase() + billing.subscription_tier.slice(1)}
                                </Text>
                            </View>
                            <View style={{
                                paddingHorizontal: spacing.md,
                                paddingVertical: spacing.xs,
                                borderRadius: radii.full,
                                backgroundColor: getStatusColor(billing.subscription_status) + '20',
                            }}>
                                <Text style={{
                                    ...typography.caption,
                                    color: getStatusColor(billing.subscription_status),
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                }}>
                                    {billing.subscription_status}
                                </Text>
                            </View>
                        </View>

                        {!isFree && currentPrice && (
                            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: spacing.md }}>
                                <Text style={{ ...typography.displayMedium, color: colors.textPrimary, fontWeight: '700' }}>
                                    R{currentPrice.toLocaleString()}
                                </Text>
                                <Text style={{ ...typography.body, color: colors.textMuted, marginLeft: spacing.xs }}>
                                    /{billing.billing_period === 'yearly' ? 'year' : 'month'}
                                </Text>
                            </View>
                        )}

                        {isFree && (
                            <Text style={{ ...typography.body, color: colors.textMuted, marginBottom: spacing.md }}>
                                Free plan — no payment required
                            </Text>
                        )}

                        <TouchableOpacity
                            onPress={() => navigation.navigate('SubscriptionPlans')}
                            style={{
                                paddingVertical: spacing.sm,
                                borderRadius: radii.md,
                                borderWidth: 1,
                                borderColor: colors.primary,
                                alignItems: 'center',
                            }}
                        >
                            <Text style={{ ...typography.body, color: colors.primary, fontWeight: '600' }}>
                                {isFree ? 'Upgrade Plan' : 'Change Plan'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Expiry & Next Payment */}
                {!isFree && (
                    <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
                        <View style={{
                            backgroundColor: colors.surface,
                            borderRadius: radii.lg,
                            padding: spacing.lg,
                            borderWidth: 1,
                            borderColor: colors.borderSubtle,
                        }}>
                            <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>
                                Subscription Details
                            </Text>

                            {/* Expiry */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <MaterialIcons name="event" size={18} color={colors.textMuted} style={{ marginRight: spacing.sm }} />
                                    <Text style={{ ...typography.body, color: colors.textMuted }}>Expires</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '500' }}>
                                        {formatDate(billing.subscription_expires_at)}
                                    </Text>
                                    <Text style={{ ...typography.caption, color: getExpiryColor(), fontWeight: '600' }}>
                                        {getExpiryLabel()}
                                    </Text>
                                </View>
                            </View>

                            {/* Next Payment */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <MaterialIcons name="payment" size={18} color={colors.textMuted} style={{ marginRight: spacing.sm }} />
                                    <Text style={{ ...typography.body, color: colors.textMuted }}>Next Payment</Text>
                                </View>
                                <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '500' }}>
                                    {formatDate(billing.next_payment_due)}
                                </Text>
                            </View>

                            {/* Started */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <MaterialIcons name="play-circle-outline" size={18} color={colors.textMuted} style={{ marginRight: spacing.sm }} />
                                    <Text style={{ ...typography.body, color: colors.textMuted }}>Started</Text>
                                </View>
                                <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '500' }}>
                                    {formatDate(billing.subscription_started_at)}
                                </Text>
                            </View>

                            {/* Last Payment */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <MaterialIcons name="check-circle-outline" size={18} color={colors.textMuted} style={{ marginRight: spacing.sm }} />
                                    <Text style={{ ...typography.body, color: colors.textMuted }}>Last Payment</Text>
                                </View>
                                <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '500' }}>
                                    {formatDate(billing.last_payment_at)}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Pay Now Button */}
                {!isFree && (
                    <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
                        <TouchableOpacity
                            onPress={handlePayNow}
                            disabled={payingNow}
                            style={{
                                backgroundColor: payingNow ? colors.textMuted : '#00457C',
                                borderRadius: radii.lg,
                                paddingVertical: spacing.md,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <MaterialIcons name="payment" size={20} color="#FFFFFF" style={{ marginRight: spacing.sm }} />
                            <Text style={{ ...typography.body, color: '#FFFFFF', fontWeight: '700' }}>
                                {payingNow ? 'Opening PayFast...' : 'Pay Now with PayFast'}
                            </Text>
                        </TouchableOpacity>
                        <Text style={{ ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs }}>
                            Secure payment via PayFast
                        </Text>
                    </View>
                )}

                {/* Invoice History */}
                <View style={{ paddingHorizontal: spacing.lg }}>
                    <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>
                        Payment History
                    </Text>

                    {invoices.length === 0 ? (
                        <View style={{
                            backgroundColor: colors.surface,
                            borderRadius: radii.lg,
                            padding: spacing.xl,
                            borderWidth: 1,
                            borderColor: colors.borderSubtle,
                            alignItems: 'center',
                        }}>
                            <MaterialIcons name="receipt" size={40} color={colors.textMuted} />
                            <Text style={{ ...typography.body, color: colors.textMuted, marginTop: spacing.sm }}>
                                No invoices yet
                            </Text>
                            <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center' }}>
                                Your payment history will appear here after your first payment.
                            </Text>
                        </View>
                    ) : (
                        invoices.map((inv) => (
                            <View
                                key={inv.id}
                                style={{
                                    backgroundColor: colors.surface,
                                    borderRadius: radii.md,
                                    padding: spacing.md,
                                    marginBottom: spacing.sm,
                                    borderWidth: 1,
                                    borderColor: colors.borderSubtle,
                                }}
                            >
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
                                    <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
                                        {inv.invoice_number}
                                    </Text>
                                    <View style={{
                                        paddingHorizontal: spacing.sm,
                                        paddingVertical: 2,
                                        borderRadius: radii.full,
                                        backgroundColor: getInvoiceStatusColor(inv.status) + '20',
                                    }}>
                                        <Text style={{
                                            ...typography.caption,
                                            color: getInvoiceStatusColor(inv.status),
                                            fontWeight: '600',
                                            textTransform: 'uppercase',
                                            fontSize: 10,
                                        }}>
                                            {inv.status}
                                        </Text>
                                    </View>
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View>
                                        <Text style={{ ...typography.caption, color: colors.textMuted }}>
                                            {inv.tier_name.charAt(0).toUpperCase() + inv.tier_name.slice(1)} • {inv.billing_period}
                                        </Text>
                                        <Text style={{ ...typography.caption, color: colors.textMuted }}>
                                            {formatDate(inv.period_start)} — {formatDate(inv.period_end)}
                                        </Text>
                                    </View>
                                    <Text style={{ ...typography.titleMedium, color: colors.textPrimary, fontWeight: '700' }}>
                                        R{Number(inv.amount).toLocaleString()}
                                    </Text>
                                </View>
                                {inv.payment_date && (
                                    <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.xs }}>
                                        Paid: {formatDate(inv.payment_date)}
                                    </Text>
                                )}
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </View>
    );
}
