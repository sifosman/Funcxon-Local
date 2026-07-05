import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { supabase } from '../lib/supabaseClient';
import type { AttendeeStackParamList } from '../navigation/AttendeeNavigator';
import { colors, spacing, typography, radii } from '../theme';
import { useIsDesktop } from '../hooks/useIsDesktop';
import { PrimaryButton, ThemedInput } from '../components/ui';
import { useAuth } from '../auth/AuthContext';
import ThemedAlert from '../components/ThemedAlert';
import type { QuoteLineItem } from '../lib/quoting';
import { createQuoteRequestedNotification, createQuoteAmendedNotification } from '../lib/notifications';

type CatalogueItem = {
  id: number;
  title: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
};

type Props = NativeStackScreenProps<AttendeeStackParamList, 'QuoteRequest'>;

function formatDateInput(date: Date | null): string {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function QuoteRequestScreen({ route, navigation }: Props) {
  const { vendorId, vendorName, type = 'vendor', editMode = false, quoteId, initialLineItems } = route.params;
  const { user } = useAuth();
  const isDesktop = useIsDesktop();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [additionalComments, setAdditionalComments] = useState('');
  const [eventDate, setEventDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<'event' | 'end' | null>(null);
  const [halls, setHalls] = useState<{ name: string; capacity?: string }[]>([]);
  const [selectedHall, setSelectedHall] = useState<string | null>(null);
  const [catalogueItems, setCatalogueItems] = useState<CatalogueItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [loadingUser, setLoadingUser] = useState(false);
  const [loadingCatalogue, setLoadingCatalogue] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alertState, setAlertState] = useState<{visible: boolean; title: string; message: string; buttons?: any[]} | null>(null);

  const selectedItems = useMemo(() => {
    return catalogueItems
      .filter((item) => selectedIds.has(item.id))
      .map((item) => ({ ...item, quantity: quantities[item.id] || 1 }));
  }, [catalogueItems, selectedIds, quantities]);

  const total = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0);
  }, [selectedItems]);

  const createListerInAppNotification = async (quoteRequestId: number | null, isAmendment: boolean) => {
    try {
      if (type === 'venue') {
        const { data: venue } = await supabase
          .from('venue_listings')
          .select('user_id, name')
          .eq('id', vendorId)
          .maybeSingle();
        if (venue?.user_id) {
          if (isAmendment && quoteRequestId) {
            await createQuoteAmendedNotification(venue.user_id, name, venue.name || vendorName, quoteRequestId, true);
          } else {
            await createQuoteRequestedNotification(venue.user_id, name, venue.name || vendorName, true);
          }
        }
      } else {
        const { data: vendor } = await supabase
          .from('vendors')
          .select('user_id, name')
          .eq('id', vendorId)
          .maybeSingle();
        if (vendor?.user_id) {
          if (isAmendment && quoteRequestId) {
            await createQuoteAmendedNotification(vendor.user_id, name, vendor.name || vendorName, quoteRequestId, false);
          } else {
            await createQuoteRequestedNotification(vendor.user_id, name, vendor.name || vendorName, false);
          }
        }
      }
    } catch (e) {
      console.error('Failed to create lister in-app notification:', e);
    }
  };

  const toggleItem = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setQuantities((prev) => ({ ...prev, [id]: prev[id] || 1 }));
  };

  const updateQuantity = (id: number, delta: number) => {
    setQuantities((prev) => {
      const current = prev[id] || 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [id]: next };
    });
  };

  const loadUserDetails = useCallback(async () => {
    if (!user?.id) return;
    setLoadingUser(true);
    try {
      const { data } = await supabase
        .from('users')
        .select('full_name, email, phone')
        .eq('auth_user_id', user.id)
        .maybeSingle();
      if (data) {
        setName(data.full_name ?? '');
        setEmail(data.email ?? user.email ?? '');
        setContactPhone(data.phone ?? '');
      } else {
        setEmail(user.email ?? '');
      }
    } catch (e) {
      console.error('Failed to load user details:', e);
      setEmail(user.email ?? '');
    } finally {
      setLoadingUser(false);
    }
  }, [user?.id, user?.email]);

  const loadCatalogueAndHalls = useCallback(async () => {
    if (!vendorId) return;
    setLoadingCatalogue(true);
    try {
      if (type === 'venue') {
        const { data: listing } = await supabase
          .from('venue_listings')
          .select('features')
          .eq('id', vendorId)
          .maybeSingle();
        const features = (listing as any)?.features ?? {};
        const hallList = (features?.halls ?? []).filter((h: any) => (h?.name ?? '').trim());
        setHalls(hallList);

        const { data: items } = await supabase
          .from('venue_catalogue_items')
          .select('id, title, description, price, image_url')
          .eq('listing_id', vendorId)
          .eq('is_active', true)
          .order('sort_order', { ascending: true });
        setCatalogueItems((items || []) as CatalogueItem[]);
      } else {
        const { data: items } = await supabase
          .from('vendor_catalogue_items')
          .select('id, title, description, price, image_url')
          .eq('vendor_id', vendorId)
          .eq('is_active', true)
          .order('sort_order', { ascending: true });
        setCatalogueItems((items || []) as CatalogueItem[]);
      }
    } catch (e) {
      console.error('Failed to load catalogue:', e);
    } finally {
      setLoadingCatalogue(false);
    }
  }, [vendorId, type]);

  useEffect(() => {
    loadUserDetails();
    loadCatalogueAndHalls();
  }, [loadUserDetails, loadCatalogueAndHalls]);

  useEffect(() => {
    if (initialLineItems && initialLineItems.length > 0) {
      // Map initial line items to catalogue items when available
      const ids = new Set<number>();
      const qtys: Record<number, number> = {};
      initialLineItems.forEach((item) => {
        const catalogueItem = catalogueItems.find((c) => c.title === item.name || c.title === (item as any).title);
        if (catalogueItem) {
          ids.add(catalogueItem.id);
          qtys[catalogueItem.id] = parseFloat(String(item.quantity)) || 1;
        }
      });
      setSelectedIds(ids);
      setQuantities(qtys);
    }
  }, [initialLineItems, catalogueItems]);

  useEffect(() => {
    if (!editMode || !quoteId) return;
    setLoadingEdit(true);
    const load = async () => {
      try {
        if (type === 'venue') {
          const { data } = await supabase
            .from('venue_quote_requests')
            .select('requester_name, requester_email, contact_phone, message, line_items, event_date, end_date, selected_hall')
            .eq('id', quoteId)
            .maybeSingle();
          if (data) {
            const d = data as any;
            setName(d.requester_name ?? name);
            setEmail(d.requester_email ?? email);
            setContactPhone(d.contact_phone ?? '');
            setAdditionalComments(d.message ?? '');
            if (d.event_date) setEventDate(new Date(d.event_date));
            if (d.end_date) setEndDate(new Date(d.end_date));
            setIsMultiDay(!!d.end_date);
            setSelectedHall(d.selected_hall ?? null);
            if (d.line_items) {
              const parsed: QuoteLineItem[] = Array.isArray(d.line_items) ? d.line_items : JSON.parse(d.line_items);
              const ids = new Set<number>();
              const qtys: Record<number, number> = {};
              parsed.forEach((item) => {
                const catalogueItem = catalogueItems.find((c) => c.id === item.catalogue_item_id || c.title === item.title);
                if (catalogueItem) {
                  ids.add(catalogueItem.id);
                  qtys[catalogueItem.id] = Number(item.quantity) || 1;
                }
              });
              setSelectedIds(ids);
              setQuantities(qtys);
            }
          }
        } else {
          const { data } = await supabase
            .from('quote_requests')
            .select('name, email, contact_phone, details, line_items, event_date, end_date')
            .eq('id', quoteId)
            .maybeSingle();
          if (data) {
            const d = data as any;
            setName(d.name ?? name);
            setEmail(d.email ?? email);
            setContactPhone(d.contact_phone ?? '');
            setAdditionalComments(d.details ?? '');
            if (d.event_date) setEventDate(new Date(d.event_date));
            if (d.end_date) setEndDate(new Date(d.end_date));
            setIsMultiDay(!!d.end_date);
            if (d.line_items) {
              const parsed: QuoteLineItem[] = Array.isArray(d.line_items) ? d.line_items : JSON.parse(d.line_items);
              const ids = new Set<number>();
              const qtys: Record<number, number> = {};
              parsed.forEach((item) => {
                const catalogueItem = catalogueItems.find((c) => c.id === item.catalogue_item_id || c.title === item.title);
                if (catalogueItem) {
                  ids.add(catalogueItem.id);
                  qtys[catalogueItem.id] = Number(item.quantity) || 1;
                }
              });
              setSelectedIds(ids);
              setQuantities(qtys);
            }
          }
        }
      } catch (e) {
        console.error('Failed to load quote for edit:', e);
      } finally {
        setLoadingEdit(false);
      }
    };
    load();
  }, [editMode, quoteId, type, catalogueItems, name, email]);

  const formatLineItemsForStorage = () => {
    if (selectedItems.length === 0) return null;
    const items: QuoteLineItem[] = selectedItems.map((item) => ({
      catalogue_item_id: item.id,
      title: item.title,
      description: item.description,
      price: item.price ?? 0,
      quantity: item.quantity,
      image_url: item.image_url,
    }));
    return JSON.stringify(items);
  };

  async function handleSubmit() {
    if (!name.trim() || !email.trim()) {
      setAlertState({ visible: true, title: 'Missing details', message: 'Please provide your name and email.' });
      return;
    }
    if (!eventDate) {
      setAlertState({ visible: true, title: 'Missing event date', message: 'Please select an event date.' });
      return;
    }
    if (isMultiDay && endDate && endDate < eventDate) {
      setAlertState({ visible: true, title: 'Invalid date range', message: 'The end date must be on or after the event date.' });
      return;
    }

    setSubmitting(true);
    try {
      if (editMode && quoteId) {
        if (type === 'venue') {
          const { error: updateError } = await supabase
            .from('venue_quote_requests')
            .update({
              requester_name: name,
              requester_email: email,
              contact_phone: contactPhone || null,
              message: additionalComments || null,
              event_date: formatDateInput(eventDate),
              end_date: isMultiDay && endDate ? formatDateInput(endDate) : null,
              selected_hall: selectedHall,
              line_items: formatLineItemsForStorage(),
              status: 'amended',
              amended_at: new Date().toISOString(),
            })
            .eq('id', quoteId);
          if (updateError) throw updateError;
        } else {
          const { error: updateError } = await supabase
            .from('quote_requests')
            .update({
              name,
              email,
              contact_phone: contactPhone || null,
              details: additionalComments || null,
              event_date: formatDateInput(eventDate),
              end_date: isMultiDay && endDate ? formatDateInput(endDate) : null,
              line_items: formatLineItemsForStorage(),
              status: 'amended',
              amended_at: new Date().toISOString(),
            })
            .eq('id', quoteId);
          if (updateError) throw updateError;
        }
        await createListerInAppNotification(quoteId, true);
        setAlertState({ visible: true, title: 'Quote updated', message: 'Your amendment has been sent to the lister.', buttons: [{ text: 'OK', style: 'default', onPress: () => { setAlertState(null); navigation.goBack(); } }] });
        setSubmitting(false);
        return;
      }

      let quoteRequestId: number | null = null;

      if (type === 'venue') {
        const { data: inserted, error: insertError } = await supabase
          .from('venue_quote_requests')
          .insert({
            listing_id: vendorId,
            requester_user_id: user?.id ?? null,
            requester_name: name,
            requester_email: email,
            requester_phone: contactPhone || null,
            contact_phone: contactPhone || null,
            event_date: formatDateInput(eventDate),
            end_date: isMultiDay && endDate ? formatDateInput(endDate) : null,
            selected_hall: selectedHall,
            message: additionalComments || null,
            line_items: formatLineItemsForStorage(),
            status: 'pending',
          })
          .select('id')
          .single();

        if (insertError) throw insertError;
        quoteRequestId = inserted?.id ?? null;
      } else {
        let userId: number | null = null;
        if (user?.id) {
          const { data: userRow, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('auth_user_id', user.id)
            .maybeSingle();
          if (userError) throw userError;
          if (!userRow) {
            const username = email.split('@')[0] || 'attendee';
            const { data: createdUser, error: createError } = await supabase
              .from('users')
              .insert({
                auth_user_id: user.id,
                username,
                password: 'demo',
                email,
                full_name: name || username,
              })
              .select('id')
              .single();
            if (!createError && createdUser) userId = createdUser.id;
          } else {
            userId = userRow.id;
          }
        }

        const { data: inserted, error: insertError } = await supabase
          .from('quote_requests')
          .insert({
            vendor_id: vendorId,
            user_id: userId,
            name,
            email,
            contact_phone: contactPhone || null,
            status: 'pending',
            details: additionalComments || null,
            event_date: formatDateInput(eventDate),
            end_date: isMultiDay && endDate ? formatDateInput(endDate) : null,
            line_items: formatLineItemsForStorage(),
          })
          .select('id')
          .single();

        if (insertError) throw insertError;
        quoteRequestId = inserted?.id ?? null;
      }

      await sendAdminNotification();
      await createListerInAppNotification(quoteRequestId, false);
      if (type === 'vendor') {
        await sendVendorNotification(vendorId, vendorName, quoteRequestId);
      } else {
        await sendVenueNotification(vendorId, vendorName, quoteRequestId);
      }

      setAlertState({ visible: true, title: 'Quote requested', message: 'Your quote request has been sent successfully.', buttons: [{ text: 'OK', style: 'default', onPress: () => { setAlertState(null); navigation.goBack(); } }] });
    } catch (err: any) {
      console.error('Submit error:', err);
      setAlertState({ visible: true, title: 'Error', message: err?.message ?? 'Failed to submit quote request.' });
    } finally {
      setSubmitting(false);
    }
  }

  async function sendVendorNotification(vendorId: number, vendorName: string, quoteRequestId: number | null) {
    try {
      const { data: vendor } = await supabase
        .from('vendors')
        .select('email, name')
        .eq('id', vendorId)
        .maybeSingle();
      if (!vendor?.email) {
        console.log('Vendor email not found, skipping vendor notification');
        return;
      }
      await supabase.functions.invoke('send-quote-notifications', {
        body: {
          type: 'quote-requested-vendor',
          quoteRequestId: quoteRequestId ?? vendorId,
          clientName: name,
          clientEmail: email,
          vendorBusinessName: vendorName,
          vendorEmail: vendor.email,
          eventDetails: additionalComments || undefined,
          eventDate: formatDateInput(eventDate),
          lineItems: selectedItems.length > 0 ? selectedItems.map((item) => ({ title: item.title, quantity: item.quantity, price: item.price ?? 0 })) : undefined,
        },
      });
    } catch (err) {
      console.error('Failed to send vendor notification:', err);
    }
  }

  async function sendVenueNotification(venueId: number, venueName: string, quoteRequestId: number | null) {
    try {
      const { data: venue } = await supabase
        .from('venue_listings')
        .select('contact_email, name')
        .eq('id', venueId)
        .maybeSingle();
      if (!venue?.contact_email) {
        console.log('Venue contact email not found, skipping venue notification');
        return;
      }
      await supabase.functions.invoke('send-quote-notifications', {
        body: {
          type: 'quote-requested-vendor',
          quoteRequestId: quoteRequestId ?? venueId,
          clientName: name,
          clientEmail: email,
          vendorBusinessName: venueName,
          vendorEmail: venue.contact_email,
          eventDetails: additionalComments || undefined,
          eventDate: formatDateInput(eventDate),
          lineItems: selectedItems.length > 0 ? selectedItems.map((item) => ({ title: item.title, quantity: item.quantity, price: item.price ?? 0 })) : undefined,
        },
      });
    } catch (err) {
      console.error('Failed to send venue notification:', err);
    }
  }

  async function sendAdminNotification() {
    try {
      await supabase.functions.invoke('send-admin-notification', {
        body: {
          type: 'quote-requested',
          customerName: name,
          customerEmail: email,
          vendorId: vendorId,
          vendorName: vendorName,
          quoteDetails: additionalComments || undefined,
          eventDate: formatDateInput(eventDate),
          endDate: isMultiDay && endDate ? formatDateInput(endDate) : undefined,
        },
      });
    } catch (err) {
      console.error('Failed to send admin notification:', err);
    }
  }

  const onDateChange = (field: 'event' | 'end', event: any, date?: Date) => {
    setShowDatePicker(null);
    if (date) {
      if (field === 'event') setEventDate(date);
      else setEndDate(date);
    }
  };

  const cardStyle = {
    padding: isDesktop ? spacing.xl : spacing.lg,
    borderRadius: isDesktop ? radii.xl : 16,
    backgroundColor: isDesktop ? colors.surfaceContainerLowest : colors.surface,
    borderWidth: 1,
    borderColor: isDesktop ? colors.outlineVariant : colors.borderSubtle,
    marginBottom: spacing.lg,
  };

  const renderHeader = () => (
    <View style={cardStyle}>
      <Text style={isDesktop ? { ...typography.labelMd, color: colors.dustyRose, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.05 } : { ...typography.titleMedium, color: colors.textPrimary }}>
        {isDesktop ? (editMode ? 'Amend Quote Request' : 'Request a Quote') : (editMode ? 'Amend your quote request for' : 'Request a quote from')}
      </Text>
      {!isDesktop && (
        <Text style={{ marginTop: spacing.xs, ...typography.body, color: colors.textSecondary }}>
          {vendorName}
        </Text>
      )}
      {isDesktop && (
        <Text style={{ ...typography.headlineMd, color: colors.primary, marginTop: spacing.xs }}>
          {vendorName}
        </Text>
      )}
    </View>
  );

  const renderYourDetails = () => (
    <>
      <Text style={isDesktop ? { ...typography.headlineSm, color: colors.textPrimary, marginBottom: spacing.md } : { ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.md }}>
        Your details
      </Text>

      <Text style={isDesktop ? { ...typography.labelMd, color: colors.dustyRose, marginBottom: spacing.xs, textTransform: 'uppercase' } : { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xs }}>Your name</Text>
      <ThemedInput
        value={name}
        onChangeText={setName}
        placeholder="e.g. Thandi M"
        autoCapitalize="words"
        editable={!loadingUser}
      />

      <Text style={isDesktop ? { ...typography.labelMd, color: colors.dustyRose, marginBottom: spacing.xs, marginTop: spacing.md, textTransform: 'uppercase' } : { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.md }}>
        Email address
      </Text>
      <ThemedInput
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!loadingUser}
      />

      <Text style={isDesktop ? { ...typography.labelMd, color: colors.dustyRose, marginBottom: spacing.xs, marginTop: spacing.md, textTransform: 'uppercase' } : { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.md }}>
        Contact number
      </Text>
      <ThemedInput
        value={contactPhone}
        onChangeText={setContactPhone}
        placeholder="e.g. 082 123 4567"
        keyboardType="phone-pad"
        autoCapitalize="none"
      />

      <Text style={isDesktop ? { ...typography.labelMd, color: colors.dustyRose, marginBottom: spacing.xs, marginTop: spacing.md, textTransform: 'uppercase' } : { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.md }}>
        Event date
      </Text>
      <TouchableOpacity
        onPress={() => setShowDatePicker('event')}
        style={{
          borderWidth: 1,
          borderColor: isDesktop ? colors.outlineVariant : colors.borderSubtle,
          borderRadius: radii.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          backgroundColor: isDesktop ? colors.surfaceContainerLowest : colors.surfaceMuted,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text style={isDesktop ? { ...typography.bodyMd, color: eventDate ? colors.textPrimary : colors.textMuted } : { ...typography.body, color: eventDate ? colors.textPrimary : colors.textMuted }}>
          {eventDate ? eventDate.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Select a date'}
        </Text>
        <MaterialIcons name="calendar-today" size={20} color={colors.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setIsMultiDay((prev) => !prev)}
        style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, marginBottom: isMultiDay ? spacing.sm : 0 }}
      >
        <MaterialIcons
          name={isMultiDay ? 'check-box' : 'check-box-outline-blank'}
          size={22}
          color={isMultiDay ? colors.primary : colors.textMuted}
        />
        <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textPrimary, marginLeft: spacing.sm } : { ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>
          Multi-day event
        </Text>
      </TouchableOpacity>

      {isMultiDay && (
        <>
          <Text style={isDesktop ? { ...typography.labelMd, color: colors.dustyRose, marginBottom: spacing.xs, marginTop: spacing.md, textTransform: 'uppercase' } : { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.md }}>
            End date
          </Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker('end')}
            style={{
              borderWidth: 1,
              borderColor: isDesktop ? colors.outlineVariant : colors.borderSubtle,
              borderRadius: radii.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              backgroundColor: isDesktop ? colors.surfaceContainerLowest : colors.surfaceMuted,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={isDesktop ? { ...typography.bodyMd, color: endDate ? colors.textPrimary : colors.textMuted } : { ...typography.body, color: endDate ? colors.textPrimary : colors.textMuted }}>
              {endDate ? endDate.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Select end date'}
            </Text>
            <MaterialIcons name="calendar-today" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </>
      )}

      {showDatePicker && (
        <DateTimePicker
          value={showDatePicker === 'event' ? (eventDate ?? new Date()) : (endDate ?? new Date())}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={new Date()}
          onChange={(event, date) => onDateChange(showDatePicker, event, date)}
        />
      )}

      {type === 'venue' && halls.length > 0 && (
        <>
          <Text style={isDesktop ? { ...typography.labelMd, color: colors.dustyRose, marginBottom: spacing.xs, marginTop: spacing.md, textTransform: 'uppercase' } : { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.md }}>
            Hall
          </Text>
          <View style={{ gap: spacing.xs }}>
            {halls.map((hall) => (
              <TouchableOpacity
                key={hall.name}
                onPress={() => setSelectedHall(hall.name)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: spacing.sm,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: selectedHall === hall.name ? colors.primary : isDesktop ? colors.outlineVariant : colors.borderSubtle,
                  backgroundColor: selectedHall === hall.name ? colors.surfaceMuted : colors.surface,
                }}
              >
                <MaterialIcons
                  name={selectedHall === hall.name ? 'radio-button-checked' : 'radio-button-unchecked'}
                  size={20}
                  color={selectedHall === hall.name ? colors.primary : colors.textMuted}
                />
                <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                  <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textPrimary } : { ...typography.body, color: colors.textPrimary }}>{hall.name}</Text>
                  {hall.capacity ? (
                    <Text style={isDesktop ? { ...typography.labelMd, color: colors.textMuted } : { ...typography.caption, color: colors.textMuted }}>Capacity: {hall.capacity}</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <Text style={isDesktop ? { ...typography.labelMd, color: colors.dustyRose, marginBottom: spacing.xs, marginTop: spacing.md, textTransform: 'uppercase' } : { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.md }}>
        Additional comments/requests/enquiries (optional)
      </Text>
      <ThemedInput
        value={additionalComments}
        onChangeText={setAdditionalComments}
        placeholder="Any other details the lister should know..."
        multiline
        numberOfLines={4}
        style={{ minHeight: 80, textAlignVertical: 'top' }}
      />
    </>
  );

  const renderCatalogueItems = () => (
    <>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
        <Text style={isDesktop ? { ...typography.headlineSm, color: colors.textPrimary } : { ...typography.titleMedium, color: colors.textPrimary }}>
          Catalogue Items
        </Text>
        {loadingCatalogue && (
          <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textMuted } : { ...typography.caption, color: colors.textMuted }}>Loading...</Text>
        )}
      </View>

      {catalogueItems.length === 0 && !loadingCatalogue && (
        <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.md } : { ...typography.caption, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.md }}>
          No catalogue items available. You can still send a general request.
        </Text>
      )}

      <View style={{ gap: spacing.sm }}>
        {catalogueItems.map((item) => {
          const isSelected = selectedIds.has(item.id);
          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.9}
              onPress={() => toggleItem(item.id)}
              style={{
                flexDirection: 'row',
                borderRadius: radii.md,
                backgroundColor: isDesktop ? colors.surfaceContainerLow : colors.surfaceMuted,
                borderWidth: 2,
                borderColor: isSelected ? colors.primary : isDesktop ? colors.outlineVariant : colors.borderSubtle,
                overflow: 'hidden',
              }}
            >
              {item.image_url ? (
                <Image source={{ uri: item.image_url }} style={{ width: 80, height: 80 }} resizeMode="cover" />
              ) : (
                <View style={{ width: 80, height: 80, backgroundColor: isDesktop ? colors.surfaceContainerLowest : colors.surface, alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialIcons name="image" size={28} color={colors.textMuted} />
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
                  {item.price === null || item.price === undefined ? '—' : `R${Number(item.price).toLocaleString()}`}
                </Text>
              </View>
              <View style={{ justifyContent: 'center', paddingRight: spacing.md }}>
                <MaterialIcons
                  name={isSelected ? 'check-circle' : 'radio-button-unchecked'}
                  size={28}
                  color={isSelected ? colors.primary : colors.textMuted}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );

  const renderSelectionSummary = () => {
    if (selectedItems.length === 0) return null;
    return (
      <>
        <Text style={isDesktop ? { ...typography.headlineSm, color: colors.textPrimary, marginBottom: spacing.md } : { ...typography.titleMedium, color: colors.textPrimary }}>Your Selection</Text>
        <View style={{ gap: spacing.sm }}>
          {selectedItems.map((item) => (
            <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textPrimary } : { ...typography.body, color: colors.textPrimary }} numberOfLines={1}>
                  {item.title}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <TouchableOpacity
                  onPress={() => updateQuantity(item.id, -1)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: isDesktop ? colors.surfaceContainerLow : colors.surface,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialIcons name="remove" size={16} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textPrimary, minWidth: 24, textAlign: 'center' } : { ...typography.body, color: colors.textPrimary, minWidth: 24, textAlign: 'center' }}>
                  {quantities[item.id] || 1}
                </Text>
                <TouchableOpacity
                  onPress={() => updateQuantity(item.id, 1)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: isDesktop ? colors.surfaceContainerLow : colors.surface,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialIcons name="add" size={16} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: isDesktop ? colors.outlineVariant : colors.borderSubtle,
              paddingTop: spacing.sm,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={isDesktop ? { ...typography.bodyMd, fontWeight: '700', color: colors.textPrimary } : { ...typography.bodyBold, color: colors.textPrimary }}>Estimated Total</Text>
            <Text style={isDesktop ? { ...typography.bodyMd, fontWeight: '700', color: colors.primary } : { ...typography.bodyBold, color: colors.primary }}>R{total.toLocaleString('en-ZA')}</Text>
          </View>
        </View>
      </>
    );
  };

  const renderSubmitButton = () => (
    <PrimaryButton
      title={submitting ? (editMode ? 'Updating...' : 'Submitting...') : (editMode ? 'Send amendment' : 'Submit quote request')}
      onPress={handleSubmit}
      disabled={submitting || loadingUser || loadingEdit || loadingCatalogue}
      style={{ marginTop: spacing.lg }}
    />
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: isDesktop ? colors.surfaceBg : colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: isDesktop ? colors.surfaceBg : colors.background }}
        contentContainerStyle={isDesktop ? { paddingHorizontal: 48, paddingTop: spacing.sm, paddingBottom: 160, maxWidth: 1200, width: '100%', alignSelf: 'center' } : { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: 160 }}
        keyboardShouldPersistTaps="handled"
      >
        {isDesktop ? null : (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}
          >
            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
            <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.xs }}>Back</Text>
          </TouchableOpacity>
        )}

        {isDesktop ? (
          <>
            <View style={{ marginBottom: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <View>
                <Text style={{ ...typography.labelMd, color: colors.dustyRose, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.05 }}>
                  {editMode ? 'Amend Quote' : 'Request Quote'}
                </Text>
                <Text style={{ ...typography.headlineMd, color: colors.primary }}>
                  {vendorName}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.gutter } as any}>
              <View style={{ flex: 2, gap: 0 } as any}>
                <View style={cardStyle}>
                  {renderYourDetails()}
                </View>
                <View style={cardStyle}>
                  {renderCatalogueItems()}
                </View>
                {renderSubmitButton()}
              </View>
              <View style={{ flex: 1, gap: 0 } as any}>
                {selectedItems.length > 0 && (
                  <View style={cardStyle}>
                    {renderSelectionSummary()}
                  </View>
                )}
                <View style={cardStyle}>
                  <Text style={{ ...typography.headlineSm, color: colors.textPrimary, marginBottom: spacing.md }}>
                    {type === 'venue' ? 'Venue' : 'Vendor'}
                  </Text>
                  <Text style={{ ...typography.bodyMd, color: colors.textSecondary }}>
                    {vendorName}
                  </Text>
                  <Text style={{ ...typography.bodyMd, color: colors.textMuted, marginTop: spacing.sm }}>
                    Review your selections and event details before submitting your quote request.
                  </Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          <>
            {renderHeader()}
            {(loadingUser || loadingEdit) && (
              <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.md }}>Loading...</Text>
            )}
            <View style={cardStyle}>
              {renderYourDetails()}
              {renderCatalogueItems()}
              {renderSelectionSummary()}
              {renderSubmitButton()}
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
