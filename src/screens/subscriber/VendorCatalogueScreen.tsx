import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radii, typography } from '../../theme';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../auth/AuthContext';

type ProfileStackParamList = {
  UpdateVendorPortfolio: undefined;
  VendorCatalogue: undefined;
  SubscriptionPlans: undefined;
};

type VendorRow = {
  id: number;
  name: string;
  subscription_tier: string | null;
  subscription_status: string | null;
};

type CatalogueItem = {
  id: number;
  vendor_id: number;
  title: string;
  description: string | null;
  price: number | null;
  currency: string;
  sort_order: number;
  is_active: boolean;
};

const FREE_CATALOGUE_LIMIT = 10;

export default function VendorCatalogueScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [vendor, setVendor] = useState<VendorRow | null>(null);
  const [items, setItems] = useState<CatalogueItem[]>([]);

  const [editVisible, setEditVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogueItem | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    price: '',
    is_active: true,
  });

  const isFreeTier = useMemo(() => {
    const tier = String(vendor?.subscription_tier ?? '').toLowerCase();
    return tier === '' || tier === 'free' || tier === 'get_started' || tier === 'get started';
  }, [vendor?.subscription_tier]);

  const canAddMoreItems = useMemo(() => {
    if (!isFreeTier) return true;
    return items.length < FREE_CATALOGUE_LIMIT;
  }, [isFreeTier, items.length]);

  const loadVendorAndItems = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      const { data: vendorRow, error: vendorErr } = await supabase
        .from('vendors')
        .select('id, name, subscription_tier, subscription_status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (vendorErr && (vendorErr as any).code !== 'PGRST116') {
        console.error('Failed to load vendor for catalogue:', vendorErr);
      }

      if (!vendorRow) {
        setVendor(null);
        setItems([]);
        return;
      }

      setVendor(vendorRow as VendorRow);

      const { data: itemRows, error: itemsErr } = await supabase
        .from('vendor_catalogue_items')
        .select('id, vendor_id, title, description, price, currency, sort_order, is_active')
        .eq('vendor_id', vendorRow.id)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (itemsErr) {
        console.error('Failed to load vendor catalogue items:', itemsErr);
        setItems([]);
        return;
      }

      setItems((itemRows || []) as CatalogueItem[]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadVendorAndItems();
  }, [loadVendorAndItems]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [items]);

  const openNew = () => {
    if (!vendor) {
      Alert.alert('No vendor profile found', 'Please complete your vendor profile before adding catalogue items.');
      return;
    }

    if (!canAddMoreItems) {
      Alert.alert(
        'Catalogue Limit Reached',
        `Your free plan allows up to ${FREE_CATALOGUE_LIMIT} catalogue items. Upgrade to add more.`,
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'View Plans', onPress: () => navigation.navigate('SubscriptionPlans') },
        ],
      );
      return;
    }

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
    if (!vendor) {
      Alert.alert('No vendor profile found', 'Please complete your vendor profile before adding catalogue items.');
      return;
    }

    if (!editForm.title.trim()) {
      Alert.alert('Required', 'Item title is required.');
      return;
    }

    if (!editingItem && !canAddMoreItems) {
      Alert.alert(
        'Catalogue Limit Reached',
        `Your free plan allows up to ${FREE_CATALOGUE_LIMIT} catalogue items. Upgrade to add more.`,
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'View Plans', onPress: () => navigation.navigate('SubscriptionPlans') },
        ],
      );
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
          .from('vendor_catalogue_items')
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
        const { error } = await supabase.from('vendor_catalogue_items').insert({
          vendor_id: vendor.id,
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
      await loadVendorAndItems();
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
            const { error } = await supabase.from('vendor_catalogue_items').delete().eq('id', item.id);
            if (error) throw error;
            await loadVendorAndItems();
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

  if (!vendor) {
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
              Create your vendor profile first.
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
                You don’t have a vendor profile yet. Please create it in “Update Vendor Portfolio” before adding catalogue items.
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('UpdateVendorPortfolio')}
                style={{
                  marginTop: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: colors.primary,
                  alignItems: 'center',
                }}
              >
                <Text style={{ ...typography.body, color: colors.primary, fontWeight: '700' }}>Go to Update Vendor Portfolio</Text>
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
            {vendor.name}
          </Text>
        </View>

        <View style={{ paddingHorizontal: spacing.lg }}>
          <TouchableOpacity
            onPress={openNew}
            disabled={saving || (!editingItem && !canAddMoreItems)}
            style={{
              backgroundColor: saving ? colors.textMuted : colors.primary,
              borderRadius: radii.lg,
              paddingVertical: spacing.md,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing.md,
              opacity: saving ? 0.7 : 1,
            }}
          >
            <MaterialIcons name="add" size={20} color="#FFFFFF" style={{ marginRight: spacing.sm }} />
            <Text style={{ ...typography.body, color: '#FFFFFF', fontWeight: '700' }}>
              Add Item
            </Text>
          </TouchableOpacity>

          {isFreeTier && (
            <View
              style={{
                backgroundColor: '#FFF7ED',
                borderRadius: radii.lg,
                padding: spacing.md,
                borderWidth: 1,
                borderColor: '#FDBA74',
                marginBottom: spacing.md,
              }}
            >
              <Text style={{ ...typography.caption, color: '#9A3412', fontWeight: '600' }}>
                Free plan limit
              </Text>
              <Text style={{ ...typography.caption, color: '#9A3412', marginTop: 2 }}>
                {items.length} of {FREE_CATALOGUE_LIMIT} items used.
              </Text>
            </View>
          )}

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
              placeholder="e.g. Starter package"
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
                borderRadius: radii.lg,
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
