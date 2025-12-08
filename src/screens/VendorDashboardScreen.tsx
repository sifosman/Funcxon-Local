import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '../lib/supabaseClient';
import { colors, spacing, radii, typography } from '../theme';

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

  return (
    <View
      style={{
        flex: 1,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.lg,
        backgroundColor: colors.background,
      }}
    >
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
              ...typography.body,
              color: colors.textPrimary,
              fontWeight: '600',
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

      {/* Reviews section */}
      <Text
        style={{
          ...typography.titleMedium,
          color: colors.textPrimary,
          marginBottom: spacing.xs,
        }}
      >
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
              <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
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

      {/* Quote requests section */}
      <Text
        style={{
          ...typography.titleMedium,
          color: colors.textPrimary,
          marginTop: spacing.lg,
          marginBottom: spacing.xs,
        }}
      >
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
            <View
              style={{
                paddingVertical: spacing.sm,
                borderBottomWidth: 1,
                borderBottomColor: colors.borderSubtle,
              }}
            >
              <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
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
                >
                  {item.details}
                </Text>
              )}
              <Text
                style={{
                  ...typography.caption,
                  color: colors.textSecondary,
                  marginTop: spacing.xs,
                }}
              >
                Status: {item.status ?? 'pending'}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}
