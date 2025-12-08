import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { supabase } from '../lib/supabaseClient';
import type { AttendeeStackParamList } from '../navigation/AttendeeNavigator';
import { colors, spacing, radii, typography } from '../theme';
import { PrimaryButton } from '../components/ui';

type Props = NativeStackScreenProps<AttendeeStackParamList, 'VendorProfile'>;

type VendorRecord = {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  logo_url: string | null;
  price_range: string | null;
  rating: number | null;
  review_count: number | null;
  dietary_options: string[] | null;
  cuisine_types: string[] | null;
  subscription_tier: string | null;
};

type Review = {
  id: number;
  rating: number;
  status: string | null;
};

export default function VendorProfileScreen({ route, navigation }: Props) {
  const { vendorId } = route.params;

  const {
    data: vendor,
    isLoading: vendorLoading,
    error: vendorError,
  } = useQuery<VendorRecord>({
    queryKey: ['vendor', vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select(
          'id, name, description, image_url, logo_url, price_range, rating, review_count, dietary_options, cuisine_types, subscription_tier',
        )
        .eq('id', vendorId)
        .single();

      if (error) {
        throw error;
      }

      return data as VendorRecord;
    },
  });

  const {
    data: reviews,
    isLoading: reviewsLoading,
    error: reviewsError,
  } = useQuery<Review[]>({
    queryKey: ['reviews', vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('id, rating, status')
        .eq('vendor_id', vendorId)
        .limit(20);

      if (error) {
        throw error;
      }

      return (data as Review[]) ?? [];
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
        <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>Failed to load vendor.</Text>
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
        <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>Vendor not found.</Text>
      </View>
    );
  }

  const name: string = vendor.name;
  const description: string | null = vendor.description;

  const tagArrays: string[][] = [
    (vendor.dietary_options as string[] | undefined) ?? [],
    (vendor.cuisine_types as string[] | undefined) ?? [],
  ];
  const tags = Array.from(new Set(tagArrays.flat().filter(Boolean)));

  const hasReviews = !!reviews && reviews.length > 0;
  const averageRating = typeof vendor.rating === 'number'
    ? vendor.rating
    : hasReviews
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;
  const reviewCount = typeof vendor.review_count === 'number'
    ? vendor.review_count
    : hasReviews
      ? reviews.length
      : 0;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.lg }}
    >
      {/* Header */}
      <View
        style={{
          marginBottom: spacing.lg,
          padding: spacing.lg,
          borderRadius: radii.xl,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
        }}
      >
        <Text
          style={{
            ...typography.titleLarge,
            color: colors.textPrimary,
          }}
        >
          {name}
        </Text>
        {averageRating !== null && (
          <Text
            style={{
              marginTop: spacing.xs,
              ...typography.body,
              color: colors.textSecondary,
            }}
          >
            {averageRating.toFixed(1)} / 5  -  {reviewCount} review
            {reviewCount === 1 ? '' : 's'}
          </Text>
        )}
        {vendor.price_range && (
          <Text
            style={{
              marginTop: spacing.xs,
              ...typography.body,
              color: colors.textSecondary,
            }}
          >
            Price range: {vendor.price_range}
          </Text>
        )}
        {vendor.subscription_tier && (
          <Text
            style={{
              marginTop: spacing.xs,
              ...typography.caption,
              color: colors.textMuted,
            }}
          >
            Subscription tier: {vendor.subscription_tier}
          </Text>
        )}
      </View>

      {/* About */}
      {description && (
        <View
          style={{
            marginBottom: spacing.lg,
            padding: spacing.lg,
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
              marginBottom: spacing.sm,
            }}
          >
            About
          </Text>
          <Text style={{ ...typography.body, color: colors.textSecondary, lineHeight: 20 }}>{description}</Text>
        </View>
      )}

      {/* Tags / highlights */}
      {tags.length > 0 && (
        <View
          style={{
            marginBottom: spacing.lg,
            padding: spacing.lg,
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
              marginBottom: spacing.sm,
            }}
          >
            Highlights
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {tags.map((tag) => (
              <View
                key={tag}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                  borderRadius: radii.full,
                  backgroundColor: colors.surfaceMuted,
                  marginRight: spacing.sm,
                  marginBottom: spacing.sm,
                }}
              >
                <Text style={{ ...typography.caption, color: colors.textPrimary }}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Reviews */}
      <View
        style={{
          marginBottom: spacing.xl,
          padding: spacing.lg,
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
            marginBottom: spacing.sm,
          }}
        >
          Reviews
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
        {!reviewsLoading && !hasReviews && (
          <Text style={{ ...typography.body, color: colors.textMuted }}>No reviews yet.</Text>
        )}
        {hasReviews && (
          <View>
            {reviews?.map((review) => (
              <View key={review.id} style={{ paddingVertical: 6 }}>
                {typeof review.rating === 'number' && (
                  <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
                    Rating: {review.rating} / 5
                  </Text>
                )}
                {review.status && (
                  <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: 2 }}>{review.status}</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Request Quote entry */}
      <View
        style={{
          paddingVertical: spacing.lg,
          borderTopWidth: 1,
          borderTopColor: colors.borderSubtle,
          marginTop: spacing.lg,
        }}
      >
        <Text
          style={{
            ...typography.titleMedium,
            color: colors.textPrimary,
            marginBottom: spacing.sm,
          }}
        >
          Request a quote
        </Text>
        <Text style={{ ...typography.body, color: colors.textSecondary, marginBottom: spacing.md }}>
          Share your event details and request a custom quote from this vendor.
        </Text>
        <PrimaryButton
          title="Request a quote"
          onPress={() =>
            navigation.navigate('QuoteRequest', {
              vendorId: vendor.id,
              vendorName: name,
            })
          }
        />
      </View>
    </ScrollView>
  );
}
