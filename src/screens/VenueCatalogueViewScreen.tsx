import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Linking, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import ThemedAlert from '../components/ThemedAlert';
import NetworkImage from '../components/NetworkImage';
import { MaterialIcons} from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AttendeeStackParamList } from '../navigation/AttendeeNavigator';
import { colors, spacing, radii, typography } from '../theme';
import { useIsDesktop } from '../hooks/useIsDesktop';
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
  const { session } = useAuth();
  const isDesktop = useIsDesktop();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<CatalogueItem[]>([]);
  const [pdfDocs, setPdfDocs] = useState<PdfDocument[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  const [alertState, setAlertState] = useState<{visible: boolean; title: string; message: string} | null>(null);

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
  };

  const updateQuantity = (id: number, delta: number) => {
    setQuantities((prev) => {
      const current = prev[id] || 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [id]: next };
    });
  };

  const handleRequestQuote = () => {
    if (selectedItems.length === 0) {
      setAlertState({ visible: true, title: 'No items selected', message: 'Please select at least one catalogue item.' });
      return;
    }
    if (!session) {
      (navigation as any).getParent()?.getParent()?.navigate('Auth', { screen: 'SignIn' });
      return;
    }
    navigation.navigate('QuoteRequest', {
      vendorId: venueId,
      vendorName: venueName,
      type: 'venue',
      initialLineItems: selectedItems.map((item) => ({
        name: item.title,
        quantity: String(quantities[item.id] || 1),
        price: item.price != null ? String(item.price) : '',
      })),
    });
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

  const renderCatalogueItem = (item: CatalogueItem) => {
    const isSelected = selectedIds.has(item.id);
    return (
      <TouchableOpacity
        key={item.id}
        activeOpacity={0.9}
        onPress={() => toggleItem(item.id)}
        style={isDesktop ? ({
          width: 'calc(33.3333% - 16px)',
          borderRadius: radii.lg,
          backgroundColor: colors.surfaceContainerLowest,
          borderWidth: 2,
          borderColor: isSelected ? colors.textPrimary : colors.outlineVariant,
          overflow: 'hidden',
        } as any) : {
          flexDirection: 'row',
          borderRadius: radii.lg,
          backgroundColor: colors.surface,
          borderWidth: 2,
          borderColor: isSelected ? colors.textPrimary : colors.borderSubtle,
          overflow: 'hidden',
        }}
      >
        {isDesktop ? (
          <View>
            {item.image_url ? (
              <NetworkImage
                uri={item.image_url}
                style={{ width: '100%', height: 160 }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{
                  width: '100%',
                  height: 160,
                  backgroundColor: colors.surfaceMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MaterialIcons name="image" size={40} color={colors.textMuted} />
              </View>
            )}
            <View style={{ position: 'absolute', top: spacing.sm, right: spacing.sm }}>
              <MaterialIcons
                name={isSelected ? 'check-circle' : 'radio-button-unchecked'}
                size={28}
                color={isSelected ? colors.textPrimary : colors.outlineVariant}
              />
            </View>
          </View>
        ) : (
          <>
            {item.image_url ? (
              <NetworkImage
                uri={item.image_url}
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
          </>
        )}
        <View style={{ flex: 1, padding: spacing.md, justifyContent: 'center' }}>
          <Text style={{ ...(isDesktop ? typography.titleMedium : typography.bodySemiBold), color: colors.textPrimary }}>
            {item.title}
          </Text>
          {item.description ? (
            <Text style={{ ...(isDesktop ? typography.bodyMd : typography.caption), color: colors.textMuted, marginTop: 2 }} numberOfLines={isDesktop ? 3 : 2}>
              {item.description}
            </Text>
          ) : null}
          <Text style={{ ...(isDesktop ? typography.bodyMd : typography.bodyBold), color: colors.textPrimary, marginTop: spacing.sm }}>
            R{Number(item.price ?? 0).toLocaleString()}
          </Text>
        </View>
        {!isDesktop && (
          <View style={{ justifyContent: 'center', paddingRight: spacing.md }}>
            <MaterialIcons
              name={isSelected ? 'check-circle' : 'radio-button-unchecked'}
              size={28}
              color={isSelected ? colors.textPrimary : colors.borderSubtle}
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: isDesktop ? colors.surfaceBg : colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={isDesktop ? { paddingHorizontal: 48, paddingTop: spacing.sm, paddingBottom: 140, maxWidth: 1200, width: '100%', alignSelf: 'center' } : { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: 140 }}
        keyboardShouldPersistTaps="handled"
      >
        {isDesktop ? null : (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}
          >
            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
            <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>Back</Text>
          </TouchableOpacity>
        )}

        <View style={{ marginBottom: spacing.lg }}>
          {isDesktop && (
            <Text style={{ ...typography.labelMd, color: colors.dustyRose, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.05 }}>
              Catalogue
            </Text>
          )}
          <Text style={{ ...(isDesktop ? typography.headlineMd : typography.titleLarge), color: colors.textPrimary, marginBottom: spacing.xs }}>
            {venueName}
          </Text>
          <Text style={{ ...(isDesktop ? typography.bodyMd : typography.body), color: colors.textMuted, marginBottom: spacing.lg }}>
            Catalogue
          </Text>
        </View>

        {!hasCatalogueItems && pdfDocs.length === 0 && (
          <View
            style={{
              padding: spacing.xl,
              borderRadius: radii.lg,
              backgroundColor: isDesktop ? colors.surfaceContainerLowest : colors.surface,
              borderWidth: 1,
              borderColor: isDesktop ? colors.outlineVariant : colors.borderSubtle,
              alignItems: 'center',
            }}
          >
            <MaterialIcons name="inventory-2" size={48} color={colors.textMuted} />
            <Text style={{ ...(isDesktop ? typography.bodyMd : typography.body), color: colors.textMuted, marginTop: spacing.md, textAlign: 'center' }}>
              No catalogue items available yet.
            </Text>
          </View>
        )}

        {!hasCatalogueItems && pdfDocs.length > 0 && (
          <View style={{ gap: spacing.md }}>
            <Text style={{ ...(isDesktop ? typography.headlineSm : typography.titleMedium), color: colors.textPrimary, marginBottom: spacing.sm }}>
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
                  backgroundColor: isDesktop ? colors.surfaceContainerLowest : colors.surface,
                  borderWidth: 1,
                  borderColor: isDesktop ? colors.outlineVariant : colors.borderSubtle,
                  gap: spacing.sm,
                }}
              >
                <MaterialIcons name="picture-as-pdf" size={28} color={colors.destructive} />
                <Text style={{ ...(isDesktop ? typography.bodyMd : typography.body), color: colors.textPrimary, flex: 1 }} numberOfLines={1}>
                  {doc.file_name || 'Catalogue PDF'}
                </Text>
                <MaterialIcons name="open-in-new" size={18} color={colors.textPrimary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {hasCatalogueItems && (
          <View style={{ gap: spacing.md }}>
            {isDesktop && (
              <Text style={{ ...typography.headlineSm, color: colors.textPrimary, marginBottom: spacing.sm }}>
                Items
              </Text>
            )}
            <View style={isDesktop ? { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md } as any : { gap: spacing.md }}>
              {activeItems.map(renderCatalogueItem)}
            </View>

            {selectedItems.length > 0 && (
              <View
                style={{
                  padding: spacing.lg,
                  borderRadius: radii.lg,
                  backgroundColor: isDesktop ? colors.surfaceContainerLowest : colors.surface,
                  borderWidth: 1,
                  borderColor: isDesktop ? colors.outlineVariant : colors.borderSubtle,
                  gap: spacing.md,
                  ...(isDesktop ? { maxWidth: 800, width: '100%', alignSelf: 'center' } : {}),
                }}
              >
                <Text style={{ ...(isDesktop ? typography.headlineSm : typography.titleMedium), color: colors.textPrimary }}>Your Selection</Text>
                {selectedItems.map((item) => (
                  <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ ...(isDesktop ? typography.bodyMd : typography.body), color: colors.textPrimary }}>{item.title}</Text>
                      <Text style={{ ...(isDesktop ? typography.bodyMd : typography.caption), color: colors.textMuted }}>
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
                      <Text style={{ ...(isDesktop ? typography.bodyMd : typography.body), color: colors.textPrimary, minWidth: 24, textAlign: 'center' }}>
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
                  <Text style={{ ...(isDesktop ? typography.headlineSm : typography.titleMedium), color: colors.textPrimary }}>Total</Text>
                  <Text style={{ ...(isDesktop ? typography.headlineSm : typography.titleMedium), color: colors.textPrimary }}>R{total.toLocaleString()}</Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              onPress={handleRequestQuote}
              disabled={selectedItems.length === 0}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: spacing.md,
                borderRadius: radii.lg,
                backgroundColor: selectedItems.length > 0 ? colors.textPrimary : colors.surfaceMuted,
                gap: spacing.sm,
                ...(isDesktop ? { maxWidth: 800, width: '100%', alignSelf: 'center' } : {}),
              }}
            >
              <MaterialIcons name="request-quote" size={20} color="#FFFFFF" />
              <Text style={{ ...typography.bodyBold, color: '#FFFFFF' }}>Request Quote</Text>
            </TouchableOpacity>

            {selectedItems.length > 0 && (
              <Text style={{ ...(isDesktop ? typography.bodyMd : typography.caption), color: colors.textMuted, textAlign: 'center' }}>
                Selected items will be pre-filled on the quote request screen.
              </Text>
            )}
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
    </KeyboardAvoidingView>
  );
}
