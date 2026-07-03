import { useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import ThemedAlert from '../components/ThemedAlert';
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
  const isAppReview = type === 'app';

  const [rating, setRating] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [alertState, setAlertState] = useState<{visible: boolean; title: string; message: string} | null>(null);

  const isFormValid = useMemo(() => rating >= 1 && rating <= 5, [rating]);

  const resolveInternalUserId = async (): Promise<number | null> => {
    if (!user?.id) return null;
    const { data, error } = await supabase.from('users').select('id').eq('auth_user_id', user.id).maybeSingle();
    if (error) throw error;
    return (data as any)?.id ?? null;
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      setAlertState({ visible: true, title: 'Sign in required', message: 'Please sign in to leave a review.' });
      return;
    }

    if (!isFormValid) {
      setAlertState({ visible: true, title: 'Missing rating', message: 'Please select a star rating.' });
      return;
    }

    setSubmitting(true);
    try {
      if (isAppReview) {
        const { error } = await supabase.from('app_reviews').insert({
          user_id: user.id,
          rating,
          title: title.trim() || null,
          review_text: reviewText.trim() || null,
          status: 'pending',
        });

        if (error) throw error;
      } else if (type === 'vendor') {
        const internalUserId = await resolveInternalUserId();
        if (!internalUserId) {
          setAlertState({ visible: true, title: 'Missing profile', message: 'We could not find your user profile. Please sign in again.' });
          return;
        }

        const { error } = await supabase.from('reviews').insert({
          user_id: internalUserId,
          vendor_id: targetId,
          rating,
          title: title.trim() || null,
          review_text: reviewText.trim() || null,
          is_verified: false,
          review_source: 'public',
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
          is_verified: false,
          review_source: 'public',
          status: 'pending',
        });

        if (error) throw error;
      }

      setAlertState({ visible: true, title: 'Review submitted', message: 'Thanks! Your review is pending approval.' });
      navigation.goBack();
    } catch (err: any) {
      setAlertState({ visible: true, title: 'Error', message: err?.message ?? 'Failed to submit review.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}
        >
          <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
          <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.xs }}>Back</Text>
        </TouchableOpacity>
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
          <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>
            {isAppReview ? 'Review the Funxon App' : 'Leave a review for'}
          </Text>
          {!isAppReview && (
            <Text style={{ ...typography.bodySemiBold, color: colors.textSecondary, marginTop: spacing.xs }}>
              {targetName}
            </Text>
          )}
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

      {alertState && (
        <ThemedAlert
          visible={alertState.visible}
          title={alertState.title}
          message={alertState.message}
          buttons={[{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }]}
          onDismiss={() => setAlertState(null)}
        />
      )}
    </KeyboardAvoidingView>
  );
}
