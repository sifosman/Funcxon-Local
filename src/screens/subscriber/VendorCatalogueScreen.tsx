import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { colors, spacing, radii, typography } from '../../theme';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../auth/AuthContext';
import ThemedAlert from '../../components/ThemedAlert';
import { getCatalogueItemLimit, isCatalogueLimitReached } from '../../lib/catalogue';

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
  subscription_expires_at: string | null;
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
  image_url: string | null;
};

export default function VendorCatalogueScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [vendor, setVendor] = useState<VendorRow | null>(null);
  const [items, setItems] = useState<CatalogueItem[]>([]);
  const [uploadingImage, setUploadingImage] = useState<number | null>(null);
  const [alertState, setAlertState] = useState<{visible: boolean; title: string; message: string; buttons?: any[]} | null>(null);
  const [itemLimit, setItemLimit] = useState<number>(0);

  const [editVisible, setEditVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogueItem | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    price: '',
    is_active: true,
    image_url: null as string | null,
  });

  const canAddMoreItems = useMemo(() => {
    return !isCatalogueLimitReached(items.length, itemLimit);
  }, [items.length, itemLimit]);

  const loadVendorAndItems = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      const { data: vendorRow, error: vendorErr } = await supabase
        .from('vendors')
        .select('id, name, subscription_tier, subscription_status, subscription_expires_at')
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
        .select('id, vendor_id, title, description, price, currency, sort_order, is_active, image_url')
        .eq('vendor_id', vendorRow.id)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (itemsErr) {
        console.error('Failed to load vendor catalogue items:', itemsErr);
        setItems([]);
      } else {
        setItems((itemRows || []) as CatalogueItem[]);
      }

      // Load tier limit for catalogue items
      const limit = await getCatalogueItemLimit('vendor', vendorRow.subscription_tier || 'free');
      setItemLimit(limit);
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
      setAlertState({ visible: true, title: 'No vendor profile found', message: 'Please complete your vendor profile before adding catalogue items.' });
      return;
    }

    if (!canAddMoreItems) {
      setAlertState({
        visible: true,
        title: 'Catalogue Limit Reached',
        message: `Your plan allows up to ${itemLimit} catalogue items. Upgrade to add more.`,
        buttons: [
          { text: 'Not now', style: 'cancel', onPress: () => setAlertState(null) },
          { text: 'View Plans', style: 'default', onPress: () => { setAlertState(null); navigation.navigate('SubscriptionPlans'); } },
        ],
      });
      return;
    }

    setEditingItem(null);
    setEditForm({ title: '', description: '', price: '', is_active: true, image_url: null });
    setEditVisible(true);
  };

  const openEdit = (item: CatalogueItem) => {
    setEditingItem(item);
    setEditForm({
      title: item.title,
      description: item.description || '',
      price: item.price === null || item.price === undefined ? '' : String(item.price),
      is_active: item.is_active,
      image_url: item.image_url || null,
    });
    setEditVisible(true);
  };

  const closeEdit = () => {
    setEditVisible(false);
    setEditingItem(null);
  };

  const handleSave = async () => {
    if (!vendor) {
      setAlertState({ visible: true, title: 'No vendor profile found', message: 'Please complete your vendor profile before adding catalogue items.' });
      return;
    }

    if (!editForm.title.trim()) {
      setAlertState({ visible: true, title: 'Required', message: 'Item title is required.' });
      return;
    }

    if (!editingItem && !canAddMoreItems) {
      setAlertState({
        visible: true,
        title: 'Catalogue Limit Reached',
        message: `Your plan allows up to ${itemLimit} catalogue items. Upgrade to add more.`,
        buttons: [
          { text: 'Not now', style: 'cancel', onPress: () => setAlertState(null) },
          { text: 'View Plans', style: 'default', onPress: () => { setAlertState(null); navigation.navigate('SubscriptionPlans'); } },
        ],
      });
      return;
    }

    const parsedPrice = editForm.price.trim() ? Number(editForm.price.trim()) : null;
    if (editForm.price.trim() && (Number.isNaN(parsedPrice) || parsedPrice === null)) {
      setAlertState({ visible: true, title: 'Invalid price', message: 'Please enter a valid number for price.' });
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
      setAlertState({ visible: true, title: 'Error', message: err?.message ?? 'Failed to save catalogue item.' });
    } finally {
      setSaving(false);
    }
  };

  const pickCatalogueImage = async (itemId: number) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setAlertState({ visible: true, title: 'Permission Required', message: 'Please allow access to your photo library to upload images.' });
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: false,
        allowsEditing: true,
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      setUploadingImage(itemId);
      const fileName = `${user?.id}/${Date.now()}-catalogue-${itemId}.jpg`;
      let fileBody: Blob | ArrayBuffer;
      if (asset.uri.startsWith('data:')) {
        const base64 = asset.uri.split(',')[1];
        fileBody = decode(base64);
      } else {
        const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: 'base64' });
        fileBody = decode(base64);
      }
      const { error: uploadError } = await supabase.storage.from('portfolio-images').upload(fileName, fileBody, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('portfolio-images').getPublicUrl(fileName);
      const { error: updateError } = await supabase.from('vendor_catalogue_items').update({ image_url: publicUrl }).eq('id', itemId);
      if (updateError) throw updateError;
      await loadVendorAndItems();
    } catch (err: any) {
      setAlertState({ visible: true, title: 'Upload failed', message: err?.message ?? 'Could not upload image.' });
    } finally {
      setUploadingImage(null);
    }
  };

  const handleDelete = async (item: CatalogueItem) => {
    setAlertState({
      visible: true,
      title: 'Delete item',
      message: `Remove "${item.title}" from your catalogue?`,
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: () => setAlertState(null) },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setAlertState(null);
            try {
              setSaving(true);
              const { error } = await supabase.from('vendor_catalogue_items').delete().eq('id', item.id);
              if (error) throw error;
              await loadVendorAndItems();
            } catch (err: any) {
              setAlertState({ visible: true, title: 'Error', message: err?.message ?? 'Failed to delete item.' });
            } finally {
              setSaving(false);
            }
          },
        },
      ],
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

  if (!vendor) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
          <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}
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
                <Text style={{ ...typography.bodyBold, color: colors.primary }}>Go to Update Vendor Portfolio</Text>
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
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}
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
          <View style={{ marginBottom: spacing.md }}>
            <Text style={{ ...typography.caption, color: colors.textMuted }}>
              {items.length} of {itemLimit} items used
            </Text>
          </View>

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
            <Text style={{ ...typography.bodyBold, color: '#FFFFFF' }}>
              Add Item
            </Text>
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
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  marginBottom: spacing.md,
                  overflow: 'hidden',
                }}
              >
                <View style={{ flexDirection: 'row' }}>
                  <TouchableOpacity
                    onPress={() => pickCatalogueImage(item.id)}
                    style={{ width: 100, height: 100, backgroundColor: colors.backgroundAlt, alignItems: 'center', justifyContent: 'center' }}
                  >
                    {item.image_url ? (
                      <Image source={{ uri: item.image_url }} style={{ width: 100, height: 100 }} resizeMode="cover" />
                    ) : uploadingImage === item.id ? (
                      <ActivityIndicator color={colors.textPrimary} />
                    ) : (
                      <>
                        <MaterialIcons name="add-photo-alternate" size={28} color={colors.textMuted} />
                        <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.xs }}>Add Photo</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <View style={{ flex: 1, padding: spacing.md, justifyContent: 'center' }}>
                    <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>{item.title}</Text>
                    {item.description ? (
                      <Text style={{ ...typography.body, color: colors.textMuted, marginTop: spacing.xs }} numberOfLines={2}>
                        {item.description}
                      </Text>
                    ) : null}
                    <Text style={{ ...typography.bodyBold, color: colors.textPrimary, marginTop: spacing.sm }}>
                      {item.price === null || item.price === undefined ? '—' : `R${Number(item.price).toLocaleString()}`}
                    </Text>
                    {!item.is_active && (
                      <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.xs }}>
                        Inactive
                      </Text>
                    )}
                  </View>
                  <View style={{ justifyContent: 'center', paddingRight: spacing.md, gap: spacing.sm }}>
                    <TouchableOpacity onPress={() => openEdit(item)} disabled={saving}>
                      <MaterialIcons name="edit" size={20} color={colors.textPrimary} />
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
              <Text style={{ ...typography.bodyBold, color: '#FFFFFF' }}>
                {saving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
