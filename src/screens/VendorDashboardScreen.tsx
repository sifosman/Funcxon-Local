import { ActivityIndicator, FlatList, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '../lib/supabaseClient';
import { colors, spacing, radii, typography } from '../theme';
import { PrimaryButton, OutlineButton } from '../components/ui';
import type { VendorStackParamList } from '../navigation/VendorNavigator';

type VendorSummary = {
  id: number;
  name: string;
  rating: number | null;
  review_count: number | null;
  price_range: string | null;
};

type StatsData = {
  totalBookings: number;
  pendingQuotes: number;
  totalRevenue: number;
  viewsThisMonth: number;
  activeListings: number;
  responseRate: number;
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

type VendorDocument = {
  id: number;
  document_type: string;
  file_name: string | null;
};

export default function VendorDashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<VendorStackParamList>>();

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
    data: stats,
  } = useQuery<StatsData>({
    queryKey: ['vendor-dashboard-stats', vendorId],
    enabled: !!vendorId,
    queryFn: async () => {
      const bookingsResult = await supabase
        .from('booking_deposits')
        .select('amount', { count: 'exact' })
        .eq('vendor_id', vendorId);

      const quotesResult = await supabase
        .from('quote_requests')
        .select('*', { count: 'exact' })
        .eq('vendor_id', vendorId)
        .eq('status', 'pending');

      const revenueResult = await supabase
        .from('booking_deposits')
        .select('amount')
        .eq('vendor_id', vendorId)
        .eq('payment_status', 'paid');

      const viewsResult = await supabase
        .from('page_views')
        .select('id', { count: 'exact', head: true })
        .eq('reference_id', vendorId)
        .eq('page_type', 'vendor')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const catalogResult = await supabase
        .from('vendor_catalog_items')
        .select('id', { count: 'exact', head: true })
        .eq('vendor_id', vendorId);

      const totalRevenue = revenueResult.data?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;

      return {
        totalBookings: bookingsResult.count || 0,
        pendingQuotes: quotesResult.count || 0,
        totalRevenue,
        viewsThisMonth: viewsResult.count || 0,
        activeListings: catalogResult.count || 0,
        responseRate: 85,
      };
    },
  });

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

  const {
    data: documents,
  } = useQuery<VendorDocument[] | null>({
    queryKey: ['vendor-dashboard-documents', vendorId],
    enabled: !!vendorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_documents')
        .select('id, document_type, file_name')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        throw error;
      }

      return (data as VendorDocument[]) ?? [];
    },
  });

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

  const StatCard = ({
    title,
    value,
    subtitle,
    onPress,
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      disabled={!onPress}
      style={{
        flex: 1,
        minWidth: '47%',
        padding: spacing.lg,
        borderRadius: radii.lg,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        marginBottom: spacing.md,
      }}
    >
      <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs }}>
        {title}
      </Text>
      <Text style={{ ...typography.titleLarge, color: colors.textPrimary, marginBottom: spacing.xs }}>
        {value}
      </Text>
      {subtitle && (
        <Text style={{ ...typography.caption, color: colors.textMuted }}>
          {subtitle}
        </Text>
      )}
    </TouchableOpacity>
  );

  const QuickActionButton = ({
    title,
    onPress,
    variant = 'primary',
  }: {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'outline';
  }) => {
    if (variant === 'outline') {
      return (
        <OutlineButton
          title={title}
          onPress={onPress}
          style={{ flex: 1, marginHorizontal: spacing.xs }}
        />
      );
    }
    return (
      <PrimaryButton
        title={title}
        onPress={onPress}
        style={{ flex: 1, marginHorizontal: spacing.xs }}
      />
    );
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
      <View style={{ marginBottom: spacing.xl }}>
        <Text
          style={{
            ...typography.displayMedium,
            color: colors.textPrimary,
            marginBottom: spacing.xs,
          }}
        >
          {vendor.name}
        </Text>
        <Text style={{ ...typography.body, color: colors.textSecondary, marginBottom: spacing.md }}>
          {typeof vendor.rating === 'number' ? `${vendor.rating.toFixed(1)} ⭐` : 'No rating yet'}
          {typeof vendor.review_count === 'number' && vendor.review_count > 0
            ? `  ·  ${vendor.review_count} review${vendor.review_count === 1 ? '' : 's'}`
            : ''}
          {vendor.price_range ? `  ·  ${vendor.price_range}` : ''}
        </Text>
      </View>

      <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>
        Performance Overview
      </Text>

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          marginBottom: spacing.lg,
        }}
      >
        <StatCard
          title="Total Bookings"
          value={stats?.totalBookings ?? 0}
          subtitle="All time"
          onPress={() => navigation.navigate('VendorBookings')}
        />
        <StatCard
          title="Pending Quotes"
          value={stats?.pendingQuotes ?? 0}
          subtitle="Requires action"
          onPress={() => navigation.navigate('VendorDashboard')}
        />
        <StatCard
          title="Revenue"
          value={`R ${stats?.totalRevenue.toLocaleString() ?? '0'}`}
          subtitle="Total earnings"
        />
        <StatCard
          title="Profile Views"
          value={stats?.viewsThisMonth ?? 0}
          subtitle="Last 30 days"
        />
        <StatCard
          title="Active Listings"
          value={stats?.activeListings ?? 0}
          subtitle="Catalog items"
          onPress={() => navigation.navigate('VendorCatalog')}
        />
        <StatCard
          title="Response Rate"
          value={`${stats?.responseRate ?? 0}%`}
          subtitle="Avg. response time"
        />
      </View>

      <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>
        Quick Actions
      </Text>

      <View
        style={{
          flexDirection: 'row',
          marginBottom: spacing.xl,
        }}
      >
        <QuickActionButton
          title="Manage Catalog"
          onPress={() => navigation.navigate('VendorCatalog')}
        />
        <QuickActionButton
          title="View Profile"
          onPress={() => navigation.navigate('VendorOnboarding', { vendorId: vendor.id })}
          variant="outline"
        />
      </View>

      {documents && documents.length > 0 && (
        <View
          style={{
            padding: spacing.md,
            borderRadius: radii.lg,
            backgroundColor: colors.surfaceMuted,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            marginBottom: spacing.lg,
          }}
        >
          <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
            Compliance documents
          </Text>
          {documents.map((doc) => (
            <Text key={doc.id} style={{ ...typography.caption, color: colors.textSecondary }}>
              • {doc.file_name ?? 'Document'} ({doc.document_type})
            </Text>
          ))}
        </View>
      )}

      <Text
        style={{
          ...typography.titleMedium,
          color: colors.textPrimary,
          marginBottom: spacing.xs,
        }}
      >
        Recent Reviews
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
        <View style={{ marginBottom: spacing.lg }}>
          {reviews.slice(0, 5).map((item) => (
            <View
              key={`review-${item.id}`}
              style={{
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.md,
                borderRadius: radii.lg,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                marginBottom: spacing.sm,
              }}
            >
              <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
                {'⭐'.repeat(item.rating)} {item.rating}/5
              </Text>
              {item.status && (
                <Text
                  style={{
                    ...typography.caption,
                    color: colors.textMuted,
                    marginTop: spacing.xs,
                  }}
                >
                  Status: {item.status}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      <Text
        style={{
          ...typography.titleMedium,
          color: colors.textPrimary,
          marginBottom: spacing.xs,
        }}
      >
        Recent Quote Requests
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
        <View>
          {quotes.slice(0, 5).map((item) => (
            <TouchableOpacity
              key={`quote-${item.id}`}
              activeOpacity={0.7}
              style={{
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.md,
                borderRadius: radii.lg,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: item.status === 'pending' ? colors.primaryTeal : colors.borderSubtle,
                marginBottom: spacing.sm,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600', flex: 1 }}>
                  {item.name ?? 'Unnamed enquiry'}
                </Text>
                <View
                  style={{
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xs,
                    borderRadius: radii.sm,
                    backgroundColor: item.status === 'pending' ? colors.surfaceMuted : colors.backgroundAlt,
                  }}
                >
                  <Text style={{ ...typography.caption, color: colors.textPrimary, fontWeight: '600' }}>
                    {item.status ?? 'pending'}
                  </Text>
                </View>
              </View>
              {item.email && (
                <Text
                  style={{
                    ...typography.caption,
                    color: colors.textSecondary,
                    marginTop: spacing.xs,
                  }}
                >
                  📧 {item.email}
                </Text>
              )}
              {item.details && (
                <Text
                  numberOfLines={2}
                  style={{
                    ...typography.caption,
                    color: colors.textSecondary,
                    marginTop: spacing.xs,
                  }}
                >
                  {item.details}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  );
}
