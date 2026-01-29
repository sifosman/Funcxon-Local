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
    SubscriptionCheckout: { tierName: string; billing: 'monthly' | 'yearly'; priceLabel: string; isFree: boolean };
    PortfolioAssistance: undefined;
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
                name="SubscriptionCheckout"
                component={SubscriptionCheckoutScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="PortfolioAssistance"
                component={PortfolioAssistanceScreen}
                options={{ headerShown: false }}
            />
        </Stack.Navigator>
    );
}
