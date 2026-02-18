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

import { supabase } from '../lib/supabaseClient';
import { colors, spacing, radii, typography } from '../theme';
import { PrimaryButton, ThemedInput } from '../components/ui';
import { useAuth } from '../auth/AuthContext';

type QuotesStackParamList = {
  QuoteResponse: {
    revisionId: number;
    quoteRequestId: number;
    vendorName?: string;
    amount?: number;
    description?: string;
  };
  QuoteHistory: {
    quoteRequestId: number;
  };
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
  vendor_id: number;
  created_at: string;
  client_notes?: string | null;
  responded_at?: string | null;
};

type VendorInfo = {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
};

export default function QuoteResponseScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<QuotesStackParamList>>();
  const route = useRoute<RouteProp<QuotesStackParamList, 'QuoteResponse'>>();
  const { user } = useAuth();

  const { revisionId, quoteRequestId, vendorName: initialVendorName, amount: initialAmount, description: initialDescription } = route.params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [revision, setRevision] = useState<QuoteRevision | null>(null);
  const [vendor, setVendor] = useState<VendorInfo | null>(null);
  const [feedback, setFeedback] = useState('');
  const [responseType, setResponseType] = useState<'accept' | 'reject' | null>(null);

  const loadQuoteDetails = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Get internal user ID
      const { data: internalUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (!internalUser) {
        Alert.alert('Error', 'User not found');
        return;
      }

      // Get revision details
      const { data: rev } = await supabase
        .from('quote_revisions')
        .select('*')
        .eq('id', revisionId)
        .maybeSingle();

      if (!rev) {
        Alert.alert('Error', 'Quote not found');
        return;
      }

      setRevision(rev as QuoteRevision);

      // Get vendor info
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id, name, email, phone')
        .eq('id', rev.vendor_id)
        .maybeSingle();

      if (vendorData) {
        setVendor(vendorData as VendorInfo);
      }
    } catch (err) {
      console.error('Error loading quote:', err);
      Alert.alert('Error', 'Failed to load quote details');
    } finally {
      setLoading(false);
    }
  }, [revisionId, user?.id]);

  useEffect(() => {
    loadQuoteDetails();
  }, [loadQuoteDetails]);

  const handleResponse = async () => {
    if (!responseType || !revision || !user?.id) return;

    if (responseType === 'reject' && !feedback.trim()) {
      Alert.alert('Feedback Required', 'Please provide feedback on why you\'re rejecting this quote. This helps the vendor improve their offer.');
      return;
    }

    setSaving(true);
    try {
      // Update revision status
      const { error: updateError } = await supabase
        .from('quote_revisions')
        .update({
          status: responseType === 'accept' ? 'accepted' : 'rejected',
          client_notes: feedback.trim() || null,
          responded_at: new Date().toISOString(),
        })
        .eq('id', revisionId);

      if (updateError) throw updateError;

      // Update quote request status
      await supabase
        .from('quote_requests')
        .update({
          status: responseType === 'accept' ? 'finalised' : 'rejected',
        })
        .eq('id', quoteRequestId);

      // Add comment
      if (feedback.trim()) {
        await supabase.from('quote_comments').insert({
          quote_revision_id: revisionId,
          author_id: user.id,
          author_type: 'attendee',
          message: feedback.trim(),
          is_internal: false,
        });
      }

      // Send notification to vendor
      await sendVendorNotification(responseType);

      Alert.alert(
        responseType === 'accept' ? 'Quote Accepted!' : 'Quote Rejected',
        responseType === 'accept'
          ? 'You have accepted this quote. The vendor will be notified to proceed.'
          : 'You have rejected this quote. The vendor may submit a revised quote.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to submit response');
    } finally {
      setSaving(false);
    }
  };

  const sendVendorNotification = async (type: 'accept' | 'reject') => {
    try {
      await supabase.functions.invoke('send-quote-notifications', {
        body: {
          type: type === 'accept' ? 'quote-accepted-vendor' : 'quote-rejected-vendor',
          quoteRequestId,
          quoteRevisionId: revisionId,
          vendorBusinessName: vendor?.name || initialVendorName,
          vendorEmail: vendor?.email,
          quoteAmount: revision?.quote_amount || initialAmount,
          clientNotes: feedback.trim() || undefined,
        },
      });
    } catch (err) {
      console.error('Failed to send vendor notification:', err);
    }
  };

  const isExpired = () => {
    if (!revision) return false;
    const created = new Date(revision.created_at);
    const validUntil = new Date(created);
    validUntil.setDate(validUntil.getDate() + (revision.validity_days || 7));
    return new Date() > validUntil;
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ ...typography.body, color: colors.textMuted, marginTop: spacing.md }}>Loading quote...</Text>
      </View>
    );
  }

  const expired = isExpired();
  const displayAmount = revision?.quote_amount || initialAmount || 0;
  const displayVendor = vendor?.name || initialVendorName || 'Vendor';
  const displayDescription = revision?.description || initialDescription || '';

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
            Review Quote
          </Text>
          <Text style={{ ...typography.body, color: colors.textMuted }}>
            From: {displayVendor}
          </Text>
        </View>

        {/* Quote Card */}
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
            {/* Amount */}
            <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
              <Text style={{ ...typography.caption, color: colors.textMuted }}>Quoted Amount</Text>
              <Text style={{ ...typography.displayLarge, color: colors.primary, fontWeight: '700' }}>
                R{displayAmount.toLocaleString()}
              </Text>
              {revision?.revision_number && revision.revision_number > 1 && (
                <View
                  style={{
                    marginTop: spacing.sm,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.xs,
                    backgroundColor: '#FEF3C7',
                    borderRadius: radii.full,
                  }}
                >
                  <Text style={{ ...typography.caption, color: '#92400E' }}>
                    Revision #{revision.revision_number}
                  </Text>
                </View>
              )}
            </View>

            {/* Description */}
            {displayDescription && (
              <View style={{ marginBottom: spacing.md }}>
                <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>Description</Text>
                <Text style={{ ...typography.body, color: colors.textPrimary }}>{displayDescription}</Text>
              </View>
            )}

            {/* Terms */}
            {revision?.terms && (
              <View style={{ marginBottom: spacing.md }}>
                <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>Terms & Conditions</Text>
                <Text style={{ ...typography.body, color: colors.textSecondary }}>{revision.terms}</Text>
              </View>
            )}

            {/* Validity */}
            {revision?.validity_days && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm }}>
                <MaterialIcons name="schedule" size={16} color={expired ? '#DC2626' : colors.textMuted} />
                <Text
                  style={{
                    ...typography.caption,
                    color: expired ? '#DC2626' : colors.textMuted,
                    marginLeft: spacing.xs,
                  }}
                >
                  {expired ? 'Quote Expired' : `Valid for ${revision.validity_days} days`}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Expired Warning */}
        {expired && (
          <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
            <View
              style={{
                backgroundColor: '#FEE2E2',
                borderRadius: radii.lg,
                padding: spacing.md,
                borderWidth: 1,
                borderColor: '#FCA5A5',
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <MaterialIcons name="error" size={24} color="#DC2626" />
              <Text style={{ ...typography.body, color: '#DC2626', marginLeft: spacing.sm, flex: 1 }}>
                This quote has expired. Please contact the vendor for a revised quote.
              </Text>
            </View>
          </View>
        )}

        {/* Response Section */}
        {!expired && revision?.status === 'sent' && (
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
                Your Response
              </Text>

              {/* Accept/Reject Buttons */}
              <View style={{ flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md }}>
                <TouchableOpacity
                  onPress={() => setResponseType('accept')}
                  style={{
                    flex: 1,
                    paddingVertical: spacing.md,
                    borderRadius: radii.md,
                    backgroundColor: responseType === 'accept' ? '#16A34A' : '#F3F4F6',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: responseType === 'accept' ? '#16A34A' : colors.borderSubtle,
                  }}
                >
                  <MaterialIcons
                    name="check-circle"
                    size={24}
                    color={responseType === 'accept' ? '#FFFFFF' : '#16A34A'}
                  />
                  <Text
                    style={{
                      ...typography.body,
                      color: responseType === 'accept' ? '#FFFFFF' : '#16A34A',
                      marginTop: spacing.xs,
                      fontWeight: '600',
                    }}
                  >
                    Accept
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setResponseType('reject')}
                  style={{
                    flex: 1,
                    paddingVertical: spacing.md,
                    borderRadius: radii.md,
                    backgroundColor: responseType === 'reject' ? '#DC2626' : '#F3F4F6',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: responseType === 'reject' ? '#DC2626' : colors.borderSubtle,
                  }}
                >
                  <MaterialIcons
                    name="cancel"
                    size={24}
                    color={responseType === 'reject' ? '#FFFFFF' : '#DC2626'}
                  />
                  <Text
                    style={{
                      ...typography.body,
                      color: responseType === 'reject' ? '#FFFFFF' : '#DC2626',
                      marginTop: spacing.xs,
                      fontWeight: '600',
                    }}
                  >
                    Reject
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Feedback Input */}
              {responseType && (
                <View style={{ marginTop: spacing.md }}>
                  <Text style={{ ...typography.body, color: colors.textSecondary, marginBottom: spacing.xs }}>
                    {responseType === 'accept'
                      ? 'Additional Comments (Optional)'
                      : 'Feedback for Vendor (Required)'}
                  </Text>
                  <ThemedInput
                    value={feedback}
                    onChangeText={setFeedback}
                    placeholder={
                      responseType === 'accept'
                        ? 'Any special requests or notes...'
                        : 'Why are you rejecting? What would make this work?'
                    }
                    multiline
                    numberOfLines={4}
                    style={{ minHeight: 100, textAlignVertical: 'top' }}
                  />
                </View>
              )}
            </View>
          </View>
        )}

        {/* Already Responded */}
        {revision?.status && ['accepted', 'rejected'].includes(revision.status) && (
          <View style={{ paddingHorizontal: spacing.lg }}>
            <View
              style={{
                backgroundColor: revision.status === 'accepted' ? '#DCFCE7' : '#FEE2E2',
                borderRadius: radii.lg,
                padding: spacing.lg,
                borderWidth: 1,
                borderColor: revision.status === 'accepted' ? '#86EFAC' : '#FCA5A5',
                alignItems: 'center',
              }}
            >
              <MaterialIcons
                name={revision.status === 'accepted' ? 'check-circle' : 'cancel'}
                size={48}
                color={revision.status === 'accepted' ? '#16A34A' : '#DC2626'}
              />
              <Text
                style={{
                  ...typography.titleMedium,
                  color: revision.status === 'accepted' ? '#16A34A' : '#DC2626',
                  marginTop: spacing.sm,
                }}
              >
                Quote {revision.status === 'accepted' ? 'Accepted' : 'Rejected'}
              </Text>
              {revision.responded_at && (
                <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.xs }}>
                  {new Date(revision.responded_at).toLocaleDateString('en-ZA', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
              )}
              {revision.client_notes && (
                <View
                  style={{
                    marginTop: spacing.md,
                    padding: spacing.sm,
                    backgroundColor: 'rgba(255,255,255,0.5)',
                    borderRadius: radii.md,
                    width: '100%',
                  }}
                >
                  <Text style={{ ...typography.caption, color: colors.textMuted }}>Your Feedback:</Text>
                  <Text style={{ ...typography.body, color: colors.textPrimary, marginTop: 2 }}>
                    {revision.client_notes}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* View History Button */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('QuoteHistory', { quoteRequestId })}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: spacing.md,
              borderRadius: radii.md,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
            }}
          >
            <MaterialIcons name="history" size={20} color={colors.textPrimary} />
            <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>
              View Quote History
            </Text>
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        {responseType && !['accepted', 'rejected'].includes(revision?.status || '') && !expired && (
          <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
            <PrimaryButton
              title={saving ? 'Submitting...' : responseType === 'accept' ? 'Confirm Acceptance' : 'Submit Rejection'}
              onPress={handleResponse}
              disabled={saving}
              style={{
                backgroundColor: responseType === 'accept' ? '#16A34A' : '#DC2626',
              }}
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
