import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radii, typography } from '../../theme';
import { useIsDesktop } from '../../hooks/useIsDesktop';

type ProfileStackParamList = {
    SubscriberProfile: undefined;
    UpdatePortfolio: undefined;
    UpdateVendorPortfolio: undefined;
    UpdateVenuePortfolio: undefined;
};

export default function UpdatePortfolioScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
    const isDesktop = useIsDesktop();

    const desktopContainerStyle = {
        maxWidth: 1200,
        width: '100%',
        alignSelf: 'center' as const,
        paddingHorizontal: 48,
    };

    const cardSurface = isDesktop ? colors.surfaceContainerLowest : colors.surface;
    const cardBorder = isDesktop ? colors.outlineVariant : colors.borderSubtle;

    const renderHeader = (isDesktopHeader: boolean) => (
        <View style={{ marginBottom: spacing.md }}>
            <Text style={isDesktopHeader ? { ...typography.labelMd, color: colors.dustyRose, textTransform: 'uppercase', marginBottom: spacing.sm } as any : { display: 'none' } as any}>
                Update Portfolio
            </Text>
            <Text style={isDesktopHeader ? { ...typography.headlineMd, color: colors.primary } as any : { ...typography.displayMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
                Update Portfolio
            </Text>
            <Text style={{ ...typography.bodyMd, color: isDesktopHeader ? colors.onSurfaceVariant : colors.textMuted }}>
                Choose what you want to update
            </Text>
        </View>
    );

    const renderMenu = () => (
        <View style={{ paddingHorizontal: isDesktop ? 0 : spacing.lg }}>
            <View
                style={{
                    borderRadius: radii.lg,
                    overflow: 'hidden',
                    backgroundColor: cardSurface,
                    borderWidth: 1,
                    borderColor: cardBorder,
                    shadowColor: '#000',
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: 2,
                }}
            >
                <TouchableOpacity
                    onPress={() => navigation.navigate('UpdateVendorPortfolio')}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: spacing.lg,
                        borderBottomWidth: 1,
                        borderBottomColor: cardBorder,
                    }}
                    activeOpacity={0.7}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <View
                            style={{
                                width: isDesktop ? 48 : 40,
                                height: isDesktop ? 48 : 40,
                                borderRadius: radii.lg,
                                backgroundColor: '#DBEAFE',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: spacing.md,
                            }}
                        >
                            <MaterialIcons name="store" size={isDesktop ? 24 : 20} color="#2563EB" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textPrimary, fontWeight: '600' } as any : { ...typography.bodyMedium, color: colors.textPrimary }}>
                                Vendor / Service Portfolio
                            </Text>
                            <Text style={isDesktop ? { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: 2 } as any : { ...typography.caption, color: colors.textMuted, marginTop: 2 }}>
                                Edit your vendor listing details
                            </Text>
                        </View>
                    </View>
                    <MaterialIcons name="chevron-right" size={isDesktop ? 24 : 20} color={colors.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => navigation.navigate('UpdateVenuePortfolio')}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: spacing.lg,
                    }}
                    activeOpacity={0.7}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <View
                            style={{
                                width: isDesktop ? 48 : 40,
                                height: isDesktop ? 48 : 40,
                                borderRadius: radii.lg,
                                backgroundColor: '#EDE9FE',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: spacing.md,
                            }}
                        >
                            <MaterialIcons name="location-city" size={isDesktop ? 24 : 20} color="#7C3AED" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textPrimary, fontWeight: '600' } as any : { ...typography.bodyMedium, color: colors.textPrimary }}>
                                Venue Portfolio
                            </Text>
                            <Text style={isDesktop ? { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: 2 } as any : { ...typography.caption, color: colors.textMuted, marginTop: 2 }}>
                                Edit your venue listing details
                            </Text>
                        </View>
                    </View>
                    <MaterialIcons name="chevron-right" size={isDesktop ? 24 : 20} color={colors.textMuted} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: isDesktop ? colors.surfaceBg : colors.background }}>
            <ScrollView contentContainerStyle={isDesktop ? { ...desktopContainerStyle, paddingBottom: spacing.xxl } as any : { paddingBottom: spacing.xl }}>
                {isDesktop ? (
                    <>
                        {renderHeader(true)}
                        {renderMenu()}
                    </>
                ) : (
                    <>
                        {/* Header */}
                        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md }}>
                            <TouchableOpacity
                                onPress={() => navigation.goBack()}
                                style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}
                            >
                                <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
                                <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>Back</Text>
                            </TouchableOpacity>

                            {renderHeader(false)}
                        </View>
                        {renderMenu()}
                    </>
                )}
            </ScrollView>
        </View>
    );
}
