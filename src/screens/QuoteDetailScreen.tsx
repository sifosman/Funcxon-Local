import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '../lib/supabaseClient';
import { colors, spacing, radii, typography } from '../theme';
import ThemedAlert from '../components/ThemedAlert';
import { useIsDesktop } from '../hooks/useIsDesktop';
import { quoteStatusLabel, isQuoteRespondable } from '../lib/quoting';
import type { QuotesStackParamList } from '../navigation/QuotesNavigator';
import { createQuoteAcceptedNotification } from '../lib/notifications';

type LineItem = {
  name: string;
  quantity: number;
  price: number;
};

type QuoteRequest = {
  id: number | string;
  original_id?: number;
  is_venue?: boolean;
  vendor_id: number | null;
  target_id?: number | null;
  target_name?: string | null;
  name: string | null;
  email: string | null;
  contact_phone?: string | null;
  status: string | null;
  details?: string | null;
  event_type?: string | null;
  event_date?: string | null;
  end_date?: string | null;
  selected_hall?: string | null;
  budget?: string | null;
  quote_amount?: number | null;
  created_at?: string | null;
  requirements?: string | null;
  line_items?: string | null;
};

type CatalogueItem = {
  id: number;
  title: string;
  description: string | null;
  price: number | null;
  currency: string;
  is_active: boolean;
  image_url: string | null;
};

type VendorSummary = {
  id: number;
  name: string | null;
  price_range: string | null;
  rating: number | null;
  review_count: number | null;
  city?: string | null;
  province?: string | null;
};

type VenueSummary = {
  id: number;
  name: string | null;
  description: string | null;
  city?: string | null;
  province?: string | null;
};

type QuoteDetailData = {
  quote: QuoteRequest;
  vendor: VendorSummary | null;
  venue: VenueSummary | null;
};

