import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '../lib/supabaseClient';
import { colors, spacing, radii, typography } from '../theme';
import ThemedAlert from '../components/ThemedAlert';
import type { QuotesStackParamList } from '../navigation/QuotesNavigator';

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
  status: string | null;
  details?: string | null;
  event_type?: string | null;
  event_date?: string | null;
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
  const { quoteId } = route.params;

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
          .select('id, listing_id, requester_name, requester_email, status, message, event_date, created_at, requirements, line_items')
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
          status: venueQuote.status,
          details: venueQuote.message,
          event_type: 'Venue',
          event_date: venueQuote.event_date,
          budget: null,
          quote_amount: null,
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
            'id, vendor_id, name, email, status, details, event_type, event_date, budget, quote_amount, created_at, requirements, line_items',
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
          name: String(item.name ?? ''),
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

  const canCancel = quote?.status === 'pending' || quote?.status === 'quoted' || quote?.status === 'amended' || quote?.status === 'in_progress';

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
              const { error: updateError } = await supabase
                .from(tableName)
                .update({ status: 'cancelled' })
                .eq('id', quote.original_id);

              if (updateError) throw updateError;
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
      ? new Date(quote!.event_date || quote!.created_at || '').toLocaleDateString()
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
          params: { venueId: profileTargetId, from: 'Quotes' },
        }
      : {
          screen: 'VendorProfile',
          params: { vendorId: profileTargetId, from: 'Quotes' },
        });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.sm,
          paddingBottom: spacing.xl,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}
        >
          <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
          <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>
            Back
          </Text>
        </TouchableOpacity>

        {/* Quote Header */}
        <View
          style={{
            marginBottom: spacing.lg,
            padding: spacing.md,
            borderRadius: radii.lg,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
          }}
        >
          <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>
            {linkedName}
          </Text>
          <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs }}>
            Requested from: {linkedName}
          </Text>
          {quote!.status && (
            <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs }}>
              Status: {quote!.status}
            </Text>
          )}
          {requestedDate && (
            <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs }}>
              Requested for: {requestedDate}
            </Text>
          )}
          {quote!.email && (
            <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs }}>
              {quote!.email}
            </Text>
          )}
        </View>

        {/* Vendor/Venue Profile Card */}
        {(vendor || venue) && (
          <View
            style={{
              marginBottom: spacing.lg,
              padding: spacing.md,
              borderRadius: radii.lg,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
            }}
          >
            <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
              {linkedName}
            </Text>
            <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs }}>
              {linkedLocation || 'Location not specified'}
            </Text>
            {!quote!.is_venue && vendor?.price_range ? (
              <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs }}>
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
                borderColor: colors.textPrimary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
                View Full {quote!.is_venue ? 'Venue' : 'Vendor'} Profile
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quote Details */}
        <View
          style={{
            marginBottom: spacing.lg,
            padding: spacing.md,
            borderRadius: radii.lg,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
          }}
        >
          {quote!.event_type && (
            <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs }}>
              Event type: {quote!.event_type}
            </Text>
          )}
          {quote!.budget && (
            <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs }}>
              Budget: {quote!.budget}
            </Text>
          )}
          {typeof quote!.quote_amount === 'number' && (
            <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs }}>
              Quoted amount: {quote!.quote_amount.toLocaleString()}
            </Text>
          )}
          {quote!.details && (
            <Text style={{ ...typography.body, color: colors.textPrimary, marginTop: spacing.sm }}>
              {quote!.details}
            </Text>
          )}
        </View>

        {/* Requested Items / Budget */}
        {parsedLineItems.length > 0 && (
          <View
            style={{
              marginBottom: spacing.lg,
              padding: spacing.md,
              borderRadius: radii.lg,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
            }}
          >
            <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.sm }}>
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
                    borderBottomColor: colors.borderSubtle,
                  }}
                >
                  <View style={{ flex: 1, paddingRight: spacing.sm }}>
                    <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
                      {item.name}
                    </Text>
                    <Text style={{ ...typography.caption, color: colors.textMuted }}>
                      Qty: {item.quantity}
                    </Text>
                  </View>
                  <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '700' }}>
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
                  borderTopColor: colors.borderSubtle,
                }}
              >
                <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '700' }}>Estimated Budget</Text>
                <Text style={{ ...typography.body, color: colors.primary, fontWeight: '700' }}>
                  R{lineItemsTotal.toLocaleString('en-ZA')}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Tour Count (venue quotes only) */}
        {isVenueQuote && tourCount !== null && (
          <View
            style={{
              marginBottom: spacing.lg,
              padding: spacing.md,
              borderRadius: radii.lg,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
            }}
          >
            <MaterialIcons name="tour" size={24} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
                {tourCount} {tourCount === 1 ? 'tour' : 'tours'} booked
              </Text>
              <Text style={{ ...typography.caption, color: colors.textMuted }}>
                Total venue tour bookings for this listing
              </Text>
            </View>
          </View>
        )}

        {/* Catalogue Items */}
        <View
          style={{
            marginBottom: spacing.lg,
            padding: spacing.md,
            borderRadius: radii.lg,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
          }}
        >
          <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.sm }}>
            Catalogue Items
          </Text>

          {catalogueLoading ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ paddingVertical: spacing.md }} />
          ) : catalogueItems.length === 0 ? (
            <View style={{ paddingVertical: spacing.md, alignItems: 'center' }}>
              <MaterialIcons name="inventory-2" size={36} color={colors.textMuted} />
              <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.sm }}>
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
                    backgroundColor: colors.surfaceMuted,
                    borderWidth: 1,
                    borderColor: colors.borderSubtle,
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
                        backgroundColor: colors.surface,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <MaterialIcons name="image" size={24} color={colors.textMuted} />
                    </View>
                  )}
                  <View style={{ flex: 1, padding: spacing.sm, justifyContent: 'center' }}>
                    <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }} numberOfLines={1}>
                      {item.title}
                    </Text>
                    {item.description ? (
                      <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: 2 }} numberOfLines={2}>
                        {item.description}
                      </Text>
                    ) : null}
                    <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '700', marginTop: spacing.xs }}>
                      R{Number(item.price ?? 0).toLocaleString()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Notes Section */}
        <View
          style={{
            marginBottom: spacing.lg,
            padding: spacing.md,
            borderRadius: radii.lg,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
          }}
        >
          <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.sm }}>
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
                  borderColor: colors.borderSubtle,
                  borderRadius: radii.md,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  backgroundColor: colors.surfaceMuted,
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
                  <Text style={{ ...typography.body, color: '#FFFFFF', fontWeight: '600' }}>
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
                    borderColor: colors.borderSubtle,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ ...typography.body, color: colors.textSecondary }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              {notes ? (
                <View
                  style={{
                    padding: spacing.sm,
                    backgroundColor: colors.surfaceMuted,
                    borderRadius: radii.md,
                    borderLeftWidth: 3,
                    borderLeftColor: colors.textMuted,
                  }}
                >
                  <Text style={{ ...typography.caption, color: colors.textMuted, fontWeight: '600' }}>Notes</Text>
                  <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: 2 }}>
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
            <Text style={{ ...typography.body, color: colors.destructive, fontWeight: '700' }}>
              {cancelling ? 'Cancelling...' : 'Cancel quote request'}
            </Text>
          </TouchableOpacity>
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
