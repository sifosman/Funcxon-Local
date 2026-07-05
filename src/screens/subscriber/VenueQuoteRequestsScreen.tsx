import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radii, typography } from '../../theme';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../auth/AuthContext';
import ThemedAlert from '../../components/ThemedAlert';
import { quoteStatusLabel } from '../../lib/quoting';
import { getMyVenueEntitlement, isVenueFeatureEnabled } from '../../lib/venueSubscription';
import { createQuoteQuotedNotification } from '../../lib/notifications';
import { useIsDesktop } from '../../hooks/useIsDesktop';

type ProfileStackParamList = {
  UpdateVenuePortfolio: undefined;
  VenueQuoteRequests: undefined;
  VenueListingPlans: undefined;
};

type VenueListingRow = {
  id: number;
  name: string;
};

type QuoteRequestRow = {
  id: number;
  listing_id: number;
  requester_user_id: string | null;
  requester_name: string | null;
  requester_email: string | null;
  requester_phone: string | null;
  contact_phone: string | null;
  event_date: string | null;
  end_date: string | null;
  selected_hall: string | null;
  message: string | null;
  line_items: string | null;
  quoted_amount: number | null;
  response_message: string | null;
  amended_message: string | null;
  status: string;
  created_at: string;
};

type ParsedLineItem = { name: string; quantity: number; price: number; };

const RESPONDABLE_STATUSES = ['pending', 'amended', 'quoted'];