export default function QuoteDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<QuotesStackParamList, 'QuoteDetail'>>();
  const isDesktop = useIsDesktop();
  const { quoteId } = route.params;
  const from = (route.params as any)?.from ?? 'Quotes';

  const [catalogueItems, setCatalogueItems] = useState<CatalogueItem[]>([]);
  const [catalogueLoading, setCatalogueLoading] = useState(false);
  const [tourCount, setTourCount] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [alertState, setAlertState] = useState<{visible: boolean; title: string; message: string; buttons?: any[]} | null>(null);

  const { data, isLoading, error } = useQuery<QuoteDetailData | null>({
    queryKey: ['quote-detail', quoteId],
    queryFn: async () => {
      const isVenueQuote = typeof quoteId === 'string' && quoteId.startsWith('venue-');
      const resolvedQuoteId = isVenueQuote ? Number(String(quoteId).replace('venue-', '')) : quoteId;

      let quote: QuoteRequest | null = null;
      let vendor: VendorSummary | null = null;
      let venue: VenueSummary | null = null;

      if (isVenueQuote) {
        const { data: venueQuoteRows, error: venueQuoteError } = await supabase
          .from('venue_quote_requests')
          .select('id, listing_id, requester_name, requester_email, requester_phone, contact_phone, status, message, event_date, end_date, selected_hall, created_at, requirements, line_items, quoted_amount')
          .eq('id', resolvedQuoteId)
          .limit(1);

        if (venueQuoteError) {
          throw venueQuoteError;
        }

        const venueQuote = (venueQuoteRows as any[] | null)?.[0];
        if (!venueQuote) {
          return null;
        }

        quote = {
          id: `venue-${venueQuote.id}`,
          original_id: venueQuote.id,
          is_venue: true,
          vendor_id: venueQuote.listing_id,
          target_id: venueQuote.listing_id,
          name: venueQuote.requester_name,
          email: venueQuote.requester_email,
          contact_phone: venueQuote.contact_phone ?? venueQuote.requester_phone ?? null,
          status: venueQuote.status,
          details: venueQuote.message,
          event_type: 'Venue',
          event_date: venueQuote.event_date,
          end_date: venueQuote.end_date,
          selected_hall: venueQuote.selected_hall,
          budget: null,
          quote_amount: venueQuote.quoted_amount,
          created_at: venueQuote.created_at,
          requirements: venueQuote.requirements ?? null,
        };

        if (venueQuote.listing_id) {
          const { data: venueRows, error: venueError } = await supabase
            .from('venue_listings')
            .select('id, name, description, city, province')
            .eq('id', venueQuote.listing_id)
            .limit(1);

          if (!venueError) {
            venue = (venueRows as VenueSummary[] | null)?.[0] ?? null;
          }
        }
      } else {
        const { data: quoteRows, error: quoteError } = await supabase
          .from('quote_requests')
          .select(
            'id, vendor_id, name, email, contact_phone, status, details, event_type, event_date, end_date, budget, quote_amount, created_at, requirements, line_items',
          )
          .eq('id', resolvedQuoteId)
          .limit(1);

        if (quoteError) {
          throw quoteError;
        }

        const vendorQuote = (quoteRows as QuoteRequest[] | null)?.[0];
        if (!vendorQuote) {
          return null;
        }

        quote = {
          ...vendorQuote,
          target_id: vendorQuote.vendor_id,
        };

        if (vendorQuote.vendor_id) {
          const { data: vendorRows, error: vendorError } = await supabase
            .from('vendors')
            .select('id, name, price_range, rating, review_count, city, province')
            .eq('id', vendorQuote.vendor_id)
            .limit(1);

          if (!vendorError) {
            vendor = (vendorRows as VendorSummary[] | null)?.[0] ?? null;
          }
        }
      }

      if (quote) {
        quote.target_name = venue?.name ?? vendor?.name ?? quote.target_name ?? null;
      }

      return quote ? { quote, vendor, venue } : null;
    },
  });

  const quote = data?.quote;
  const isVenueQuote = quote?.is_venue ?? false;
  const targetId = quote?.target_id ?? quote?.vendor_id ?? null;

  const parsedLineItems = useMemo<LineItem[]>(() => {
    if (!quote?.line_items) return [];
    try {
      const parsed = JSON.parse(quote.line_items);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => ({
          name: String(item.title ?? item.name ?? ''),
          quantity: typeof item.quantity === 'number' ? item.quantity : parseFloat(item.quantity) || 1,
          price: typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0,
        }));
      }
    } catch {
      // ignore malformed JSON
    }
    return [];
  }, [quote?.line_items]);

  const lineItemsTotal = useMemo(() => {
    return parsedLineItems.reduce((sum: number, item: LineItem) => sum + item.quantity * item.price, 0);
  }, [parsedLineItems]);

  const canCancel = quote?.status === 'pending' || quote?.status === 'quoted' || quote?.status === 'amended';

  const handleCancel = () => {
    if (!quote?.original_id || !canCancel) return;
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
            setCancelling(true);
            try {
              const tableName = isVenueQuote ? 'venue_quote_requests' : 'quote_requests';
              const { data: updatedRows, error: updateError } = await supabase
                .from(tableName)
                .update({ status: 'cancelled' })
                .eq('id', quote.original_id)
                .select('id');

              if (updateError) throw updateError;
              if (!updatedRows || updatedRows.length === 0) {
                throw new Error('Could not cancel this quote request. You may not have permission to modify it.');
              }
              navigation.goBack();
            } catch (err: any) {
              setAlertState({ visible: true, title: 'Unable to cancel', message: err?.message ?? 'Please try again.' });
            } finally {
              setCancelling(false);
            }
          },
        },
      ],
    });
  };

  const loadCatalogueItems = useCallback(async () => {
    if (!targetId) return;
    setCatalogueLoading(true);
    try {
      const table = isVenueQuote ? 'venue_catalogue_items' : 'vendor_catalogue_items';
      const column = isVenueQuote ? 'listing_id' : 'vendor_id';
      const { data: items, error: itemsErr } = await supabase
        .from(table)
        .select('id, title, description, price, currency, is_active, image_url')
        .eq(column, targetId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (itemsErr) {
        setCatalogueItems([]);
      } else {
        setCatalogueItems((items ?? []) as CatalogueItem[]);
      }
    } catch {
      setCatalogueItems([]);
    } finally {
      setCatalogueLoading(false);
    }
  }, [targetId, isVenueQuote]);

  const loadTourCount = useCallback(async () => {
    if (!isVenueQuote || !targetId) {
      setTourCount(null);
      return;
    }
    try {
      const { count, error } = await supabase
        .from('venue_tour_bookings')
        .select('id', { count: 'exact', head: true })
        .eq('listing_id', targetId);

      if (!error) {
        setTourCount(count ?? 0);
      }
    } catch {
      setTourCount(null);
    }
  }, [isVenueQuote, targetId]);

  useEffect(() => {
    if (quote) {
      setNotes(quote.requirements ?? '');
      loadCatalogueItems();
      loadTourCount();
    }
  }, [quote, loadCatalogueItems, loadTourCount]);

  const handleSaveNotes = async () => {
    if (!quote?.original_id) return;
    setSavingNotes(true);
    try {
      const tableName = isVenueQuote ? 'venue_quote_requests' : 'quote_requests';
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ requirements: notes.trim() || null })
        .eq('id', quote.original_id);

      if (updateError) throw updateError;
      setEditingNotes(false);
    } catch (err: any) {
      setAlertState({ visible: true, title: 'Error', message: err?.message ?? 'Failed to save notes' });
    } finally {
      setSavingNotes(false);
    }
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
        <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>Failed to load quote.</Text>
        <Text style={{ marginTop: spacing.sm, ...typography.body, color: colors.textMuted }}>{error.message}</Text>
      </View>
    );
  }

  if (!data || !data.quote) {
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
          This quote could not be found.
        </Text>
      </View>
    );
  }

  const { vendor, venue } = data;

  const requestedDate =
    quote!.event_date || quote!.created_at
      ? new Date(quote!.event_date || quote!.created_at || '').toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })
      : null;

  const linkedName = venue?.name ?? vendor?.name ?? quote!.target_name ?? 'Listing';
  const linkedLocation = venue
    ? [venue.city, venue.province].filter(Boolean).join(', ')
    : vendor
      ? [vendor.city, vendor.province].filter(Boolean).join(', ')
      : '';

  const handleOpenProfile = () => {
    const profileTargetId = quote!.target_id ?? quote!.vendor_id;
    if (!profileTargetId) {
      return;
    }

    navigation.navigate('Home', quote!.is_venue
      ? {
          screen: 'VenueProfile',
          params: { venueId: profileTargetId, from },
        }
      : {
          screen: 'VendorProfile',
          params: { vendorId: profileTargetId, from },
        });
  };

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Home', { screen: 'Quotes' });
    }
  };

  const handleAmend = () => {
    const targetId = quote!.target_id ?? quote!.vendor_id;
    if (!targetId) return;
    navigation.navigate('Home', {
      screen: 'QuoteRequest',
      params: {
        vendorId: targetId,
        vendorName: quote!.target_name ?? 'Vendor',
        type: quote!.is_venue ? 'venue' : 'vendor',
        editMode: true,
        quoteId: quote!.original_id ?? quote!.id,
        from,
      },
    });
  };

  const handleAccept = async () => {
    if (!quote?.original_id) return;
    try {
      const tableName = isVenueQuote ? 'venue_quote_requests' : 'quote_requests';
      const { error } = await supabase
        .from(tableName)
        .update({ status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('id', quote.original_id);
      if (error) throw error;

      // In-app notification for the lister
      if (quote.target_id) {
        const requesterName = quote.name || 'A client';
        if (isVenueQuote) {
          const { data: listing } = await supabase
            .from('venue_listings')
            .select('user_id, name')
            .eq('id', quote.target_id)
            .maybeSingle();
          if (listing?.user_id) {
            await createQuoteAcceptedNotification(
              listing.user_id,
              requesterName,
              listing.name || quote.target_name || 'Venue',
              quote.original_id,
              true
            ).catch(() => {});
          }
        } else {
          const { data: vendor } = await supabase
            .from('vendors')
            .select('user_id, name')
            .eq('id', quote.target_id)
            .maybeSingle();
          if (vendor?.user_id) {
            await createQuoteAcceptedNotification(
              vendor.user_id,
              requesterName,
              vendor.name || quote.target_name || 'Vendor',
              quote.original_id,
              false
            ).catch(() => {});
          }
        }
      }

      navigation.navigate('QuoteResponse', {
        revisionId: null,
        quoteRequestId: quote.id,
        vendorName: quote.target_name ?? undefined,
        amount: quote.quote_amount ?? undefined,
        accepted: true,
      });
    } catch (err: any) {
      setAlertState({ visible: true, title: 'Unable to accept', message: err?.message ?? 'Please try again.' });
    }
  };

  const handleReject = () => {
    navigation.navigate('QuoteResponse', {
      revisionId: null,
      quoteRequestId: quote!.id,
      vendorName: quote!.target_name ?? undefined,
      amount: quote!.quote_amount ?? undefined,
      rejectOnly: true,
    });
  };

  const cardStyle = {
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: isDesktop ? colors.surfaceContainerLowest : colors.surface,
    borderWidth: 1,
    borderColor: isDesktop ? colors.outlineVariant : colors.borderSubtle,
  };

  const renderHeaderCard = () => (
    <View style={cardStyle}>
      <Text style={isDesktop ? { ...typography.headlineSm, color: colors.textPrimary } : { ...typography.titleMedium, color: colors.textPrimary }}>
        {linkedName}
      </Text>
      <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textSecondary, marginTop: spacing.xs } : { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs }}>
        Requested from: {linkedName}
      </Text>
      {quote!.status && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs }}>
          <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textSecondary } : { ...typography.caption, color: colors.textSecondary }}>
            Status: {quoteStatusLabel(quote!.status)}
          </Text>
        </View>
      )}
      {quote!.name && (
        <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textSecondary, marginTop: spacing.xs } : { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs }}>
          Requested by: {quote!.name} {quote!.email ? `(${quote!.email})` : ''}
        </Text>
      )}
      {quote!.contact_phone && (
        <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textSecondary, marginTop: spacing.xs } : { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs }}>
          Contact: {quote!.contact_phone}
        </Text>
      )}
      {requestedDate && (
        <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textSecondary, marginTop: spacing.xs } : { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs }}>
          Event date: {requestedDate}
        </Text>
      )}
      {quote!.end_date && (
        <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textSecondary, marginTop: spacing.xs } : { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs }}>
          End date: {new Date(quote!.end_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
        </Text>
      )}
      {quote!.selected_hall && (
        <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textSecondary, marginTop: spacing.xs } : { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs }}>
          Hall: {quote!.selected_hall}
        </Text>
      )}
      {quote!.email && !quote!.name && (
        <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textSecondary, marginTop: spacing.xs } : { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs }}>
          {quote!.email}
        </Text>
      )}
    </View>
  );

  const renderProfileCard = () => {
    if (!vendor && !venue) return null;
    return (
      <View style={cardStyle}>
        <Text style={isDesktop ? { ...typography.headlineSm, color: colors.textPrimary } : { ...typography.bodySemiBold, color: colors.textPrimary }}>
          {linkedName}
        </Text>
        <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textSecondary, marginTop: spacing.xs } : { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs }}>
          {linkedLocation || 'Location not specified'}
        </Text>
        {!quote!.is_venue && vendor?.price_range ? (
          <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textSecondary, marginTop: spacing.xs } : { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs }}>
            {vendor.price_range}
          </Text>
        ) : null}
        <TouchableOpacity
          onPress={handleOpenProfile}
          style={{
            marginTop: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={isDesktop ? { ...typography.labelMd, color: colors.textPrimary } : { ...typography.bodySemiBold, color: colors.textPrimary }}>
            View Full {quote!.is_venue ? 'Venue' : 'Vendor'} Profile
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderQuoteDetails = () => (
    <View style={cardStyle}>
      {quote!.event_type && (
        <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textSecondary, marginBottom: spacing.xs } : { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs }}>
          Event type: {quote!.event_type}
        </Text>
      )}
      {quote!.budget && (
        <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textSecondary, marginBottom: spacing.xs } : { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs }}>
          Budget: {quote!.budget}
        </Text>
      )}
      {typeof quote!.quote_amount === 'number' && (
        <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textSecondary, marginBottom: spacing.xs } : { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs }}>
          Quoted amount: R {quote!.quote_amount.toLocaleString('en-ZA')}
        </Text>
      )}
      {quote!.details && (
        <>
          <Text style={isDesktop ? { ...typography.labelMd, color: colors.textMuted, marginBottom: spacing.xs } : { ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>
            Additional comments/requests/enquiries:
          </Text>
          <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textPrimary, marginBottom: spacing.xs } : { ...typography.body, color: colors.textPrimary, marginBottom: spacing.xs }}>
            {quote!.details}
          </Text>
        </>
      )}
    </View>
  );

  const renderRequestedItems = () => {
    if (parsedLineItems.length === 0) return null;
    return (
      <View style={cardStyle}>
        <Text style={isDesktop ? { ...typography.headlineSm, color: colors.textPrimary, marginBottom: spacing.sm } : { ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.sm }}>
          Requested Items
        </Text>
        <View style={{ gap: spacing.sm }}>
          {parsedLineItems.map((item, index) => (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: spacing.xs,
                borderBottomWidth: index === parsedLineItems.length - 1 ? 0 : 1,
                borderBottomColor: isDesktop ? colors.outlineVariant : colors.borderSubtle,
              }}
            >
              <View style={{ flex: 1, paddingRight: spacing.sm }}>
                <Text style={isDesktop ? { ...typography.bodyMd, fontWeight: '600', color: colors.textPrimary } : { ...typography.bodySemiBold, color: colors.textPrimary }}>
                  {item.name}
                </Text>
                <Text style={isDesktop ? { ...typography.labelMd, color: colors.textMuted } : { ...typography.caption, color: colors.textMuted }}>
                  Qty: {item.quantity}
                </Text>
              </View>
              <Text style={isDesktop ? { ...typography.bodyMd, fontWeight: '700', color: colors.textPrimary } : { ...typography.bodyBold, color: colors.textPrimary }}>
                R{(item.quantity * item.price).toLocaleString('en-ZA')}
              </Text>
            </View>
          ))}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingTop: spacing.sm,
              borderTopWidth: 1,
              borderTopColor: isDesktop ? colors.outlineVariant : colors.borderSubtle,
            }}
          >
            <Text style={isDesktop ? { ...typography.bodyMd, fontWeight: '700', color: colors.textPrimary } : { ...typography.bodyBold, color: colors.textPrimary }}>Estimated Budget</Text>
            <Text style={isDesktop ? { ...typography.bodyMd, fontWeight: '700', color: colors.primary } : { ...typography.bodyBold, color: colors.primary }}>
              R{lineItemsTotal.toLocaleString('en-ZA')}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderTourCount = () => {
    if (!isVenueQuote || tourCount === null) return null;
    return (
      <View
        style={{
          ...cardStyle,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        }}
      >
        <MaterialIcons name="tour" size={24} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={isDesktop ? { ...typography.headlineSm, color: colors.textPrimary } : { ...typography.bodySemiBold, color: colors.textPrimary }}>
            {tourCount} {tourCount === 1 ? 'tour' : 'tours'} booked
          </Text>
          <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textMuted } : { ...typography.caption, color: colors.textMuted }}>
            Total venue tour bookings for this listing
          </Text>
        </View>
      </View>
    );
  };

  const renderCatalogueItems = () => (
    <View style={cardStyle}>
      <Text style={isDesktop ? { ...typography.headlineSm, color: colors.textPrimary, marginBottom: spacing.sm } : { ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.sm }}>
        Catalogue Items
      </Text>

      {catalogueLoading ? (
        <ActivityIndicator size="small" color={colors.primary} style={{ paddingVertical: spacing.md }} />
      ) : catalogueItems.length === 0 ? (
        <View style={{ paddingVertical: spacing.md, alignItems: 'center' }}>
          <MaterialIcons name="inventory-2" size={36} color={colors.textMuted} />
          <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textMuted, marginTop: spacing.sm } : { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm }}>
            No catalogue items available.
          </Text>
        </View>
      ) : (
        <View style={{ gap: spacing.sm }}>
          {catalogueItems.map((item) => (
            <View
              key={item.id}
              style={{
                flexDirection: 'row',
                borderRadius: radii.md,
                backgroundColor: isDesktop ? colors.surfaceContainerLow : colors.surfaceMuted,
                borderWidth: 1,
                borderColor: isDesktop ? colors.outlineVariant : colors.borderSubtle,
                overflow: 'hidden',
              }}
            >
              {item.image_url ? (
                <Image
                  source={{ uri: item.image_url }}
                  style={{ width: 72, height: 72 }}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={{
                    width: 72,
                    height: 72,
                    backgroundColor: isDesktop ? colors.surfaceContainerLowest : colors.surface,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialIcons name="image" size={24} color={colors.textMuted} />
                </View>
              )}
              <View style={{ flex: 1, padding: spacing.sm, justifyContent: 'center' }}>
                <Text style={isDesktop ? { ...typography.bodyMd, fontWeight: '600', color: colors.textPrimary } : { ...typography.bodySemiBold, color: colors.textPrimary }} numberOfLines={1}>
                  {item.title}
                </Text>
                {item.description ? (
                  <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textMuted, marginTop: 2 } : { ...typography.caption, color: colors.textMuted, marginTop: 2 }} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
                <Text style={isDesktop ? { ...typography.bodyMd, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.xs } : { ...typography.bodyBold, color: colors.textPrimary, marginTop: spacing.xs }}>
                  R{Number(item.price ?? 0).toLocaleString()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderNotes = () => (
    <View style={cardStyle}>
      <Text style={isDesktop ? { ...typography.headlineSm, color: colors.textPrimary, marginBottom: spacing.sm } : { ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.sm }}>
        Notes
      </Text>

      {editingNotes ? (
        <View>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Add notes about this quote..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
            style={{
              borderWidth: 1,
              borderColor: isDesktop ? colors.outlineVariant : colors.borderSubtle,
              borderRadius: radii.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              backgroundColor: isDesktop ? colors.surfaceContainerLow : colors.surfaceMuted,
              color: colors.textPrimary,
              minHeight: 80,
              textAlignVertical: 'top',
            }}
          />
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
            <TouchableOpacity
              onPress={handleSaveNotes}
              disabled={savingNotes}
              style={{
                flex: 1,
                paddingVertical: spacing.sm,
                borderRadius: radii.md,
                backgroundColor: savingNotes ? colors.textMuted : colors.primary,
                alignItems: 'center',
              }}
            >
              <Text style={isDesktop ? { ...typography.labelMd, color: '#FFFFFF' } : { ...typography.bodySemiBold, color: '#FFFFFF' }}>
                {savingNotes ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setEditingNotes(false); setNotes(quote?.requirements ?? ''); }}
              style={{
                flex: 1,
                paddingVertical: spacing.sm,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: isDesktop ? colors.outlineVariant : colors.borderSubtle,
                alignItems: 'center',
              }}
            >
              <Text style={isDesktop ? { ...typography.labelMd, color: colors.textSecondary } : { ...typography.body, color: colors.textSecondary }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View>
          {notes ? (
            <View
              style={{
                padding: spacing.sm,
                backgroundColor: isDesktop ? colors.surfaceContainerLow : colors.surfaceMuted,
                borderRadius: radii.md,
                borderLeftWidth: 3,
                borderLeftColor: colors.textMuted,
              }}
            >
              <Text style={isDesktop ? { ...typography.labelMd, color: colors.textMuted } : { ...typography.captionSemiBold, color: colors.textMuted }}>Notes</Text>
              <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textSecondary, marginTop: 2 } : { ...typography.caption, color: colors.textSecondary, marginTop: 2 }}>
                {notes}
              </Text>
            </View>
          ) : null}
          <TouchableOpacity
            onPress={() => setEditingNotes(true)}
            style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs }}
          >
            <MaterialIcons name="edit-note" size={16} color={colors.primary} />
            <Text style={{ ...typography.caption, color: colors.primary, marginLeft: spacing.xs }}>
              {notes ? 'Edit notes' : 'Add notes'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderActions = () => (
    <>
      {isQuoteRespondable(quote!.status) && (
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
          <TouchableOpacity
            onPress={handleAccept}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: spacing.md,
              borderRadius: radii.lg,
              backgroundColor: '#16A34A',
            }}
          >
            <MaterialIcons name="check-circle" size={20} color="#FFFFFF" style={{ marginRight: spacing.sm }} />
            <Text style={isDesktop ? { ...typography.labelMd, color: '#FFFFFF' } : { ...typography.bodyBold, color: '#FFFFFF' }}>Accept Quote</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleAmend}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: spacing.md,
              borderRadius: radii.lg,
              backgroundColor: colors.primary,
            }}
          >
            <MaterialIcons name="edit" size={20} color="#FFFFFF" style={{ marginRight: spacing.sm }} />
            <Text style={isDesktop ? { ...typography.labelMd, color: '#FFFFFF' } : { ...typography.bodyBold, color: '#FFFFFF' }}>Amend</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleReject}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: spacing.md,
              borderRadius: radii.lg,
              borderWidth: 1,
              borderColor: colors.destructive,
            }}
          >
            <MaterialIcons name="cancel" size={20} color={colors.destructive} style={{ marginRight: spacing.sm }} />
            <Text style={isDesktop ? { ...typography.labelMd, color: colors.destructive } : { ...typography.bodyBold, color: colors.destructive }}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}

      {canCancel && (
        <TouchableOpacity
          onPress={handleCancel}
          disabled={cancelling}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: spacing.md,
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: colors.destructive,
            opacity: cancelling ? 0.7 : 1,
          }}
        >
          <MaterialIcons name="cancel" size={20} color={colors.destructive} style={{ marginRight: spacing.sm }} />
          <Text style={isDesktop ? { ...typography.labelMd, color: colors.destructive } : { ...typography.bodyBold, color: colors.destructive }}>
            {cancelling ? 'Cancelling...' : 'Cancel quote request'}
          </Text>
        </TouchableOpacity>
      )}
    </>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: isDesktop ? colors.surfaceBg : colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: isDesktop ? colors.surfaceBg : colors.background }}
        contentContainerStyle={isDesktop ? {
          paddingHorizontal: 48,
          paddingTop: spacing.xl,
          paddingBottom: spacing.xl,
          maxWidth: 1200,
          width: '100%',
          alignSelf: 'center',
        } : {
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.sm,
          paddingBottom: spacing.xl,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
            onPress={handleGoBack}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}
          >
            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
            <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>
              Back
            </Text>
          </TouchableOpacity>

        {isDesktop ? (
          <>
            <View style={{ marginBottom: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <View>
                <Text style={{ ...typography.labelMd, color: colors.dustyRose, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.05 }}>
                  Quote Details
                </Text>
                <Text style={{ ...typography.headlineMd, color: colors.primary }}>
                  {linkedName}
                </Text>
              </View>
            </View>
            {renderHeaderCard()}
            <View style={{ flexDirection: 'row', gap: spacing.gutter } as any}>
              <View style={{ flex: 7, gap: 0 } as any}>
                {renderQuoteDetails()}
                {renderRequestedItems()}
                {renderNotes()}
              </View>
              <View style={{ flex: 5, gap: 0 } as any}>
                {renderProfileCard()}
                {renderTourCount()}
                {renderCatalogueItems()}
                {renderActions()}
              </View>
            </View>
          </>
        ) : (
          <>
            {renderHeaderCard()}
            {renderProfileCard()}
            {renderQuoteDetails()}
            {renderRequestedItems()}
            {renderTourCount()}
            {renderCatalogueItems()}
            {renderNotes()}
            {renderActions()}
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
