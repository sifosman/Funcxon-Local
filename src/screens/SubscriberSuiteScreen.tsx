import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radii, typography } from '../theme';

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

    const menuItems: MenuItem[] = [
        {
            id: 'portfolio-profile',
            title: 'Portfolio Profile',
            description: 'Access your subscriber portal and manage your listings',
            icon: 'business-center',
            route: 'PortfolioProfile',
            iconColor: colors.primaryTeal,
            iconBg: '#E0F2F7',
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

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
                {/* Header */}
                <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.md }}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}
                    >
                        <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
                        <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>
                            Back to My Account
                        </Text>
                    </TouchableOpacity>

                    <Text style={{ ...typography.displayMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
                        Subscriber Suite
                    </Text>
                    <Text style={{ ...typography.body, color: colors.textMuted }}>
                        Manage your business listings and subscriber profile
                    </Text>
                </View>

                {/* Menu Items */}
                <View style={{ paddingHorizontal: spacing.lg }}>
                    <View
                        style={{
                            borderRadius: radii.lg,
                            overflow: 'hidden',
                            backgroundColor: colors.surface,
                            borderWidth: 1,
                            borderColor: colors.borderSubtle,
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
                                    padding: spacing.lg,
                                    borderBottomWidth: index < menuItems.length - 1 ? 1 : 0,
                                    borderBottomColor: colors.borderSubtle,
                                }}
                                activeOpacity={0.7}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                    <View
                                        style={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: radii.lg,
                                            backgroundColor: item.iconBg,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: spacing.md,
                                        }}
                                    >
                                        <MaterialIcons name={item.icon} size={20} color={item.iconColor} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ ...typography.body, fontWeight: '500', color: colors.textPrimary }}>
                                            {item.title}
                                        </Text>
                                        <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: 2 }}>
                                            {item.description}
                                        </Text>
                                    </View>
                                </View>
                                <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