export default function VenueQuoteRequestsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const isDesktop = useIsDesktop();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alertState, setAlertState] = useState<{visible: boolean; title: string; message: string} | null>(null);
  const [respondingId, setRespondingId] = useState<number | null>(null);
  const [responseAmount, setResponseAmount] = useState('');
  const [responseMessage, setResponseMessage] = useState('');

  const [listing, setListing] = useState<VenueListingRow | null>(null);
  const [requests, setRequests] = useState<QuoteRequestRow[]>([]);
  const [canUseQuotes, setCanUseQuotes] = useState<boolean>(false);

  const loadEntitlement = useCallback(async () => {
    if (!user?.id) return;
    const ent = await getMyVenueEntitlement(user.id);
    setCanUseQuotes(isVenueFeatureEnabled(ent, 'quote_requests'));
  }, [user?.id]);

  const loadListingAndRequests = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data: listingRow } = await supabase
        .from('venue_listings')
        .select('id, name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!listingRow) {
        setListing(null);
        setRequests([]);
        return;
      }

      setListing({ id: listingRow.id, name: listingRow.name });

      const { data: reqRows, error: reqErr } = await supabase
        .from('venue_quote_requests')
        .select('id, listing_id, requester_user_id, requester_name, requester_email, requester_phone, contact_phone, event_date, end_date, selected_hall, message, line_items, quoted_amount, response_message, amended_message, status, created_at')
        .eq('listing_id', listingRow.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (reqErr) {
        console.error('Failed to load venue quote requests:', reqErr);
        setRequests([]);
        return;
      }

      setRequests((reqRows || []) as QuoteRequestRow[]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadEntitlement();
    loadListingAndRequests();
  }, [loadEntitlement, loadListingAndRequests]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const statusColor = useMemo(() => {
    return (status: string) => {
      switch (status) {
        case 'pending':
          return '#3B82F6';
        case 'quoted':
          return '#0369A1';
        case 'amended':
          return '#D97706';
        case 'accepted':
          return '#16A34A';
        case 'finalised':
          return '#166534';
        case 'rejected':
          return '#DC2626';
        case 'cancelled':
          return colors.textMuted;
        default:
          return colors.textMuted;
      }
    };
  }, []);

  const parseLineItems = (row: QuoteRequestRow): ParsedLineItem[] => {
    if (!row.line_items) return [];
    try {
      const parsed = JSON.parse(row.line_items);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => ({
          name: String(item.name ?? ''),
          quantity: Number(item.quantity) || 1,
          price: Number(item.price) || 0,
        }));
      }
    } catch {
      // ignore
    }
    return [];
  };

  const updateStatus = async (req: QuoteRequestRow, status: string) => {
    setSaving(true);
    try {
      const update: any = { status };
      if (status === 'finalised') update.finalised_at = new Date().toISOString();
      if (status === 'rejected') update.rejected_at = new Date().toISOString();
      if (status === 'cancelled') update.cancelled_at = new Date().toISOString();
      const { error } = await supabase.from('venue_quote_requests').update(update).eq('id', req.id);
      if (error) throw error;
      setRequests((prev) => prev.map((r) => (r.id === req.id ? { ...r, status } : r)));
    } catch (err: any) {
      setAlertState({ visible: true, title: 'Error', message: err?.message ?? 'Failed to update status.' });
    } finally {
      setSaving(false);
    }
  };

  const startRespond = (req: QuoteRequestRow) => {
    setRespondingId(req.id);
    setResponseAmount(req.quoted_amount?.toString() ?? '');
    setResponseMessage(req.amended_message ?? req.response_message ?? '');
  };

  const cancelRespond = () => {
    setRespondingId(null);
    setResponseAmount('');
    setResponseMessage('');
  };

  const submitResponse = async (req: QuoteRequestRow) => {
    if (!responseAmount.trim() || isNaN(Number(responseAmount)) || Number(responseAmount) <= 0) {
      setAlertState({ visible: true, title: 'Invalid Amount', message: 'Please enter a valid quote amount.' });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('venue_quote_requests').update({
        status: 'quoted',
        quoted_amount: Number(responseAmount),
        response_message: responseMessage.trim() || null,
      }).eq('id', req.id);
      if (error) throw error;
      setRequests((prev) => prev.map((r) => (r.id === req.id ? { ...r, status: 'quoted', quoted_amount: Number(responseAmount), response_message: responseMessage.trim() || null } : r)));
      cancelRespond();
      // In-app notification for the requester
      if (req.requester_user_id) {
        await createQuoteQuotedNotification(req.requester_user_id, listing?.name || 'Venue', req.id, true).catch(() => {});
      }
      // Send notification to client
      await supabase.functions.invoke('send-quote-notifications', {
        body: {
          type: 'quote-created-client',
          quoteRequestId: req.id,
          clientName: req.requester_name,
          clientEmail: req.requester_email,
          vendorBusinessName: listing?.name,
          quoteAmount: Number(responseAmount),
          quoteDescription: responseMessage.trim() || undefined,
          isVenue: true,
        },
      });
    } catch (err: any) {
      setAlertState({ visible: true, title: 'Error', message: err?.message ?? 'Failed to send quote.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ ...typography.body, color: colors.textMuted, marginTop: spacing.md }}>Loading quote requests...</Text>
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

  const renderHeader = (isDesktopHeader: boolean, subtitle: string) => (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={isDesktopHeader ? { ...typography.labelMd, color: colors.dustyRose, textTransform: 'uppercase', marginBottom: spacing.sm } as any : { display: 'none' } as any}>
        Quotes
      </Text>
      <Text style={isDesktopHeader ? { ...typography.headlineMd, color: colors.primary } as any : { ...typography.displayMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
        Quote Requests
      </Text>
      <Text style={{ ...typography.bodyMd, color: isDesktopHeader ? colors.onSurfaceVariant : colors.textMuted }}>
        {subtitle}
      </Text>
    </View>
  );

  if (!canUseQuotes) {
    return (
      <View style={{ flex: 1, backgroundColor: isDesktop ? colors.surfaceBg : colors.background }}>
        <ScrollView contentContainerStyle={isDesktop ? { ...desktopContainerStyle, paddingBottom: spacing.xxl } as any : { paddingBottom: spacing.xl }}>
          <View style={{ paddingHorizontal: isDesktop ? 0 : spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md }}>
            {!isDesktop && (
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}
              >
                <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
                <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>Back</Text>
              </TouchableOpacity>
            )}

            {renderHeader(isDesktop, 'This feature is available on paid venue plans.')}
          </View>

          <View style={{ paddingHorizontal: isDesktop ? 0 : spacing.lg }}>
            <View
              style={{
                backgroundColor: '#FFF7ED',
                borderRadius: radii.lg,
                padding: spacing.lg,
                borderWidth: 1,
                borderColor: '#FDBA74',
              }}
            >
              <Text style={{ ...typography.titleMedium, color: '#9A3412', marginBottom: spacing.sm }}>
                Upgrade required
              </Text>
              <Text style={{ ...typography.bodyMd, color: '#9A3412', marginBottom: spacing.md }}>
                Upgrade your venue plan to receive and manage online quote requests.
              </Text>

              <TouchableOpacity
                onPress={() => navigation.navigate('VenueListingPlans')}
                style={{
                  paddingVertical: spacing.sm,
                  borderRadius: radii.md,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                }}
              >
                <Text style={{ ...typography.bodyBold, color: '#FFFFFF' }}>View Venue Plans</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={{ flex: 1, backgroundColor: isDesktop ? colors.surfaceBg : colors.background }}>
        <ScrollView contentContainerStyle={isDesktop ? { ...desktopContainerStyle, paddingBottom: spacing.xxl } as any : { paddingBottom: spacing.xl }}>
          <View style={{ paddingHorizontal: isDesktop ? 0 : spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md }}>
            {!isDesktop && (
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}
              >
                <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
                <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>Back</Text>
              </TouchableOpacity>
            )}

            {renderHeader(isDesktop, 'Create your venue listing first.')}
          </View>

          <View style={{ paddingHorizontal: isDesktop ? 0 : spacing.lg }}>
            <View
              style={{
                backgroundColor: cardSurface,
                borderRadius: radii.lg,
                padding: spacing.lg,
                borderWidth: 1,
                borderColor: cardBorder,
              }}
            >
              <Text style={{ ...typography.bodyMd, color: colors.textPrimary }}>
                You don’t have a venue listing yet. Please create it in “Update Venue Portfolio” before managing quote requests.
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('UpdateVenuePortfolio')}
                style={{
                  marginTop: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: colors.primary,
                  alignItems: 'center',
                }}
              >
                <Text style={{ ...typography.bodyBold, color: colors.primary }}>Go to Update Venue Portfolio</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  const renderRequestCard = (req: QuoteRequestRow) => (
    <View
      key={req.id}
      style={{
        backgroundColor: cardSurface,
        borderRadius: radii.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: cardBorder,
        marginBottom: spacing.md,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, paddingRight: spacing.md }}>
          <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textPrimary, fontWeight: '600' } as any : { ...typography.titleMedium, color: colors.textPrimary }}>
            {req.requester_name || 'New Request'}
          </Text>
          <Text style={isDesktop ? { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: spacing.xs } as any : { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs }}>
            Requested: {formatDate(req.created_at)}
          </Text>
          {req.event_date ? (
            <Text style={isDesktop ? { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: spacing.xs } as any : { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs }}>
              Event date: {formatDate(req.event_date)}
            </Text>
          ) : null}
        </View>

        <View
          style={{
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.xs,
            borderRadius: radii.full,
            backgroundColor: statusColor(req.status) + '20',
          }}
        >
          <Text
            style={{
              ...typography.captionBold,
              color: statusColor(req.status),
              textTransform: 'uppercase',
            }}
          >
            {quoteStatusLabel(req.status)}
          </Text>
        </View>
      </View>

      {(req.requester_email || req.contact_phone || req.requester_phone) && (
        <View style={{ marginTop: spacing.md }}>
          {req.requester_email ? (
            <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textPrimary } as any : { ...typography.body, color: colors.textPrimary }}>
              Email: {req.requester_email}
            </Text>
          ) : null}
          {(req.contact_phone || req.requester_phone) ? (
            <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textPrimary, marginTop: spacing.xs } as any : { ...typography.body, color: colors.textPrimary, marginTop: spacing.xs }}>
              Phone: {req.contact_phone || req.requester_phone}
            </Text>
          ) : null}
        </View>
      )}

      {req.selected_hall ? (
        <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textPrimary, marginTop: spacing.xs } as any : { ...typography.body, color: colors.textPrimary, marginTop: spacing.xs }}>
          Hall: {req.selected_hall}
        </Text>
      ) : null}

      {req.end_date ? (
        <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textPrimary, marginTop: spacing.xs } as any : { ...typography.body, color: colors.textPrimary, marginTop: spacing.xs }}>
          End date: {formatDate(req.end_date)}
        </Text>
      ) : null}

      {req.message ? (
        <View style={{ marginTop: spacing.md }}>
          <Text style={{ ...typography.caption, color: colors.textMuted }}>Additional comments/requests/enquiries</Text>
          <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textPrimary, marginTop: spacing.xs } as any : { ...typography.body, color: colors.textPrimary, marginTop: spacing.xs }}>
            {req.message}
          </Text>
        </View>
      ) : null}

      {parseLineItems(req).length > 0 && (
        <View style={{ marginTop: spacing.md }}>
          <Text style={{ ...typography.caption, color: colors.textMuted }}>Requested Items</Text>
          {parseLineItems(req).map((item, idx) => (
            <Text key={idx} style={isDesktop ? { ...typography.bodyMd, color: colors.textPrimary, marginTop: spacing.xs } as any : { ...typography.body, color: colors.textPrimary, marginTop: spacing.xs }}>
              {item.name} x{item.quantity} — R{(item.quantity * item.price).toLocaleString('en-ZA')}
            </Text>
          ))}
        </View>
      )}

      {typeof req.quoted_amount === 'number' && (
        <View style={{ marginTop: spacing.md }}>
          <Text style={{ ...typography.caption, color: colors.textMuted }}>Quoted Amount</Text>
          <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textPrimary, marginTop: spacing.xs, fontWeight: '600' } as any : { ...typography.titleMedium, color: colors.textPrimary, marginTop: spacing.xs }}>
            R {req.quoted_amount.toLocaleString('en-ZA')}
          </Text>
        </View>
      )}

      {req.amended_message ? (
        <View style={{ marginTop: spacing.md, padding: spacing.sm, backgroundColor: '#FEF3C7', borderRadius: radii.md, borderLeftWidth: 3, borderLeftColor: '#D97706' }}>
          <Text style={{ ...typography.captionSemiBold, color: '#92400E' }}>Amendment Request</Text>
          <Text style={{ ...typography.body, color: '#92400E', marginTop: 2 }}>{req.amended_message}</Text>
        </View>
      ) : null}

      {req.response_message ? (
        <View style={{ marginTop: spacing.md, padding: spacing.sm, backgroundColor: '#F0F9FF', borderRadius: radii.md, borderLeftWidth: 3, borderLeftColor: colors.primary }}>
          <Text style={{ ...typography.captionSemiBold, color: colors.primary }}>Your Response</Text>
          <Text style={{ ...typography.body, color: colors.primary, marginTop: 2 }}>{req.response_message}</Text>
        </View>
      ) : null}

      {respondingId === req.id ? (
        <View style={{ marginTop: spacing.md }}>
          <Text style={{ ...typography.caption, color: colors.textMuted }}>Quote Amount (R)</Text>
          <TextInput
            value={responseAmount}
            onChangeText={setResponseAmount}
            placeholder="e.g. 5000"
            keyboardType="numeric"
            style={{
              borderWidth: 1,
              borderColor: cardBorder,
              borderRadius: radii.md,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.sm,
              backgroundColor: colors.surfaceMuted,
              color: colors.textPrimary,
              marginTop: spacing.xs,
            }}
          />
          <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.sm }}>Response / Notes</Text>
          <TextInput
            value={responseMessage}
            onChangeText={setResponseMessage}
            placeholder="Add any notes..."
            multiline
            numberOfLines={3}
            style={{
              borderWidth: 1,
              borderColor: cardBorder,
              borderRadius: radii.md,
              paddingHorizontal: spacing.sm,
              paddingVertical: spacing.sm,
              backgroundColor: colors.surfaceMuted,
              color: colors.textPrimary,
              minHeight: 70,
              textAlignVertical: 'top',
              marginTop: spacing.xs,
            }}
          />
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
            <TouchableOpacity
              onPress={() => submitResponse(req)}
              disabled={saving}
              style={{
                flex: 1,
                paddingVertical: spacing.sm,
                borderRadius: radii.md,
                backgroundColor: colors.primary,
                alignItems: 'center',
                opacity: saving ? 0.6 : 1,
              }}
            >
              <Text style={{ ...typography.bodyBold, color: '#FFFFFF' }}>
                {saving ? 'Saving...' : 'Send Quote'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={cancelRespond}
              style={{
                flex: 1,
                paddingVertical: spacing.sm,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: cardBorder,
                alignItems: 'center',
              }}
            >
              <Text style={{ ...typography.body, color: colors.textSecondary }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={{ marginTop: spacing.md, gap: spacing.sm }}>
          {RESPONDABLE_STATUSES.includes(req.status) && (
            <TouchableOpacity
              onPress={() => startRespond(req)}
              disabled={saving}
              style={{
                paddingVertical: spacing.sm,
                borderRadius: radii.md,
                backgroundColor: colors.primary,
                alignItems: 'center',
                opacity: saving ? 0.6 : 1,
              }}
            >
              <Text style={{ ...typography.bodyBold, color: '#FFFFFF' }}>
                {req.status === 'amended' ? 'Resubmit Revised Quote' : 'Respond with Quote'}
              </Text>
            </TouchableOpacity>
          )}
          {req.status === 'accepted' && (
            <TouchableOpacity
              onPress={() => updateStatus(req, 'finalised')}
              disabled={saving}
              style={{
                paddingVertical: spacing.sm,
                borderRadius: radii.md,
                backgroundColor: '#16A34A',
                alignItems: 'center',
                opacity: saving ? 0.6 : 1,
              }}
            >
              <Text style={{ ...typography.bodyBold, color: '#FFFFFF' }}>Mark Finalised</Text>
            </TouchableOpacity>
          )}
          {(req.status === 'pending' || req.status === 'quoted' || req.status === 'amended') && (
            <TouchableOpacity
              onPress={() => updateStatus(req, 'cancelled')}
              disabled={saving}
              style={{
                paddingVertical: spacing.sm,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: colors.destructive,
                alignItems: 'center',
                opacity: saving ? 0.6 : 1,
              }}
            >
              <Text style={{ ...typography.bodyBold, color: colors.destructive }}>Cancel Request</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View
      style={{
        backgroundColor: cardSurface,
        borderRadius: radii.lg,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: cardBorder,
        alignItems: 'center',
      }}
    >
      <MaterialIcons name="request-quote" size={48} color={colors.textMuted} />
      <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textMuted, marginTop: spacing.md, textAlign: 'center' } as any : { ...typography.body, color: colors.textMuted, marginTop: spacing.md, textAlign: 'center' }}>
        No quote requests yet.
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: isDesktop ? colors.surfaceBg : colors.background }}>
      <ScrollView contentContainerStyle={isDesktop ? { ...desktopContainerStyle, paddingBottom: spacing.xxl } as any : { paddingBottom: spacing.xl }}>
        {isDesktop ? (
          <>
            {renderHeader(true, listing.name)}
            <View style={{ flexDirection: 'row', gap: spacing.gutter } as any}>
              <View style={{ flex: 2 } as any}>
                <View style={{ backgroundColor: cardSurface, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: cardBorder }}>
                  <Text style={{ ...typography.headlineSm, color: colors.textPrimary, marginBottom: spacing.md }}>
                    Requests
                  </Text>
                  {requests.length === 0 ? renderEmptyState() : requests.map(renderRequestCard)}
                </View>
              </View>
              <View style={{ flex: 1 } as any}>
                <View style={{ backgroundColor: cardSurface, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: cardBorder }}>
                  <Text style={{ ...typography.headlineSm, color: colors.textPrimary, marginBottom: spacing.sm }}>
                    Overview
                  </Text>
                  <Text style={{ ...typography.bodyMd, color: colors.onSurfaceVariant } as any}>
                    {requests.length} request{requests.length === 1 ? '' : 's'} for {listing.name}
                  </Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          <>
            <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md }}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}
              >
                <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
                <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>Back</Text>
              </TouchableOpacity>

              {renderHeader(false, listing.name)}
            </View>

            <View style={{ paddingHorizontal: spacing.lg }}>
              {requests.length === 0 ? renderEmptyState() : requests.map(renderRequestCard)}
            </View>
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
