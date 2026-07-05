import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { supabase } from '../lib/supabaseClient';
import { colors, spacing, radii, typography } from '../theme';
import { useIsDesktop } from '../hooks/useIsDesktop';

type ProfileStackParamList = {
  VendorQuoteCreate: {
    quoteRequestId: number;
    clientName?: string;
    clientEmail?: string;
    eventDetails?: string;
  };
  VendorQuoteHistory: { quoteRequestId: number };
};

type VendorSummary = {
  id: number;
  name: string;
  rating: number | null;
  review_count: number | null;
  price_range: string | null;
};

type Review = {
  id: number;
  rating: number;
  status: string | null;
};

type QuoteRequest = {
  id: number;
  name: string | null;
  email: string | null;
  status: string | null;
  details?: string | null;
};

export default function VendorDashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const isDesktop = useIsDesktop();
  const {
    data: vendor,
    isLoading: vendorLoading,
    error: vendorError,
  } = useQuery<VendorSummary | null>({
    queryKey: ['vendor-dashboard-vendor'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, name, rating, review_count, price_range')
        .order('id', { ascending: true })
        .limit(1);

      if (error) {
        throw error;
      }

      return (data && data[0]) || null;
    },
  });

  const vendorId = vendor?.id ?? null;

  const {
    data: reviews,
    isLoading: reviewsLoading,
    error: reviewsError,
  } = useQuery<Review[]>({
    queryKey: ['vendor-dashboard-reviews', vendorId],
    enabled: !!vendorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('id, rating, status')
        .eq('vendor_id', vendorId)
        .order('id', { ascending: false })
        .limit(10);

      if (error) {
        throw error;
      }

      return (data as Review[]) ?? [];
    },
  });

  const {
    data: quotes,
    isLoading: quotesLoading,
    error: quotesError,
  } = useQuery<QuoteRequest[]>({
    queryKey: ['vendor-dashboard-quotes', vendorId],
    enabled: !!vendorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quote_requests')
        .select('id, name, email, status, details')
        .eq('vendor_id', vendorId)
        .order('id', { ascending: false })
        .limit(20);

      if (error) {
        throw error;
      }

      return (data as QuoteRequest[]) ?? [];
    },
  });

  const pendingCount = quotes?.filter((q) => q.status === 'pending').length ?? 0;

  if (vendorLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  if (vendorError instanceof Error) {
    return (
      <View
        style={{
          flex: 1,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.lg,
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>Failed to load vendor dashboard.</Text>
        <Text style={{ marginTop: spacing.sm, ...typography.body, color: colors.textMuted }}>{vendorError.message}</Text>
      </View>
    );
  }

  if (!vendor) {
    return (
      <View
        style={{
          flex: 1,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.lg,
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <Text style={{ textAlign: 'center', ...typography.body, color: colors.textPrimary }}>
          No vendor found. Add at least one row to the vendors table to see the dashboard.
        </Text>
      </View>
    );
  }

  const desktopContainerStyle = {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center' as const,
    paddingHorizontal: 48,
  };

  const renderHeader = () => (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={{ ...typography.labelMd, color: colors.dustyRose, textTransform: 'uppercase', marginBottom: spacing.sm } as any}>
        Vendor Dashboard
      </Text>
      <Text style={{ ...typography.headlineMd, color: colors.primary, marginBottom: spacing.xs }}>
        {vendor.name}
      </Text>
      <Text style={{ ...typography.bodyMd, color: colors.onSurfaceVariant }}>
        {typeof vendor.rating === 'number' ? `${vendor.rating.toFixed(1)} / 5` : 'No rating yet'}
        {typeof vendor.review_count === 'number' && vendor.review_count > 0
          ? `  ·  ${vendor.review_count} review${vendor.review_count === 1 ? '' : 's'}`
          : ''}
        {vendor.price_range ? `  ·  ${vendor.price_range}` : ''}
      </Text>
    </View>
  );

  const renderSummaryCards = () => (
    <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg } as any}>
      <View style={{ flex: 1, backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.outlineVariant } as any}>
        <Text style={{ ...typography.labelMd, color: colors.onSurfaceVariant, marginBottom: spacing.sm } as any}>Pending Quotes</Text>
        <Text style={{ ...typography.headlineMd, color: colors.primary }}>{pendingCount}</Text>
      </View>
      <View style={{ flex: 1, backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.outlineVariant } as any}>
        <Text style={{ ...typography.labelMd, color: colors.onSurfaceVariant, marginBottom: spacing.sm } as any}>Total Reviews</Text>
        <Text style={{ ...typography.headlineMd, color: colors.primary }}>{vendor.review_count ?? 0}</Text>
      </View>
      <View style={{ flex: 1, backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.outlineVariant } as any}>
        <Text style={{ ...typography.labelMd, color: colors.onSurfaceVariant, marginBottom: spacing.sm } as any}>Rating</Text>
        <Text style={{ ...typography.headlineMd, color: colors.primary }}>{typeof vendor.rating === 'number' ? vendor.rating.toFixed(1) : '-'}</Text>
      </View>
    </View>
  );

  const renderQuickActions = () => (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={{ ...typography.headlineSm, color: colors.textPrimary, marginBottom: spacing.md }}>Quick Actions</Text>
      <View style={{ flexDirection: 'row', gap: spacing.md } as any}>
        <TouchableOpacity
          onPress={() => navigation.navigate('VendorQuoteHistory' as any)}
          style={{ flex: 1, backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.outlineVariant } as any}
        >
          <MaterialIcons name="history" size={24} color={colors.primary} />
          <Text style={{ ...typography.bodyMd, color: colors.textPrimary, marginTop: spacing.sm, fontWeight: '600' } as any}>Quote History</Text>
          <Text style={{ ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: 2 } as any}>View past quotes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('VendorCatalogue' as any)}
          style={{ flex: 1, backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.outlineVariant } as any}
        >
          <MaterialIcons name="inventory" size={24} color={colors.primary} />
          <Text style={{ ...typography.bodyMd, color: colors.textPrimary, marginTop: spacing.sm, fontWeight: '600' } as any}>Catalogue</Text>
          <Text style={{ ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: 2 } as any}>Manage items</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('VendorAnalytics' as any)}
          style={{ flex: 1, backgroundColor: colors.surfaceContainerLowest, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.outlineVariant } as any}
        >
          <MaterialIcons name="bar-chart" size={24} color={colors.primary} />
          <Text style={{ ...typography.bodyMd, color: colors.textPrimary, marginTop: spacing.sm, fontWeight: '600' } as any}>Analytics</Text>
          <Text style={{ ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: 2 } as any}>View stats</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderReviews = () => (
    <View style={{ backgroundColor: isDesktop ? colors.surfaceContainerLowest : undefined, borderRadius: isDesktop ? radii.lg : undefined, padding: isDesktop ? spacing.lg : undefined, borderWidth: isDesktop ? 1 : 0, borderColor: isDesktop ? colors.outlineVariant : undefined } as any}>
      <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
        Recent reviews
      </Text>
      {reviewsLoading && (
        <View style={{ paddingVertical: 8 }}>
          <ActivityIndicator />
        </View>
      )}
      {reviewsError instanceof Error && (
        <View style={{ paddingVertical: 8 }}>
          <Text style={{ ...typography.body, color: colors.textPrimary }}>Failed to load reviews.</Text>
          <Text style={{ ...typography.caption, color: colors.textMuted }}>{reviewsError.message}</Text>
        </View>
      )}
      {!reviewsLoading && (!reviews || reviews.length === 0) && (
        <Text style={{ marginBottom: spacing.md, ...typography.body, color: colors.textMuted }}>No reviews yet.</Text>
      )}
      {reviews && reviews.length > 0 && (
        <FlatList
          data={reviews}
          keyExtractor={(item) => `review-${item.id}`}
          renderItem={({ item }) => (
            <View
              style={{
                paddingVertical: spacing.sm,
                borderBottomWidth: 1,
                borderBottomColor: colors.borderSubtle,
              }}
            >
              <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary }}>
                Rating: {item.rating} / 5
              </Text>
              {item.status && (
                <Text
                  style={{
                    ...typography.caption,
                    color: colors.textMuted,
                    marginTop: spacing.xs,
                  }}
                >
                  {item.status}
                </Text>
              )}
            </View>
          )}
          style={{ marginBottom: 16 }}
        />
      )}
    </View>
  );

  const renderQuotes = () => (
    <View style={{ backgroundColor: isDesktop ? colors.surfaceContainerLowest : undefined, borderRadius: isDesktop ? radii.lg : undefined, padding: isDesktop ? spacing.lg : undefined, borderWidth: isDesktop ? 1 : 0, borderColor: isDesktop ? colors.outlineVariant : undefined } as any}>
      <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
        Recent quote requests
      </Text>
      {quotesLoading && (
        <View style={{ paddingVertical: 8 }}>
          <ActivityIndicator />
        </View>
      )}
      {quotesError instanceof Error && (
        <View style={{ paddingVertical: 8 }}>
          <Text style={{ ...typography.body, color: colors.textPrimary }}>Failed to load quote requests.</Text>
          <Text style={{ ...typography.caption, color: colors.textMuted }}>{quotesError.message}</Text>
        </View>
      )}
      {!quotesLoading && (!quotes || quotes.length === 0) && (
        <Text style={{ ...typography.body, color: colors.textMuted }}>No quote requests yet.</Text>
      )}
      {quotes && quotes.length > 0 && (
        <FlatList
          data={quotes}
          keyExtractor={(item) => `quote-${item.id}`}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('VendorQuoteCreate', {
                  quoteRequestId: item.id,
                  clientName: item.name || undefined,
                  clientEmail: item.email || undefined,
                  eventDetails: item.details || undefined,
                })
              }
              style={{
                paddingVertical: spacing.sm,
                borderBottomWidth: 1,
                borderBottomColor: colors.borderSubtle,
              }}
            >
              <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary }}>
                {item.name ?? 'Unnamed enquiry'}
              </Text>
              {item.email && (
                <Text
                  style={{
                    ...typography.caption,
                    color: colors.textSecondary,
                    marginTop: spacing.xs,
                  }}
                >
                  {item.email}
                </Text>
              )}
              {item.details && (
                <Text
                  style={{
                    ...typography.caption,
                    color: colors.textSecondary,
                    marginTop: spacing.xs,
                  }}
                  numberOfLines={2}
                >
                  {item.details}
                </Text>
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs }}>
                <Text
                  style={{
                    ...typography.caption,
                    color: item.status === 'pending' ? '#D97706' : colors.textSecondary,
                    fontWeight: item.status === 'pending' ? '600' : '400',
                  }}
                >
                  Status: {item.status ?? 'pending'}
                </Text>
                {item.status === 'pending' && (
                  <Text
                    style={{
                      ...typography.caption,
                      color: colors.primary,
                      marginLeft: spacing.sm,
                    }}
                  >
                    Tap to create quote →
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isDesktop ? colors.surfaceBg : colors.background,
      }}
    >
      <View style={isDesktop ? { ...desktopContainerStyle, paddingVertical: spacing.lg } as any : { flex: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg }}>
        {isDesktop ? (
          <>
            {renderHeader()}
            {renderSummaryCards()}
            {renderQuickActions()}
            <View style={{ flexDirection: 'row', gap: spacing.gutter } as any}>
              <View style={{ flex: 1 } as any}>
                {renderReviews()}
              </View>
              <View style={{ flex: 1 } as any}>
                {renderQuotes()}
              </View>
            </View>
          </>
        ) : (
          <>
            {pendingCount > 0 && (
              <View
                style={{
                  padding: spacing.md,
                  borderRadius: radii.lg,
                  backgroundColor: colors.surfaceMuted,
                  borderWidth: 1,
                  borderColor: colors.borderStrong,
                  marginBottom: spacing.md,
                }}
              >
                <Text
                  style={{
                    ...typography.bodySemiBold,
                    color: colors.textPrimary,
                  }}
                >
                  You have {pendingCount} pending quote request{pendingCount === 1 ? '' : 's'}.
                </Text>
              </View>
            )}
            <Text
              style={{
                ...typography.titleMedium,
                color: colors.textPrimary,
                marginBottom: spacing.xs,
              }}
            >
              {vendor.name}
            </Text>
            <Text style={{ ...typography.body, color: colors.textSecondary, marginBottom: spacing.md }}>
              {typeof vendor.rating === 'number' ? `${vendor.rating.toFixed(1)} / 5` : 'No rating yet'}
              {typeof vendor.review_count === 'number' && vendor.review_count > 0
                ? `  ·  ${vendor.review_count} review${vendor.review_count === 1 ? '' : 's'}`
                : ''}
              {vendor.price_range ? `  ·  ${vendor.price_range}` : ''}
            </Text>
            {renderReviews()}
            {renderQuotes()}
          </>
        )}
      </View>
    </View>
  );
}
