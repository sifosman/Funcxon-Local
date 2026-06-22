import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radii, typography } from '../../theme';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../auth/AuthContext';

type ProfileStackParamList = {
  UpdateVendorPortfolio: undefined;
  VendorAnalytics: undefined;
  SubscriptionPlans: undefined;
};

type VendorRow = {
  id: number;
  name: string;
};

export default function VendorAnalyticsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [vendor, setVendor] = useState<VendorRow | null>(null);
  const [canUseAnalytics, setCanUseAnalytics] = useState(false);

  const [counts, setCounts] = useState({
    catalogueItems: 0,
    quoteRequests: 0,
    reviews: 0,
  });

  const loadEntitlement = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data: vendorRow } = await supabase
        .from('vendors')
        .select('subscription_tier, subscription_status')
        .eq('user_id', user.id)
        .maybeSingle();

      const tier = String(vendorRow?.subscription_tier ?? '').toLowerCase();
      const status = String(vendorRow?.subscription_status ?? '').toLowerCase();
      setCanUseAnalytics(tier !== 'free' && tier !== '' && status === 'active');
    } catch {
      setCanUseAnalytics(false);
    }
  }, [user?.id]);

  const loadAnalytics = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      const { data: vendorRow } = await supabase
        .from('vendors')
        .select('id, name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!vendorRow) {
        setVendor(null);
        setCounts({ catalogueItems: 0, quoteRequests: 0, reviews: 0 });
        return;
      }

      setVendor({ id: vendorRow.id, name: vendorRow.name });

      const vendorId = vendorRow.id;

      const [{ count: catalogueCount }, { count: quoteCount }, { count: reviewCount }] = await Promise.all([
        supabase.from('vendor_catalogue_items').select('*', { count: 'exact', head: true }).eq('vendor_id', vendorId),
        supabase.from('quote_requests').select('*', { count: 'exact', head: true }).eq('vendor_id', vendorId),
        supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('vendor_id', vendorId),
      ]);

      setCounts({
        catalogueItems: catalogueCount ?? 0,
        quoteRequests: quoteCount ?? 0,
        reviews: reviewCount ?? 0,
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadEntitlement();
    loadAnalytics();
  }, [loadEntitlement, loadAnalytics]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ ...typography.body, color: colors.textMuted, marginTop: spacing.md }}>Loading analytics...</Text>
      </View>
    );
  }

  if (!canUseAnalytics) {
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
              Analytics & Stats
            </Text>
            <Text style={{ ...typography.body, color: colors.textMuted }}>
              This feature is available on paid vendor plans.
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
                Upgrade your vendor plan to view analytics & stats.
              </Text>

              <TouchableOpacity
                onPress={() => navigation.navigate('SubscriptionPlans')}
                style={{
                  paddingVertical: spacing.sm,
                  borderRadius: radii.md,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                }}
              >
                <Text style={{ ...typography.bodyBold, color: '#FFFFFF' }}>View Plans</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (!vendor) {
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
              Analytics & Stats
            </Text>
            <Text style={{ ...typography.body, color: colors.textMuted }}>
              Create your vendor profile first.
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
                You don't have a vendor profile yet. Please create it in "Update Vendor Portfolio" before viewing analytics.
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('UpdateVendorPortfolio')}
                style={{
                  marginTop: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: colors.primary,
                  alignItems: 'center',
                }}
              >
                <Text style={{ ...typography.bodyBold, color: colors.primary }}>Go to Update Vendor Portfolio</Text>
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
            Analytics & Stats
          </Text>
          <Text style={{ ...typography.body, color: colors.textMuted }}>{vendor.name}</Text>
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
            <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>
              Overview
            </Text>

            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <View
                style={{
                  flex: 1,
                  backgroundColor: colors.surfaceMuted,
                  borderRadius: radii.lg,
                  padding: spacing.md,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                }}
              >
                <Text style={{ ...typography.caption, color: colors.textMuted }}>Catalogue Items</Text>
                <Text style={{ ...typography.displayLarge, color: colors.textPrimary }}>
                  {counts.catalogueItems}
                </Text>
              </View>

              <View
                style={{
                  flex: 1,
                  backgroundColor: colors.surfaceMuted,
                  borderRadius: radii.lg,
                  padding: spacing.md,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                }}
              >
                <Text style={{ ...typography.caption, color: colors.textMuted }}>Quote Requests</Text>
                <Text style={{ ...typography.displayLarge, color: colors.textPrimary }}>
                  {counts.quoteRequests}
                </Text>
              </View>
            </View>

            <View style={{ marginTop: spacing.md }}>
              <View
                style={{
                  backgroundColor: colors.surfaceMuted,
                  borderRadius: radii.lg,
                  padding: spacing.md,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                }}
              >
                <Text style={{ ...typography.caption, color: colors.textMuted }}>Reviews</Text>
                <Text style={{ ...typography.displayLarge, color: colors.textPrimary }}>
                  {counts.reviews}
                </Text>
              </View>
            </View>

            <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.md }}>
              This is a basic analytics view showing your current activity counts.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
