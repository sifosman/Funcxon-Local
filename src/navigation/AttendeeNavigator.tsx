import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import AttendeeHomeScreen from '../screens/AttendeeHomeScreen';
import VendorProfileScreen from '../screens/VendorProfileScreen';
import QuoteRequestScreen from '../screens/QuoteRequestScreen';
import PlannerScreen from '../screens/PlannerScreen';
import { colors, typography } from '../theme';

export type AttendeeStackParamList = {
  VendorList: undefined;
  VendorProfile: { vendorId: number };
  QuoteRequest: { vendorId: number; vendorName: string };
  Planner: undefined;
};

const Stack = createNativeStackNavigator<AttendeeStackParamList>();

export function AttendeeNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTitleStyle: {
          color: colors.textPrimary,
          fontWeight: '600',
        },
        headerTintColor: colors.textPrimary,
      }}
    >
      <Stack.Screen
        name="VendorList"
        component={AttendeeHomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="VendorProfile"
        component={VendorProfileScreen}
        options={{ title: 'Vendor profile' }}
      />
      <Stack.Screen
        name="QuoteRequest"
        component={QuoteRequestScreen}
        options={{ title: 'Request a quote' }}
      />
      <Stack.Screen
        name="Planner"
        component={PlannerScreen}
        options={{ title: 'My planner (demo)' }}
      />
    </Stack.Navigator>
  );
}
