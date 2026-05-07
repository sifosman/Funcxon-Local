import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Linking, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AttendeeStackParamList } from '../navigation/AttendeeNavigator';
import { colors, spacing, radii, typography } from '../theme';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';

type Props = NativeStackScreenProps<AttendeeStackParamList, 'VenueCatalogueView'>;

type CatalogueItem = {
  id: number;
  listing_id: number;
  title: string;
  description: string | null;
  price: number | null;
  currency: string;
  sort_order: number;
  is_active: boolean;
  image_url: string | null;
};

type PdfDocument = {
  id: number;
  document_url: string;
  file_name: string | null;
  created_at: string;
};

export default function VenueCatalogueViewScreen({ route, navigation }: Props) {
  const { venueId, venueName } = route.params;
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<CatalogueItem[]>([]);
  const [pdfDocs, setPdfDocs] = useState<PdfDocument[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventDetails, setEventDetails] = useState('');
  const [showQuoteForm, setShowQuoteForm] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: itemRows, error: itemsErr } = await supabase
        .from('venue_catalogue_items')
        .select('id, listing_id, title, description, price, currency, sort_order, is_active, image_url')
        .eq('listing_id', venueId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      const { data: pdfRows } = await supabase
        .from('venue_documents')
        .select('id, document_url, file_name, created_at')
        .eq('venue_id', venueId)
        .eq('document_type', 'catalogue_pdf')
        .order('created_at', { ascending: false });

      if (itemsErr) {
        console.error('Failed to load catalogue items:', itemsErr);
        setItems([]);
      } else {
        setItems((itemRows || []) as CatalogueItem[]);
      }
      setPdfDocs((pdfRows || []) as PdfDocument[]);
    } finally {
      setLoading(false);
    }
  }, [venueId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeItems = useMemo(() => items.filter((i) => i.is_active), [items]);

  const selectedItems = useMemo(() => {
    return activeItems.filter((item) => selectedIds.has(item.id)).map((item) => ({
      ...item,
      quantity: quantities[item.id] || 1,
    }));
  }, [activeItems, selectedIds, quantities]);

  const total = useMemo(() => {
    return selectedItems.reduce((sum, item) => {
      const qty = quantities[item.id] || 1;
      return sum + (item.price ?? 0) * qty;
    }, 0);
  }, [selectedItems, quantities]);

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
    setSaved(false);
  };

  const updateQuantity = (id: number, delta: number) => {
    setQuantities((prev) => {
      const current = prev[id] || 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [id]: next };
    });
    setSaved(false);
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      Alert.alert('Saved', 'Your selection has been saved.');
    }, 400);
  };

  const handleSubmitQuotation = async () => {
    if (!user?.id) {
      Alert.alert('Sign in required', 'Please sign in to submit a quotation.');
      return;
    }
    if (!clientName.trim() || !clientEmail.trim()) {
      Alert.alert('Missing details', 'Please provide your name and email.');
      return;
    }
    if (selectedItems.length === 0) {
      Alert.alert('No items selected', 'Please select at least one catalogue item.');
      return;
    }

    const itemsSummary = selectedItems
      .map((item) => `- ${item.title} x${quantities[item.id] || 1} @ R${Number(item.price ?? 0).toLocaleString()}`)
      .join('\n');
    const totalLine = `\nTotal: R${total.toLocaleString()}`;
    const fullMessage = `Catalogue Quotation Request:\n\n${itemsSummary}${totalLine}\n\nEvent Details:\n${eventDetails || 'N/A'}\nEvent Date: ${eventDate || 'N/A'}\nPhone: ${clientPhone || 'N/A'}`;

    setSaving(true);
    try {
      const { error: insertError } = await supabase.from('venue_quote_requests').insert({
        listing_id: venueId,
        requester_user_id: user.id,
        requester_name: clientName,
        requester_email: clientEmail,
        requester_phone: clientPhone.trim() || null,
        event_date: eventDate.trim() || null,
        message: fullMessage,
        status: 'pending',
      });

      if (insertError) throw insertError;

      Alert.alert('Quotation Submitted', 'Your catalogue quotation has been sent to the venue. You will be notified when they respond.');
      setShowQuoteForm(false);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to submit quotation.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ ...typography.body, color: colors.textMuted, marginTop: spacing.md }}>Loading catalogue...</Text>
      </View>
    );
  }

  const hasCatalogueItems = activeItems.length > 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, paddingBottom: 140 }}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}
        >
          <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
          <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>Back</Text>
        </TouchableOpacity>

        <Text style={{ ...typography.titleLarge, color: colors.textPrimary, marginBottom: spacing.xs }}>
          {venueName}
        </Text>
        <Text style={{ ...typography.body, color: colors.textMuted, marginBottom: spacing.lg }}>
          Catalogue
        </Text>

        {!hasCatalogueItems && pdfDocs.length === 0 && (
          <View
            style={{
              padding: spacing.xl,
              borderRadius: radii.lg,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              alignItems: 'center',
            }}
          >
            <MaterialIcons name="inventory-2" size={48} color={colors.textMuted} />
            <Text style={{ ...typography.body, color: colors.textMuted, marginTop: spacing.md, textAlign: 'center' }}>
              No catalogue items available yet.
            </Text>
          </View>
        )}

        {!hasCatalogueItems && pdfDocs.length > 0 && (
          <View style={{ gap: spacing.md }}>
            <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.sm }}>
              PDF Catalogue
            </Text>
            {pdfDocs.map((doc) => (
              <TouchableOpacity
                key={doc.id}
                onPress={() => {
                  if (doc.document_url) {
                    Linking.openURL(doc.document_url).catch(() => null);
                  }
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: spacing.md,
                  borderRadius: radii.lg,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  gap: spacing.sm,
                }}
              >
                <MaterialIcons name="picture-as-pdf" size={28} color={colors.destructive} />
                <Text style={{ ...typography.body, color: colors.textPrimary, flex: 1 }} numberOfLines={1}>
                  {doc.file_name || 'Catalogue PDF'}
                </Text>
                <MaterialIcons name="open-in-new" size={18} color={colors.primaryTeal} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {hasCatalogueItems && (
          <View style={{ gap: spacing.md }}>
            {activeItems.map((item) => {
              const isSelected = selectedIds.has(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.9}
                  onPress={() => toggleItem(item.id)}
                  style={{
                    flexDirection: 'row',
                    borderRadius: radii.lg,
                    backgroundColor: colors.surface,
                    borderWidth: 2,
                    borderColor: isSelected ? colors.primaryTeal : colors.borderSubtle,
                    overflow: 'hidden',
                  }}
                >
                  {item.image_url ? (
                    <Image
                      source={{ uri: item.image_url }}
                      style={{ width: 100, height: 100 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: 100,
                        height: 100,
                        backgroundColor: colors.surfaceMuted,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <MaterialIcons name="image" size={32} color={colors.textMuted} />
                    </View>
                  )}
                  <View style={{ flex: 1, padding: spacing.md, justifyContent: 'center' }}>
                    <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
                      {item.title}
                    </Text>
                    {item.description ? (
                      <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: 2 }} numberOfLines={2}>
                        {item.description}
                      </Text>
                    ) : null}
                    <Text style={{ ...typography.body, color: colors.primaryTeal, fontWeight: '700', marginTop: spacing.sm }}>
                      R{Number(item.price ?? 0).toLocaleString()}
                    </Text>
                  </View>
                  <View style={{ justifyContent: 'center', paddingRight: spacing.md }}>
                    <MaterialIcons
                      name={isSelected ? 'check-circle' : 'radio-button-unchecked'}
                      size={28}
                      color={isSelected ? colors.primaryTeal : colors.borderSubtle}
                    />
                  </View>
                </TouchableOpacity>
              );
            })}

            {selectedItems.length > 0 && (
              <View
                style={{
                  padding: spacing.lg,
                  borderRadius: radii.lg,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  gap: spacing.md,
                }}
              >
                <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>Your Selection</Text>
                {selectedItems.map((item) => (
                  <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ ...typography.body, color: colors.textPrimary }}>{item.title}</Text>
                      <Text style={{ ...typography.caption, color: colors.textMuted }}>
                        R{Number(item.price ?? 0).toLocaleString()} each
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                      <TouchableOpacity
                        onPress={() => updateQuantity(item.id, -1)}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: colors.surfaceMuted,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <MaterialIcons name="remove" size={16} color={colors.textPrimary} />
                      </TouchableOpacity>
                      <Text style={{ ...typography.body, color: colors.textPrimary, minWidth: 24, textAlign: 'center' }}>
                        {quantities[item.id] || 1}
                      </Text>
                      <TouchableOpacity
                        onPress={() => updateQuantity(item.id, 1)}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: colors.surfaceMuted,
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
                    borderTopColor: colors.borderSubtle,
                    paddingTop: spacing.md,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>Total</Text>
                  <Text style={{ ...typography.titleMedium, color: colors.primaryTeal }}>R{total.toLocaleString()}</Text>
                </View>
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: spacing.md,
                  borderRadius: radii.lg,
                  backgroundColor: saved ? colors.surfaceMuted : colors.surface,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  gap: spacing.sm,
                }}
              >
                <MaterialIcons name={saved ? 'check' : 'save'} size={20} color={saved ? '#16A34A' : colors.textMuted} />
                <Text style={{ ...typography.body, color: saved ? '#16A34A' : colors.textPrimary, fontWeight: '600' }}>
                  {saved ? 'Saved' : 'Save'}
                </Text>
              </TouchableOpacity>

              {saved && (
                <TouchableOpacity
                  onPress={() => setShowQuoteForm(true)}
                  disabled={saving || selectedItems.length === 0}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: spacing.md,
                    borderRadius: radii.lg,
                    backgroundColor: selectedItems.length > 0 ? colors.primaryTeal : colors.surfaceMuted,
                    gap: spacing.sm,
                  }}
                >
                  <MaterialIcons name="send" size={20} color="#FFFFFF" />
                  <Text style={{ ...typography.body, color: '#FFFFFF', fontWeight: '700' }}>Submit Quotation</Text>
                </TouchableOpacity>
              )}
            </View>

            {!saved && selectedItems.length > 0 && (
              <Text style={{ ...typography.caption, color: colors.textMuted, textAlign: 'center' }}>
                Save your selection before submitting a quotation.
              </Text>
            )}
          </View>
        )}

        {/* Quote Form */}
        {showQuoteForm && (
          <View
            style={{
              marginTop: spacing.lg,
              padding: spacing.lg,
              borderRadius: radii.lg,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
              gap: spacing.md,
            }}
          >
            <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.sm }}>
              Submit Quotation
            </Text>
            <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.sm }}>
              The venue will receive your selected items and contact you.
            </Text>

            <Text style={{ ...typography.label, color: colors.textSecondary }}>Your Name *</Text>
            <TextInput
              value={clientName}
              onChangeText={setClientName}
              placeholder="e.g. Thandi M"
              placeholderTextColor={colors.textMuted}
              style={{
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                borderRadius: radii.md,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                backgroundColor: colors.surfaceMuted,
                color: colors.textPrimary,
              }}
            />

            <Text style={{ ...typography.label, color: colors.textSecondary }}>Email *</Text>
            <TextInput
              value={clientEmail}
              onChangeText={setClientEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              style={{
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                borderRadius: radii.md,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                backgroundColor: colors.surfaceMuted,
                color: colors.textPrimary,
              }}
            />

            <Text style={{ ...typography.label, color: colors.textSecondary }}>Phone</Text>
            <TextInput
              value={clientPhone}
              onChangeText={setClientPhone}
              placeholder="+27 ..."
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              style={{
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                borderRadius: radii.md,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                backgroundColor: colors.surfaceMuted,
                color: colors.textPrimary,
              }}
            />

            <Text style={{ ...typography.label, color: colors.textSecondary }}>Event Date</Text>
            <TextInput
              value={eventDate}
              onChangeText={setEventDate}
              placeholder="e.g. 2026-06-15"
              placeholderTextColor={colors.textMuted}
              style={{
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                borderRadius: radii.md,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                backgroundColor: colors.surfaceMuted,
                color: colors.textPrimary,
              }}
            />

            <Text style={{ ...typography.label, color: colors.textSecondary }}>Event Details</Text>
            <TextInput
              value={eventDetails}
              onChangeText={setEventDetails}
              placeholder="Guest count, type of event, special requests..."
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
                minHeight: 90,
                textAlignVertical: 'top',
              }}
            />

            <TouchableOpacity
              onPress={handleSubmitQuotation}
              disabled={saving}
              style={{
                paddingVertical: spacing.md,
                borderRadius: radii.lg,
                backgroundColor: saving ? colors.textMuted : colors.primaryTeal,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: spacing.sm,
              }}
            >
              <MaterialIcons name="send" size={20} color="#FFFFFF" />
              <Text style={{ ...typography.body, color: '#FFFFFF', fontWeight: '700' }}>
                {saving ? 'Submitting...' : 'Submit Quotation'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowQuoteForm(false)}
              style={{ alignItems: 'center', paddingVertical: spacing.sm }}
            >
              <Text style={{ ...typography.body, color: colors.textMuted }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
