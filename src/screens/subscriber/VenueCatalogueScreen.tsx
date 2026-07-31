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
import { getMyVenueEntitlement, isVenueFeatureEnabled } from '../../lib/venueSubscription';
import { getCatalogueItemLimit, isCatalogueLimitReached } from '../../lib/catalogue';
import { useIsDesktop } from '../../hooks/useIsDesktop';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

type ProfileStackParamList = {
  UpdateVenuePortfolio: undefined;
  VenueCatalogue: undefined;
  VenueListingPlans: undefined;
  SubscriptionPlans: undefined;
};

type VenueListingRow = {
  id: number;
  name: string;
  subscription_plan: string | null;
  subscription_status: string | null;
  subscription_expires_at: string | null;
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
  image_url: string | null;
};

export default function VenueCatalogueScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { user } = useAuth();
  const isDesktop = useIsDesktop();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [listing, setListing] = useState<VenueListingRow | null>(null);
  const [items, setItems] = useState<CatalogueItem[]>([]);
  const [uploadingImage, setUploadingImage] = useState<number | null>(null);
  const [alertState, setAlertState] = useState<{visible: boolean; title: string; message: string; buttons?: any[]} | null>(null);
  const [itemLimit, setItemLimit] = useState<number>(0);

  const [canUseCatalogue, setCanUseCatalogue] = useState<boolean>(false);

  const [editVisible, setEditVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogueItem | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    price: '',
    is_active: true,
    image_url: null as string | null,
  });

  const [pickedImage, setPickedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [quantities, setQuantities] = useState<Record<number, number>>({});

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
      return { ...prev, [id]: Math.max(1, current + delta) };
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setQuantities({});
  };

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
        .select('id, name, subscription_plan, subscription_status, subscription_expires_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (listingErr && (listingErr as any).code !== 'PGRST116') {
        console.error('Failed to load venue listing for catalogue:', listingErr);
        setListing(null);
        setItems([]);
        return;
      }

      let effectiveListing = listingRow;

      if (!effectiveListing) {
        // Fallback: check venues table and auto-create a venue_listings row if one exists there
        const { data: venuesRow, error: venuesErr } = await supabase
          .from('venues')
          .select('id, name, subscription_plan_key, subscription_status, subscription_expires_at')
          .eq('user_id', user.id)
          .maybeSingle();

        if (venuesErr && (venuesErr as any).code !== 'PGRST116') {
          console.error('Failed to load venues fallback for catalogue:', venuesErr);
        }

        if (venuesRow) {
          // Auto-create the missing venue_listings record from the venues row
          const { data: createdRow, error: createErr } = await supabase
            .from('venue_listings')
            .upsert(
              {
                user_id: user.id,
                name: venuesRow.name || 'Venue Listing',
                subscription_plan: venuesRow.subscription_plan_key || 'get_started',
                subscription_status: venuesRow.subscription_status || 'active',
              },
              { onConflict: 'user_id' },
            )
            .select('id, name, subscription_plan, subscription_status, subscription_expires_at')
            .single();

          if (createErr) {
            console.error('Failed to auto-create venue_listings from venues fallback:', createErr);
          } else {
            effectiveListing = createdRow;
          }
        }
      }

      if (!effectiveListing) {
        setListing(null);
        setItems([]);
        return;
      }

      setListing({
        id: effectiveListing.id,
        name: effectiveListing.name,
        subscription_plan: effectiveListing.subscription_plan || null,
        subscription_status: effectiveListing.subscription_status || null,
        subscription_expires_at: effectiveListing.subscription_expires_at || null,
      });

      const { data: itemRows, error: itemsErr } = await supabase
        .from('venue_catalogue_items')
        .select('id, listing_id, title, description, price, currency, sort_order, is_active, image_url')
        .eq('listing_id', effectiveListing.id)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (itemsErr) {
        console.error('Failed to load catalogue items:', itemsErr);
        setItems([]);
      } else {
        setItems((itemRows || []) as CatalogueItem[]);
      }

      // Load tier limit for catalogue items
      const limit = await getCatalogueItemLimit('venue', effectiveListing.subscription_plan || 'get_started');
      setItemLimit(limit);
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

  const selectedItems = useMemo(() => {
    return sortedItems
      .filter((item) => selectedIds.has(item.id))
      .map((item) => ({ ...item, quantity: quantities[item.id] || 1 }));
  }, [sortedItems, selectedIds, quantities]);

  const total = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + (item.price ?? 0) * item.quantity, 0);
  }, [selectedItems]);

  const openNew = () => {
    if (isCatalogueLimitReached(items.length, itemLimit)) {
      setAlertState({
        visible: true,
        title: 'Catalogue Limit Reached',
        message: `Your plan allows up to ${itemLimit} catalogue items. Upgrade to add more.`,
        buttons: [
          { text: 'Not now', style: 'cancel', onPress: () => setAlertState(null) },
          { text: 'View Plans', style: 'default', onPress: () => { setAlertState(null); navigation.navigate('VenueListingPlans'); } },
        ],
      });
      return;
    }
    setEditingItem(null);
    setPickedImage(null);
    setEditForm({ title: '', description: '', price: '', is_active: true, image_url: null });
    setEditVisible(true);
  };

  const openEdit = (item: CatalogueItem) => {
    setEditingItem(item);
    setPickedImage(null);
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
    setPickedImage(null);
  };

  const uploadCatalogueImage = async (asset: ImagePicker.ImagePickerAsset, itemId: number) => {
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
    const { error: updateError } = await supabase.from('venue_catalogue_items').update({ image_url: publicUrl }).eq('id', itemId);
    if (updateError) throw updateError;
  };

  const pickImageForForm = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setAlertState({ visible: true, title: 'Permission Required', message: 'Please allow access to your photo library to upload images.' });
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: false,
        allowsEditing: false,
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const fileSize = asset.fileSize || 0;
      if (fileSize > MAX_IMAGE_SIZE) {
        setAlertState({ visible: true, title: 'Image Too Large', message: `${asset.fileName || 'Image'} is ${(fileSize / 1024 / 1024).toFixed(1)}MB. Maximum allowed is 10MB.` });
        return;
      }
      setPickedImage(asset);
    } catch (err: any) {
      setAlertState({ visible: true, title: 'Error', message: err?.message ?? 'Could not pick image.' });
    }
  };

  const handleSave = async () => {
    if (!listing) {
      setAlertState({ visible: true, title: 'No listing found', message: 'Create your venue listing first before adding catalogue items.' });
      return;
    }

    if (!editingItem && isCatalogueLimitReached(items.length, itemLimit)) {
      setAlertState({
        visible: true,
        title: 'Catalogue Limit Reached',
        message: `Your plan allows up to ${itemLimit} catalogue items. Upgrade to add more.`,
        buttons: [
          { text: 'Not now', style: 'cancel', onPress: () => setAlertState(null) },
          { text: 'View Plans', style: 'default', onPress: () => { setAlertState(null); navigation.navigate('VenueListingPlans'); } },
        ],
      });
      return;
    }

    if (!editForm.title.trim()) {
      setAlertState({ visible: true, title: 'Required', message: 'Item title is required.' });
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
          .from('venue_catalogue_items')
          .update({
            title: editForm.title.trim(),
            description: editForm.description.trim() || null,
            price: parsedPrice,
            is_active: editForm.is_active,
          })
          .eq('id', editingItem.id);

        if (error) throw error;

        if (pickedImage) {
          await uploadCatalogueImage(pickedImage, editingItem.id);
        }
      } else {
        const nextSort = items.length > 0 ? Math.max(...items.map((i) => i.sort_order || 0)) + 1 : 0;
        const { data: insertedRow, error } = await supabase.from('venue_catalogue_items').insert({
          listing_id: listing.id,
          title: editForm.title.trim(),
          description: editForm.description.trim() || null,
          price: parsedPrice,
          currency: 'ZAR',
          sort_order: nextSort,
          is_active: editForm.is_active,
        }).select('id').single();

        if (error) throw error;

        if (pickedImage && insertedRow) {
          await uploadCatalogueImage(pickedImage, insertedRow.id);
        }
      }

      closeEdit();
      await loadListingAndItems();
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
        allowsEditing: false,
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const fileSize = asset.fileSize || 0;
      if (fileSize > MAX_IMAGE_SIZE) {
        setAlertState({ visible: true, title: 'Image Too Large', message: `${asset.fileName || 'Image'} is ${(fileSize / 1024 / 1024).toFixed(1)}MB. Maximum allowed is 10MB.` });
        return;
      }
      setUploadingImage(itemId);
      await uploadCatalogueImage(asset, itemId);
      await loadListingAndItems();
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
              const { error } = await supabase.from('venue_catalogue_items').delete().eq('id', item.id);
              if (error) throw error;
              await loadListingAndItems();
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
        Catalogue
      </Text>
      <Text style={isDesktopHeader ? { ...typography.headlineMd, color: colors.primary } as any : { ...typography.displayMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
        Catalogue / Pricelist
      </Text>
      <Text style={{ ...typography.bodyMd, color: isDesktopHeader ? colors.onSurfaceVariant : colors.textMuted }}>
        {subtitle}
      </Text>
    </View>
  );

  if (!canUseCatalogue) {
    return (
      <View style={{ flex: 1, backgroundColor: isDesktop ? colors.surfaceBg : colors.background }}>
        <ScrollView contentContainerStyle={isDesktop ? { ...desktopContainerStyle, paddingBottom: spacing.xxl } as any : { paddingBottom: spacing.xl }}>
          <View style={{ paddingHorizontal: isDesktop ? 0 : spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md }}>
            <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}
              >
                <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
                <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>Back</Text>
              </TouchableOpacity>

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
            <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}
              >
                <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
                <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>Back</Text>
              </TouchableOpacity>

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
                <Text style={{ ...typography.bodyBold, color: colors.primary }}>Go to Update Venue Portfolio</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  const renderItemCard = (item: CatalogueItem) => (
    <View
      key={item.id}
      style={{
        backgroundColor: cardSurface,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: cardBorder,
        marginBottom: spacing.md,
        overflow: 'hidden',
        width: isDesktop ? '48%' : '100%',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => toggleItem(item.id)} style={{ padding: spacing.sm }}>
          <MaterialIcons
            name={selectedIds.has(item.id) ? 'check-box' : 'check-box-outline-blank'}
            size={24}
            color={selectedIds.has(item.id) ? colors.primary : colors.textMuted}
          />
        </TouchableOpacity>
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
          <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textPrimary, fontWeight: '600' } as any : { ...typography.titleMedium, color: colors.textPrimary }}>{item.title}</Text>
          {item.description ? (
            <Text style={isDesktop ? { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: spacing.xs } as any : { ...typography.body, color: colors.textMuted, marginTop: spacing.xs }} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
          <Text style={{ ...typography.bodyBold, color: colors.textPrimary, marginTop: spacing.sm }}>
            {item.price === null || item.price === undefined ? '—' : `R${Number(item.price).toLocaleString()}`}
          </Text>
          {selectedIds.has(item.id) && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm }}>
              <TouchableOpacity
                onPress={() => updateQuantity(item.id, -1)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: radii.md,
                  backgroundColor: colors.surfaceMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MaterialIcons name="remove" size={18} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={{ ...typography.bodyBold, color: colors.textPrimary, minWidth: 24, textAlign: 'center' }}>
                {quantities[item.id] || 1}
              </Text>
              <TouchableOpacity
                onPress={() => updateQuantity(item.id, 1)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: radii.md,
                  backgroundColor: colors.surfaceMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MaterialIcons name="add" size={18} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          )}
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
  );

  const renderSelectionPanel = () => (
    <View
      style={{
        backgroundColor: cardSurface,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: cardBorder,
        padding: spacing.md,
        marginBottom: spacing.md,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
        <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textPrimary, fontWeight: '600' } as any : { ...typography.titleMedium, color: colors.textPrimary }}>Your Selection</Text>
        <TouchableOpacity onPress={clearSelection}>
          <Text style={{ ...typography.captionSemiBold, color: colors.textMuted }}>Clear</Text>
        </TouchableOpacity>
      </View>
      {selectedItems.map((item) => (
        <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs }}>
          <Text style={{ ...typography.body, color: colors.textPrimary }}>
            {item.title} x{item.quantity}
          </Text>
          <Text style={{ ...typography.body, color: colors.textPrimary }}>
            R{Number((item.price ?? 0) * item.quantity).toLocaleString()}
          </Text>
        </View>
      ))}
      <View
        style={{
          borderTopWidth: 1,
          borderColor: cardBorder,
          marginTop: spacing.sm,
          paddingTop: spacing.sm,
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}
      >
        <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>Total</Text>
        <Text style={{ ...typography.titleMedium, color: colors.primary }}>
          R{Number(total).toLocaleString()}
        </Text>
      </View>
    </View>
  );

  const renderAddButton = () => (
    <TouchableOpacity
      onPress={openNew}
      disabled={saving}
      style={{
        opacity: isCatalogueLimitReached(items.length, itemLimit) ? 0.6 : 1,
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
      <Text style={{ ...typography.bodyBold, color: '#FFFFFF' }}>Add Item</Text>
    </TouchableOpacity>
  );

  const renderUsageCounter = () => (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={isDesktop ? { ...typography.bodyMd, color: colors.onSurfaceVariant } as any : { ...typography.caption, color: colors.textMuted }}>
        {items.length} of {itemLimit} items used
      </Text>
    </View>
  );

  const renderItems = () => (
    <>
      {sortedItems.length === 0 ? (
        <View
          style={{
            backgroundColor: cardSurface,
            borderRadius: radii.lg,
            padding: spacing.xl,
            borderWidth: 1,
            borderColor: cardBorder,
            alignItems: 'center',
            width: '100%',
          }}
        >
          <MaterialIcons name="inventory-2" size={48} color={colors.textMuted} />
          <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textMuted, marginTop: spacing.md, textAlign: 'center' } as any : { ...typography.body, color: colors.textMuted, marginTop: spacing.md, textAlign: 'center' }}>
            No catalogue items yet.
          </Text>
        </View>
      ) : (
        <View style={isDesktop ? { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' } as any : undefined}>
          {sortedItems.map(renderItemCard)}
        </View>
      )}
    </>
  );

  return (
    <View style={{ flex: 1, backgroundColor: isDesktop ? colors.surfaceBg : colors.background }}>
      <ScrollView contentContainerStyle={isDesktop ? { ...desktopContainerStyle, paddingBottom: spacing.xxl } as any : { paddingBottom: spacing.xl }}>
        {isDesktop ? (
          <>
            {renderHeader(true, listing.name)}
            <View style={{ flexDirection: 'row', gap: spacing.gutter } as any}>
              <View style={{ flex: 3 } as any}>
                {renderUsageCounter()}
                {renderAddButton()}
                {renderItems()}
              </View>
              <View style={{ flex: 1 } as any}>
                {selectedItems.length > 0 && renderSelectionPanel()}
                <View style={{ backgroundColor: cardSurface, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: cardBorder }}>
                  <Text style={{ ...typography.headlineSm, color: colors.textPrimary, marginBottom: spacing.sm }}>
                    Catalogue
                  </Text>
                  <Text style={{ ...typography.bodyMd, color: colors.onSurfaceVariant } as any}>
                    Manage items and pricing for your venue listing.
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
              {renderUsageCounter()}
              {renderAddButton()}
              {selectedItems.length > 0 && renderSelectionPanel()}
              {renderItems()}
            </View>
          </>
        )}
      </ScrollView>

      <Modal visible={editVisible} transparent animationType="fade" onRequestClose={closeEdit}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.lg }}>
          <View
            style={{
              backgroundColor: cardSurface,
              borderRadius: radii.lg,
              padding: spacing.lg,
              borderWidth: 1,
              borderColor: cardBorder,
              maxWidth: 560,
              width: '100%',
              alignSelf: 'center',
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <Text style={isDesktop ? { ...typography.headlineSm, color: colors.textPrimary } as any : { ...typography.titleMedium, color: colors.textPrimary }}>
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
                borderColor: cardBorder,
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
                borderColor: cardBorder,
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
                borderColor: cardBorder,
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

            <Text style={{ ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs }}>Image (max 10MB)</Text>
            <TouchableOpacity
              onPress={pickImageForForm}
              style={{
                borderWidth: 1,
                borderColor: cardBorder,
                borderRadius: radii.md,
                backgroundColor: colors.surfaceMuted,
                alignItems: 'center',
                justifyContent: 'center',
                padding: spacing.md,
                minHeight: 120,
                marginBottom: spacing.xs,
              }}
            >
              {pickedImage ? (
                <Image source={{ uri: pickedImage.uri }} style={{ width: 100, height: 100, borderRadius: radii.md }} resizeMode="cover" />
              ) : editingItem?.image_url ? (
                <Image source={{ uri: editingItem.image_url }} style={{ width: 100, height: 100, borderRadius: radii.md }} resizeMode="cover" />
              ) : (
                <>
                  <MaterialIcons name="add-photo-alternate" size={28} color={colors.textMuted} />
                  <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.xs }}>Tap to add image</Text>
                </>
              )}
            </TouchableOpacity>
            {pickedImage && (
              <TouchableOpacity
                onPress={() => setPickedImage(null)}
                style={{ alignSelf: 'center', marginBottom: spacing.md }}
              >
                <Text style={{ ...typography.caption, color: colors.destructive }}>Remove image</Text>
              </TouchableOpacity>
            )}

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
