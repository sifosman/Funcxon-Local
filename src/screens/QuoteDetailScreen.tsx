import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '../lib/supabaseClient';
import { colors, spacing, radii, typography } from '../theme';
import type { QuotesStackParamList } from '../navigation/QuotesNavigator';

type QuoteRequest = {
  id: number | string;
  original_id?: number;
  is_venue?: boolean;
  vendor_id: number | null;
  target_id?: number | null;
  target_name?: string | null;
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

type VenueSummary = {
  id: number;
  name: string | null;
  description: string | null;
  city?: string | null;
  province?: string | null;
};

type QuoteDetailData = {
  quote: QuoteRequest;
  vendor: VendorSummary | null;
  venue: VenueSummary | null;
};

export default function QuoteDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<QuotesStackParamList, 'QuoteDetail'>>();
  const { quoteId } = route.params;

  const { data, isLoading, error } = useQuery<QuoteDetailData | null>({
    queryKey: ['quote-detail', quoteId],
    queryFn: async () => {
      const isVenueQuote = typeof quoteId === 'string' && quoteId.startsWith('venue-');
      const resolvedQuoteId = isVenueQuote ? Number(String(quoteId).replace('venue-', '')) : quoteId;

      let quote: QuoteRequest | null = null;
      let vendor: VendorSummary | null = null;
      let venue: VenueSummary | null = null;

      if (isVenueQuote) {
        const { data: venueQuoteRows, error: venueQuoteError } = await supabase
          .from('venue_quote_requests')
          .select('id, listing_id, requester_name, requester_email, status, message, event_date, created_at')
          .eq('id', resolvedQuoteId)
          .limit(1);

        if (venueQuoteError) {
          throw venueQuoteError;
        }

        const venueQuote = (venueQuoteRows as any[] | null)?.[0];
        if (!venueQuote) {
          return null;
        }

        quote = {
          id: `venue-${venueQuote.id}`,
          original_id: venueQuote.id,
          is_venue: true,
          vendor_id: venueQuote.listing_id,
          target_id: venueQuote.listing_id,
          name: venueQuote.requester_name,
          email: venueQuote.requester_email,
          status: venueQuote.status,
          details: venueQuote.message,
          event_type: 'Venue',
          event_date: venueQuote.event_date,
          budget: null,
          quote_amount: null,
          created_at: venueQuote.created_at,
        };

        if (venueQuote.listing_id) {
          const { data: venueRows, error: venueError } = await supabase
            .from('venue_listings')
            .select('id, name, description, city, province')
            .eq('id', venueQuote.listing_id)
            .limit(1);

          if (!venueError) {
            venue = (venueRows as VenueSummary[] | null)?.[0] ?? null;
          }
        }
      } else {
        const { data: quoteRows, error: quoteError } = await supabase
          .from('quote_requests')
          .select(
            'id, vendor_id, name, email, status, details, event_type, event_date, budget, quote_amount, created_at',
          )
          .eq('id', resolvedQuoteId)
          .limit(1);

        if (quoteError) {
          throw quoteError;
        }

        const vendorQuote = (quoteRows as QuoteRequest[] | null)?.[0];
        if (!vendorQuote) {
          return null;
        }

        quote = {
          ...vendorQuote,
          target_id: vendorQuote.vendor_id,
        };

        if (vendorQuote.vendor_id) {
          const { data: vendorRows, error: vendorError } = await supabase
            .from('vendors')
            .select('id, name, price_range, rating, review_count, city, province')
            .eq('id', vendorQuote.vendor_id)
            .limit(1);

          if (!vendorError) {
            vendor = (vendorRows as VendorSummary[] | null)?.[0] ?? null;
          }
        }
      }

      if (quote) {
        quote.target_name = venue?.name ?? vendor?.name ?? quote.target_name ?? null;
      }

      return quote ? { quote, vendor, venue } : null;
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

  const { quote, vendor, venue } = data;

  const requestedDate =
    quote.event_date || quote.created_at
      ? new Date(quote.event_date || quote.created_at || '').toLocaleDateString()
      : null;

  const linkedName = venue?.name ?? vendor?.name ?? quote.target_name ?? 'Listing';
  const linkedLocation = venue
    ? [venue.city, venue.province].filter(Boolean).join(', ')
    : vendor
      ? [vendor.city, vendor.province].filter(Boolean).join(', ')
      : '';

  const handleOpenProfile = () => {
    const targetId = quote.target_id ?? quote.vendor_id;
    if (!targetId) {
      return;
    }

    navigation.navigate('Home', quote.is_venue
      ? {
          screen: 'VenueProfile',
          params: { venueId: targetId, from: 'Quotes' },
        }
      : {
          screen: 'VendorProfile',
          params: { vendorId: targetId, from: 'Quotes' },
        });
  };

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
          {linkedName}
        </Text>
        <Text
          style={{
            ...typography.caption,
            color: colors.textSecondary,
            marginTop: spacing.xs,
          }}
        >
          Requested from: {linkedName}
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

      {(vendor || venue) && (
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
            {linkedName}
          </Text>
          <Text
            style={{
              ...typography.caption,
              color: colors.textSecondary,
              marginTop: spacing.xs,
            }}
          >
            {linkedLocation || 'Location not specified'}
          </Text>
          {!quote.is_venue && vendor?.price_range ? (
            <Text
              style={{
                ...typography.caption,
                color: colors.textSecondary,
                marginTop: spacing.xs,
              }}
            >
              {vendor.price_range}
            </Text>
          ) : null}
          <TouchableOpacity
            onPress={handleOpenProfile}
            style={{
              marginTop: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: radii.md,
              borderWidth: 1,
              borderColor: colors.primaryTeal,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ ...typography.body, color: colors.primaryTeal, fontWeight: '600' }}>
              View Full {quote.is_venue ? 'Venue' : 'Vendor'} Profile
            </Text>
          </TouchableOpacity>
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
