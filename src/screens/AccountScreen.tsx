import { useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radii, typography } from '../theme';
import { useAuth } from '../auth/AuthContext';

// This will be defined in ProfileNavigator
type ProfileStackParamList = {
    AccountMain: undefined;
    SubscriberSuite: undefined;
    SubscriberLogin: undefined;
    SubscriberProfile: undefined;
};

type MenuItem = {
    id: string;
    label: string;
    icon: keyof typeof MaterialIcons.glyphMap;
    route?: keyof ProfileStackParamList;
    action?: () => void;
    color?: string;
    submenu?: MenuItem[];
};

export default function AccountScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
    const { signOut } = useAuth();
    const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

    const toggleMenu = (menuId: string) => {
        const newExpanded = new Set(expandedMenus);
        if (newExpanded.has(menuId)) {
            newExpanded.delete(menuId);
        } else {
            newExpanded.add(menuId);
        }
        setExpandedMenus(newExpanded);
    };

    const handleLogout = async () => {
        const { error } = await signOut();
        if (error) {
            Alert.alert('Sign out failed', error.message);
        }
    };

    const menuItems: MenuItem[] = [
        {
            id: 'my-profile',
            label: 'My Profile',
            icon: 'person',
            submenu: [
                { id: 'create-profile', label: 'Create Profile', icon: 'person-add' },
                { id: 'edit-profile', label: 'Edit Profile', icon: 'edit' },
                { id: 'change-password', label: 'Change Password', icon: 'lock' },
                { id: 'marketing-permissions', label: 'Marketing Permissions', icon: 'notifications' },
                { id: 'delete-account', label: 'Delete Account', icon: 'delete', color: colors.destructive },
            ],
        },
        {
            id: 'my-planner',
            label: 'My Planner',
            icon: 'event',
        },
        {
            id: 'my-quotes',
            label: 'My Quotes',
            icon: 'request-quote',
        },
        {
            id: 'subscriber-suite',
            label: 'Subscriber Suite',
            icon: 'credit-card',
            submenu: [
                { id: 'portfolio-profile', label: 'Portfolio Profile', icon: 'business-center', route: 'SubscriberLogin' },
                { id: 'subscriber-legal-terms', label: 'Subscriber Legal Terms', icon: 'description' },
                { id: 'activity-dashboard', label: 'Activity Dashboard', icon: 'bar-chart' },
            ],
        },
        {
            id: 'listings-subscription',
            label: 'Listings Subscription Offers',
            icon: 'local-offer',
            submenu: [
                { id: 'subscription-plans', label: 'View Subscription Plans', icon: 'credit-card' },
                { id: 'subscription-vendors', label: 'Vendors / Service Professionals', icon: 'store' },
                { id: 'subscription-venues', label: 'Venues', icon: 'location-city' },
            ],
        },
        {
            id: 'terms-policies',
            label: 'Funcxon Terms and Policies',
            icon: 'shield',
        },
        {
            id: 'help-centre',
            label: 'Help Centre',
            icon: 'help',
        },
        {
            id: 'logout',
            label: 'Logout',
            icon: 'logout',
            color: colors.destructive,
            action: handleLogout,
        },
    ];

    const renderMenuItem = (item: MenuItem, isSubmenu = false) => {
        const isExpanded = expandedMenus.has(item.id);
        const hasSubmenu = item.submenu && item.submenu.length > 0;
        const textColor = item.color || colors.textPrimary;

        const handlePress = () => {
            if (item.action) {
                item.action();
            } else if (hasSubmenu) {
                toggleMenu(item.id);
            } else if (item.route) {
                navigation.navigate(item.route);
            } else if (item.id === 'subscription-plans') {
                navigation.navigate('SubscriptionPlans');
            }
        };

        return (
            <View key={item.id}>
                <TouchableOpacity
                    onPress={handlePress}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingVertical: spacing.md,
                        paddingHorizontal: isSubmenu ? spacing.xl + spacing.lg : spacing.lg,
                        backgroundColor: colors.surface,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.borderSubtle,
                    }}
                    activeOpacity={0.7}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <MaterialIcons
                            name={item.icon}
                            size={20}
                            color={isSubmenu ? colors.textMuted : colors.primaryTeal}
                            style={{ marginRight: spacing.md }}
                        />
                        <Text
                            style={{
                                ...typography.body,
                                fontWeight: isSubmenu ? '400' : '500',
                                color: textColor,
                                fontSize: isSubmenu ? 13 : 14,
                            }}
                        >
                            {item.label}
                        </Text>
                    </View>
                    {hasSubmenu && (
                        <MaterialIcons
                            name={isExpanded ? 'expand-less' : 'expand-more'}
                            size={20}
                            color={colors.textMuted}
                        />
                    )}
                    {!hasSubmenu && !item.action && (
                        <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
                    )}
                </TouchableOpacity>

                {hasSubmenu && isExpanded && (
                    <View style={{ backgroundColor: colors.backgroundAlt }}>
                        {item.submenu!.map((subItem) => renderMenuItem(subItem, true))}
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
                <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.lg }}>
                    <Text style={{ ...typography.displayMedium, color: colors.textPrimary }}>My Account</Text>
                </View>

                <View
                    style={{
                        marginHorizontal: spacing.lg,
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
                    {menuItems.map((item) => renderMenuItem(item))}
                </View>
            </ScrollView>
        </View>
    );
}
