import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '../lib/supabaseClient';
import { colors, spacing, radii, typography } from '../theme';
import type { QuotesStackParamList } from '../navigation/QuotesNavigator';

type QuoteRequest = {
  id: number;
  vendor_id: number | null;
  name: string | null;
  email: string | null;
  status: string | null;
  details?: string | null;
  event_type?: string | null;
  event_date?: string | null;
  budget?: string | null;
  quote_amount?: number | null;
  created_at?: string | null;
};

type VendorSummary = {
  id: number;
  name: string | null;
  price_range: string | null;
  rating: number | null;
  review_count: number | null;
  city?: string | null;
  province?: string | null;
};

type QuoteDetailData = {
  quote: QuoteRequest;
  vendor: VendorSummary | null;
};

export default function QuoteDetailScreen() {
  const route = useRoute<RouteProp<QuotesStackParamList, 'QuoteDetail'>>();
  const { quoteId } = route.params;

  const { data, isLoading, error } = useQuery<QuoteDetailData | null>({
    queryKey: ['quote-detail', quoteId],
    queryFn: async () => {
      const { data: quoteRows, error: quoteError } = await supabase
        .from('quote_requests')
        .select(
          'id, vendor_id, name, email, status, details, event_type, event_date, budget, quote_amount, created_at',
        )
        .eq('id', quoteId)
        .limit(1);

      if (quoteError) {
        throw quoteError;
      }

      const quote = (quoteRows as QuoteRequest[] | null)?.[0];
      if (!quote) {
        return null;
      }

      let vendor: VendorSummary | null = null;

      if (quote.vendor_id) {
        const { data: vendorRows, error: vendorError } = await supabase
          .from('vendors')
          .select('id, name, price_range, rating, review_count, city, province')
          .eq('id', quote.vendor_id)
          .limit(1);

        if (!vendorError) {
          vendor = (vendorRows as VendorSummary[] | null)?.[0] ?? null;
        }
      }

      return { quote, vendor };
    },
  });

  if (isLoading) {
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

  if (error instanceof Error) {
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
        <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>Failed to load quote.</Text>
        <Text style={{ marginTop: spacing.sm, ...typography.body, color: colors.textMuted }}>{error.message}</Text>
      </View>
    );
  }

  if (!data || !data.quote) {
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
          This quote could not be found.
        </Text>
      </View>
    );
  }

  const { quote, vendor } = data;

  const requestedDate =
    quote.event_date || quote.created_at
      ? new Date(quote.event_date || quote.created_at || '').toLocaleDateString()
      : null;

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
      contentContainerStyle={{
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.lg,
      }}
    >
      <View
        style={{
          marginBottom: spacing.lg,
          padding: spacing.md,
          borderRadius: radii.lg,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
        }}
      >
        <Text
          style={{
            ...typography.titleMedium,
            color: colors.textPrimary,
          }}
        >
          {quote.name || 'Unnamed enquiry'}
        </Text>
        {quote.status && (
          <Text
            style={{
              ...typography.caption,
              color: colors.textSecondary,
              marginTop: spacing.xs,
            }}
          >
            Status: {quote.status}
          </Text>
        )}
        {requestedDate && (
          <Text
            style={{
              ...typography.caption,
              color: colors.textSecondary,
              marginTop: spacing.xs,
            }}
          >
            Requested for: {requestedDate}
          </Text>
        )}
        {quote.email && (
          <Text
            style={{
              ...typography.caption,
              color: colors.textSecondary,
              marginTop: spacing.xs,
            }}
          >
            {quote.email}
          </Text>
        )}
      </View>

      {vendor && (
        <View
          style={{
            marginBottom: spacing.lg,
            padding: spacing.md,
            borderRadius: radii.lg,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
          }}
        >
          <Text
            style={{
              ...typography.body,
              color: colors.textPrimary,
              fontWeight: '600',
            }}
          >
            {vendor.name || 'Vendor'}
          </Text>
          <Text
            style={{
              ...typography.caption,
              color: colors.textSecondary,
              marginTop: spacing.xs,
            }}
          >
            {[vendor.city, vendor.province].filter(Boolean).join(', ') || 'Location not specified'}
          </Text>
          <Text
            style={{
              ...typography.caption,
              color: colors.textSecondary,
              marginTop: spacing.xs,
            }}
          >
            {vendor.price_range || ''}
          </Text>
        </View>
      )}

      <View
        style={{
          marginBottom: spacing.lg,
          padding: spacing.md,
          borderRadius: radii.lg,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
        }}
      >
        {quote.event_type && (
          <Text
            style={{
              ...typography.caption,
              color: colors.textSecondary,
              marginBottom: spacing.xs,
            }}
          >
            Event type: {quote.event_type}
          </Text>
        )}
        {quote.budget && (
          <Text
            style={{
              ...typography.caption,
              color: colors.textSecondary,
              marginBottom: spacing.xs,
            }}
          >
            Budget: {quote.budget}
          </Text>
        )}
        {typeof quote.quote_amount === 'number' && (
          <Text
            style={{
              ...typography.caption,
              color: colors.textSecondary,
              marginBottom: spacing.xs,
            }}
          >
            Quoted amount: {quote.quote_amount.toLocaleString()}
          </Text>
        )}
        {quote.details && (
          <Text
            style={{
              ...typography.body,
              color: colors.textPrimary,
              marginTop: spacing.sm,
            }}
          >
            {quote.details}
          </Text>
        )}
      </View>
    </ScrollView>
  );
}
