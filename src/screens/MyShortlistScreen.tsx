
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { ShortlistService, ShortlistItem } from '../services/ShortlistService';
import { colors, spacing, radii, typography } from '../theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AttendeeStackParamList } from '../navigation/AttendeeNavigator';

type NavigationProp = NativeStackNavigationProp<AttendeeStackParamList>;

export default function MyShortlistScreen() {
    const navigation = useNavigation<NavigationProp>();

    const { data, isLoading, error, refetch } = useQuery<ShortlistItem[]>({
        queryKey: ['shortlist'],
        queryFn: () => ShortlistService.getShortlist(),
    });

    if (isLoading) {
        return (
            <View
                style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.background,
                }}
            >
                <ActivityIndicator />
            </View>
        );
    }

    if (error instanceof Error) {
        return (
            <View
                style={{
                    flex: 1,
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.lg,
                    justifyContent: 'center',
                    backgroundColor: colors.background,
                }}
            >
                <Text style={{ ...typography.titleMedium, color: colors.textPrimary }}>Failed to load favorites.</Text>
                <Text style={{ marginTop: spacing.sm, ...typography.body, color: colors.textMuted }}>{error.message}</Text>
            </View>
        );
    }

    if (!data || data.length === 0) {
        return (
            <View
                style={{
                    flex: 1,
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.lg,
                    justifyContent: 'center',
                    backgroundColor: colors.background,
                }}
            >
                <Text style={{ textAlign: 'center', ...typography.body, color: colors.textPrimary }}>
                    No favorites yet.
                </Text>
                <Text
                    style={{
                        textAlign: 'center',
                        marginTop: spacing.sm,
                        ...typography.body,
                        color: colors.textMuted,
                    }}
                >
                    Browsing vendors and tap the heart icon to save them here.
                </Text>
            </View>
        );
    }

    return (
        <View
            style={{
                flex: 1,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.lg,
                backgroundColor: colors.background,
            }}
        >
            <FlatList
                data={data}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{ paddingBottom: spacing.xl }}
                onRefresh={refetch}
                refreshing={isLoading}
                renderItem={({ item }) => {
                    const vendor = item.vendor;
                    if (!vendor) return null;

                    return (
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate('VendorProfile', { vendorId: vendor.id })}
                            style={{ marginBottom: spacing.md }}
                        >
                            <View
                                style={{
                                    flexDirection: 'row',
                                    borderRadius: radii.lg,
                                    backgroundColor: colors.surface,
                                    borderWidth: 1,
                                    borderColor: colors.borderSubtle,
                                    overflow: 'hidden',
                                }}
                            >
                                {vendor.image_url && (
                                    <Image
                                        source={{ uri: vendor.image_url }}
                                        style={{ width: 100, height: 100 }}
                                        resizeMode="cover"
                                    />
                                )}
                                <View style={{ flex: 1, padding: spacing.md, justifyContent: 'center' }}>
                                    <Text
                                        style={{
                                            ...typography.titleMedium,
                                            fontSize: 16,
                                            color: colors.textPrimary,
                                        }}
                                        numberOfLines={1}
                                    >
                                        {vendor.name}
                                    </Text>
                                    <Text
                                        style={{
                                            ...typography.caption,
                                            color: colors.textSecondary,
                                            marginTop: 2,
                                        }}
                                    >
                                        {[vendor.city, vendor.province].filter(Boolean).join(', ')}
                                    </Text>

                                    <View style={{ flexDirection: 'row', marginTop: spacing.xs, alignItems: 'center' }}>
                                        <Text style={{ ...typography.caption, color: colors.primary }}>
                                            ⭐ {vendor.rating?.toFixed(1) || 'New'} ({vendor.review_count || 0})
                                        </Text>
                                        {vendor.price_range && (
                                            <Text style={{ ...typography.caption, color: colors.textMuted, marginLeft: spacing.md }}>
                                                {vendor.price_range}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                }}
            />
        </View>
    );
}
