import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { supabase } from '../../lib/supabaseClient';
import { colors, spacing, radii, typography } from '../../theme';
import { useAuth } from '../../auth/AuthContext';
import ThemedAlert from '../../components/ThemedAlert';
import { quoteStatusLabel } from '../../lib/quoting';
import { useIsDesktop } from '../../hooks/useIsDesktop';

type SubscriberStackParamList = {
  VendorQuoteHistory: { quoteRequestId: number };
  VendorQuoteCreate: { quoteRequestId: number };
};

type QuoteAttachment = {
  url: string;
  name: string;
  type?: string;
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
  notes: string | null;
  client_notes: string | null;
  responded_at: string | null;
  created_at: string;
  created_by: string;
  attachments: QuoteAttachment[] | null;
};

type QuoteComment = {
  id: number;
  quote_revision_id: number;
  author_type: string;
  message: string;
  is_internal: boolean;
  created_at: string;
};

export default function VendorQuoteHistoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<SubscriberStackParamList>>();
  const route = useRoute<RouteProp<SubscriberStackParamList, 'VendorQuoteHistory'>>();
  const { user } = useAuth();
  const isDesktop = useIsDesktop();
  const { quoteRequestId } = route.params;

  const [loading, setLoading] = useState(true);
  const [revisions, setRevisions] = useState<QuoteRevision[]>([]);
  const [comments, setComments] = useState<Record<number, QuoteComment[]>>({});
  const [expandedRevision, setExpandedRevision] = useState<number | null>(null);
  const [quoteRequestStatus, setQuoteRequestStatus] = useState<string | null>(null);
  const [alertState, setAlertState] = useState<{visible: boolean; title: string; message: string} | null>(null);

  const loadHistory = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Verify vendor ownership
      const { data: vendor } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!vendor) {
        setAlertState({ visible: true, title: 'Error', message: 'Vendor profile not found' });
        return;
      }

      // Load quote request status
      const { data: qr } = await supabase
        .from('quote_requests')
        .select('status')
        .eq('id', quoteRequestId)
        .eq('vendor_id', vendor.id)
        .maybeSingle();
      setQuoteRequestStatus(qr?.status ?? null);

      // Load revisions
      const { data: revs, error: revError } = await supabase
        .from('quote_revisions')
        .select('*')
        .eq('quote_request_id', quoteRequestId)
        .order('revision_number', { ascending: false });

      if (revError) throw revError;
      setRevisions((revs || []) as QuoteRevision[]);

      // Load comments for each revision
      const revisionIds = (revs || []).map((r) => r.id);
      if (revisionIds.length > 0) {
        const { data: coms, error: comError } = await supabase
          .from('quote_comments')
          .select('*')
          .in('quote_revision_id', revisionIds)
          .order('created_at', { ascending: true });

        if (!comError && coms) {
          const commentsByRevision: Record<number, QuoteComment[]> = {};
          coms.forEach((c) => {
            if (!commentsByRevision[c.quote_revision_id]) {
              commentsByRevision[c.quote_revision_id] = [];
            }
            commentsByRevision[c.quote_revision_id].push(c as QuoteComment);
          });
          setComments(commentsByRevision);
        }
      }
    } catch (err) {
      console.error('Error loading quote history:', err);
      setAlertState({ visible: true, title: 'Error', message: 'Failed to load quote history' });
    } finally {
      setLoading(false);
    }
  }, [quoteRequestId, user?.id]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return '#16A34A';
      case 'rejected':
        return '#DC2626';
      case 'sent':
      case 'quoted':
        return '#2B9EB3';
      case 'draft':
        return '#6B7280';
      case 'expired':
        return '#92400E';
      default:
        return colors.textMuted;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'accepted':
        return '#DCFCE7';
      case 'rejected':
        return '#FEE2E2';
      case 'sent':
      case 'quoted':
        return '#E0F2FE';
      case 'draft':
        return '#F3F4F6';
      case 'expired':
        return '#FFEDD5';
      default:
        return colors.surfaceMuted;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isQuoteExpired = (revision: QuoteRevision) => {
    if (revision.status !== 'sent') return false;
    const created = new Date(revision.created_at);
    const validUntil = new Date(created);
    validUntil.setDate(validUntil.getDate() + (revision.validity_days || 7));
    return new Date() > validUntil;
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ ...typography.body, color: colors.textMuted, marginTop: spacing.md }}>Loading history...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: isDesktop ? colors.surfaceBg : colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        {isDesktop ? (
          <View style={{ maxWidth: 1200, width: '100%', alignSelf: 'center', paddingHorizontal: 48, paddingTop: spacing.xl }}>
            {/* Header */}
            <Text style={{ ...typography.displayMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
              Quote History
            </Text>
            <Text style={{ ...typography.body, color: colors.textMuted, marginBottom: spacing.lg }}>
              {revisions.length} revision{revisions.length !== 1 ? 's' : ''}
            </Text>

            {revisions.length > 0 ? (
              <View style={{ flexDirection: 'row', gap: spacing.gutter } as any}>
                {/* Left column - revision list */}
                <View style={{ flex: 5, gap: spacing.gutter } as any}>
                  {revisions.map((rev, index) => {
                    const expired = isQuoteExpired(rev);
                    const displayStatus = expired && rev.status === 'sent' ? 'expired' : rev.status;
                    const isExpanded = expandedRevision === rev.id;

                    return (
                      <TouchableOpacity
                        key={rev.id}
                        onPress={() => setExpandedRevision(isExpanded ? null : rev.id)}
                        style={{
                          backgroundColor: colors.surfaceContainerLowest,
                          borderRadius: radii.lg,
                          padding: spacing.lg,
                          borderWidth: isExpanded ? 2 : 1,
                          borderColor: isExpanded ? colors.primary : colors.outlineVariant,
                          opacity: rev.status === 'draft' ? 0.7 : 1,
                        }}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
                          <View>
                            <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>
                              Revision #{rev.revision_number}
                            </Text>
                            <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: 2 }}>
                              {formatDate(rev.created_at)}
                            </Text>
                          </View>
                          <View
                            style={{
                              paddingHorizontal: spacing.md,
                              paddingVertical: spacing.xs,
                              borderRadius: radii.full,
                              backgroundColor: getStatusBg(displayStatus),
                            }}
                          >
                            <Text style={{ ...typography.captionBold, color: getStatusColor(displayStatus), textTransform: 'uppercase' }}>
                              {quoteStatusLabel(displayStatus)}
                            </Text>
                          </View>
                        </View>

                        {rev.quote_amount && (
                          <Text style={{ ...typography.titleLarge, color: colors.textPrimary }}>
                            R{rev.quote_amount.toLocaleString()}
                          </Text>
                        )}

                        {rev.description && (
                          <Text style={{ ...typography.body, color: colors.textSecondary, marginTop: spacing.xs }} numberOfLines={2}>
                            {rev.description}
                          </Text>
                        )}

                        {/* Action Buttons */}
                        {rev.status === 'draft' && index === 0 && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, gap: spacing.xs }}>
                            <MaterialIcons name="edit" size={16} color={colors.primary} />
                            <Text style={{ ...typography.captionSemiBold, color: colors.primary }}>Continue Editing Draft</Text>
                          </View>
                        )}

                        {(rev.status === 'rejected' || quoteRequestStatus === 'amended') && index === 0 && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, gap: spacing.xs }}>
                            <MaterialIcons name="send" size={16} color={colors.primary} />
                            <Text style={{ ...typography.captionSemiBold, color: colors.primary }}>Submit Revised Quote</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Right column - expanded revision details */}
                <View style={{ flex: 7 } as any}>
                  {expandedRevision ? (() => {
                    const rev = revisions.find(r => r.id === expandedRevision);
                    if (!rev) return null;
                    const revisionComments = comments[rev.id] || [];

                    return (
                      <View
                        style={{
                          backgroundColor: colors.surfaceContainerLowest,
                          borderRadius: radii.lg,
                          padding: spacing.lg,
                          borderWidth: 1,
                          borderColor: colors.outlineVariant,
                        }}
                      >
                        <Text style={{ ...typography.titleLarge, color: colors.textPrimary, marginBottom: spacing.sm }}>
                          Revision #{rev.revision_number} Details
                        </Text>

                        {rev.quote_amount && (
                          <View style={{ marginBottom: spacing.md }}>
                            <Text style={{ ...typography.caption, color: colors.textMuted }}>Amount</Text>
                            <Text style={{ ...typography.titleLarge, color: colors.textPrimary }}>
                              R{rev.quote_amount.toLocaleString()}
                            </Text>
                          </View>
                        )}

                        {rev.description && (
                          <View style={{ marginBottom: spacing.md }}>
                            <Text style={{ ...typography.caption, color: colors.textMuted }}>Description</Text>
                            <Text style={{ ...typography.body, color: colors.textSecondary }}>{rev.description}</Text>
                          </View>
                        )}

                        {rev.terms && (
                          <View style={{ marginBottom: spacing.md }}>
                            <Text style={{ ...typography.caption, color: colors.textMuted }}>Terms</Text>
                            <Text style={{ ...typography.body, color: colors.textSecondary }}>{rev.terms}</Text>
                          </View>
                        )}

                        {rev.validity_days && (
                          <View style={{ marginBottom: spacing.md }}>
                            <Text style={{ ...typography.caption, color: colors.textMuted }}>Validity</Text>
                            <Text style={{ ...typography.body, color: colors.textSecondary }}>
                              {rev.validity_days} days
                            </Text>
                          </View>
                        )}

                        {rev.notes && (
                          <View
                            style={{
                              marginBottom: spacing.md,
                              padding: spacing.sm,
                              backgroundColor: '#F3F4F6',
                              borderRadius: radii.md,
                              borderLeftWidth: 3,
                              borderLeftColor: colors.textMuted,
                            }}
                          >
                            <Text style={{ ...typography.caption, color: colors.textMuted }}>Internal Notes</Text>
                            <Text style={{ ...typography.body, color: colors.textSecondary }}>{rev.notes}</Text>
                          </View>
                        )}

                        {rev.client_notes && (
                          <View
                            style={{
                              marginBottom: spacing.md,
                              padding: spacing.sm,
                              backgroundColor: '#FEF3C7',
                              borderRadius: radii.md,
                              borderLeftWidth: 3,
                              borderLeftColor: '#D97706',
                            }}
                          >
                            <Text style={{ ...typography.captionSemiBold, color: '#92400E' }}>Client Feedback</Text>
                            <Text style={{ ...typography.body, color: colors.textSecondary }}>{rev.client_notes}</Text>
                            {rev.responded_at && (
                              <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: 2 }}>
                                {formatDate(rev.responded_at)}
                              </Text>
                            )}
                          </View>
                        )}

                        {rev.attachments && rev.attachments.length > 0 && (
                          <View style={{ marginBottom: spacing.md }}>
                            <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm }}>
                              Attachments ({rev.attachments.length})
                            </Text>
                            {rev.attachments.map((attachment, idx) => (
                              <TouchableOpacity
                                key={idx}
                                onPress={() => {
                                  if (attachment.url) {
                                    Linking.openURL(attachment.url).catch(() => {
                                      setAlertState({ visible: true, title: 'Error', message: 'Could not open attachment' });
                                    });
                                  }
                                }}
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  padding: spacing.sm,
                                  backgroundColor: '#FEE2E2',
                                  borderRadius: radii.md,
                                  marginBottom: spacing.xs,
                                  borderLeftWidth: 3,
                                  borderLeftColor: '#DC2626',
                                }}
                              >
                                <MaterialIcons name="picture-as-pdf" size={18} color="#DC2626" />
                                <Text
                                  style={{
                                    ...typography.body,
                                    color: colors.textPrimary,
                                    marginLeft: spacing.sm,
                                    flex: 1,
                                  }}
                                  numberOfLines={1}
                                >
                                  {attachment.name || 'Attachment'}
                                </Text>
                                <MaterialIcons name="open-in-new" size={16} color={colors.textMuted} />
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}

                        {/* Comments */}
                        {revisionComments.length > 0 && (
                          <View style={{ marginTop: spacing.md }}>
                            <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm }}>
                              Comments ({revisionComments.length})
                            </Text>
                            {revisionComments.map((comment) => (
                              <View
                                key={comment.id}
                                style={{
                                  padding: spacing.sm,
                                  backgroundColor: comment.is_internal ? '#F3F4F6' : '#F0F9FF',
                                  borderRadius: radii.md,
                                  marginBottom: spacing.xs,
                                  borderLeftWidth: 2,
                                  borderLeftColor: comment.is_internal ? colors.textMuted : colors.primary,
                                }}
                              >
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                  <Text style={{ ...typography.captionSemiBold, color: colors.textSecondary }}>
                                    {comment.author_type === 'vendor' ? 'You' : 'Client'}
                                    {comment.is_internal && ' (Internal)'}
                                  </Text>
                                  <Text style={{ ...typography.caption, color: colors.textMuted }}>
                                    {new Date(comment.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
                                  </Text>
                                </View>
                                <Text style={{ ...typography.body, color: colors.textPrimary, marginTop: 2 }}>
                                  {comment.message}
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}

                        {/* Action Buttons */}
                        {rev.status === 'draft' && (
                          <TouchableOpacity
                            onPress={() => navigation.navigate('VendorQuoteCreate', { quoteRequestId })}
                            style={{
                              marginTop: spacing.md,
                              paddingVertical: spacing.sm,
                              borderRadius: radii.md,
                              borderWidth: 1,
                              borderColor: colors.primary,
                              alignItems: 'center',
                            }}
                          >
                            <Text style={{ ...typography.bodyBold, color: colors.primary }}>
                              Continue Editing Draft
                            </Text>
                          </TouchableOpacity>
                        )}

                        {(rev.status === 'rejected' || quoteRequestStatus === 'amended') && revisions.indexOf(rev) === 0 && (
                          <TouchableOpacity
                            onPress={() => navigation.navigate('VendorQuoteCreate', { quoteRequestId })}
                            style={{
                              marginTop: spacing.md,
                              paddingVertical: spacing.sm,
                              borderRadius: radii.md,
                              backgroundColor: colors.primary,
                              alignItems: 'center',
                            }}
                          >
                            <Text style={{ ...typography.bodyBold, color: '#FFFFFF' }}>
                              Submit Revised Quote
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })() : (
                    <View
                      style={{
                        backgroundColor: colors.surfaceContainerLowest,
                        borderRadius: radii.lg,
                        padding: spacing.xl,
                        borderWidth: 1,
                        borderColor: colors.outlineVariant,
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: 300,
                      }}
                    >
                      <MaterialIcons name="history" size={48} color={colors.textMuted} />
                      <Text style={{ ...typography.body, color: colors.textMuted, marginTop: spacing.md, textAlign: 'center' }}>
                        Select a revision to view its details
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ) : (
              <View style={{ paddingTop: spacing.xl, alignItems: 'center' }}>
                <MaterialIcons name="history" size={48} color={colors.textMuted} />
                <Text style={{ ...typography.body, color: colors.textMuted, marginTop: spacing.md, textAlign: 'center' }}>
                  No quote history yet. Create your first quote to see it here.
                </Text>
              </View>
            )}
          </View>
        ) : (
          <>
            {/* Header */}
            <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md }}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
                <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>Back</Text>
              </TouchableOpacity>

              <Text style={{ ...typography.displayMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
                Quote History
              </Text>
              <Text style={{ ...typography.body, color: colors.textMuted }}>
                {revisions.length} revision{revisions.length !== 1 ? 's' : ''}
              </Text>
            </View>

            {/* Revisions List */}
            <View style={{ paddingHorizontal: spacing.lg }}>
              {revisions.map((rev, index) => {
                const expired = isQuoteExpired(rev);
                const displayStatus = expired && rev.status === 'sent' ? 'expired' : rev.status;
                const isExpanded = expandedRevision === rev.id;
                const revisionComments = comments[rev.id] || [];

                return (
                  <View
                    key={rev.id}
                    style={{
                      backgroundColor: colors.surface,
                      borderRadius: radii.lg,
                      padding: spacing.lg,
                      borderWidth: 1,
                      borderColor: colors.borderSubtle,
                      marginBottom: spacing.md,
                      opacity: rev.status === 'draft' ? 0.7 : 1,
                    }}
                  >
                    {/* Revision Header */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md }}>
                      <View>
                        <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>
                          Revision #{rev.revision_number}
                        </Text>
                        <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: 2 }}>
                          {formatDate(rev.created_at)}
                        </Text>
                      </View>
                      <View
                        style={{
                          paddingHorizontal: spacing.md,
                          paddingVertical: spacing.xs,
                          borderRadius: radii.full,
                          backgroundColor: getStatusBg(displayStatus),
                        }}
                      >
                        <Text style={{ ...typography.captionBold, color: getStatusColor(displayStatus), textTransform: 'uppercase' }}>
                          {quoteStatusLabel(displayStatus)}
                        </Text>
                      </View>
                    </View>

                    {/* Amount */}
                    {rev.quote_amount && (
                      <View style={{ marginBottom: spacing.md }}>
                        <Text style={{ ...typography.caption, color: colors.textMuted }}>Amount</Text>
                        <Text style={{ ...typography.titleLarge, color: colors.textPrimary }}>
                          R{rev.quote_amount.toLocaleString()}
                        </Text>
                      </View>
                    )}

                    {/* Description Preview */}
                    {rev.description && (
                      <View style={{ marginBottom: spacing.sm }}>
                        <Text style={{ ...typography.caption, color: colors.textMuted }}>Description</Text>
                        <Text style={{ ...typography.body, color: colors.textSecondary }} numberOfLines={isExpanded ? undefined : 2}>
                          {rev.description}
                        </Text>
                      </View>
                    )}

                    {/* Expand/Collapse Button */}
                    {(rev.terms || rev.notes || rev.client_notes || revisionComments.length > 0) && (
                      <TouchableOpacity
                        onPress={() => setExpandedRevision(isExpanded ? null : rev.id)}
                        style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm }}
                      >
                        <Text style={{ ...typography.caption, color: colors.primary }}>
                          {isExpanded ? 'Show Less' : 'Show More'}
                        </Text>
                        <MaterialIcons
                          name={isExpanded ? 'expand-less' : 'expand-more'}
                          size={18}
                          color={colors.primary}
                        />
                      </TouchableOpacity>
                    )}

                    {/* Expanded Details */}
                    {isExpanded && (
                      <View style={{ marginTop: spacing.md }}>
                        {rev.terms && (
                          <View style={{ marginBottom: spacing.md }}>
                            <Text style={{ ...typography.caption, color: colors.textMuted }}>Terms</Text>
                            <Text style={{ ...typography.body, color: colors.textSecondary }}>{rev.terms}</Text>
                          </View>
                        )}

                        {rev.validity_days && (
                          <View style={{ marginBottom: spacing.md }}>
                            <Text style={{ ...typography.caption, color: colors.textMuted }}>Validity</Text>
                            <Text style={{ ...typography.body, color: colors.textSecondary }}>
                              {rev.validity_days} days
                            </Text>
                          </View>
                        )}

                        {rev.notes && (
                          <View
                            style={{
                              marginBottom: spacing.md,
                              padding: spacing.sm,
                              backgroundColor: '#F3F4F6',
                              borderRadius: radii.md,
                              borderLeftWidth: 3,
                              borderLeftColor: colors.textMuted,
                            }}
                          >
                            <Text style={{ ...typography.caption, color: colors.textMuted }}>Internal Notes</Text>
                            <Text style={{ ...typography.body, color: colors.textSecondary }}>{rev.notes}</Text>
                          </View>
                        )}

                        {rev.client_notes && (
                          <View
                            style={{
                              marginBottom: spacing.md,
                              padding: spacing.sm,
                              backgroundColor: '#FEF3C7',
                              borderRadius: radii.md,
                              borderLeftWidth: 3,
                              borderLeftColor: '#D97706',
                            }}
                          >
                            <Text style={{ ...typography.captionSemiBold, color: '#92400E' }}>Client Feedback</Text>
                            <Text style={{ ...typography.body, color: colors.textSecondary }}>{rev.client_notes}</Text>
                            {rev.responded_at && (
                              <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: 2 }}>
                                {formatDate(rev.responded_at)}
                              </Text>
                            )}
                          </View>
                        )}

                        {rev.attachments && rev.attachments.length > 0 && (
                          <View style={{ marginBottom: spacing.md }}>
                            <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm }}>
                              Attachments ({rev.attachments.length})
                            </Text>
                            {rev.attachments.map((attachment, idx) => (
                              <TouchableOpacity
                                key={idx}
                                onPress={() => {
                                  if (attachment.url) {
                                    Linking.openURL(attachment.url).catch(() => {
                                      setAlertState({ visible: true, title: 'Error', message: 'Could not open attachment' });
                                    });
                                  }
                                }}
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  padding: spacing.sm,
                                  backgroundColor: '#FEE2E2',
                                  borderRadius: radii.md,
                                  marginBottom: spacing.xs,
                                  borderLeftWidth: 3,
                                  borderLeftColor: '#DC2626',
                                }}
                              >
                                <MaterialIcons name="picture-as-pdf" size={18} color="#DC2626" />
                                <Text
                                  style={{
                                    ...typography.body,
                                    color: colors.textPrimary,
                                    marginLeft: spacing.sm,
                                    flex: 1,
                                  }}
                                  numberOfLines={1}
                                >
                                  {attachment.name || 'Attachment'}
                                </Text>
                                <MaterialIcons name="open-in-new" size={16} color={colors.textMuted} />
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}

                        {/* Comments */}
                        {revisionComments.length > 0 && (
                          <View style={{ marginTop: spacing.md }}>
                            <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm }}>
                              Comments ({revisionComments.length})
                            </Text>
                            {revisionComments.map((comment) => (
                              <View
                                key={comment.id}
                                style={{
                                  padding: spacing.sm,
                                  backgroundColor: comment.is_internal ? '#F3F4F6' : '#F0F9FF',
                                  borderRadius: radii.md,
                                  marginBottom: spacing.xs,
                                  borderLeftWidth: 2,
                                  borderLeftColor: comment.is_internal ? colors.textMuted : colors.primary,
                                }}
                              >
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                  <Text style={{ ...typography.captionSemiBold, color: colors.textSecondary }}>
                                    {comment.author_type === 'vendor' ? 'You' : 'Client'}
                                    {comment.is_internal && ' (Internal)'}
                                  </Text>
                                  <Text style={{ ...typography.caption, color: colors.textMuted }}>
                                    {new Date(comment.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
                                  </Text>
                                </View>
                                <Text style={{ ...typography.body, color: colors.textPrimary, marginTop: 2 }}>
                                  {comment.message}
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    )}

                    {/* Action Buttons */}
                    {rev.status === 'draft' && index === 0 && (
                      <TouchableOpacity
                        onPress={() =>
                          navigation.navigate('VendorQuoteCreate', { quoteRequestId })
                        }
                        style={{
                          marginTop: spacing.md,
                          paddingVertical: spacing.sm,
                          borderRadius: radii.md,
                          borderWidth: 1,
                          borderColor: colors.primary,
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ ...typography.bodyBold, color: colors.primary }}>
                          Continue Editing Draft
                        </Text>
                      </TouchableOpacity>
                    )}

                    {(rev.status === 'rejected' || quoteRequestStatus === 'amended') && index === 0 && (
                      <TouchableOpacity
                        onPress={() =>
                          navigation.navigate('VendorQuoteCreate', { quoteRequestId })
                        }
                        style={{
                          marginTop: spacing.md,
                          paddingVertical: spacing.sm,
                          borderRadius: radii.md,
                          backgroundColor: colors.primary,
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ ...typography.bodyBold, color: '#FFFFFF' }}>
                          Submit Revised Quote
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>

            {revisions.length === 0 && (
              <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xl, alignItems: 'center' }}>
                <MaterialIcons name="history" size={48} color={colors.textMuted} />
                <Text style={{ ...typography.body, color: colors.textMuted, marginTop: spacing.md, textAlign: 'center' }}>
                  No quote history yet. Create your first quote to see it here.
                </Text>
              </View>
            )}
          </>
        )}
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
    </View>
  );
}
