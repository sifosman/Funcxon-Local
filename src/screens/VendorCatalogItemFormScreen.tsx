import { useState, useEffect } from 'react';
import { ScrollView, Text, View, Switch, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { supabase } from '../lib/supabaseClient';
import { colors, spacing, radii, typography } from '../theme';
import { PrimaryButton, ThemedInput, OutlineButton } from '../components/ui';
import type { VendorStackParamList } from '../navigation/VendorNavigator';

type Props = NativeStackScreenProps<VendorStackParamList, 'VendorCatalogItemForm'>;

type CatalogItemForm = {
  title: string;
  category: string;
  description: string;
  sku: string;
  unit_qty: string;
  price: string;
  moq: string;
  lead_time_days: string;
  location: string;
  is_available: boolean;
  image_url: string;
};

export default function VendorCatalogItemFormScreen({ route, navigation }: Props) {
  const { itemId } = route.params;
  const queryClient = useQueryClient();
  const isEditing = !!itemId;

  // TODO: Get vendorId from auth context
  const vendorId = 1;

  const [formData, setFormData] = useState<CatalogItemForm>({
    title: '',
    category: '',
    description: '',
    sku: '',
    unit_qty: '',
    price: '',
    moq: '1',
    lead_time_days: '',
    location: '',
    is_available: true,
    image_url: '',
  });

  // Fetch existing item if editing
  const { data: existingItem, isLoading } = useQuery({
    queryKey: ['catalog_item', itemId],
    queryFn: async () => {
      if (!itemId) return null;

      const { data, error } = await supabase
        .from('vendor_catalog_items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!itemId,
  });

  useEffect(() => {
    if (existingItem) {
      setFormData({
        title: existingItem.title || '',
        category: existingItem.category || '',
        description: existingItem.description || '',
        sku: existingItem.sku || '',
        unit_qty: existingItem.unit_qty || '',
        price: existingItem.price?.toString() || '',
        moq: existingItem.moq?.toString() || '1',
        lead_time_days: existingItem.lead_time_days?.toString() || '',
        location: existingItem.location || '',
        is_available: existingItem.is_available ?? true,
        image_url: existingItem.image_url || '',
      });
    }
  }, [existingItem]);

  const saveMutation = useMutation({
    mutationFn: async (data: CatalogItemForm) => {
      const payload = {
        vendor_id: vendorId,
        title: data.title,
        category: data.category || null,
        description: data.description || null,
        sku: data.sku || null,
        unit_qty: data.unit_qty || null,
        price: data.price ? parseFloat(data.price) : null,
        moq: data.moq ? parseInt(data.moq) : 1,
        lead_time_days: data.lead_time_days ? parseInt(data.lead_time_days) : null,
        location: data.location || null,
        is_available: data.is_available,
        image_url: data.image_url || null,
      };

      if (isEditing && itemId) {
        const { error } = await supabase
          .from('vendor_catalog_items')
          .update(payload)
          .eq('id', itemId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('vendor_catalog_items').insert(payload);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog_items', vendorId] });
      navigation.goBack();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!itemId) return;

      const { error } = await supabase
        .from('vendor_catalog_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog_items', vendorId] });
      navigation.goBack();
    },
  });

  const updateField = <K extends keyof CatalogItemForm>(field: K, value: CatalogItemForm[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this item?')) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.lg,
        }}
      >
        <Text style={{ ...typography.titleLarge, color: colors.textPrimary, marginBottom: spacing.md }}>
          {isEditing ? 'Edit Catalog Item' : 'Add Catalog Item'}
        </Text>

        <Text style={{ ...typography.body, color: colors.textSecondary, marginBottom: spacing.xl }}>
          Fill out all 14 fields from the catalog format specification.
        </Text>

        {/* Image URL - Field 1 */}
        <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.sm }}>
          1. Image
        </Text>
        <ThemedInput
          placeholder="Image URL"
          value={formData.image_url}
          onChangeText={(text) => updateField('image_url', text)}
        />

        {/* Title - Field 2 */}
        <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginTop: spacing.lg, marginBottom: spacing.sm }}>
          2. Title *
        </Text>
        <ThemedInput
          placeholder="Product/Service Title"
          value={formData.title}
          onChangeText={(text) => updateField('title', text)}
        />

        {/* Category - Field 3 */}
        <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginTop: spacing.lg, marginBottom: spacing.sm }}>
          3. Category
        </Text>
        <ThemedInput
          placeholder="Category (e.g., Decor, Catering)"
          value={formData.category}
          onChangeText={(text) => updateField('category', text)}
        />

        {/* Description - Field 4 */}
        <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginTop: spacing.lg, marginBottom: spacing.sm }}>
          4. Short Description
        </Text>
        <ThemedInput
          placeholder="Brief description of item"
          value={formData.description}
          onChangeText={(text) => updateField('description', text)}
          multiline
          numberOfLines={3}
          style={{ height: 80, textAlignVertical: 'top' }}
        />

        {/* SKU - Field 5 */}
        <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginTop: spacing.lg, marginBottom: spacing.sm }}>
          5. SKU (Stock Code)
        </Text>
        <ThemedInput
          placeholder="SKU"
          value={formData.sku}
          onChangeText={(text) => updateField('sku', text)}
        />

        {/* Unit/Qty - Field 6 */}
        <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginTop: spacing.lg, marginBottom: spacing.sm }}>
          6. Unit/Qty
        </Text>
        <ThemedInput
          placeholder="e.g., per person, per item, per hour"
          value={formData.unit_qty}
          onChangeText={(text) => updateField('unit_qty', text)}
        />

        {/* Price - Field 7 */}
        <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginTop: spacing.lg, marginBottom: spacing.sm }}>
          7. Price
        </Text>
        <ThemedInput
          placeholder="Price (ZAR)"
          value={formData.price}
          onChangeText={(text) => updateField('price', text)}
          keyboardType="decimal-pad"
        />

        {/* MOQ - Field 9 */}
        <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginTop: spacing.lg, marginBottom: spacing.sm }}>
          9. MOQ (Minimum Order Quantity)
        </Text>
        <ThemedInput
          placeholder="Minimum order quantity"
          value={formData.moq}
          onChangeText={(text) => updateField('moq', text)}
          keyboardType="number-pad"
        />

        {/* Lead Time - Field 10 */}
        <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginTop: spacing.lg, marginBottom: spacing.sm }}>
          10. Lead Time (Days)
        </Text>
        <ThemedInput
          placeholder="Days needed to prepare"
          value={formData.lead_time_days}
          onChangeText={(text) => updateField('lead_time_days', text)}
          keyboardType="number-pad"
        />

        {/* Location - Field 12 */}
        <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginTop: spacing.lg, marginBottom: spacing.sm }}>
          12. Location
        </Text>
        <ThemedInput
          placeholder="Location/Region"
          value={formData.location}
          onChangeText={(text) => updateField('location', text)}
        />

        {/* Availability Toggle */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: spacing.xl,
            paddingVertical: spacing.md,
          }}
        >
          <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>
            14. Available for Purchase
          </Text>
          <Switch
            value={formData.is_available}
            onValueChange={(value) => updateField('is_available', value)}
            trackColor={{ false: colors.surfaceMuted, true: colors.primary }}
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Action Buttons */}
      <View
        style={{
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.lg,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.borderSubtle,
          gap: spacing.md,
        }}
      >
        <PrimaryButton
          title={isEditing ? 'Save Changes' : 'Add Item'}
          onPress={handleSave}
          disabled={saveMutation.isPending || !formData.title}
        />

        {isEditing && (
          <OutlineButton
            title="Delete Item"
            onPress={handleDelete}
          />
        )}
      </View>
    </View>
  );
}
