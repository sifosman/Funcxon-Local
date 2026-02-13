import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AccountScreen from '../screens/AccountScreen';
import SubscriberSuiteScreen from '../screens/SubscriberSuiteScreen';
import SubscriberLoginScreen from '../screens/SubscriberLoginScreen';
import SubscriberProfileScreen from '../screens/SubscriberProfileScreen';
import PortfolioProfileScreen from '../screens/subscriber/PortfolioProfileScreen';
import PortfolioTypeScreen from '../screens/subscriber/PortfolioTypeScreen';
import ApplicationStep1Screen from '../screens/subscriber/ApplicationStep1Screen';
import ApplicationStep2Screen from '../screens/subscriber/ApplicationStep2Screen';
import ApplicationStep3Screen from '../screens/subscriber/ApplicationStep3Screen';
import ApplicationStep4Screen from '../screens/subscriber/ApplicationStep4Screen';
import SubscriptionPlansScreen from '../screens/SubscriptionPlansScreen';
import SubscriptionCheckoutScreen from '../screens/SubscriptionCheckoutScreen';
import PortfolioAssistanceScreen from '../screens/PortfolioAssistanceScreen';
import VendorSignupSuccessScreen from '../screens/VendorSignupSuccessScreen';
import TermsAndPoliciesScreen from '../screens/TermsAndPoliciesScreen';
import LegalDocumentScreen from '../screens/LegalDocumentScreen';
import VenueListingPlansScreen from '../screens/VenueListingPlansScreen';
import UpdatePortfolioScreen from '../screens/subscriber/UpdatePortfolioScreen';
import UpdateVendorPortfolioScreen from '../screens/subscriber/UpdateVendorPortfolioScreen';
import UpdateVenuePortfolioScreen from '../screens/subscriber/UpdateVenuePortfolioScreen';
import VenueCatalogueScreen from '../screens/subscriber/VenueCatalogueScreen';
import VendorCatalogueScreen from '../screens/subscriber/VendorCatalogueScreen';
import VenueQuoteRequestsScreen from '../screens/subscriber/VenueQuoteRequestsScreen';
import VenueTourBookingsScreen from '../screens/subscriber/VenueTourBookingsScreen';
import VenueAnalyticsScreen from '../screens/subscriber/VenueAnalyticsScreen';
import ActionItemsScreen from '../screens/subscriber/ActionItemsScreen';
import CalendarUpdatesScreen from '../screens/subscriber/CalendarUpdatesScreen';
import BillingScreen from '../screens/BillingScreen';
import { colors, typography } from '../theme';

export type ProfileStackParamList = {
    AccountMain: undefined;
    SubscriberSuite: undefined;
    SubscriberLogin: undefined;
    SubscriberProfile: undefined;
    PortfolioProfile: undefined;
    PortfolioType: undefined;
    ApplicationStep1: undefined;
    ApplicationStep2: undefined;
    ApplicationStep3: undefined;
    ApplicationStep4: undefined;
    SubscriptionPlans: undefined;
    VenueListingPlans: undefined;
    SubscriptionCheckout: {
        tierName: string;
        billing: 'monthly' | 'yearly' | '6_month' | '12_month';
        priceLabel: string;
        isFree: boolean;
        productType?: 'vendor' | 'venue';
        planKey?: string;
    };
    VendorSignupSuccess: { email: string; fullName: string; tierName: string };
    PortfolioAssistance: undefined;
    UpdatePortfolio: undefined;
    UpdateVendorPortfolio: undefined;
    UpdateVenuePortfolio: undefined;
    VenueCatalogue: undefined;
    VendorCatalogue: undefined;
    VenueQuoteRequests: undefined;
    VenueTourBookings: undefined;
    VenueAnalytics: undefined;
    ActionItems: undefined;
    CalendarUpdates: undefined;
    Billing: undefined;
    TermsAndPolicies: undefined;
    LegalDocument: { documentId: string };
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileNavigator() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: {
                    backgroundColor: colors.surface,
                },
                headerTitleStyle: {
                    ...typography.titleMedium,
                    color: colors.textPrimary,
                },
                headerTintColor: colors.textPrimary,
            }}
        >
            <Stack.Screen
                name="AccountMain"
                component={AccountScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="SubscriberSuite"
                component={SubscriberSuiteScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="SubscriberLogin"
                component={SubscriberLoginScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="SubscriberProfile"
                component={SubscriberProfileScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="PortfolioProfile"
                component={PortfolioProfileScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="PortfolioType"
                component={PortfolioTypeScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="ApplicationStep1"
                component={ApplicationStep1Screen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="ApplicationStep2"
                component={ApplicationStep2Screen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="ApplicationStep3"
                component={ApplicationStep3Screen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="ApplicationStep4"
                component={ApplicationStep4Screen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="SubscriptionPlans"
                component={SubscriptionPlansScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="VenueListingPlans"
                component={VenueListingPlansScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="SubscriptionCheckout"
                component={SubscriptionCheckoutScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="PortfolioAssistance"
                component={PortfolioAssistanceScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="VendorSignupSuccess"
                component={VendorSignupSuccessScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="UpdatePortfolio"
                component={UpdatePortfolioScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="UpdateVendorPortfolio"
                component={UpdateVendorPortfolioScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="UpdateVenuePortfolio"
                component={UpdateVenuePortfolioScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="VenueCatalogue"
                component={VenueCatalogueScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="VendorCatalogue"
                component={VendorCatalogueScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="VenueQuoteRequests"
                component={VenueQuoteRequestsScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="VenueTourBookings"
                component={VenueTourBookingsScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="VenueAnalytics"
                component={VenueAnalyticsScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="ActionItems"
                component={ActionItemsScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="CalendarUpdates"
                component={CalendarUpdatesScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Billing"
                component={BillingScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="TermsAndPolicies"
                component={TermsAndPoliciesScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="LegalDocument"
                component={LegalDocumentScreen}
                options={{ headerShown: false }}
            />
        </Stack.Navigator>
    );
}
