import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radii, typography } from '../theme';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { getLatestUserApplication, getLatestUserApplicationByType, isBlockingApplicationStatus } from '../lib/applicationService';
import type { ProfileStackParamList } from '../navigation/ProfileNavigator';
import { HelpCenterModal } from '../components/HelpCenterModal';
import ThemedAlert from '../components/ThemedAlert';
import { useApplicationForm } from '../context/ApplicationFormContext';
import { useIsDesktop } from '../hooks/useIsDesktop';

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
    const { signOut, user, userRole } = useAuth();
    const { resetForm } = useApplicationForm();
    const isDesktop = useIsDesktop();
    const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
    const [helpVisible, setHelpVisible] = useState(false);
    const [logoutAlert, setLogoutAlert] = useState<{visible: boolean; title: string; message: string} | null>(null);
    const [currentPlan, setCurrentPlan] = useState<string | null>(null);
    const [hasSubscriberAccess, setHasSubscriberAccess] = useState(false);

    const fetchCurrentPlan = useCallback(async () => {
        if (!user?.id) {
            setHasSubscriberAccess(false);
            return;
        }
        try {
            const { data: userData } = await supabase
                .from('users')
                .select('id, auth_user_id')
                .eq('auth_user_id', user.id)
                .maybeSingle();
            const listingUserId = userData?.auth_user_id ?? user.id;

            // A user has Lister Portfolio access if they have any vendor,
            // venue listing, legacy venue, or a submitted subscriber application.
            const [{ data: vendorData }, { data: venueData }, { data: applicationsData }] = await Promise.all([
                supabase.from('vendors').select('subscription_tier').eq('user_id', listingUserId).maybeSingle(),
                supabase.from('venue_listings').select('id').eq('user_id', listingUserId).maybeSingle(),
                supabase.from('subscriber_applications').select('id').eq('user_id', listingUserId).limit(1),
            ]);

            const hasPortfolio = !!vendorData || !!venueData || !!(applicationsData && applicationsData.length > 0);
            setHasSubscriberAccess(hasPortfolio || userRole === 'vendor');
            setCurrentPlan(vendorData?.subscription_tier || null);
        } catch {
            // Silently fail; fall back to role-based access
            setHasSubscriberAccess(userRole === 'vendor');
        }
    }, [user?.id, userRole]);

    useFocusEffect(
        useCallback(() => {
            fetchCurrentPlan();
        }, [fetchCurrentPlan]),
    );

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
            setLogoutAlert({ visible: true, title: 'Sign out failed', message: error.message });
            return;
        }

        setLogoutAlert({ visible: true, title: 'Logged out', message: 'You have been logged out successfully.' });
    };

    const handleLogin = () => {
        const rootNav = navigation.getParent()?.getParent() as any;
        rootNav?.navigate?.('Auth', { screen: 'SignIn' });
    };

    const handleGoToPlanner = () => {
        // Navigate to the Planner tab
        const parentNav = navigation.getParent() as any;
        parentNav?.navigate?.('Planner');
    };

    const handleGoToQuotes = () => {
        // Navigate to the Quotes tab
        const parentNav = navigation.getParent() as any;
        parentNav?.navigate?.('Quotes');
    };

    const handleEditAccount = () => {
        if (!user?.id) {
            const rootNav = navigation.getParent()?.getParent() as any;
            rootNav?.navigate?.('Auth', { screen: 'SignIn' });
            return;
        }

        navigation.navigate('AccountSettings');
    };

    const navigateToExistingApplicationIfBlocked = async () => {
        const latestApplication = await getLatestUserApplication();
        if (!latestApplication.success || !latestApplication.data) {
            return false;
        }

        if (isBlockingApplicationStatus(latestApplication.data.status)) {
            navigation.navigate('ApplicationStatus');
            return true;
        }

        return false;
    };

    const handleBecomeVendor = async () => {
        if (!user?.id) {
            navigation.navigate('SubscriptionPlans');
            return;
        }

        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, auth_user_id')
            .eq('auth_user_id', user.id)
            .maybeSingle();

        const vendorUserId = userData?.auth_user_id ?? user.id;

        const { data: vendorData, error: vendorError } = await supabase
            .from('vendors')
            .select('id, subscription_status, subscription_tier')
            .eq('user_id', vendorUserId)
            .maybeSingle();

        if (vendorError) {
            navigation.navigate('SubscriptionPlans');
            return;
        }

        const status = String(vendorData?.subscription_status ?? '').toLowerCase();
        const tier = String(vendorData?.subscription_tier ?? '').toLowerCase();
        const hasActiveSubscription = !!vendorData && (status === 'active' || status === 'trial' || tier === 'premium' || tier === 'premium_plus');

        if (!hasActiveSubscription) {
            navigation.navigate('SubscriptionPlans');
            return;
        }

        const latestVendorApplication = await getLatestUserApplicationByType('vendor');
        if (latestVendorApplication.success && latestVendorApplication.data && isBlockingApplicationStatus(latestVendorApplication.data.status)) {
            navigation.navigate('ApplicationStatus');
            return;
        }

        resetForm();
        navigation.navigate('PortfolioType');
    };

    const handleGoToVenueListingPlans = async () => {
        // If user already has a venue listing, let them through to upgrade/change plan
        if (user?.id) {
            const { data: existingVenue } = await supabase
                .from('venue_listings')
                .select('id')
                .eq('user_id', user.id)
                .maybeSingle();

            if (existingVenue?.id) {
                navigation.navigate('VenueListingPlans');
                return;
            }
        }

        // New applicant — check for blocking application status
        const latestVenueApplication = await getLatestUserApplicationByType('venue');
        if (latestVenueApplication.success && latestVenueApplication.data && isBlockingApplicationStatus(latestVenueApplication.data.status)) {
            navigation.navigate('ApplicationStatus');
            return;
        }

        navigation.navigate('VenueListingPlans');
    };

    const handleGoToListings = () => {
        // Jump to the Home tab (Search/Listings) and its initial screen.
        // This screen lives in the root tab navigator, so we need to navigate via the parent navigator.
        const parentNav = navigation.getParent() as any;
        parentNav?.navigate?.('Home', { screen: 'VendorList' });
    };

    const handleHelpCentre = () => {
        setHelpVisible(true);
    };

    const [errorAlert, setErrorAlert] = useState<{visible: boolean; title: string; message: string} | null>(null);

    const executeDeleteAccount = async () => {
        if (!user?.id) return;
        setHelpVisible(false);
        try {
            const { error } = await supabase
                .from('account_deletion_requests')
                .insert({ user_id: user.id, status: 'pending' });

            if (error) throw error;

            setErrorAlert({
                visible: true,
                title: 'Request Submitted',
                message: 'Your account deletion request has been submitted. Our admin team will review and process it within 48 hours. You will be notified once it is completed.',
            });
        } catch (err: any) {
            setErrorAlert({
                visible: true,
                title: 'Request Failed',
                message: err?.message || 'Could not submit deletion request. Please try again or contact support.',
            });
        }
    };

    const menuItems: MenuItem[] = [
        {
            id: 'lister-portfolio',
            label: 'Lister Portfolio Dashboard',
            icon: 'dashboard',
            route: 'ListerPortfolio',
        },
        {
            id: 'my-profile',
            label: 'My Profile',
            icon: 'person',
            submenu: [
                { id: 'edit-username-password', label: 'Edit Username & Password', icon: 'edit', action: handleEditAccount },
                { id: 'notification', label: 'Notification', icon: 'notifications', route: 'MarketingPermissions' },
            ],
        },
        ...(userRole !== 'vendor' ? [{
            id: 'my-tours',
            label: 'My Bookings',
            icon: 'calendar-month' as keyof typeof MaterialIcons.glyphMap,
            route: 'MyTours' as keyof ProfileStackParamList,
        }] : []),
        {
            id: 'terms-policies',
            label: 'Funxon Terms and Policies',
            icon: 'shield',
            route: 'TermsAndPolicies',
        },
        {
            id: 'help-centre',
            label: 'Help Centre',
            icon: 'help',
        },
        {
            id: user ? 'logout' : 'login',
            label: user ? 'Logout' : 'Login',
            icon: user ? 'logout' : 'login',
            color: user ? colors.destructive : colors.textPrimary,
            action: user ? handleLogout : handleLogin,
        },
    ];

    const renderMenuItem = (item: MenuItem, isSubmenu = false) => {
        const isExpanded = expandedMenus.has(item.id);
        const hasSubmenu = item.submenu && item.submenu.length > 0;
        const textColor = item.color || colors.textPrimary;
        const hideChevron = item.id === 'change-password'
            || item.id === 'marketing-permissions'
            || item.id === 'terms-policies'
            || item.id === 'help-centre'
            || item.id === 'delete-account'
            || item.id === 'account-management';

        const handlePress = () => {
            if (item.action) {
                item.action();
            } else if (hasSubmenu) {
                toggleMenu(item.id);
            } else if (item.route) {
                // Use type assertion to fix TypeScript issue with dynamic route
                (navigation as any).navigate(item.route);
            } else if (item.id === 'my-planner') {
                handleGoToPlanner();
            } else if (item.id === 'my-quotes') {
                handleGoToQuotes();
            } else if (item.id === 'help-centre') {
                handleHelpCentre();
            }
        };

        return (
            <View key={item.id}>
                <TouchableOpacity
                    testID={item.id}
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
                            color={isSubmenu ? colors.textMuted : colors.textPrimary}
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
                    {!hasSubmenu && !item.action && !hideChevron && (
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
        <View style={{ flex: 1, backgroundColor: isDesktop ? colors.surfaceBg : colors.background }}>
            <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
                {isDesktop ? (
                    <View style={{ maxWidth: 1200, width: '100%', alignSelf: 'center', paddingHorizontal: 48, paddingTop: spacing.xl, paddingBottom: spacing.xl }}>
                        <View style={{ flexDirection: 'row', gap: spacing.gutter } as any}>
                            <View style={{ width: 320, gap: spacing.gutter } as any}>
                                <View
                                    style={{
                                        borderRadius: radii.lg,
                                        overflow: 'hidden',
                                        backgroundColor: colors.surfaceContainerLowest,
                                        borderWidth: 1,
                                        borderColor: colors.outlineVariant,
                                    }}
                                >
                                    {menuItems
                                        .filter((item) => item.id !== 'lister-portfolio' || hasSubscriberAccess)
                                        .map((item) => renderMenuItem(item))}
                                </View>
                            </View>
                            <View style={{ flex: 1, gap: spacing.gutter } as any}>
                                <View
                                    style={{
                                        backgroundColor: colors.surfaceContainerLowest,
                                        borderRadius: radii.lg,
                                        borderWidth: 1,
                                        borderColor: colors.outlineVariant,
                                        padding: spacing.xl,
                                    }}
                                >
                                    <Text style={{ ...typography.headlineMd, color: colors.textPrimary }}>
                                        Hello{user?.email ? `, ${user.email.split('@')[0]}` : ''}
                                    </Text>
                                    {user && (
                                        <View style={{ marginTop: spacing.md }}>
                                            <Text style={{ ...typography.bodyMd, color: colors.onSurfaceVariant, marginBottom: spacing.sm }}>
                                                {user.email}
                                            </Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm }}>
                                                <View
                                                    style={{
                                                        paddingHorizontal: spacing.md,
                                                        paddingVertical: spacing.xs,
                                                        borderRadius: radii.full,
                                                        backgroundColor: userRole === 'vendor' ? colors.primary : colors.accent,
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            ...typography.labelMd,
                                                            color: userRole === 'vendor' ? '#FFFFFF' : colors.textPrimary,
                                                        }}
                                                    >
                                                        {userRole === 'vendor' ? 'Vendor' : 'Attendee'}
                                                    </Text>
                                                </View>
                                                {currentPlan && (
                                                    <View
                                                        style={{
                                                            paddingHorizontal: spacing.md,
                                                            paddingVertical: spacing.xs,
                                                            borderRadius: radii.full,
                                                            backgroundColor: currentPlan === 'free' ? '#9CA3AF' : currentPlan === 'premium' ? '#8B5CF6' : currentPlan === 'enterprise' ? '#DC2626' : colors.primary,
                                                        }}
                                                    >
                                                        <Text style={{ ...typography.labelMd, color: '#FFFFFF' }}>
                                                            {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan
                                                        </Text>
                                                    </View>
                                                )}
                                                {currentPlan && currentPlan !== 'enterprise' && (
                                                    <TouchableOpacity
                                                        onPress={() => navigation.navigate('SubscriptionPlans')}
                                                        style={{
                                                            paddingHorizontal: spacing.sm,
                                                            paddingVertical: spacing.xs,
                                                            borderRadius: radii.full,
                                                            borderWidth: 1,
                                                            borderColor: colors.primary,
                                                        }}
                                                    >
                                                        <Text style={{ ...typography.labelMd, color: colors.textPrimary }}>Upgrade</Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>
                    </View>
                ) : (
                    <>
                        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.lg }}>
                            <Text style={{ ...typography.displayMedium, color: colors.textPrimary }}>
                                Hello{user?.email ? `, ${user.email.split('@')[0]}` : ''}
                            </Text>
                            {user && (
                                <View style={{ marginTop: spacing.sm }}>
                                    <Text style={{ ...typography.caption, color: colors.textSecondary, marginBottom: spacing.xs }}>
                                        {user.email}
                                    </Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.xs }}>
                                        <View
                                            style={{
                                                paddingHorizontal: spacing.md,
                                                paddingVertical: spacing.xs,
                                                borderRadius: radii.full,
                                                backgroundColor: userRole === 'vendor' ? colors.primary : colors.accent,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    ...typography.caption,
                                                    fontWeight: '700',
                                                    color: userRole === 'vendor' ? '#FFFFFF' : colors.textPrimary,
                                                }}
                                            >
                                                {userRole === 'vendor' ? 'Vendor' : 'Attendee'}
                                            </Text>
                                        </View>
                                        {currentPlan && (
                                            <View
                                                style={{
                                                    paddingHorizontal: spacing.md,
                                                    paddingVertical: spacing.xs,
                                                    borderRadius: radii.full,
                                                    backgroundColor: currentPlan === 'free' ? '#9CA3AF' : currentPlan === 'premium' ? '#8B5CF6' : currentPlan === 'enterprise' ? '#DC2626' : colors.primary,
                                                }}
                                            >
                                                <Text style={{ ...typography.captionBold, color: '#FFFFFF' }}>
                                                    {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan
                                                </Text>
                                            </View>
                                        )}
                                        {currentPlan && currentPlan !== 'enterprise' && (
                                            <TouchableOpacity
                                                onPress={() => navigation.navigate('SubscriptionPlans')}
                                                style={{
                                                    paddingHorizontal: spacing.sm,
                                                    paddingVertical: spacing.xs,
                                                    borderRadius: radii.full,
                                                    borderWidth: 1,
                                                    borderColor: colors.primary,
                                                }}
                                            >
                                                <Text style={{ ...typography.captionSemiBold, color: colors.textPrimary, fontSize: 10 }}>Upgrade</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            )}
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
                            {menuItems
                                .filter((item) => item.id !== 'lister-portfolio' || hasSubscriberAccess)
                                .map((item) => renderMenuItem(item))}
                        </View>
                    </>
                )}
            </ScrollView>
            <HelpCenterModal
                visible={helpVisible}
                onClose={() => setHelpVisible(false)}
                onNavigateToHelp={() => {
                    setHelpVisible(false);
                    navigation.navigate('PortfolioAssistance', { openFaqs: true });
                }}
                onDeleteAccount={executeDeleteAccount}
                userRole={userRole}
            />
            {logoutAlert && (
                <ThemedAlert
                    visible={logoutAlert.visible}
                    title={logoutAlert.title}
                    message={logoutAlert.message}
                    buttons={[
                        { text: 'OK', style: 'default', onPress: () => { setLogoutAlert(null); const parentNav = navigation.getParent() as any; parentNav?.navigate?.('Home'); } }
                    ]}
                    onDismiss={() => setLogoutAlert(null)}
                />
            )}
            {errorAlert && (
                <ThemedAlert
                    visible={errorAlert.visible}
                    title={errorAlert.title}
                    message={errorAlert.message}
                    buttons={[{ text: 'OK', style: 'default', onPress: () => setErrorAlert(null) }]}
                    onDismiss={() => setErrorAlert(null)}
                />
            )}
        </View>
    );
}
