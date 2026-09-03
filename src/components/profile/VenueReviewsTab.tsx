import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, radii, typography } from '../../theme';
import { PrimaryButton } from '../ui';

type VenueReview = {
  id: number;
  rating: number;
  title: string | null;
  review_text: string | null;
  is_verified: boolean | null;
  created_at: string | null;
  status: string | null;
};

type Props = {
  reviews: VenueReview[] | undefined;
  reviewsLoading: boolean;
  reviewsError: Error | null;
  ratingSummaryValue: string;
  ratingSummaryCount: number;
  averageRating: number | null;
  ratingBreakdown: Record<number, number>;
  ratingCategories: { label: string; value: number }[];
  user: { id?: string } | null;
  navigation: any;
  venueId: number;
  name: string;
};

const headerTitleMedium = { ...typography.titleMedium, fontFamily: 'Montserrat_600SemiBold' as const };

const VenueReviewsTab = React.memo(function VenueReviewsTab({
  reviews,
  reviewsLoading,
  reviewsError,
  ratingSummaryValue,
  ratingSummaryCount,
  averageRating,
  ratingBreakdown,
  ratingCategories,
  user,
  navigation,
  venueId,
  name,
}: Props) {
  const hasReviews = !!reviews && reviews.length > 0;

  return (
    <View>
      {hasReviews && (
        <>
          <View style={{ marginBottom: spacing.md, padding: spacing.md, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ ...typography.titleLarge, color: colors.textPrimary }}>{ratingSummaryValue}</Text>
              <View style={{ flexDirection: 'row', marginVertical: 2 }}>
                {Array.from({ length: 5 }).map((_, index) => (
                  <MaterialIcons key={index} name={averageRating && averageRating >= index + 1 ? 'star' : 'star-border'} size={14} color="#F59E0B" />
                ))}
              </View>
              <Text style={{ ...typography.caption, color: colors.textMuted, fontSize: 11 }}>{ratingSummaryCount} review{ratingSummaryCount === 1 ? '' : 's'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = ratingBreakdown[rating] ?? 0;
                const progress = ratingSummaryCount ? count / ratingSummaryCount : 0;
                return (
                  <View key={rating} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
                    <Text style={{ ...typography.caption, color: colors.textMuted, width: 12, fontSize: 11 }}>{rating}</Text>
                    <MaterialIcons name="star" size={10} color="#F59E0B" />
                    <View style={{ flex: 1, height: 5, backgroundColor: colors.surfaceMuted, borderRadius: 999, marginHorizontal: spacing.xs, overflow: 'hidden' }}>
                      <View style={{ width: `${progress * 100}%`, height: '100%', backgroundColor: colors.coral }} />
                    </View>
                    <Text style={{ ...typography.caption, color: colors.textMuted, width: 16, textAlign: 'right', fontSize: 11 }}>{count}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={{ marginBottom: spacing.md, padding: spacing.md, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle }}>
            <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary, marginBottom: spacing.sm }}>Rating Breakdown</Text>
            <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm, fontSize: 11 }}>Average ratings by category</Text>
            {ratingCategories.map((category) => (
              <View key={category.label} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <Text style={{ ...typography.caption, color: colors.textPrimary, flex: 1, fontSize: 12 }}>{category.label}</Text>
                <View style={{ flexDirection: 'row', marginRight: spacing.xs }}>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <MaterialIcons key={index} name={category.value >= index + 1 ? 'star' : 'star-border'} size={12} color="#F59E0B" />
                  ))}
                </View>
                <Text style={{ ...typography.caption, color: colors.textMuted, fontSize: 11 }}>{category.value.toFixed(1)}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {reviewsLoading ? (
        <View style={{ marginBottom: spacing.lg, padding: spacing.lg, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator />
        </View>
      ) : reviewsError ? (
        <View style={{ marginBottom: spacing.lg, padding: spacing.lg, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle }}>
          <Text style={{ ...headerTitleMedium, color: colors.textPrimary, marginBottom: spacing.sm }}>Failed to load reviews</Text>
          <Text style={{ ...typography.body, color: colors.textMuted }}>{reviewsError.message}</Text>
        </View>
      ) : !reviews || reviews.length === 0 ? (
        <View style={{ marginBottom: spacing.lg, padding: spacing.lg, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle, alignItems: 'center' }}>
          <MaterialIcons name="rate-review" size={48} color={colors.textMuted} />
          <Text style={{ ...typography.body, color: colors.textSecondary, marginTop: spacing.md, textAlign: 'center' }}>No reviews yet.</Text>
        </View>
      ) : (
        <View style={{ gap: spacing.md, marginBottom: spacing.lg }}>
          {reviews.map((review) => (
            <View key={review.id} style={{ padding: spacing.lg, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <MaterialIcons key={idx} name={review.rating >= idx + 1 ? 'star' : 'star-border'} size={16} color="#F59E0B" />
                  ))}
                  {review.is_verified ? (
                    <View style={{ marginLeft: spacing.sm, backgroundColor: '#DCFCE7', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radii.full, borderWidth: 1, borderColor: '#BBF7D0' }}>
                      <Text style={{ ...typography.captionSemiBold, color: '#166534' }}>Verified</Text>
                    </View>
                  ) : null}
                  {review.status === 'pending' ? (
                    <View style={{ marginLeft: spacing.sm, backgroundColor: '#FEF3C7', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radii.full, borderWidth: 1, borderColor: '#FDE68A' }}>
                      <Text style={{ ...typography.captionSemiBold, color: '#92400E' }}>Pending</Text>
                    </View>
                  ) : null}
                </View>
              </View>
              {review.title ? <Text style={{ ...headerTitleMedium, color: colors.textPrimary, marginTop: spacing.sm }}>{review.title}</Text> : null}
              {review.review_text ? (
                <Text style={{ ...typography.body, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 20 }}>{review.review_text}</Text>
              ) : (
                <Text style={{ ...typography.body, color: colors.textMuted, marginTop: spacing.sm }}>No written review provided.</Text>
              )}
              {review.created_at ? (
                <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.sm }}>
                  {new Date(review.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      )}

      {/* Ratings System Explanation */}
      <View style={{ marginBottom: spacing.lg, padding: spacing.lg, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle }}>
        <Text style={{ ...headerTitleMedium, color: colors.textPrimary, marginBottom: spacing.sm }}>Ratings System</Text>
        <View style={{ gap: spacing.xs }}>
          {[
            { stars: 5, desc: 'Exceptional experience' },
            { stars: 4, desc: 'Very good experience' },
            { stars: 3, desc: 'Good experience' },
            { stars: 2, desc: 'Below average experience' },
            { stars: 1, desc: 'Poor experience' },
          ].map(({ stars, desc }) => (
            <View key={stars} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialIcons name="star" size={14} color="#F59E0B" />
              <Text style={{ ...typography.caption, color: colors.textSecondary, marginLeft: spacing.sm }}>{stars} stars = {desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {user?.id ? (
        <View style={{ marginBottom: spacing.lg, padding: spacing.lg, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle }}>
          <Text style={{ ...headerTitleMedium, color: colors.textPrimary, marginBottom: spacing.sm }}>Add a Review</Text>
          <Text style={{ ...typography.body, color: colors.textSecondary, marginBottom: spacing.md }}>Share your experience with this venue. Reviews help other users make informed decisions.</Text>
          <PrimaryButton title="Add a review" onPress={() => navigation.navigate('CreateReview', { type: 'venue', targetId: venueId, targetName: name })} />
        </View>
      ) : (
        <View style={{ marginBottom: spacing.lg, padding: spacing.lg, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSubtle }}>
          <Text style={{ ...typography.body, color: colors.textSecondary }}>Sign in to leave a review.</Text>
        </View>
      )}
    </View>
  );
});

export default VenueReviewsTab;