import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radii, typography } from '../theme';
import { useIsDesktop } from '../hooks/useIsDesktop';

type ProfileStackParamList = {
    AccountMain: undefined;
    SubscriberSuite: undefined;
    SubscriberLogin: undefined;
    SubscriberProfile: undefined;
    PortfolioProfile: undefined;
    PortfolioAssistance: undefined;
    TermsAndPolicies: undefined;
};

type MenuItem = {
    id: string;
    title: string;
    description: string;
    icon: keyof typeof MaterialIcons.glyphMap;
    route: keyof ProfileStackParamList;
    iconColor: string;
    iconBg: string;
};

export default function SubscriberSuiteScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
    const isDesktop = useIsDesktop();

    const menuItems: MenuItem[] = [
        {
            id: 'portfolio-profile',
            title: 'Portfolio Profile',
            description: 'Access your subscriber portal and manage your listings',
            icon: 'business-center',
            route: 'PortfolioProfile',
            iconColor: colors.textPrimary,
            iconBg: '#f2f7ff',
        },
        {
            id: 'portfolio-assistance',
            title: 'Portfolio Assistance',
            description: 'Get expert help with your portfolio creation and optimization',
            icon: 'support-agent',
            route: 'PortfolioAssistance',
            iconColor: '#8B5CF6',
            iconBg: '#F3E8FF',
        },
        {
            id: 'subscriber-legal-terms',
            title: 'Subscriber Legal Terms',
            description: 'Review terms, privacy policy, and data processing agreement',
            icon: 'description',
            route: 'TermsAndPolicies',
            iconColor: '#6366F1',
            iconBg: '#EEF2FF',
        },
        {
            id: 'activity-dashboard',
            title: 'Activity Dashboard',
            description: 'View your performance metrics and analytics',
            icon: 'bar-chart',
            route: 'AccountMain', // Placeholder
            iconColor: '#8B5CF6',
            iconBg: '#F5F3FF',
        },
    ];

    const desktopContainerStyle = {
        maxWidth: 1200,
        width: '100%',
        alignSelf: 'center' as const,
        paddingHorizontal: 48,
    };

    const renderHeader = (isDesktopHeader: boolean) => (
        <View style={{ marginBottom: spacing.md }}>
            <Text style={isDesktopHeader ? { ...typography.labelMd, color: colors.dustyRose, textTransform: 'uppercase', marginBottom: spacing.sm } as any : { display: 'none' } as any}>
                Subscriber Hub
            </Text>
            <Text style={isDesktopHeader ? { ...typography.headlineMd, color: colors.primary } as any : { ...typography.displayMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
                Subscriber Suite
            </Text>
            <Text style={{ ...typography.bodyMd, color: isDesktopHeader ? colors.onSurfaceVariant : colors.textMuted }}>
                Manage your business listings and subscriber profile
            </Text>
        </View>
    );

    const renderMenu = () => (
        <View
            style={{
                borderRadius: radii.lg,
                overflow: 'hidden',
                backgroundColor: isDesktop ? colors.surfaceContainerLowest : colors.surface,
                borderWidth: 1,
                borderColor: isDesktop ? colors.outlineVariant : colors.borderSubtle,
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
            }}
        >
            {menuItems.map((item, index) => (
                <TouchableOpacity
                    key={item.id}
                    onPress={() => navigation.navigate(item.route)}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: isDesktop ? spacing.lg : spacing.lg,
                        borderBottomWidth: index < menuItems.length - 1 ? 1 : 0,
                        borderBottomColor: isDesktop ? colors.outlineVariant : colors.borderSubtle,
                    }}
                    activeOpacity={0.7}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <View
                            style={{
                                width: isDesktop ? 48 : 40,
                                height: isDesktop ? 48 : 40,
                                borderRadius: radii.lg,
                                backgroundColor: item.iconBg,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: spacing.md,
                            }}
                        >
                            <MaterialIcons name={item.icon} size={isDesktop ? 24 : 20} color={item.iconColor} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={isDesktop ? { ...typography.bodyMd, color: colors.textPrimary, fontWeight: '600' } as any : { ...typography.bodyMedium, color: colors.textPrimary }}>
                                {item.title}
                            </Text>
                            <Text style={isDesktop ? { ...typography.bodyMd, color: colors.onSurfaceVariant, marginTop: 2 } as any : { ...typography.caption, color: colors.textMuted, marginTop: 2 }}>
                                {item.description}
                            </Text>
                        </View>
                    </View>
                    <MaterialIcons name="chevron-right" size={isDesktop ? 24 : 20} color={colors.textMuted} />
                </TouchableOpacity>
            ))}
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: isDesktop ? colors.surfaceBg : colors.background }}>
            <ScrollView
                contentContainerStyle={isDesktop ? { ...desktopContainerStyle, paddingBottom: spacing.xxl } as any : { paddingBottom: spacing.xl }}
            >
                {isDesktop ? (
                    <>
                        {renderHeader(true)}
                        <View style={{ flexDirection: 'row', gap: spacing.gutter } as any}>
                            <View style={{ flex: 2 } as any}>
                                {renderMenu()}
                            </View>
                            <View style={{ flex: 1, gap: spacing.md } as any}>
                                <View style={{
                                    backgroundColor: colors.surfaceContainerLowest,
                                    borderRadius: radii.lg,
                                    padding: spacing.lg,
                                    borderWidth: 1,
                                    borderColor: colors.outlineVariant,
                                }}>
                                    <Text style={{ ...typography.headlineSm, color: colors.primary, marginBottom: spacing.sm }}>
                                        Help Desk
                                    </Text>
                                    <Text style={{ ...typography.bodyMd, color: colors.onSurfaceVariant }}>
                                        Access portfolio assistance, legal terms, and subscriber support from your desktop hub.
                                    </Text>
                                </View>
                            </View>
                        </View>
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
                                <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>
                                    Back to My Account
                                </Text>
                            </TouchableOpacity>

                            {renderHeader(false)}
                        </View>

                        {/* Menu Items */}
                        <View style={{ paddingHorizontal: spacing.lg }}>
                            {renderMenu()}
                        </View>
                    </>
                )}
            </ScrollView>
        </View>
    );
}
