import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radii, typography } from '../../theme';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../auth/AuthContext';
import { getMyVenueEntitlement, isVenueFeatureEnabled } from '../../lib/venueSubscription';
import { useIsDesktop } from '../../hooks/useIsDesktop';

type ProfileStackParamList = {
  UpdateVenuePortfolio: undefined;
  VenueAnalytics: undefined;
  VenueListingPlans: undefined;
};

type VenueListingRow = {
  id: number;
  name: string;
};

export default function VenueAnalyticsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { user } = useAuth();
  const isDesktop = useIsDesktop();

  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState<VenueListingRow | null>(null);
  const [canUseAnalytics, setCanUseAnalytics] = useState(false);

  const [counts, setCounts] = useState({
    catalogueItems: 0,
    quoteRequests: 0,
    tourBookings: 0,
  });

  const loadEntitlement = useCallback(async () => {
    if (!user?.id) return;
    const ent = await getMyVenueEntitlement(user.id);
    setCanUseAnalytics(isVenueFeatureEnabled(ent, 'analytics'));
  }, [user?.id]);

  const loadAnalytics = useCallback(async () => {
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
        setCounts({ catalogueItems: 0, quoteRequests: 0, tourBookings: 0 });
        return;
      }

      setListing({ id: listingRow.id, name: listingRow.name });

      const listingId = listingRow.id;

      const [{ count: catalogueCount }, { count: quoteCount }, { count: tourCount }] = await Promise.all([
        supabase.from('venue_catalogue_items').select('*', { count: 'exact', head: true }).eq('listing_id', listingId),
        supabase.from('venue_quote_requests').select('*', { count: 'exact', head: true }).eq('listing_id', listingId),
        supabase.from('venue_tour_bookings').select('*', { count: 'exact', head: true }).eq('listing_id', listingId),
      ]);

      setCounts({
        catalogueItems: catalogueCount ?? 0,
        quoteRequests: quoteCount ?? 0,
        tourBookings: tourCount ?? 0,
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

  const desktopContainerStyle = {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center' as const,
    paddingHorizontal: 48,
  };

  const cardSurface = isDesktop ? colors.surfaceContainerLowest : colors.surface;
  const cardBorder = isDesktop ? colors.outlineVariant : colors.borderSubtle;

  const renderHeader = (isDesktopHeader: boolean, subtitle: string) => (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={isDesktopHeader ? { ...typography.labelMd, color: colors.dustyRose, textTransform: 'uppercase', marginBottom: spacing.sm } as any : { display: 'none' } as any}>
        Analytics
      </Text>
      <Text style={isDesktopHeader ? { ...typography.headlineMd, color: colors.primary } as any : { ...typography.displayMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
        Analytics & Stats
      </Text>
      <Text style={{ ...typography.bodyMd, color: isDesktopHeader ? colors.onSurfaceVariant : colors.textMuted }}>
        {subtitle}
      </Text>
    </View>
  );

  const renderStatsCards = () => (
    <View style={{ flexDirection: 'row', gap: spacing.md } as any}>
      <View style={{ flex: 1, backgroundColor: cardSurface, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: cardBorder } as any}>
        <Text style={{ ...typography.labelMd, color: colors.onSurfaceVariant, marginBottom: spacing.sm } as any}>Catalogue Items</Text>
        <Text style={{ ...typography.headlineMd, color: colors.primary }}>{counts.catalogueItems}</Text>
      </View>
      <View style={{ flex: 1, backgroundColor: cardSurface, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: cardBorder } as any}>
        <Text style={{ ...typography.labelMd, color: colors.onSurfaceVariant, marginBottom: spacing.sm } as any}>Quote Requests</Text>
        <Text style={{ ...typography.headlineMd, color: colors.primary }}>{counts.quoteRequests}</Text>
      </View>
      <View style={{ flex: 1, backgroundColor: cardSurface, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: cardBorder } as any}>
        <Text style={{ ...typography.labelMd, color: colors.onSurfaceVariant, marginBottom: spacing.sm } as any}>Tour Bookings</Text>
        <Text style={{ ...typography.headlineMd, color: colors.primary }}>{counts.tourBookings}</Text>
      </View>
    </View>
  );

  if (!canUseAnalytics) {
    return (
      <View style={{ flex: 1, backgroundColor: isDesktop ? colors.surfaceBg : colors.background }}>
        <ScrollView contentContainerStyle={isDesktop ? { ...desktopContainerStyle, paddingBottom: spacing.xxl } as any : { paddingBottom: spacing.xl }}>
          <View style={{ paddingHorizontal: isDesktop ? 0 : spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md }}>
            {!isDesktop && (
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}
              >
                <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
                <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>Back</Text>
              </TouchableOpacity>
            )}

            {renderHeader(isDesktop, 'This feature is available on paid venue plans.')}
          </View>

          <View style={{ paddingHorizontal: isDesktop ? 0 : spacing.lg }}>
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
              <Text style={{ ...typography.bodyMd, color: '#9A3412', marginBottom: spacing.md }}>
                Upgrade your venue plan to view analytics & stats.
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
      <View style={{ flex: 1, backgroundColor: isDesktop ? colors.surfaceBg : colors.background }}>
        <ScrollView contentContainerStyle={isDesktop ? { ...desktopContainerStyle, paddingBottom: spacing.xxl } as any : { paddingBottom: spacing.xl }}>
          <View style={{ paddingHorizontal: isDesktop ? 0 : spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md }}>
            {!isDesktop && (
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}
              >
                <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
                <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>Back</Text>
              </TouchableOpacity>
            )}

            {renderHeader(isDesktop, 'Create your venue listing first.')}
          </View>

          <View style={{ paddingHorizontal: isDesktop ? 0 : spacing.lg }}>
            <View
              style={{
                backgroundColor: cardSurface,
                borderRadius: radii.lg,
                padding: spacing.lg,
                borderWidth: 1,
                borderColor: cardBorder,
              }}
            >
              <Text style={{ ...typography.bodyMd, color: colors.textPrimary }}>
                You don’t have a venue listing yet. Please create it in “Update Venue Portfolio” before viewing analytics.
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
    <View style={{ flex: 1, backgroundColor: isDesktop ? colors.surfaceBg : colors.background }}>
      <ScrollView contentContainerStyle={isDesktop ? { ...desktopContainerStyle, paddingBottom: spacing.xxl } as any : { paddingBottom: spacing.xl }}>
        {isDesktop ? (
          <>
            {renderHeader(true, listing.name)}
            <View style={{ flexDirection: 'row', gap: spacing.gutter } as any}>
              <View style={{ flex: 2 } as any}>
                <View style={{ backgroundColor: cardSurface, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: cardBorder }}>
                  <Text style={{ ...typography.headlineSm, color: colors.textPrimary, marginBottom: spacing.md }}>
                    Overview
                  </Text>
                  {renderStatsCards()}
                  <Text style={{ ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: spacing.md }}>
                    This is a basic analytics view showing your current activity counts.
                  </Text>
                </View>
              </View>
              <View style={{ flex: 1 } as any}>
                <View style={{ backgroundColor: cardSurface, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: cardBorder }}>
                  <Text style={{ ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center' } as any}>
                    Upgrade your plan for deeper insights, trend charts, and tour conversion metrics.
                  </Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          <>
            <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md }}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}
              >
                <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
                <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>Back</Text>
              </TouchableOpacity>

              {renderHeader(false, listing.name)}
            </View>

            <View style={{ paddingHorizontal: spacing.lg }}>
              <View
                style={{
                  backgroundColor: cardSurface,
                  borderRadius: radii.lg,
                  padding: spacing.lg,
                  borderWidth: 1,
                  borderColor: cardBorder,
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
                    <Text style={{ ...typography.caption, color: colors.textMuted }}>Tour Bookings</Text>
                    <Text style={{ ...typography.displayLarge, color: colors.textPrimary }}>
                      {counts.tourBookings}
                    </Text>
                  </View>
                </View>

                <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.md }}>
                  This is a basic analytics view showing your current activity counts.
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
