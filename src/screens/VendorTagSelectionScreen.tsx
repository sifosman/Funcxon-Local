import { useState, useEffect } from 'react';
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { supabase } from '../lib/supabaseClient';
import { colors, spacing, radii, typography } from '../theme';
import { PrimaryButton } from '../components/ui';
import type { VendorStackParamList } from '../navigation/VendorNavigator';

type Props = NativeStackScreenProps<VendorStackParamList, 'VendorTagSelection'>;

type TagCategory = {
  id: number;
  name: string;
  slug: string;
  vendor_type: string;
  parent_category_id: number | null;
};

type VendorTag = {
  tag_category_id: number;
};

export default function VendorTagSelectionScreen({ route, navigation }: Props) {
  const { vendorId } = route.params;
  const queryClient = useQueryClient();
  const [selectedTags, setSelectedTags] = useState<number[]>([]);

  // Fetch all tag categories
  const { data: tagCategories, isLoading: tagsLoading } = useQuery<TagCategory[]>({
    queryKey: ['tag_categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tag_categories')
        .select('id, name, slug, vendor_type, parent_category_id')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as TagCategory[];
    },
  });

  // Fetch existing vendor tags
  const { data: existingTags } = useQuery<VendorTag[]>({
    queryKey: ['vendor_tags', vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_tags')
        .select('tag_category_id')
        .eq('vendor_id', vendorId);

      if (error) throw error;
      return data as VendorTag[];
    },
    enabled: !!vendorId,
  });

  // Set initial selected tags
  useEffect(() => {
    if (existingTags) {
      setSelectedTags(existingTags.map((t) => t.tag_category_id));
    }
  }, [existingTags]);

  // Save tags mutation
  const saveTagsMutation = useMutation({
    mutationFn: async (tagIds: number[]) => {
      // Delete existing tags
      await supabase.from('vendor_tags').delete().eq('vendor_id', vendorId);

      // Insert new tags
      if (tagIds.length > 0) {
        const tagInserts = tagIds.map((tagId) => ({
          vendor_id: vendorId,
          tag_category_id: tagId,
        }));

        const { error } = await supabase.from('vendor_tags').insert(tagInserts);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor_tags', vendorId] });
      navigation.goBack();
    },
  });

  const toggleTag = (tagId: number) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSave = () => {
    saveTagsMutation.mutate(selectedTags);
  };

  if (tagsLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Group tags by parent category
  const parentCategories = tagCategories?.filter((t) => !t.parent_category_id) || [];
  const childTags = tagCategories?.filter((t) => t.parent_category_id) || [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.lg,
        }}
      >
        <Text style={{ ...typography.body, color: colors.textSecondary, marginBottom: spacing.xl }}>
          Select all tags that apply to your business. These help customers find you.
        </Text>

        {parentCategories.map((parent) => {
          const children = childTags.filter((c) => c.parent_category_id === parent.id);
          if (children.length === 0) return null;

          return (
            <View key={parent.id} style={{ marginBottom: spacing.xl }}>
              <Text
                style={{
                  ...typography.titleMedium,
                  color: colors.textPrimary,
                  marginBottom: spacing.md,
                }}
              >
                {parent.name}
              </Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {children.map((tag) => {
                  const isSelected = selectedTags.includes(tag.id);

                  return (
                    <TouchableOpacity
                      key={tag.id}
                      onPress={() => toggleTag(tag.id)}
                      style={{
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.sm,
                        borderRadius: radii.lg,
                        borderWidth: 1,
                        borderColor: isSelected ? colors.primary : colors.borderSubtle,
                        backgroundColor: isSelected ? colors.primary : colors.surface,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.xs,
                      }}
                    >
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: radii.sm,
                          borderWidth: 2,
                          borderColor: isSelected ? '#FFFFFF' : colors.borderStrong,
                          backgroundColor: isSelected ? '#FFFFFF' : 'transparent',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isSelected && (
                          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: 'bold' }}>✓</Text>
                        )}
                      </View>
                      <Text
                        style={{
                          ...typography.body,
                          color: isSelected ? '#FFFFFF' : colors.textPrimary,
                        }}
                      >
                        {tag.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}

        <View style={{ height: 100 }} />
      </ScrollView>

      <View
        style={{
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.lg,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.borderSubtle,
        }}
      >
        <Text
          style={{
            ...typography.caption,
            color: colors.textSecondary,
            marginBottom: spacing.sm,
            textAlign: 'center',
          }}
        >
          {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''} selected
        </Text>
        <PrimaryButton
          title="Save Tags"
          onPress={handleSave}
          disabled={saveTagsMutation.isPending}
        />
      </View>
    </View>
  );
}
