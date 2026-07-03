import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker';

import { supabase } from '../lib/supabaseClient';
import { createTourRequestedNotification } from '../lib/notifications';
import type { AttendeeStackParamList } from '../navigation/AttendeeNavigator';
import { colors, spacing, typography, radii } from '../theme';
import { PrimaryButton, ThemedInput } from '../components/ui';
import { useAuth } from '../auth/AuthContext';
import ThemedAlert from '../components/ThemedAlert';

type Props = NativeStackScreenProps<AttendeeStackParamList, 'BookTour'>;

export default function BookTourScreen({ route, navigation }: Props) {
  const { venueId, venueName } = route.params;
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alertState, setAlertState] = useState<{visible: boolean; title: string; message: string; buttons?: any[]} | null>(null);

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  async function handleSubmit() {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setAlertState({ visible: true, title: 'Missing details', message: 'Please provide your name, email, and phone number.' });
      return;
    }

    setSubmitting(true);
    try {
      const { error: insertError } = await supabase.from('venue_tour_bookings').insert({
        listing_id: venueId,
        requester_user_id: user?.id ?? null,
        requester_name: name,
        requester_email: email,
        requester_phone: phone,
        requested_date: date.toISOString().slice(0, 10),
        requested_time: null,
        message: message || null,
        status: 'pending',
      });

      if (insertError) {
        throw insertError;
      }

      // Send admin/venue owner notification about the tour request
      await sendTourNotification();

      setAlertState({ visible: true, title: 'Tour Requested', message: 'Your tour request has been sent. The venue will confirm with you shortly.', buttons: [{ text: 'OK', style: 'default', onPress: () => { setAlertState(null); navigation.goBack(); } }] });
    } catch (err: any) {
      setAlertState({ visible: true, title: 'Error', message: err?.message ?? 'Failed to submit tour request.' });
    } finally {
      setSubmitting(false);
    }
  }

  async function sendTourNotification() {
    try {
      const { data: venue } = await supabase
        .from('venue_listings')
        .select('user_id, name')
        .eq('id', venueId)
        .maybeSingle();

      if (venue?.user_id) {
        await createTourRequestedNotification(venue.user_id, name, date.toISOString().slice(0, 10));
      }
    } catch (err) {
      console.error('Failed to send tour notification:', err);
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
            Book a tour at
          </Text>
          <Text
            style={{
              marginTop: spacing.xs,
              ...typography.body,
              color: colors.textSecondary,
              fontWeight: '600'
            }}
          >
            {venueName}
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

          <Text style={typography.label}>Name</Text>
          <ThemedInput
            value={name}
            onChangeText={setName}
            placeholder="Your full name"
            autoCapitalize="words"
          />

          <Text style={typography.label}>Email</Text>
          <ThemedInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={typography.label}>Phone Number</Text>
          <ThemedInput
            value={phone}
            onChangeText={setPhone}
            placeholder="e.g. 082 123 4567"
            keyboardType="phone-pad"
          />

          <Text style={typography.label}>Preferred Date</Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={{
              padding: spacing.md,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              borderRadius: radii.md,
              marginBottom: spacing.md,
              backgroundColor: colors.background,
            }}
          >
            <Text style={{ ...typography.body, color: colors.textPrimary }}>
              {date.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}

          <Text style={typography.label}>Message (Optional)</Text>
          <ThemedInput
            value={message}
            onChangeText={setMessage}
            placeholder="Any specific questions or requests?"
            multiline
            numberOfLines={4}
            style={{ minHeight: 80, textAlignVertical: 'top' }}
          />

          <PrimaryButton
            title={submitting ? 'Submitting...' : 'Request Tour'}
            onPress={handleSubmit}
            disabled={submitting}
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
