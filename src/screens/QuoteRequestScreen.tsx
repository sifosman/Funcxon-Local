import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { supabase } from '../lib/supabaseClient';
import type { AttendeeStackParamList } from '../navigation/AttendeeNavigator';
import { colors, spacing, typography, radii } from '../theme';
import { PrimaryButton, ThemedInput } from '../components/ui';
import { useAuth } from '../auth/AuthContext';
import ThemedAlert from '../components/ThemedAlert';

type Props = NativeStackScreenProps<AttendeeStackParamList, 'QuoteRequest'>;

export default function QuoteRequestScreen({ route, navigation }: Props) {
  const { vendorId, vendorName, type = 'vendor', editMode = false, quoteId } = route.params;
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [eventDetails, setEventDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [alertState, setAlertState] = useState<{visible: boolean; title: string; message: string; buttons?: any[]} | null>(null);

  useEffect(() => {
    if (!editMode || !quoteId) return;
    setLoadingEdit(true);
    const load = async () => {
      try {
        if (type === 'venue') {
          const { data } = await supabase
            .from('venue_quote_requests')
            .select('requester_name, requester_email, message')
            .eq('id', quoteId)
            .maybeSingle();
          if (data) {
            setName(data.requester_name ?? '');
            setEmail(data.requester_email ?? '');
            setEventDetails(data.message ?? '');
          }
        } else {
          const { data } = await supabase
            .from('quote_requests')
            .select('name, email, details')
            .eq('id', quoteId)
            .maybeSingle();
          if (data) {
            setName(data.name ?? '');
            setEmail(data.email ?? '');
            setEventDetails(data.details ?? '');
          }
        }
      } catch (e) {
        console.error('Failed to load quote for edit:', e);
      } finally {
        setLoadingEdit(false);
      }
    };
    load();
  }, [editMode, quoteId, type]);

  async function handleSubmit() {
    if (!name.trim() || !email.trim()) {
      setAlertState({ visible: true, title: 'Missing details', message: 'Please provide your name and email.' });
      return;
    }

    setSubmitting(true);
    try {
      if (editMode && quoteId) {
        // Update existing quote request
        if (type === 'venue') {
          const { error: updateError } = await supabase
            .from('venue_quote_requests')
            .update({ requester_name: name, requester_email: email, message: eventDetails || null })
            .eq('id', quoteId);
          if (updateError) throw updateError;
        } else {
          const { error: updateError } = await supabase
            .from('quote_requests')
            .update({ name, email, details: eventDetails || null })
            .eq('id', quoteId);
          if (updateError) throw updateError;
        }
        setAlertState({ visible: true, title: 'Quote updated', message: 'Your quote request has been updated successfully.', buttons: [{ text: 'OK', style: 'default', onPress: () => { setAlertState(null); navigation.goBack(); } }] });
        setSubmitting(false);
        return;
      }

      let quoteRequestId: number | null = null;

      if (type === 'venue') {
        const { data: inserted, error: insertError } = await supabase
          .from('venue_quote_requests')
          .insert({
            listing_id: vendorId,
            requester_user_id: user?.id ?? null,
            requester_name: name,
            requester_email: email,
            requester_phone: null,
            event_date: null,
            message: eventDetails || null,
            status: 'pending',
          })
          .select('id')
          .single();

        if (insertError) throw insertError;
        quoteRequestId = inserted?.id ?? null;
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

          // If user doesn't exist in users table, create them
          if (!userRow) {
            const username = email.split('@')[0] || 'attendee';
            const { data: createdUser, error: createError } = await supabase
              .from('users')
              .insert({
                auth_user_id: user.id,
                username,
                password: 'demo',
                email,
                full_name: name || username,
              })
              .select('id')
              .single();

            if (!createError && createdUser) {
              userId = createdUser.id;
            }
          } else {
            userId = userRow.id;
          }
        }

        const { data: inserted, error: insertError } = await supabase
          .from('quote_requests')
          .insert({
            vendor_id: vendorId,
            user_id: userId,
            name,
            email,
            status: 'pending',
            details: eventDetails || null,
          })
          .select('id')
          .single();

        if (insertError) throw insertError;
        quoteRequestId = inserted?.id ?? null;
      }

      // Send admin notification about new quote request
      await sendAdminNotification();

      // Send vendor/venue notification about new quote request
      if (type === 'vendor') {
        await sendVendorNotification(vendorId, vendorName, quoteRequestId);
      } else {
        await sendVenueNotification(vendorId, vendorName, quoteRequestId);
      }

      setAlertState({ visible: true, title: 'Quote requested', message: 'Your quote request has been sent successfully.', buttons: [{ text: 'OK', style: 'default', onPress: () => { setAlertState(null); navigation.goBack(); } }] });
    } catch (err: any) {
      console.error('Submit error:', err);
      setAlertState({ visible: true, title: 'Error', message: err?.message ?? 'Failed to submit quote request.' });
    } finally {
      setSubmitting(false);
    }
  }

  async function sendVendorNotification(vendorId: number, vendorName: string, quoteRequestId: number | null) {
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
          quoteRequestId: quoteRequestId ?? vendorId,
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

  async function sendVenueNotification(venueId: number, venueName: string, quoteRequestId: number | null) {
    try {
      // Get venue email from database
      const { data: venue, error: venueError } = await supabase
        .from('venue_listings')
        .select('contact_email, name')
        .eq('id', venueId)
        .maybeSingle();

      if (venueError || !venue?.contact_email) {
        console.log('Venue contact email not found, skipping venue notification');
        return;
      }

      const { data, error } = await supabase.functions.invoke('send-quote-notifications', {
        body: {
          type: 'quote-requested-vendor',
          quoteRequestId: quoteRequestId ?? venueId,
          clientName: name,
          clientEmail: email,
          vendorBusinessName: venueName,
          vendorEmail: venue.contact_email,
          eventDetails: eventDetails || undefined,
        },
      });

      if (error) {
        console.error('Error sending venue notification:', error);
        return;
      }

      console.log('Venue notification sent successfully:', data);
    } catch (err) {
      console.error('Failed to send venue notification:', err);
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
      {Platform.OS === 'web' && (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}
        >
          <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
          <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.xs }}>Back</Text>
        </TouchableOpacity>
      )}
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
          {editMode ? 'Amend your quote request for' : 'Request a quote from'}
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

      {loadingEdit && (
        <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.md }}>Loading...</Text>
      )}

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
          title={submitting ? (editMode ? 'Updating...' : 'Submitting...') : (editMode ? 'Update quote request' : 'Submit quote request')}
          onPress={handleSubmit}
          disabled={submitting || loadingEdit}
          style={{ marginTop: spacing.lg }}
        />
      </View>
    </ScrollView>

    {alertState && (
      <ThemedAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        buttons={alertState.buttons ?? [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }]}
        onDismiss={() => setAlertState(null)}
      />
    )}
    </KeyboardAvoidingView>
  );
}
