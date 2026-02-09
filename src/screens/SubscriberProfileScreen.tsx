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
    PortfolioType: undefined;
    UpdatePortfolio: undefined;
    ActionItems: undefined;
    CalendarUpdates: undefined;
};

type MenuItem = {
    id: string;
    title: string;
    description: string;
    icon: keyof typeof MaterialIcons.glyphMap;
    route?: keyof ProfileStackParamList;
    iconColor: string;
    iconBg: string;
};

export default function SubscriberProfileScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();

    const profileOptions: MenuItem[] = [
        {
            id: 'create-portfolio',
            title: 'Create Portfolio',
            description: 'Set up a new vendor, service provider, or venue portfolio',
            icon: 'person-add',
            route: 'PortfolioType',
            iconColor: '#10B981',
            iconBg: '#D1FAE5',
        },
        {
            id: 'update-portfolio',
            title: 'Update Portfolio',
            description: 'Update and manage your existing portfolio listings',
            icon: 'edit',
            route: 'UpdatePortfolio',
            iconColor: '#3B82F6',
            iconBg: '#DBEAFE',
        },
        {
            id: 'action-items',
            title: 'Action Items',
            description: 'View and manage your pending tasks and to-dos',
            icon: 'checklist',
            route: 'ActionItems',
            iconColor: '#F59E0B',
            iconBg: '#FEF3C7',
        },
        {
            id: 'calendar-updates',
            title: 'Calendar Updates',
            description: 'Check your schedule and upcoming events',
            icon: 'event',
            route: 'CalendarUpdates',
            iconColor: '#8B5CF6',
            iconBg: '#EDE9FE',
        },
    ];

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
                {/* Back button */}
                <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.md }}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('AccountMain')}
                        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}
                    >
                        <MaterialIcons name="arrow-back" size={20} color={colors.textPrimary} />
                        <Text style={{ ...typography.body, color: colors.textPrimary, marginLeft: spacing.sm }}>
                            Back to My Account
                        </Text>
                    </TouchableOpacity>

                    {/* Header */}
                    <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
                        <Text style={{ ...typography.displayMedium, color: colors.textPrimary, marginBottom: spacing.xs }}>
                            Welcome Back!
                        </Text>
                        <Text style={{ ...typography.body, color: colors.textMuted }}>
                            What would you like to do today?
                        </Text>
                    </View>
                </View>

                {/* Profile Options */}
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
                        {profileOptions.map((option, index) => (
                            <TouchableOpacity
                                key={option.id}
                                onPress={() => option.route && navigation.navigate(option.route)}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: spacing.lg,
                                    borderBottomWidth: index < profileOptions.length - 1 ? 1 : 0,
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
                                            backgroundColor: option.iconBg,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginRight: spacing.md,
                                        }}
                                    >
                                        <MaterialIcons name={option.icon} size={20} color={option.iconColor} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ ...typography.body, fontWeight: '500', color: colors.textPrimary }}>
                                            {option.title}
                                        </Text>
                                        <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: 2 }}>
                                            {option.description}
                                        </Text>
                                    </View>
                                </View>
                                <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Help Text */}
                <View style={{ marginTop: spacing.xl, marginHorizontal: spacing.lg, padding: spacing.lg, backgroundColor: colors.muted, borderRadius: radii.lg }}>
                    <Text style={{ ...typography.caption, color: colors.textMuted, textAlign: 'center' }}>
                        Create a new profile to list your services, or edit your existing portfolio to update your information.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}
