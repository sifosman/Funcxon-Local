import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { supabase } from '../lib/supabaseClient';
import { colors, spacing, radii, typography } from '../theme';
import { useAuth } from '../auth/AuthContext';
import ThemedAlert from '../components/ThemedAlert';
import { useIsDesktop } from '../hooks/useIsDesktop';

type QuotesStackParamList = {
  QuoteHistory: { quoteRequestId: number };
  QuoteResponse: {
    revisionId: number;
    quoteRequestId: number;
    vendorName?: string;
    amount?: number;
    description?: string;
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
  client_notes: string | null;
  responded_at: string | null;
  created_at: string;
};

type QuoteComment = {
  id: number;
  quote_revision_id: number;
  author_type: string;
  message: string;
  created_at: string;
};

type VendorInfo = {
  name: string | null;
};

export default function QuoteHistoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<QuotesStackParamList>>();
  const route = useRoute<RouteProp<QuotesStackParamList, 'QuoteHistory'>>();
  const { user } = useAuth();
  const isDesktop = useIsDesktop();
  const { quoteRequestId } = route.params;

  const [loading, setLoading] = useState(true);
  const [revisions, setRevisions] = useState<QuoteRevision[]>([]);
  const [vendor, setVendor] = useState<VendorInfo | null>(null);
  const [comments, setComments] = useState<Record<number, QuoteComment[]>>({});
  const [expandedRevision, setExpandedRevision] = useState<number | null>(null);
  const [alertState, setAlertState] = useState<{visible: boolean; title: string; message: string} | null>(null);

  const loadHistory = useCallback(async () => {
    if (!user?.id) return;

    try {
      // Get internal user ID
      const { data: internalUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (!internalUser) {
        setAlertState({ visible: true, title: 'Error', message: 'User not found' });
        return;
      }

      // Get quote request to verify ownership and get vendor info
      const { data: quoteRequest } = await supabase
        .from('quote_requests')
        .select('vendor_id, user_id')
        .eq('id', quoteRequestId)
        .maybeSingle();

      if (!quoteRequest || quoteRequest.user_id !== internalUser.id) {
        setAlertState({ visible: true, title: 'Error', message: 'Quote request not found' });
        return;
      }

      // Get vendor info
      const { data: vendorData } = await supabase
        .from('vendors')
        .select('name')
        .eq('id', quoteRequest.vendor_id)
        .maybeSingle();

      if (vendorData) {
        setVendor(vendorData as VendorInfo);
      }

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

  const isExpired = (revision: QuoteRevision) => {
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

  const renderRevisionCard = (rev: QuoteRevision, index: number) => {
    const expired = isExpired(rev);
    const displayStatus = expired && rev.status === 'sent' ? 'expired' : rev.status;
    const isExpanded = expandedRevision === rev.id;
    const revisionComments = comments[rev.id] || [];
    return (
      <View
        key={rev.id}
        style={{
          backgroundColor: isDesktop ? colors.surfaceContainerLowest : colors.surface,
          borderRadius: radii.lg,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: isDesktop ? colors.outlineVariant : colors.borderSubtle,
          marginBottom: spacing.md,
          width: isDesktop ? 'calc(50% - 12px)' : '100%',
          opacity: rev.status === 'draft' ? 0.7 : 1,
        } as any}
      >
        {/* Revision Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md }}>
          <View>
            <Text style={isDesktop ? { ...typography.headlineSm, color: colors.textPrimary } : { ...typography.titleMedium, color: colors.textPrimary }}>
              Revision #{rev.revision_number}
            </Text>
            <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textMuted, marginTop: 2 } : { ...typography.caption, color: colors.textMuted, marginTop: 2 }}>
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
              {displayStatus}
            </Text>
          </View>
        </View>

        {/* Amount */}
        {rev.quote_amount && (
          <View style={{ marginBottom: spacing.md }}>
            <Text style={isDesktop ? { ...typography.labelMd, color: colors.textMuted } : { ...typography.caption, color: colors.textMuted }}>Amount</Text>
            <Text style={isDesktop ? { ...typography.headlineSm, color: colors.textPrimary } : { ...typography.titleLarge, color: colors.textPrimary }}>
              R{rev.quote_amount.toLocaleString()}
            </Text>
          </View>
        )}

        {/* Description */}
        {rev.description && (
          <View style={{ marginBottom: spacing.sm }}>
            <Text style={isDesktop ? { ...typography.labelMd, color: colors.textMuted } : { ...typography.caption, color: colors.textMuted }}>Description</Text>
            <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textSecondary } : { ...typography.body, color: colors.textSecondary }} numberOfLines={isExpanded ? undefined : 2}>
              {rev.description}
            </Text>
          </View>
        )}

        {/* Expand Button */}
        {(rev.terms || rev.client_notes || revisionComments.length > 0) && (
          <TouchableOpacity
            onPress={() => setExpandedRevision(isExpanded ? null : rev.id)}
            style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm }}
          >
            <Text style={{ ...typography.caption, color: colors.primary }}>
              {isExpanded ? 'Show Less' : 'Show More'}
            </Text>
            <MaterialIcons name={isExpanded ? 'expand-less' : 'expand-more'} size={18} color={colors.primary} />
          </TouchableOpacity>
        )}

        {/* Expanded Details */}
        {isExpanded && (
          <View style={{ marginTop: spacing.md }}>
            {rev.terms && (
              <View style={{ marginBottom: spacing.md }}>
                <Text style={isDesktop ? { ...typography.labelMd, color: colors.textMuted } : { ...typography.caption, color: colors.textMuted }}>Terms</Text>
                <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textSecondary } : { ...typography.body, color: colors.textSecondary }}>{rev.terms}</Text>
              </View>
            )}

            {rev.validity_days && (
              <View style={{ marginBottom: spacing.md }}>
                <Text style={isDesktop ? { ...typography.labelMd, color: colors.textMuted } : { ...typography.caption, color: colors.textMuted }}>Validity</Text>
                <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textSecondary } : { ...typography.body, color: colors.textSecondary }}>{rev.validity_days} days</Text>
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
                <Text style={{ ...typography.captionSemiBold, color: '#92400E' }}>Your Feedback</Text>
                <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textSecondary } : { ...typography.body, color: colors.textSecondary }}>{rev.client_notes}</Text>
                {rev.responded_at && (
                  <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textMuted, marginTop: 2 } : { ...typography.caption, color: colors.textMuted, marginTop: 2 }}>
                    {formatDate(rev.responded_at)}
                  </Text>
                )}
              </View>
            )}

            {/* Comments */}
            {revisionComments.length > 0 && (
              <View style={{ marginTop: spacing.md }}>
                <Text style={isDesktop ? { ...typography.labelMd, color: colors.textMuted, marginBottom: spacing.sm } : { ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm }}>
                  Comments ({revisionComments.length})
                </Text>
                {revisionComments.map((comment) => (
                  <View
                    key={comment.id}
                    style={{
                      padding: spacing.sm,
                      backgroundColor: comment.author_type === 'vendor' ? '#F0F9FF' : '#FFFFFF',
                      borderRadius: radii.md,
                      marginBottom: spacing.xs,
                      borderLeftWidth: 2,
                      borderLeftColor: comment.author_type === 'vendor' ? colors.primary : '#D97706',
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ ...typography.captionSemiBold, color: colors.textSecondary }}>
                        {comment.author_type === 'vendor' ? vendor?.name || 'Vendor' : 'You'}
                      </Text>
                      <Text style={{ ...typography.caption, color: colors.textMuted }}>
                        {new Date(comment.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </Text>
                    </View>
                    <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textPrimary, marginTop: 2 } : { ...typography.body, color: colors.textPrimary, marginTop: 2 }}>
                      {comment.message}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Action Button for Pending Quotes */}
        {rev.status === 'sent' && !expired && (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('QuoteResponse', {
                revisionId: rev.id,
                quoteRequestId,
                vendorName: vendor?.name || undefined,
                amount: rev.quote_amount || undefined,
                description: rev.description || undefined,
              })
            }
            style={{
              marginTop: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: radii.md,
              backgroundColor: colors.primary,
              alignItems: 'center',
            }}
          >
            <Text style={{ ...typography.bodyBold, color: '#FFFFFF' }}>Review & Respond</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDesktop ? colors.surfaceBg : colors.background }}>
      <ScrollView
        contentContainerStyle={isDesktop ? { paddingBottom: spacing.xl, paddingHorizontal: 48, maxWidth: 1200, width: '100%', alignSelf: 'center' } : { paddingBottom: spacing.xl }}
      >
        {/* Header */}
        <View style={isDesktop ? { paddingTop: spacing.sm, paddingBottom: spacing.md } : { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md }}>
          {isDesktop ? null : (
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
              <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
              <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>Back</Text>
            </TouchableOpacity>
          )}

          {isDesktop ? (
            <View style={{ marginBottom: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <View>
                <Text style={{ ...typography.labelMd, color: colors.dustyRose, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.05 }}>
                  Quote History
                </Text>
                <Text style={{ ...typography.headlineMd, color: colors.primary }}>
                  {vendor?.name || 'Vendor'} - {revisions.length} revision{revisions.length !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          ) : (
            <>
              <Text style={{ ...typography.displayMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
                Quote History
              </Text>
              <Text style={{ ...typography.body, color: colors.textMuted }}>
                {vendor?.name || 'Vendor'} - {revisions.length} revision{revisions.length !== 1 ? 's' : ''}
              </Text>
            </>
          )}
        </View>

        {/* Revisions List */}
        <View style={isDesktop ? { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.gutter } as any : { paddingHorizontal: spacing.lg }}>
          {revisions.map((rev, index) => renderRevisionCard(rev, index))}
        </View>

        {revisions.length === 0 && (
          <View style={isDesktop ? { paddingTop: spacing.xl, alignItems: 'center' } : { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, alignItems: 'center' }}>
            <MaterialIcons name="history" size={48} color={colors.textMuted} />
            <Text style={{ ...typography.body, color: colors.textMuted, marginTop: spacing.md, textAlign: 'center' }}>
              No quote history yet. The vendor hasn't submitted any quotes.
            </Text>
          </View>
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
