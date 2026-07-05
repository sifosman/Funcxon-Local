import { useState, useCallback, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { supabase } from '../../lib/supabaseClient';
import { uploadFileToStorage } from '../../lib/applicationService';
import { colors, spacing, radii, typography } from '../../theme';
import { OutlineButton, PrimaryButton, ThemedInput } from '../../components/ui';
import { useAuth } from '../../auth/AuthContext';
import ThemedAlert from '../../components/ThemedAlert';
import { createQuoteQuotedNotification } from '../../lib/notifications';
import { useIsDesktop } from '../../hooks/useIsDesktop';

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
  contact_phone: string | null;
  status: string;
  details: string | null;
  event_type: string | null;
  event_date: string | null;
  end_date: string | null;
  budget: string | null;
  quote_amount: number | null;
  amended_message: string | null;
  response_message: string | null;
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
  const isDesktop = useIsDesktop();

  const { quoteRequestId, clientName, clientEmail, eventDetails } = route.params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quoteRequest, setQuoteRequest] = useState<QuoteRequest | null>(null);
  const [existingRevisions, setExistingRevisions] = useState<QuoteRevision[]>([]);
  const [alertState, setAlertState] = useState<{visible: boolean; title: string; message: string; buttons?: any[]} | null>(null);

  // Form state
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [terms, setTerms] = useState('');
  const [validityDays, setValidityDays] = useState('7');
  const [internalNotes, setInternalNotes] = useState('');
  const [attachments, setAttachments] = useState<{ uri: string; name: string; type: string; url?: string; uploading?: boolean }[]>([]);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

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
        setAlertState({ visible: true, title: 'Error', message: 'Vendor profile not found', buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
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
        setAlertState({ visible: true, title: 'Error', message: 'Quote request not found or not assigned to you', buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
        return;
      }

      setQuoteRequest(qr as QuoteRequest);

      // Get existing revisions
      const { data: revisions } = await supabase
        .from('quote_revisions')
        .select('*')
        .eq('quote_request_id', quoteRequestId)
        .order('revision_number', { ascending: false });

      const revisionsList = (revisions || []) as QuoteRevision[];
      setExistingRevisions(revisionsList);

      // Pre-fill if there's an existing draft revision
      const draftRevision = revisions?.find((r) => r.status === 'draft');
      if (draftRevision) {
        setAmount(draftRevision.quote_amount?.toString() || '');
        setDescription(draftRevision.description || '');
        setTerms(draftRevision.terms || '');
        setValidityDays(draftRevision.validity_days?.toString() || '7');
      } else if (qr.status === 'amended') {
        // Pre-fill from latest sent revision when responding to an amendment
        const latestSent = revisionsList.find((r) => r.status === 'sent' || r.status === 'accepted');
        if (latestSent) {
          setAmount(latestSent.quote_amount?.toString() || '');
          setDescription(latestSent.description || '');
          setTerms(latestSent.terms || '');
          setValidityDays(latestSent.validity_days?.toString() || '7');
        }
      }
    } catch (err) {
      console.error('Error loading quote request:', err);
      setAlertState({ visible: true, title: 'Error', message: 'Failed to load quote request', buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
    } finally {
      setLoading(false);
    }
  }, [quoteRequestId, user?.id]);

  useEffect(() => {
    loadQuoteRequest();
  }, [loadQuoteRequest]);

  const pickAttachment = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) return;
      if (!result.assets?.[0]) return;

      const file = result.assets[0];
      setAttachments((prev) => [
        ...prev,
        { uri: file.uri, name: file.name || 'attachment.pdf', type: 'application/pdf', uploading: true },
      ]);
      setUploadingAttachment(true);

      const { url, error } = await uploadFileToStorage(
        'quote-attachments',
        { uri: file.uri, name: file.name || 'attachment.pdf', type: 'application/pdf' },
        user?.id || 'anonymous'
      );

      setAttachments((prev) => {
        const next = [...prev];
        const idx = next.findIndex((a) => a.uri === file.uri);
        if (idx >= 0) {
          if (url) {
            next[idx] = { ...next[idx], url, uploading: false };
          } else {
            next.splice(idx, 1);
          }
        }
        return next;
      });

      if (error) {
        console.error('Attachment upload failed:', error);
        setAlertState({ visible: true, title: 'Upload Failed', message: error, buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
      }
    } catch (err: any) {
      console.error('Attachment pick error:', err);
      setAlertState({ visible: true, title: 'Upload Failed', message: err?.message || 'Failed to attach PDF', buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
    } finally {
      setUploadingAttachment(false);
    }
  };

  const removeAttachment = (uri: string) => {
    setAttachments((prev) => prev.filter((a) => a.uri !== uri));
  };

  const validateForm = (): boolean => {
    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      setAlertState({ visible: true, title: 'Invalid Amount', message: 'Please enter a valid quote amount', buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
      return false;
    }
    if (!description.trim()) {
      setAlertState({ visible: true, title: 'Missing Description', message: 'Please provide a description of what the quote includes', buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
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
        setAlertState({ visible: true, title: 'Error', message: 'Vendor not found', buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
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
        attachments: attachments.map((a) => ({ url: a.url, name: a.name, type: a.type })).filter((a) => a.url),
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

      setAlertState({ visible: true, title: 'Draft Saved', message: 'Your quote has been saved as a draft', buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
    } catch (err: any) {
      setAlertState({ visible: true, title: 'Error', message: err?.message || 'Failed to save draft', buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
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
        setAlertState({ visible: true, title: 'Error', message: 'Vendor not found', buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
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
            attachments: attachments.map((a) => ({ url: a.url, name: a.name, type: a.type })).filter((a) => a.url),
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
            attachments: attachments.map((a) => ({ url: a.url, name: a.name, type: a.type })).filter((a) => a.url),
          })
          .select('id')
          .single();

        if (error) throw error;
        revisionId = data?.id;
      }

      // Update quote request status
      const nextStatus = quoteRequest?.status === 'amended' ? 'quoted' : 'quoted';
      await supabase
        .from('quote_requests')
        .update({
          status: nextStatus,
          quote_amount: Number(amount),
        })
        .eq('id', quoteRequestId);

      // In-app notification for the requester
      if (quoteRequest?.user_id) {
        const { data: requester } = await supabase
          .from('users')
          .select('auth_user_id')
          .eq('id', quoteRequest.user_id)
          .maybeSingle();
        if (requester?.auth_user_id) {
          await createQuoteQuotedNotification(requester.auth_user_id, vendor.name, quoteRequestId, false).catch(() => {});
        }
      }

      // Send notification to client
      await sendClientNotification(revisionId, vendor.name);

      setAlertState({ visible: true, title: 'Quote Sent', message: 'Your quote has been sent to the client', buttons: [{ text: 'OK', style: 'default', onPress: () => { setAlertState(null); navigation.goBack(); } }] });
    } catch (err: any) {
      setAlertState({ visible: true, title: 'Error', message: err?.message || 'Failed to send quote', buttons: [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }] });
    } finally {
      setSaving(false);
    }
  };

  const sendClientNotification = async (revisionId: number, vendorName: string) => {
    try {
      const sentRevisions = existingRevisions.filter((r) => r.status === 'sent');
      const revisionNumber = sentRevisions.length + 1;
      const isAmendment = quoteRequest?.status === 'amended';
      const isRevision = revisionNumber > 1 || isAmendment;
      const attachmentUrls = attachments
        .filter((a) => a.url)
        .map((a) => ({ url: a.url, name: a.name }));

      await supabase.functions.invoke('send-quote-notifications', {
        body: {
          type: isAmendment ? 'quote-revised-client' : isRevision ? 'quote-revised-client' : 'quote-created-client',
          quoteRequestId,
          quoteRevisionId: revisionId,
          clientName: quoteRequest?.name,
          clientEmail: quoteRequest?.email,
          vendorBusinessName: vendorName,
          quoteAmount: Number(amount),
          quoteDescription: description.trim(),
          revisionNumber,
          attachments: attachmentUrls,
          isAmendment,
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

  const desktopContainerStyle = {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center' as const,
    paddingHorizontal: 48,
  };

  const cardSurface = isDesktop ? colors.surfaceContainerLowest : colors.surface;
  const cardBorder = isDesktop ? colors.outlineVariant : colors.borderSubtle;

  const renderHeader = (isDesktopHeader: boolean) => (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={isDesktopHeader ? { ...typography.labelMd, color: colors.dustyRose, textTransform: 'uppercase', marginBottom: spacing.sm } as any : { display: 'none' } as any}>
        Quotes
      </Text>
      <Text style={isDesktopHeader ? { ...typography.headlineMd, color: colors.primary } as any : { ...typography.displayMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
        Create Quote
      </Text>
      <Text style={{ ...typography.bodyMd, color: isDesktopHeader ? colors.onSurfaceVariant : colors.textMuted }}>
        For: {clientName || quoteRequest?.name || 'Client'}
      </Text>
    </View>
  );

  const renderRequestDetails = () => (
    <View
      style={{
        backgroundColor: cardSurface,
        borderRadius: radii.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: cardBorder,
      }}
    >
      <Text style={isDesktop ? { ...typography.headlineSm, color: colors.textPrimary, marginBottom: spacing.sm } as any : { ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.sm }}>
        Request Details
      </Text>
      {eventDetails || quoteRequest?.details ? (
        <Text style={{ ...typography.bodyMd, color: colors.onSurfaceVariant, marginBottom: spacing.sm } as any}>
          {eventDetails || quoteRequest?.details}
        </Text>
      ) : null}
      {quoteRequest?.event_type ? (
        <Text style={{ ...typography.bodyMd, color: colors.onSurfaceVariant } as any}>Event Type: {quoteRequest.event_type}</Text>
      ) : null}
      {quoteRequest?.event_date ? (
        <Text style={{ ...typography.bodyMd, color: colors.onSurfaceVariant } as any}>
          Event Date: {new Date(quoteRequest.event_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
        </Text>
      ) : null}
      {quoteRequest?.end_date ? (
        <Text style={{ ...typography.bodyMd, color: colors.onSurfaceVariant } as any}>
          End Date: {new Date(quoteRequest.end_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
        </Text>
      ) : null}
      {quoteRequest?.contact_phone ? (
        <Text style={{ ...typography.bodyMd, color: colors.onSurfaceVariant } as any}>
          Contact: {quoteRequest.contact_phone}
        </Text>
      ) : null}
      {quoteRequest?.budget ? (
        <Text style={{ ...typography.bodyMd, color: colors.onSurfaceVariant } as any}>Client Budget: {quoteRequest.budget}</Text>
      ) : null}
      {quoteRequest?.amended_message ? (
        <View style={{ marginTop: spacing.sm, padding: spacing.sm, backgroundColor: '#FEF3C7', borderRadius: radii.md, borderLeftWidth: 3, borderLeftColor: '#D97706' }}>
          <Text style={{ ...typography.captionSemiBold, color: '#92400E' }}>Amendment Request</Text>
          <Text style={{ ...typography.caption, color: '#92400E', marginTop: 2 }}>{quoteRequest.amended_message}</Text>
        </View>
      ) : null}
      {quoteRequest?.response_message ? (
        <View style={{ marginTop: spacing.sm, padding: spacing.sm, backgroundColor: '#F0F9FF', borderRadius: radii.md, borderLeftWidth: 3, borderLeftColor: colors.primary }}>
          <Text style={{ ...typography.captionSemiBold, color: colors.primary }}>Client Feedback</Text>
          <Text style={{ ...typography.caption, color: colors.primary, marginTop: 2 }}>{quoteRequest.response_message}</Text>
        </View>
      ) : null}
    </View>
  );

  const renderQuoteForm = () => (
    <View
      style={{
        backgroundColor: cardSurface,
        borderRadius: radii.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: cardBorder,
      }}
    >
      <Text style={isDesktop ? { ...typography.headlineSm, color: colors.textPrimary, marginBottom: spacing.md } as any : { ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>
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

      {/* Attachments */}
      <Text style={{ ...typography.body, color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.md }}>
        Attachments (PDF)
      </Text>
      {attachments.map((attachment) => (
        <View
          key={attachment.uri}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: spacing.sm,
            backgroundColor: colors.surfaceMuted,
            borderRadius: radii.md,
            marginBottom: spacing.xs,
            borderWidth: 1,
            borderColor: cardBorder,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <MaterialIcons name="picture-as-pdf" size={20} color={attachment.uploading ? colors.textMuted : '#DC2626'} />
            <Text
              style={{
                ...typography.body,
                color: attachment.uploading ? colors.textMuted : colors.textPrimary,
                marginLeft: spacing.sm,
                flex: 1,
              }}
              numberOfLines={1}
            >
              {attachment.name}
              {attachment.uploading ? ' (uploading...)' : ''}
            </Text>
          </View>
          {!attachment.uploading && (
            <TouchableOpacity onPress={() => removeAttachment(attachment.uri)} style={{ padding: spacing.xs }}>
              <MaterialIcons name="close" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      ))}
      <TouchableOpacity
        onPress={pickAttachment}
        disabled={uploadingAttachment}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing.sm,
          borderWidth: 1,
          borderColor: cardBorder,
          borderRadius: radii.md,
          borderStyle: 'dashed',
          marginTop: spacing.xs,
          opacity: uploadingAttachment ? 0.6 : 1,
        }}
      >
        <MaterialIcons name="add" size={18} color={colors.primary} />
        <Text style={{ ...typography.body, color: colors.primary, marginLeft: spacing.xs }}>
          {uploadingAttachment ? 'Uploading PDF...' : 'Add PDF Attachment'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderRevisionHistory = () =>
    existingRevisions.length > 0 ? (
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
    ) : null;

  const renderActions = () => (
    <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
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
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: isDesktop ? colors.surfaceBg : colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={isDesktop ? { ...desktopContainerStyle, paddingBottom: 120 } as any : { paddingBottom: 120 }}>
        {isDesktop ? (
          <>
            {renderHeader(true)}
            <View style={{ flexDirection: 'row', gap: spacing.gutter } as any}>
              <View style={{ flex: 2 } as any}>
                {renderQuoteForm()}
                {renderActions()}
              </View>
              <View style={{ flex: 1, gap: spacing.md } as any}>
                {renderRequestDetails()}
                {renderRevisionHistory()}
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Header */}
            <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md }}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
                <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>Back</Text>
              </TouchableOpacity>

              {renderHeader(false)}
            </View>

            {/* Client Info Card */}
            <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
              {renderRequestDetails()}
            </View>

            {/* Quote Form */}
            <View style={{ paddingHorizontal: spacing.lg }}>
              {renderQuoteForm()}
            </View>

            {/* Revision History Link */}
            <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
              {renderRevisionHistory()}
            </View>

            {/* Action Buttons */}
            <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl, gap: spacing.md }}>
              {renderActions()}
            </View>
          </>
        )}
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
