import { useState, useCallback, useEffect } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { supabase } from '../../lib/supabaseClient';
import { colors, spacing, radii, typography } from '../../theme';
import { OutlineButton, PrimaryButton, ThemedInput } from '../../components/ui';
import { useAuth } from '../../auth/AuthContext';

type SubscriberStackParamList = {
  VendorQuoteCreate: {
    quoteRequestId: number;
    clientName?: string;
    clientEmail?: string;
    eventDetails?: string;
  };
  VendorQuoteHistory: {
    quoteRequestId: number;
  };
};

type QuoteRequest = {
  id: number;
  vendor_id: number;
  user_id: number;
  name: string;
  email: string;
  status: string;
  details: string | null;
  event_type: string | null;
  event_date: string | null;
  budget: string | null;
  quote_amount: number | null;
  created_at: string;
};

type QuoteRevision = {
  id: number;
  quote_request_id: number;
  quote_amount: number | null;
  description: string | null;
  validity_days: number;
  terms: string | null;
  revision_number: number;
  status: string;
  created_at: string;
};

export default function VendorQuoteCreateScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<SubscriberStackParamList>>();
  const route = useRoute<RouteProp<SubscriberStackParamList, 'VendorQuoteCreate'>>();
  const { user } = useAuth();

  const { quoteRequestId, clientName, clientEmail, eventDetails } = route.params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quoteRequest, setQuoteRequest] = useState<QuoteRequest | null>(null);
  const [existingRevisions, setExistingRevisions] = useState<QuoteRevision[]>([]);

  // Form state
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [terms, setTerms] = useState('');
  const [validityDays, setValidityDays] = useState('7');
  const [internalNotes, setInternalNotes] = useState('');

  // Load quote request details
  const loadQuoteRequest = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Get vendor ID for current user
      const { data: vendor } = await supabase
        .from('vendors')
        .select('id, name, user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!vendor) {
        Alert.alert('Error', 'Vendor profile not found');
        return;
      }

      // Get quote request
      const { data: qr } = await supabase
        .from('quote_requests')
        .select('*')
        .eq('id', quoteRequestId)
        .eq('vendor_id', vendor.id)
        .maybeSingle();

      if (!qr) {
        Alert.alert('Error', 'Quote request not found or not assigned to you');
        return;
      }

      setQuoteRequest(qr as QuoteRequest);

      // Get existing revisions
      const { data: revisions } = await supabase
        .from('quote_revisions')
        .select('*')
        .eq('quote_request_id', quoteRequestId)
        .order('revision_number', { ascending: false });

      setExistingRevisions((revisions || []) as QuoteRevision[]);

      // Pre-fill if there's an existing draft revision
      const draftRevision = revisions?.find((r) => r.status === 'draft');
      if (draftRevision) {
        setAmount(draftRevision.quote_amount?.toString() || '');
        setDescription(draftRevision.description || '');
        setTerms(draftRevision.terms || '');
        setValidityDays(draftRevision.validity_days?.toString() || '7');
      }
    } catch (err) {
      console.error('Error loading quote request:', err);
      Alert.alert('Error', 'Failed to load quote request');
    } finally {
      setLoading(false);
    }
  }, [quoteRequestId, user?.id]);

  useEffect(() => {
    loadQuoteRequest();
  }, [loadQuoteRequest]);

  const validateForm = (): boolean => {
    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid quote amount');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Missing Description', 'Please provide a description of what the quote includes');
      return false;
    }
    return true;
  };

  const saveDraft = async () => {
    if (!quoteRequest || !user?.id) return;

    setSaving(true);
    try {
      const { data: vendor } = await supabase
        .from('vendors')
        .select('id, name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!vendor) {
        Alert.alert('Error', 'Vendor not found');
        return;
      }

      // Check for existing draft
      const existingDraft = existingRevisions.find((r) => r.status === 'draft');

      const revisionData = {
        quote_request_id: quoteRequestId,
        vendor_id: vendor.id,
        quote_amount: Number(amount),
        description: description.trim(),
        terms: terms.trim() || null,
        validity_days: parseInt(validityDays) || 7,
        status: 'draft',
        notes: internalNotes.trim() || null,
      };

      if (existingDraft) {
        // Update existing draft
        const { error } = await supabase
          .from('quote_revisions')
          .update(revisionData)
          .eq('id', existingDraft.id);

        if (error) throw error;
      } else {
        // Create new draft
        const { error } = await supabase.from('quote_revisions').insert(revisionData);
        if (error) throw error;
      }

      Alert.alert('Draft Saved', 'Your quote has been saved as a draft');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const sendQuote = async () => {
    if (!validateForm() || !quoteRequest || !user?.id) return;

    setSaving(true);
    try {
      const { data: vendor } = await supabase
        .from('vendors')
        .select('id, name, user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!vendor) {
        Alert.alert('Error', 'Vendor not found');
        return;
      }

      // Check for existing draft to update, or create new
      const existingDraft = existingRevisions.find((r) => r.status === 'draft');

      let revisionId: number;

      if (existingDraft) {
        // Update to sent status
        const { error, data } = await supabase
          .from('quote_revisions')
          .update({
            quote_amount: Number(amount),
            description: description.trim(),
            terms: terms.trim() || null,
            validity_days: parseInt(validityDays) || 7,
            status: 'sent',
            notes: internalNotes.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingDraft.id)
          .select('id')
          .single();

        if (error) throw error;
        revisionId = existingDraft.id;
      } else {
        // Create new revision as sent
        const { error, data } = await supabase
          .from('quote_revisions')
          .insert({
            quote_request_id: quoteRequestId,
            vendor_id: vendor.id,
            quote_amount: Number(amount),
            description: description.trim(),
            terms: terms.trim() || null,
            validity_days: parseInt(validityDays) || 7,
            status: 'sent',
            notes: internalNotes.trim() || null,
          })
          .select('id')
          .single();

        if (error) throw error;
        revisionId = data?.id;
      }

      // Update quote request status
      await supabase
        .from('quote_requests')
        .update({
          status: 'quoted',
          quote_amount: Number(amount),
        })
        .eq('id', quoteRequestId);

      // Send notification to client
      await sendClientNotification(revisionId, vendor.name);

      Alert.alert('Quote Sent', 'Your quote has been sent to the client', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to send quote');
    } finally {
      setSaving(false);
    }
  };

  const sendClientNotification = async (revisionId: number, vendorName: string) => {
    try {
      const revisionNumber = existingRevisions.filter((r) => r.status === 'sent').length + 1;
      const isRevision = revisionNumber > 1;

      await supabase.functions.invoke('send-quote-notifications', {
        body: {
          type: isRevision ? 'quote-revised-client' : 'quote-created-client',
          quoteRequestId,
          quoteRevisionId: revisionId,
          clientName: quoteRequest?.name,
          clientEmail: quoteRequest?.email,
          vendorBusinessName: vendorName,
          quoteAmount: Number(amount),
          quoteDescription: description.trim(),
          revisionNumber,
        },
      });
    } catch (err) {
      console.error('Failed to send client notification:', err);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ ...typography.body, color: colors.textMuted, marginTop: spacing.md }}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.md }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}>
            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
            <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>Back</Text>
          </TouchableOpacity>

          <Text style={{ ...typography.displayMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
            Create Quote
          </Text>
          <Text style={{ ...typography.body, color: colors.textMuted }}>
            For: {clientName || quoteRequest?.name || 'Client'}
          </Text>
        </View>

        {/* Client Info Card */}
        <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radii.lg,
              padding: spacing.lg,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
            }}
          >
            <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.sm }}>
              Request Details
            </Text>
            {eventDetails || quoteRequest?.details ? (
              <Text style={{ ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm }}>
                {eventDetails || quoteRequest?.details}
              </Text>
            ) : null}
            {quoteRequest?.event_type ? (
              <Text style={{ ...typography.caption, color: colors.textMuted }}>Event Type: {quoteRequest.event_type}</Text>
            ) : null}
            {quoteRequest?.event_date ? (
              <Text style={{ ...typography.caption, color: colors.textMuted }}>
                Event Date: {new Date(quoteRequest.event_date).toLocaleDateString()}
              </Text>
            ) : null}
            {quoteRequest?.budget ? (
              <Text style={{ ...typography.caption, color: colors.textMuted }}>Client Budget: {quoteRequest.budget}</Text>
            ) : null}
          </View>
        </View>

        {/* Quote Form */}
        <View style={{ paddingHorizontal: spacing.lg }}>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radii.lg,
              padding: spacing.lg,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
            }}
          >
            <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>
              Quote Details
            </Text>

            {/* Amount */}
            <Text style={{ ...typography.body, color: colors.textSecondary, marginBottom: spacing.xs }}>Quote Amount (R)</Text>
            <ThemedInput
              value={amount}
              onChangeText={setAmount}
              placeholder="e.g. 5000"
              keyboardType="numeric"
              autoCapitalize="none"
            />

            {/* Description */}
            <Text style={{ ...typography.body, color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.md }}>
              Description of Services
            </Text>
            <ThemedInput
              value={description}
              onChangeText={setDescription}
              placeholder="Describe what this quote includes..."
              multiline
              numberOfLines={4}
              style={{ minHeight: 100, textAlignVertical: 'top' }}
            />

            {/* Terms */}
            <Text style={{ ...typography.body, color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.md }}>
              Terms & Conditions
            </Text>
            <ThemedInput
              value={terms}
              onChangeText={setTerms}
              placeholder="Payment terms, delivery details, cancellation policy..."
              multiline
              numberOfLines={3}
              style={{ minHeight: 80, textAlignVertical: 'top' }}
            />

            {/* Validity */}
            <Text style={{ ...typography.body, color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.md }}>
              Quote Valid (Days)
            </Text>
            <ThemedInput
              value={validityDays}
              onChangeText={setValidityDays}
              placeholder="7"
              keyboardType="numeric"
            />

            {/* Internal Notes */}
            <Text style={{ ...typography.body, color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.md }}>
              Internal Notes (Not visible to client)
            </Text>
            <ThemedInput
              value={internalNotes}
              onChangeText={setInternalNotes}
              placeholder="Private notes about this quote..."
              multiline
              numberOfLines={2}
              style={{ minHeight: 60, textAlignVertical: 'top', backgroundColor: colors.surfaceMuted }}
            />
          </View>
        </View>

        {/* Revision History Link */}
        {existingRevisions.length > 0 && (
          <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
            <TouchableOpacity
              onPress={() => navigation.navigate('VendorQuoteHistory', { quoteRequestId })}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: spacing.md,
                backgroundColor: '#F0F9FF',
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: '#BAE6FD',
              }}
            >
              <MaterialIcons name="history" size={20} color="#0369A1" />
              <Text style={{ ...typography.body, color: '#0369A1', marginLeft: spacing.sm, flex: 1 }}>
                View Quote History ({existingRevisions.length} revision{existingRevisions.length !== 1 ? 's' : ''})
              </Text>
              <MaterialIcons name="chevron-right" size={20} color="#0369A1" />
            </TouchableOpacity>
          </View>
        )}

        {/* Action Buttons */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl, gap: spacing.md }}>
          <PrimaryButton
            title={saving ? 'Sending...' : 'Send Quote to Client'}
            onPress={sendQuote}
            disabled={saving}
          />
          <OutlineButton
            title={saving ? 'Saving...' : 'Save as Draft'}
            onPress={saveDraft}
            style={{ marginTop: spacing.md }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
