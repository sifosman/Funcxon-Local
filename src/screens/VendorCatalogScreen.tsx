import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { supabase } from '../lib/supabaseClient';
import { colors, spacing, radii, typography } from '../theme';
import { PrimaryButton } from '../components/ui';
import type { VendorStackParamList } from '../navigation/VendorNavigator';

type Props = NativeStackScreenProps<VendorStackParamList, 'VendorCatalog'>;

type CatalogItem = {
  id: number;
  title: string;
  category: string;
  price: number;
  image_url: string | null;
  is_available: boolean;
  sku: string | null;
  moq: number;
};

export default function VendorCatalogScreen({ navigation }: Props) {
  // TODO: Get vendorId from auth context
  const vendorId = 1;

  const { data: catalogItems, isLoading } = useQuery<CatalogItem[]>({
    queryKey: ['catalog_items', vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_catalog_items')
        .select('id, title, category, price, image_url, is_available, sku, moq')
        .eq('vendor_id', vendorId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as CatalogItem[];
    },
  });

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
        {catalogItems && catalogItems.length > 0 ? (
          <View>
            {catalogItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => navigation.navigate('VendorCatalogItemForm', { itemId: item.id })}
                style={{
                  marginBottom: spacing.lg,
                  borderRadius: radii.lg,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.borderSubtle,
                  overflow: 'hidden',
                }}
              >
                <View style={{ flexDirection: 'row' }}>
                  {/* Image */}
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
                      <Text style={{ fontSize: 32 }}>📦</Text>
                    </View>
                  )}

                  {/* Details */}
                  <View style={{ flex: 1, padding: spacing.md }}>
                    <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>
                      {item.title}
                    </Text>

                    {item.category && (
                      <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs }}>
                        {item.category}
                      </Text>
                    )}

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: spacing.md }}>
                      <Text style={{ ...typography.body, color: colors.primary, fontWeight: '600' }}>
                        R {item.price?.toFixed(2) || '0.00'}
                      </Text>

                      {item.sku && (
                        <Text style={{ ...typography.caption, color: colors.textMuted }}>
                          SKU: {item.sku}
                        </Text>
                      )}
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs, gap: spacing.sm }}>
                      <View
                        style={{
                          paddingHorizontal: spacing.sm,
                          paddingVertical: 2,
                          borderRadius: radii.sm,
                          backgroundColor: item.is_available ? colors.accent : colors.surfaceMuted,
                        }}
                      >
                        <Text style={{ ...typography.caption, color: colors.textPrimary }}>
                          {item.is_available ? 'Available' : 'Unavailable'}
                        </Text>
                      </View>

                      {item.moq > 1 && (
                        <Text style={{ ...typography.caption, color: colors.textMuted }}>
                          MOQ: {item.moq}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: spacing.xxl }}>
            <Text style={{ fontSize: 64, marginBottom: spacing.md }}>📦</Text>
            <Text style={{ ...typography.titleMedium, color: colors.textPrimary, marginBottom: spacing.sm }}>
              No Catalog Items Yet
            </Text>
            <Text style={{ ...typography.body, color: colors.textSecondary, textAlign: 'center' }}>
              Start building your catalog by adding your first product or service.
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Item Button */}
      <View
        style={{
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.lg,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.borderSubtle,
        }}
      >
        <PrimaryButton
          title="+ Add Catalog Item"
          onPress={() => navigation.navigate('VendorCatalogItemForm', {})}
        />
      </View>
    </View>
  );
}
