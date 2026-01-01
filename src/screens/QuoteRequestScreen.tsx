import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { supabase } from '../lib/supabaseClient';
import type { AttendeeStackParamList } from '../navigation/AttendeeNavigator';
import { colors, spacing, typography } from '../theme';
import { PrimaryButton, ThemedInput } from '../components/ui';

type Props = NativeStackScreenProps<AttendeeStackParamList, 'QuoteRequest'>;

export default function QuoteRequestScreen({ route, navigation }: Props) {
  const { vendorId, vendorName } = route.params;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [eventDetails, setEventDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Missing details', 'Please provide your name and email.');
      return;
    }

    setSubmitting(true);
    try {
      // For this demo, try to attach the request to the demo_attendee user if present.
      const { data: userRows, error: userError } = await supabase
        .from('users')
        .select('id, username')
        .eq('username', 'demo_attendee')
        .limit(1);

      if (userError) {
        throw userError;
      }

      const demoUser = userRows?.[0];
      const userId = demoUser?.id ?? 6;

      const { error: insertError } = await supabase.from('quote_requests').insert({
        vendor_id: vendorId,
        user_id: userId,
        name,
        email,
        status: 'pending',
        details: eventDetails || null,
      });

      if (insertError) {
        throw insertError;
      }

      Alert.alert('Quote requested', 'Your quote request has been sent (demo).');
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to submit quote request.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.lg }}
    >
      <View
        style={{
          marginBottom: spacing.lg,
          padding: spacing.lg,
          borderRadius: 16,
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
          Request a quote from
        </Text>
        <Text
          style={{
            marginTop: spacing.xs,
            ...typography.body,
            color: colors.textSecondary,
          }}
        >
          {vendorName}
        </Text>
      </View>

      <View
        style={{
          padding: spacing.lg,
          borderRadius: 16,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
        }}
      >
        <Text
          style={{
            ...typography.titleMedium,
            color: colors.textPrimary,
            marginBottom: spacing.md,
          }}
        >
          Your details
        </Text>

        <Text
          style={{
            ...typography.body,
            color: colors.textSecondary,
            marginBottom: spacing.xs,
          }}
        >
          Your name
        </Text>
        <ThemedInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Thandi M"
          autoCapitalize="words"
        />

        <Text
          style={{
            ...typography.body,
            color: colors.textSecondary,
            marginBottom: spacing.xs,
          }}
        >
          Email address
        </Text>
        <ThemedInput
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text
          style={{
            ...typography.body,
            color: colors.textSecondary,
            marginBottom: spacing.xs,
          }}
        >
          Event details (optional)
        </Text>
        <ThemedInput
          value={eventDetails}
          onChangeText={setEventDetails}
          placeholder="Date, guest count, location, special notes..."
          multiline
          numberOfLines={4}
          style={{ minHeight: 80, textAlignVertical: 'top' }}
        />

        <PrimaryButton
          title={submitting ? 'Submitting...' : 'Submit quote request'}
          onPress={handleSubmit}
          disabled={submitting}
          style={{ marginTop: spacing.lg }}
        />
      </View>
    </ScrollView>
  );
}
