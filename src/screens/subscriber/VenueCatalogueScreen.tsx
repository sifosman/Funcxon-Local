import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radii, typography } from '../../theme';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../auth/AuthContext';
import { getMyVenueEntitlement, isVenueFeatureEnabled } from '../../lib/venueSubscription';

type ProfileStackParamList = {
  UpdateVenuePortfolio: undefined;
  VenueCatalogue: undefined;
  VenueListingPlans: undefined;
};

type VenueListingRow = {
  id: number;
  name: string;
};

type CatalogueItem = {
  id: number;
  listing_id: number;
  title: string;
  description: string | null;
  price: number | null;
  currency: string;
  sort_order: number;
  is_active: boolean;
};

export default function VenueCatalogueScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [listing, setListing] = useState<VenueListingRow | null>(null);
  const [items, setItems] = useState<CatalogueItem[]>([]);

  const [canUseCatalogue, setCanUseCatalogue] = useState<boolean>(false);

  const [editVisible, setEditVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogueItem | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    price: '',
    is_active: true,
  });

  const loadEntitlement = useCallback(async () => {
    if (!user?.id) return;
    const ent = await getMyVenueEntitlement(user.id);
    setCanUseCatalogue(isVenueFeatureEnabled(ent, 'catalogue_pricelist'));
  }, [user?.id]);

  const loadListingAndItems = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      const { data: listingRow, error: listingErr } = await supabase
        .from('venue_listings')
        .select('id, name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (listingErr && (listingErr as any).code !== 'PGRST116') {
        console.error('Failed to load venue listing for catalogue:', listingErr);
      }

      if (!listingRow) {
        setListing(null);
        setItems([]);
        return;
      }

      setListing({ id: listingRow.id, name: listingRow.name });

      const { data: itemRows, error: itemsErr } = await supabase
        .from('venue_catalogue_items')
        .select('id, listing_id, title, description, price, currency, sort_order, is_active')
        .eq('listing_id', listingRow.id)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (itemsErr) {
        console.error('Failed to load catalogue items:', itemsErr);
        setItems([]);
        return;
      }

      setItems((itemRows || []) as CatalogueItem[]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadEntitlement();
    loadListingAndItems();
  }, [loadEntitlement, loadListingAndItems]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [items]);

  const openNew = () => {
    setEditingItem(null);
    setEditForm({ title: '', description: '', price: '', is_active: true });
    setEditVisible(true);
  };

  const openEdit = (item: CatalogueItem) => {
    setEditingItem(item);
    setEditForm({
      title: item.title,
      description: item.description || '',
      price: item.price === null || item.price === undefined ? '' : String(item.price),
      is_active: item.is_active,
    });
    setEditVisible(true);
  };

  const closeEdit = () => {
    setEditVisible(false);
    setEditingItem(null);
  };

  const handleSave = async () => {
    if (!listing) {
      Alert.alert('No listing found', 'Create your venue listing first before adding catalogue items.');
      return;
    }

    if (!editForm.title.trim()) {
      Alert.alert('Required', 'Item title is required.');
      return;
    }

    const parsedPrice = editForm.price.trim() ? Number(editForm.price.trim()) : null;
    if (editForm.price.trim() && (Number.isNaN(parsedPrice) || parsedPrice === null)) {
      Alert.alert('Invalid price', 'Please enter a valid number for price.');
      return;
    }

    setSaving(true);
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('venue_catalogue_items')
          .update({
            title: editForm.title.trim(),
            description: editForm.description.trim() || null,
            price: parsedPrice,
            is_active: editForm.is_active,
          })
          .eq('id', editingItem.id);

        if (error) throw error;
      } else {
        const nextSort = items.length > 0 ? Math.max(...items.map((i) => i.sort_order || 0)) + 1 : 0;
        const { error } = await supabase.from('venue_catalogue_items').insert({
          listing_id: listing.id,
          title: editForm.title.trim(),
          description: editForm.description.trim() || null,
          price: parsedPrice,
          currency: 'ZAR',
          sort_order: nextSort,
          is_active: editForm.is_active,
        });

        if (error) throw error;
      }

      closeEdit();
      await loadListingAndItems();
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to save catalogue item.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: CatalogueItem) => {
    Alert.alert('Delete item', `Remove "${item.title}" from your catalogue?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setSaving(true);
            const { error } = await supabase.from('venue_catalogue_items').delete().eq('id', item.id);
            if (error) throw error;
            await loadListingAndItems();
          } catch (err: any) {
            Alert.alert('Error', err?.message ?? 'Failed to delete item.');
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ ...typography.body, color: colors.textMuted, marginTop: spacing.md }}>Loading catalogue...</Text>
      </View>
    );
  }

  if (!canUseCatalogue) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
          <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.md }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}
            >
              <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
              <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>Back</Text>
            </TouchableOpacity>

            <Text style={{ ...typography.displayMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
              Catalogue / Pricelist
            </Text>
            <Text style={{ ...typography.body, color: colors.textMuted }}>
              This feature is available on paid venue plans.
            </Text>
          </View>

          <View style={{ paddingHorizontal: spacing.lg }}>
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
              <Text style={{ ...typography.body, color: '#9A3412', marginBottom: spacing.md }}>
                Upgrade your venue plan to add a catalogue/pricelist.
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
                <Text style={{ ...typography.body, color: '#FFFFFF', fontWeight: '700' }}>View Venue Plans</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
          <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.md }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}
            >
              <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
              <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>Back</Text>
            </TouchableOpacity>

            <Text style={{ ...typography.displayMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
              Catalogue / Pricelist
            </Text>
            <Text style={{ ...typography.body, color: colors.textMuted }}>
              Create your venue listing first.
            </Text>
          </View>

          <View style={{ paddingHorizontal: spacing.lg }}>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: radii.lg,
                padding: spacing.lg,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
              }}
            >
              <Text style={{ ...typography.body, color: colors.textPrimary }}>
                You don’t have a venue listing yet. Please create it in “Update Venue Portfolio” before adding catalogue items.
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
                <Text style={{ ...typography.body, color: colors.primary, fontWeight: '700' }}>Go to Update Venue Portfolio</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.md }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}
          >
            <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
            <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>Back</Text>
          </TouchableOpacity>

          <Text style={{ ...typography.displayMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
            Catalogue / Pricelist
          </Text>
          <Text style={{ ...typography.body, color: colors.textMuted }}>
            {listing.name}
          </Text>
        </View>

        <View style={{ paddingHorizontal: spacing.lg }}>
          <TouchableOpacity
            onPress={openNew}
            disabled={saving}
            style={{
              backgroundColor: saving ? colors.textMuted : colors.primary,
              borderRadius: radii.lg,
              paddingVertical: spacing.md,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing.md,
            }}
          >
            <MaterialIcons name="add" size={20} color="#FFFFFF" style={{ marginRight: spacing.sm }} />
            <Text style={{ ...typography.body, color: '#FFFFFF', fontWeight: '700' }}>Add Item</Text>
          </TouchableOpacity>

          {sortedItems.length === 0 ? (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: radii.lg,
                padding: spacing.xl,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                alignItems: 'center',
              }}
            >
              <MaterialIcons name="inventory-2" size={48} color={colors.textMuted} />
              <Text style={{ ...typography.body, color: colors.textMuted, marginTop: spacing.md, textAlign: 'center' }}>
                No catalogue items yet.
              </Text>
            </View>
          ) : (
            sortedItems.map((item) => (
              <View
                key={item.id}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: radii.lg,
                  padding: spacing.lg,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  marginBottom: spacing.md,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1, paddingRight: spacing.md }}>
                    <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>{item.title}</Text>
                    {item.description ? (
                      <Text style={{ ...typography.body, color: colors.textMuted, marginTop: spacing.xs }}>
                        {item.description}
                      </Text>
                    ) : null}
                    <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '700', marginTop: spacing.sm }}>
                      {item.price === null || item.price === undefined ? '—' : `R${Number(item.price).toLocaleString()}`}
                    </Text>
                    {!item.is_active && (
                      <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.xs }}>
                        Inactive
                      </Text>
                    )}
                  </View>

                  <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                    <TouchableOpacity onPress={() => openEdit(item)} disabled={saving}>
                      <MaterialIcons name="edit" size={20} color={colors.primaryTeal} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item)} disabled={saving}>
                      <MaterialIcons name="delete-outline" size={20} color={colors.destructive} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={editVisible} transparent animationType="fade" onRequestClose={closeEdit}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.lg }}>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radii.lg,
              padding: spacing.lg,
              borderWidth: 1,
              borderColor: colors.borderSubtle,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>
                {editingItem ? 'Edit item' : 'Add item'}
              </Text>
              <TouchableOpacity onPress={closeEdit}>
                <MaterialIcons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>Title</Text>
            <TextInput
              value={editForm.title}
              onChangeText={(v) => setEditForm((p) => ({ ...p, title: v }))}
              placeholder="e.g. Venue hire"
              placeholderTextColor={colors.textMuted}
              style={{
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                borderRadius: radii.md,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                backgroundColor: colors.surfaceMuted,
                color: colors.textPrimary,
                marginBottom: spacing.md,
              }}
            />

            <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>Description</Text>
            <TextInput
              value={editForm.description}
              onChangeText={(v) => setEditForm((p) => ({ ...p, description: v }))}
              placeholder="Optional description"
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
                marginBottom: spacing.md,
              }}
            />

            <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>Price (ZAR)</Text>
            <TextInput
              value={editForm.price}
              onChangeText={(v) => setEditForm((p) => ({ ...p, price: v }))}
              placeholder="e.g. 1500"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              style={{
                borderWidth: 1,
                borderColor: colors.borderSubtle,
                borderRadius: radii.md,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                backgroundColor: colors.surfaceMuted,
                color: colors.textPrimary,
                marginBottom: spacing.md,
              }}
            />

            <TouchableOpacity
              onPress={() => setEditForm((p) => ({ ...p, is_active: !p.is_active }))}
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}
            >
              <MaterialIcons
                name={editForm.is_active ? 'check-box' : 'check-box-outline-blank'}
                size={22}
                color={editForm.is_active ? colors.primaryTeal : colors.textMuted}
              />
              <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>
                Active
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              disabled={saving}
              style={{
                backgroundColor: saving ? colors.textMuted : colors.primary,
                borderRadius: radii.md,
                paddingVertical: spacing.md,
                alignItems: 'center',
              }}
            >
              <Text style={{ ...typography.body, color: '#FFFFFF', fontWeight: '700' }}>
                {saving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
