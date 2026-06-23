import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';

import { supabase } from '../lib/supabaseClient';
import { colors, spacing, radii, typography } from '../theme';
import type { QuotesStackParamList } from '../navigation/QuotesNavigator';
import { useAuth } from '../auth/AuthContext';
import ThemedAlert from '../components/ThemedAlert';

type QuoteRequest = {
  id: number | string;
  original_id?: number;
  is_venue?: boolean;
  vendor_id: number | null;
  target_id?: number | null;
  target_name?: string | null;
  name: string | null;
  email: string | null;
  status: string | null;
  details?: string | null;
  event_type?: string | null;
  event_date?: string | null;
  budget?: string | null;
  quote_amount?: number | null;
  created_at?: string | null;
  requirements?: string | null;
  notes?: string | null;
};

type VendorSeed = {
  id: number;
  name: string | null;
  description: string | null;
  category_id: number | null;
};

type CategorySeed = {
  id: number;
  name: string | null;
};

export default function QuotesScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'finalised' | 'tours'>('all');
  const [actionLoadingId, setActionLoadingId] = useState<number | string | null>(null);
  const [editingNotesId, setEditingNotesId] = useState<number | string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [alertState, setAlertState] = useState<{visible: boolean; title: string; message: string; buttons?: any[]} | null>(null);

  const { data, isLoading, error, refetch } = useQuery<QuoteRequest[]>({
    queryKey: ['attendee-quotes', user?.id],
    queryFn: async () => {
      console.log('[QuotesScreen] Starting fetch, user.id:', user?.id);
      
      if (!user?.id) {
        console.log('[QuotesScreen] No user.id, returning empty array');
        return [];
      }

      const { data: userRows, error: userError } = await supabase
        .from('users')
        .select('id, username, email')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      console.log('[QuotesScreen] User lookup result:', { userRows, userError });

      if (userError) {
        throw userError;
      }

      let internalUser = userRows ?? null;

      if (!internalUser) {
        const email = user.email ?? 'attendee@funxon.co.za';
        const username = email.split('@')[0] || 'attendee';
        console.log('[QuotesScreen] Creating new user:', { email, username });
        
        const { data: createdUser, error: createError } = await supabase
          .from('users')
          .insert({
            auth_user_id: user.id,
            username,
            password: 'demo',
            email,
            full_name: username,
          })
          .select('id, username, email')
          .single();

        console.log('[QuotesScreen] User creation result:', { createdUser, createError });

        if (!createError && createdUser) {
          internalUser = createdUser;
        }
      }

      if (!internalUser) {
        console.log('[QuotesScreen] No internal user found/created, returning empty array');
        return [];
      }

      console.log('[QuotesScreen] Internal user:', internalUser);

      const { data: vendorSeeds, error: vendorSeedError } = await supabase
        .from('vendors')
        .select('id, name')
        .limit(200);

      if (vendorSeedError) {
        throw vendorSeedError;
      }

      const { data: venueSeeds, error: venueSeedError } = await supabase
        .from('venue_listings')
        .select('id, name')
        .limit(200);

      if (venueSeedError) {
        throw venueSeedError;
      }

      const vendorNameMap = new Map((vendorSeeds ?? []).map((entry: any) => [entry.id, entry.name]));
      const venueNameMap = new Map((venueSeeds ?? []).map((entry: any) => [entry.id, entry.name]));

      const { data: vendorQuotes, error: vendorError } = await supabase
        .from('quote_requests')
        .select('id, vendor_id, name, email, status, details, event_type, event_date, budget, quote_amount, created_at, requirements')
        .eq('user_id', internalUser.id)
        .order('id', { ascending: false })
        .limit(50);

      console.log('[QuotesScreen] Vendor quotes result:', { count: vendorQuotes?.length, vendorError });

      if (vendorError) {
        throw vendorError;
      }

      const { data: venueQuotes, error: venueError } = await supabase
        .from('venue_quote_requests')
        .select('id, listing_id, requester_name, requester_email, status, message, event_date, created_at, line_items')
        .eq('requester_user_id', user.id) // venue requests use the auth.uid
        .order('id', { ascending: false })
        .limit(50);

      console.log('[QuotesScreen] Venue quotes result:', { count: venueQuotes?.length, venueError });

      if (venueError) {
        throw venueError;
      }

      const formattedVendorQuotes: QuoteRequest[] = (vendorQuotes ?? []).map(q => ({
        id: q.id,
        vendor_id: q.vendor_id,
        target_id: q.vendor_id,
        target_name: q.vendor_id ? vendorNameMap.get(q.vendor_id) ?? q.name : q.name,
        name: q.name,
        email: q.email,
        status: q.status,
        details: q.details,
        event_type: q.event_type,
        event_date: q.event_date,
        budget: q.budget,
        quote_amount: q.quote_amount,
        created_at: q.created_at,
        requirements: q.requirements,
        notes: q.requirements,
      }));

      const formattedVenueQuotes: QuoteRequest[] = (venueQuotes ?? []).map(q => ({
        id: `venue-${q.id}`,
        original_id: q.id,
        is_venue: true,
        vendor_id: q.listing_id,
        target_id: q.listing_id,
        target_name: q.listing_id ? venueNameMap.get(q.listing_id) ?? 'Venue' : 'Venue',
        name: q.requester_name,
        email: q.requester_email,
        status: q.status,
        details: q.message,
        event_type: 'Venues',
        event_date: q.event_date,
        budget: null,
        quote_amount: null,
        created_at: q.created_at,
        requirements: null,
        notes: null,
      }));

      const allQuotes = [...formattedVendorQuotes, ...formattedVenueQuotes].sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      });

      console.log('[QuotesScreen] Total quotes:', allQuotes.length, { vendor: formattedVendorQuotes.length, venue: formattedVenueQuotes.length });

      return allQuotes;
    },
    refetchOnMount: 'always',
  });

  // Auto-refresh when screen gains focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const filtered = useMemo(() => {
    if (!data) return [];
    if (activeTab === 'all') return data;
    if (activeTab === 'tours') return data.filter((item) => item.status === 'tour_requested');
    return data.filter((item) => item.status === activeTab);
  }, [data, activeTab]);

  const summary = useMemo(() => {
    const totals = {
      total: 0,
      finalised: 0,
      pending: 0,
      inProgress: 0,
    };
    data?.forEach((quote) => {
      if (quote.status === 'cancelled') return;
      const amount = typeof quote.quote_amount === 'number' ? quote.quote_amount : 0;
      totals.total += amount;
      if (quote.status === 'finalised') {
        totals.finalised += amount;
      } else if (quote.status === 'pending') {
        totals.pending += amount;
      } else if (quote.status === 'in_progress') {
        totals.inProgress += amount;
      }
    });
    return totals;
  }, [data]);

  const statusStyle = (status?: string | null) => {
    switch (status) {
      case 'pending':
        return { backgroundColor: '#EDE7FF', color: '#5B4BBA' };
      case 'quoted':
        return { backgroundColor: '#E0F2FE', color: '#0369A1' };
      case 'finalised':
        return { backgroundColor: '#DCFCE7', color: '#166534' };
      case 'accepted':
        return { backgroundColor: '#DCFCE7', color: '#16A34A' };
      case 'rejected':
        return { backgroundColor: '#FEE2E2', color: '#DC2626' };
      case 'amended':
        return { backgroundColor: '#FFEDD5', color: '#9A3412' };
      case 'in_progress':
        return { backgroundColor: '#FDE68A', color: '#92400E' };
      case 'tour_requested':
        return { backgroundColor: '#E0F2FE', color: '#0369A1' };
      case 'cancelled':
        return { backgroundColor: '#F3F4F6', color: '#6B7280' };
      default:
        return { backgroundColor: '#FEF3C7', color: '#92400E' };
    }
  };

  const formatCurrency = (value: number) => `R ${value.toLocaleString('en-ZA')}`;

  const tabCounts = {
    all: data?.length ?? 0,
    pending: data?.filter((item) => item.status === 'pending').length ?? 0,
    finalised: data?.filter((item) => item.status === 'finalised').length ?? 0,
    tours: data?.filter((item) => item.status === 'tour_requested').length ?? 0,
  };

  const canCancel = (status?: string | null) => {
    return status === 'pending' || status === 'quoted' || status === 'amended' || status === 'in_progress';
  };

  const handleCancel = (quote: QuoteRequest) => {
    if (!canCancel(quote.status)) {
      setAlertState({ visible: true, title: 'Cannot cancel', message: 'This quote cannot be cancelled.' });
      return;
    }
    setAlertState({
      visible: true,
      title: 'Cancel quote request?',
      message: 'The vendor will be notified that this quote request has been cancelled.',
      buttons: [
        { text: 'Keep request', style: 'cancel', onPress: () => setAlertState(null) },
        {
          text: 'Cancel request',
          style: 'destructive',
          onPress: async () => {
            setAlertState(null);
            setActionLoadingId(quote.id);
            try {
              const tableName = quote.is_venue ? 'venue_quote_requests' : 'quote_requests';
              const { data: updatedRows, error: updateError } = await supabase
                .from(tableName)
                .update({ status: 'cancelled' })
                .eq('id', quote.original_id ?? quote.id)
                .select('id');

              if (updateError) throw updateError;
              if (!updatedRows || updatedRows.length === 0) {
                throw new Error('Could not cancel this quote request. You may not have permission to modify it.');
              }
              await refetch();
            } catch (err: any) {
              setAlertState({ visible: true, title: 'Unable to cancel', message: err?.message ?? 'Please try again.' });
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ],
    });
  };

  const handleSecondaryAction = async (quote: QuoteRequest) => {
    const targetId = quote.target_id ?? quote.vendor_id;

    if (!targetId) {
      setAlertState({ visible: true, title: 'Missing listing', message: 'This quote is missing a vendor or venue reference.' });
      return;
    }

    // If a quote has been sent (has quote_amount and status is quoted), navigate to response screen
    if (quote.status === 'quoted' || (typeof quote.quote_amount === 'number' && quote.quote_amount > 0)) {
      // Fetch the latest revision for this quote
      try {
        setActionLoadingId(quote.id);
        const { data: revisions, error: revError } = await supabase
          .from('quote_revisions')
          .select('id, quote_amount, description, status')
          .eq('quote_request_id', quote.original_id ?? quote.id)
          .eq('status', 'sent')
          .order('revision_number', { ascending: false })
          .limit(1);

        if (revError) throw revError;

        const latestRevision = revisions?.[0];
        if (latestRevision) {
          navigation.navigate('QuoteResponse', {
            revisionId: latestRevision.id,
            quoteRequestId: quote.id,
            vendorName: quote.name || undefined,
            amount: latestRevision.quote_amount || undefined,
            description: latestRevision.description || undefined,
          });
        } else {
          // Fallback if no revision found
          setAlertState({ visible: true, title: 'Quote Ready', message: 'A quote has been prepared for you. View details to see more.' });
        }
      } catch (err) {
        console.error('Error fetching revision:', err);
        setAlertState({ visible: true, title: 'Error', message: 'Failed to load quote details' });
      } finally {
        setActionLoadingId(null);
      }
      return;
    }

    if (quote.status === 'finalised' || quote.status === 'accepted') {
      navigation.navigate('Home', quote.is_venue
        ? {
            screen: 'VenueProfile',
            params: { venueId: targetId, from: 'Quotes' },
          }
        : {
            screen: 'VendorProfile',
            params: { vendorId: targetId, from: 'Quotes' },
          });
      return;
    }

    if (quote.status === 'pending') {
      navigation.navigate('Home', {
        screen: 'QuoteRequest',
        params: {
          vendorId: targetId ?? 0,
          vendorName: quote.target_name ?? 'Vendor',
          type: quote.is_venue ? 'venue' : 'vendor',
          editMode: true,
          quoteId: quote.original_id ?? quote.id,
        },
      });
      return;
    }

    if (quote.status === 'amended') {
      setActionLoadingId(quote.id);
      try {
        const { error: updateError } = await supabase
          .from('quote_requests')
          .update({ status: 'finalised' })
          .eq('id', quote.original_id ?? quote.id);

        if (updateError) {
          throw updateError;
        }

        await refetch();
      } catch (err: any) {
        setAlertState({ visible: true, title: 'Unable to approve', message: err?.message ?? 'Please try again.' });
      } finally {
        setActionLoadingId(null);
      }
      return;
    }

    if (quote.status === 'cancelled') {
      setAlertState({ visible: true, title: 'Quote cancelled', message: 'This quote request has been cancelled.' });
      return;
    }

    if (quote.status === 'tour_requested') {
      if (quote.is_venue) {
        navigation.navigate('Home', {
          screen: 'VenueProfile',
          params: { venueId: targetId, from: 'Quotes' },
        });
      } else if (targetId) {
        navigation.navigate('Home', {
          screen: 'VendorProfile',
          params: { vendorId: targetId, from: 'Quotes' },
        });
      }
      return;
    }

    setAlertState({ visible: true, title: 'In progress', message: 'This quote is still being prepared by the vendor.' });
  };

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  if (error instanceof Error) {
    return (
      <View
        style={{
          flex: 1,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.lg,
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>Failed to load quotes.</Text>
        <Text style={{ marginTop: spacing.sm, ...typography.body, color: colors.textMuted }}>{error.message}</Text>
      </View>
    );
  }

  if (!data || data.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.lg,
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <Text style={{ textAlign: 'center', ...typography.body, color: colors.textPrimary }}>
          You have not requested any quotes yet.
        </Text>
        <Text
          style={{
            textAlign: 'center',
            marginTop: spacing.sm,
            ...typography.body,
            color: colors.textMuted,
          }}
        >
          Request a quote from a vendor to see it listed here.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.lg,
        backgroundColor: colors.background,
      }}
    >
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        ListHeaderComponent={
          <View>
            <View>
              <Text style={{ ...typography.displayMedium, color: colors.textPrimary }}>My Quotes</Text>
              <Text style={{ ...typography.body, color: colors.textSecondary, marginTop: spacing.xs }}>
                Track your vendor quotes by status
              </Text>
            </View>

            <View
              style={{
                marginTop: spacing.lg,
                padding: spacing.lg,
                borderRadius: radii.lg,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 3 },
              }}
            >
              <Text style={{ ...typography.bodySemiBold, color: colors.textPrimary, marginBottom: spacing.md }}>
                Quote Summary
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.md }}>
                <View style={{ width: '50%' }}>
                  <Text style={{ ...typography.caption, color: colors.textMuted }}>Total Value</Text>
                  <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>
                    {formatCurrency(summary.total)}
                  </Text>
                </View>
                <View style={{ width: '50%' }}>
                  <Text style={{ ...typography.caption, color: colors.textMuted }}>Finalised</Text>
                  <Text style={{ ...typography.titleMedium, color: '#16A34A' }}>
                    {formatCurrency(summary.finalised)}
                  </Text>
                </View>
                <View style={{ width: '50%' }}>
                  <Text style={{ ...typography.caption, color: colors.textMuted }}>Pending</Text>
                  <Text style={{ ...typography.titleMedium, color: '#4F46E5' }}>
                    {formatCurrency(summary.pending)}
                  </Text>
                </View>
                <View style={{ width: '50%' }}>
                  <Text style={{ ...typography.caption, color: colors.textMuted }}>In Progress</Text>
                  <Text style={{ ...typography.titleMedium, color: '#D97706' }}>
                    {formatCurrency(summary.inProgress)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={{ flexDirection: 'row', columnGap: spacing.sm, marginTop: spacing.lg, marginBottom: spacing.md }}>
              {([
                { key: 'all' as const, label: `All (${tabCounts.all})` },
                { key: 'pending' as const, label: `Pending (${tabCounts.pending})` },
                { key: 'finalised' as const, label: `Finalised (${tabCounts.finalised})` },
                { key: 'tours' as const, label: `Tours (${tabCounts.tours})` },
              ]).map((tab) => {
                const selected = activeTab === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    onPress={() => setActiveTab(tab.key)}
                    style={{
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.xs,
                      borderRadius: radii.full,
                      borderWidth: 1,
                      borderColor: selected ? colors.primary : colors.borderSubtle,
                      backgroundColor: selected ? colors.primary : colors.surface,
                    }}
                  >
                    <Text style={{ ...typography.caption, color: selected ? '#FFFFFF' : colors.textPrimary }}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const requestedDate = item.event_date || item.created_at
            ? new Date(item.event_date || item.created_at || '').toLocaleDateString('en-ZA')
            : null;
          const actionLabel = item.status === 'cancelled'
            ? 'View Details'
            : item.status === 'finalised' || item.status === 'accepted'
              ? 'Rate and Review'
              : item.status === 'quoted' || (typeof item.quote_amount === 'number' && item.quote_amount > 0)
                ? 'Review & Accept'
                : item.status === 'amended'
                  ? 'Approve'
                  : item.status === 'pending'
                    ? 'Amend'
                    : item.status === 'tour_requested'
                      ? 'Contact Venue'
                      : 'View Details';
          const actionLoading = actionLoadingId === item.id;
          return (
            <View
              style={{
                marginBottom: spacing.md,
                padding: spacing.lg,
                borderRadius: radii.lg,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                shadowColor: '#000',
                shadowOpacity: 0.06,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 4 },
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1, paddingRight: spacing.sm }}>
                  <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>
                    {item.target_name ?? item.name ?? (item.is_venue ? 'Venue Quote' : 'Vendor Quote')}
                  </Text>
                  <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs }}>
                    {item.is_venue ? 'Venue Quote Request' : (item.event_type ?? 'Service package')}
                  </Text>
                </View>
                <View
                  style={{
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xs,
                    borderRadius: radii.full,
                    backgroundColor: statusStyle(item.status).backgroundColor,
                  }}
                >
                  <Text style={{ ...typography.captionSemiBold, color: statusStyle(item.status).color }}>
                    {item.status ?? 'requested'}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm }}>
                <MaterialIcons name={item.is_venue ? 'storefront' : 'store'} size={14} color={colors.textMuted} style={{ marginRight: spacing.xs }} />
                <Text style={{ ...typography.caption, color: colors.textMuted }}>
                  Requested from {item.target_name ?? (item.is_venue ? 'Venue' : 'Vendor')}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm }}>
                <MaterialIcons
                  name={item.status === 'pending' ? 'schedule' : 'visibility'}
                  size={14}
                  color={item.status === 'pending' ? colors.textMuted : '#16A34A'}
                  style={{ marginRight: spacing.xs }}
                />
                <Text style={{ ...typography.caption, color: item.status === 'pending' ? colors.textMuted : '#16A34A' }}>
                  {item.status === 'pending' ? 'Awaiting vendor review' : 'Vendor has seen this request'}
                </Text>
              </View>

              {item.details && (
                <Text style={{ ...typography.body, color: colors.textSecondary, marginTop: spacing.sm }} numberOfLines={3}>
                  {item.details}
                </Text>
              )}

              {/* Notes field */}
              <View style={{ marginTop: spacing.sm }}>
                {editingNotesId === item.id ? (
                  <View>
                    <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>Notes</Text>
                    <TextInput
                      value={notesDraft}
                      onChangeText={setNotesDraft}
                      placeholder="Add notes about this quote..."
                      placeholderTextColor={colors.textMuted}
                      multiline
                      style={{
                        borderWidth: 1,
                        borderColor: colors.borderSubtle,
                        borderRadius: radii.md,
                        paddingHorizontal: spacing.sm,
                        paddingVertical: spacing.sm,
                        backgroundColor: colors.surfaceMuted,
                        color: colors.textPrimary,
                        minHeight: 60,
                        textAlignVertical: 'top',
                      }}
                    />
                    <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs }}>
                      <TouchableOpacity
                        onPress={async () => {
                          try {
                            setActionLoadingId(item.id);
                            const tableName = item.is_venue ? 'venue_quote_requests' : 'quote_requests';
                            const { error } = await supabase
                              .from(tableName)
                              .update({ requirements: notesDraft || null })
                              .eq('id', item.original_id ?? item.id);
                            if (error) throw error;
                            await refetch();
                          } catch (err: any) {
                            setAlertState({ visible: true, title: 'Error', message: err?.message ?? 'Failed to save notes' });
                          } finally {
                            setActionLoadingId(null);
                            setEditingNotesId(null);
                          }
                        }}
                        disabled={actionLoadingId === item.id}
                        style={{
                          flex: 1,
                          paddingVertical: spacing.xs,
                          borderRadius: radii.sm,
                          backgroundColor: colors.primary,
                          alignItems: 'center',
                          opacity: actionLoadingId === item.id ? 0.7 : 1,
                        }}
                      >
                        <Text style={{ ...typography.captionSemiBold, color: '#FFFFFF' }}>
                          {actionLoadingId === item.id ? 'Saving...' : 'Save'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => { setEditingNotesId(null); setNotesDraft(''); }}
                        style={{
                          flex: 1,
                          paddingVertical: spacing.xs,
                          borderRadius: radii.sm,
                          borderWidth: 1,
                          borderColor: colors.borderSubtle,
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ ...typography.caption, color: colors.textSecondary }}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View>
                    {item.notes ? (
                      <View style={{
                        padding: spacing.sm,
                        backgroundColor: colors.surfaceMuted,
                        borderRadius: radii.md,
                        borderLeftWidth: 3,
                        borderLeftColor: colors.textMuted,
                      }}>
                        <Text style={{ ...typography.captionSemiBold, color: colors.textMuted }}>Notes</Text>
                        <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: 2 }}>
                          {item.notes}
                        </Text>
                      </View>
                    ) : null}
                    <TouchableOpacity
                      onPress={() => {
                        setNotesDraft(item.notes ?? '');
                        setEditingNotesId(item.id);
                      }}
                      style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs }}
                    >
                      <MaterialIcons name="edit-note" size={16} color={colors.primary} />
                      <Text style={{ ...typography.caption, color: colors.primary, marginLeft: spacing.xs }}>
                        {item.notes ? 'Edit notes' : 'Add notes'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {item.requirements && item.status === 'tour_requested' && (
                <View style={{ 
                  marginTop: spacing.sm, 
                  padding: spacing.sm, 
                  backgroundColor: '#F0F9FF', 
                  borderRadius: radii.md,
                  borderLeftWidth: 3,
                  borderLeftColor: colors.primary
                }}>
                  <Text style={{ ...typography.captionSemiBold, color: colors.primary }}>
                    Tour Request
                  </Text>
                  <Text style={{ ...typography.caption, color: colors.primary, marginTop: 2 }}>
                    {item.requirements}
                  </Text>
                </View>
              )}

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md }}>
                <View>
                  <Text style={{ ...typography.caption, color: colors.textMuted }}>Category:</Text>
                  <Text style={{ ...typography.body, color: colors.textPrimary }}>
                    {item.is_venue ? 'Venue' : (item.event_type ?? 'General')}
                  </Text>
                </View>
                <View>
                  <Text style={{ ...typography.caption, color: colors.textMuted }}>Requested:</Text>
                  <Text style={{ ...typography.body, color: colors.textPrimary }}>
                    {requestedDate ?? 'TBD'}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ ...typography.caption, color: colors.textMuted }}>Quote</Text>
                  <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>
                    {typeof item.quote_amount === 'number' ? formatCurrency(item.quote_amount) : 'TBD'}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', marginTop: spacing.md, columnGap: spacing.sm }}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('QuoteDetail', { quoteId: item.id })}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: spacing.sm,
                    borderRadius: radii.md,
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
                    backgroundColor: colors.surface,
                  }}
                >
                  <MaterialIcons name="description" size={16} color={colors.textPrimary} style={{ marginRight: spacing.xs }} />
                  <Text style={{ ...typography.caption, color: colors.textPrimary }}>View Details</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleSecondaryAction(item)}
                  disabled={actionLoading}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: spacing.sm,
                    borderRadius: radii.md,
                    backgroundColor: colors.accent,
                    opacity: actionLoading ? 0.7 : 1,
                  }}
                >
                  <MaterialIcons name="edit" size={16} color={colors.textPrimary} style={{ marginRight: spacing.xs }} />
                  <Text style={{ ...typography.caption, color: colors.textPrimary }}>
                    {actionLoading ? 'Saving...' : actionLabel}
                  </Text>
                </TouchableOpacity>
              </View>

              {canCancel(item.status) && (
                <TouchableOpacity
                  onPress={() => handleCancel(item)}
                  disabled={actionLoading}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: spacing.sm,
                    paddingVertical: spacing.sm,
                    borderRadius: radii.md,
                    borderWidth: 1,
                    borderColor: colors.destructive,
                    opacity: actionLoading ? 0.7 : 1,
                  }}
                >
                  <MaterialIcons name="cancel" size={16} color={colors.destructive} style={{ marginRight: spacing.xs }} />
                  <Text style={{ ...typography.captionSemiBold, color: colors.destructive }}>
                    {actionLoading ? 'Cancelling...' : 'Cancel request'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />

      {alertState && (
        <ThemedAlert
          visible={alertState.visible}
          title={alertState.title}
          message={alertState.message}
          buttons={alertState.buttons ?? [{ text: 'OK', style: 'default', onPress: () => setAlertState(null) }]}
          onDismiss={() => setAlertState(null)}
        />
      )}
    </View>
  );
}
