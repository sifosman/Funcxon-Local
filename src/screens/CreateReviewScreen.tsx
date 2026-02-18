import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { AttendeeStackParamList } from '../navigation/AttendeeNavigator';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';
import { colors, radii, spacing, typography } from '../theme';
import { PrimaryButton, ThemedInput } from '../components/ui';

type Props = NativeStackScreenProps<AttendeeStackParamList, 'CreateReview'>;

export default function CreateReviewScreen({ route, navigation }: Props) {
  const { type, targetId, targetName } = route.params;
  const { user } = useAuth();

  const [rating, setRating] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isFormValid = useMemo(() => rating >= 1 && rating <= 5, [rating]);

  const resolveInternalUserId = async (): Promise<number | null> => {
    if (!user?.id) return null;
    const { data, error } = await supabase.from('users').select('id').eq('auth_user_id', user.id).maybeSingle();
    if (error) throw error;
    return (data as any)?.id ?? null;
  };

  const checkEligibility = async (): Promise<boolean> => {
    if (!user?.id) return false;

    if (type === 'vendor') {
      const internalUserId = await resolveInternalUserId();
      if (!internalUserId) return false;

      const { count, error } = await supabase
        .from('quote_requests')
        .select('id', { count: 'exact', head: true })
        .eq('vendor_id', targetId)
        .eq('user_id', internalUserId)
        .in('status', ['accepted', 'finalised']);

      if (error) throw error;
      return (count ?? 0) > 0;
    }

    const { count: quoteCount, error: quoteError } = await supabase
      .from('venue_quote_requests')
      .select('id', { count: 'exact', head: true })
      .eq('listing_id', targetId)
      .eq('requester_user_id', user.id)
      .in('status', ['accepted', 'finalised']);

    if (quoteError) throw quoteError;

    const { count: tourCount, error: tourError } = await supabase
      .from('venue_tour_bookings')
      .select('id', { count: 'exact', head: true })
      .eq('listing_id', targetId)
      .eq('requester_user_id', user.id)
      .in('status', ['accepted', 'finalised']);

    if (tourError) throw tourError;

    return (quoteCount ?? 0) > 0 || (tourCount ?? 0) > 0;
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      Alert.alert('Sign in required', 'Please sign in to leave a review.');
      return;
    }

    if (!isFormValid) {
      Alert.alert('Missing rating', 'Please select a star rating.');
      return;
    }

    setSubmitting(true);
    try {
      const eligible = await checkEligibility();
      if (!eligible) {
        Alert.alert('Not eligible', 'You can only leave a review after you have used this service.');
        return;
      }

      if (type === 'vendor') {
        const internalUserId = await resolveInternalUserId();
        if (!internalUserId) {
          Alert.alert('Missing profile', 'We could not find your user profile. Please sign in again.');
          return;
        }

        const { error } = await supabase.from('reviews').insert({
          user_id: internalUserId,
          vendor_id: targetId,
          rating,
          title: title.trim() || null,
          review_text: reviewText.trim() || null,
          is_verified: true,
          status: 'pending',
        });

        if (error) throw error;
      } else {
        const { error } = await supabase.from('venue_reviews').insert({
          user_id: user.id,
          venue_id: targetId,
          rating,
          title: title.trim() || null,
          review_text: reviewText.trim() || null,
          is_verified: true,
          status: 'pending',
        });

        if (error) throw error;
      }

      Alert.alert('Review submitted', 'Thanks! Your review is pending approval.');
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
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
          <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>Leave a review for</Text>
          <Text style={{ ...typography.body, color: colors.textSecondary, marginTop: spacing.xs, fontWeight: '600' }}>
            {targetName}
          </Text>
        </View>

        <View
          style={{
            padding: spacing.lg,
            borderRadius: radii.xl,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
          }}
        >
          <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>Your rating</Text>
          <View style={{ flexDirection: 'row', marginBottom: spacing.md }}>
            {Array.from({ length: 5 }).map((_, idx) => {
              const value = idx + 1;
              const filled = rating >= value;
              return (
                <TouchableOpacity
                  key={value}
                  onPress={() => setRating(value)}
                  style={{ padding: 6 }}
                  accessibilityRole="button"
                >
                  <MaterialIcons name={filled ? 'star' : 'star-border'} size={28} color="#F59E0B" />
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={typography.label}>Title (optional)</Text>
          <ThemedInput value={title} onChangeText={setTitle} placeholder="e.g. Great experience" />

          <Text style={typography.label}>Review (optional)</Text>
          <ThemedInput
            value={reviewText}
            onChangeText={setReviewText}
            placeholder="Share details about your experience..."
            multiline
            numberOfLines={5}
            style={{ minHeight: 110, textAlignVertical: 'top' }}
          />

          <PrimaryButton
            title={submitting ? 'Submitting...' : 'Submit review'}
            onPress={handleSubmit}
            disabled={!isFormValid || submitting}
            style={{ marginTop: spacing.lg }}
          />

          {submitting ? (
            <View style={{ marginTop: spacing.md, alignItems: 'center' }}>
              <ActivityIndicator />
            </View>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
