import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { supabase } from '../lib/supabaseClient';
import type { AttendeeStackParamList } from '../navigation/AttendeeNavigator';
import { colors, spacing, typography } from '../theme';
import { PrimaryButton, ThemedInput } from '../components/ui';
import { useAuth } from '../auth/AuthContext';

type Props = NativeStackScreenProps<AttendeeStackParamList, 'QuoteRequest'>;

export default function QuoteRequestScreen({ route, navigation }: Props) {
  const { vendorId, vendorName, type = 'vendor' } = route.params;
  const { user } = useAuth();

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
      if (type === 'venue') {
        const { error: insertError } = await supabase.from('venue_quote_requests').insert({
          listing_id: vendorId,
          requester_user_id: user?.id ?? null,
          requester_name: name,
          requester_email: email,
          requester_phone: null,
          event_date: null,
          message: eventDetails || null,
          status: 'pending',
        });

        if (insertError) throw insertError;
      } else {
        // Resolve the internal user id from the authenticated user
        let userId: number | null = null;
        if (user?.id) {
          const { data: userRow, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('auth_user_id', user.id)
            .maybeSingle();

          if (userError) {
            throw userError;
          }
          userId = userRow?.id ?? null;
        }

        const { error: insertError } = await supabase.from('quote_requests').insert({
          vendor_id: vendorId,
          user_id: userId,
          name,
          email,
          status: 'pending',
          details: eventDetails || null,
        });

        if (insertError) throw insertError;
      }

      // Send admin notification about new quote request
      await sendAdminNotification();

      // Send vendor notification about new quote request
      if (type === 'vendor') {
        await sendVendorNotification(vendorId, vendorName);
      }

      Alert.alert('Quote requested', 'Your quote request has been sent.');
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to submit quote request.');
    } finally {
      setSubmitting(false);
    }
  }

  async function sendVendorNotification(vendorId: number, vendorName: string) {
    try {
      // Get vendor email from database
      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .select('email, name')
        .eq('id', vendorId)
        .maybeSingle();

      if (vendorError || !vendor?.email) {
        console.log('Vendor email not found, skipping vendor notification');
        return;
      }

      const { data, error } = await supabase.functions.invoke('send-quote-notifications', {
        body: {
          type: 'quote-requested-vendor',
          quoteRequestId: vendorId,
          clientName: name,
          clientEmail: email,
          vendorBusinessName: vendorName,
          vendorEmail: vendor.email,
          eventDetails: eventDetails || undefined,
        },
      });

      if (error) {
        console.error('Error sending vendor notification:', error);
        return;
      }

      console.log('Vendor notification sent successfully:', data);
    } catch (err) {
      console.error('Failed to send vendor notification:', err);
    }
  }

  async function sendAdminNotification() {
    try {
      const { data, error } = await supabase.functions.invoke('send-admin-notification', {
        body: {
          type: 'quote-requested',
          customerName: name,
          customerEmail: email,
          vendorId: vendorId,
          vendorName: vendorName,
          quoteDetails: eventDetails || undefined,
        },
      });

      if (error) {
        console.error('Error sending admin notification:', error);
        return;
      }

      console.log('Admin notification sent successfully:', data);
    } catch (err) {
      console.error('Failed to send admin notification:', err);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, paddingBottom: 120 }}
      keyboardShouldPersistTaps="handled"
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
    </KeyboardAvoidingView>
  );
}
