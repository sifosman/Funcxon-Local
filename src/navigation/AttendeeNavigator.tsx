import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import AttendeeHomeScreen from '../screens/AttendeeHomeScreen';
import VendorProfileScreen from '../screens/VendorProfileScreen';
import VenueProfileScreen from '../screens/VenueProfileScreen';
import BookTourScreen from '../screens/BookTourScreen';
import QuoteRequestScreen from '../screens/QuoteRequestScreen';
import PlannerScreen from '../screens/PlannerScreen';
import { colors, typography } from '../theme';

export type AttendeeStackParamList = {
  VendorList: undefined;
  VendorProfile: { vendorId: number; from?: 'Favourites' };
  VenueProfile: { venueId: number; from?: 'Favourites' };
  QuoteRequest: { vendorId: number; vendorName: string; type?: 'vendor' | 'venue' };
  BookTour: { venueId: number; venueName: string };
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
        name="VenueProfile"
        component={VenueProfileScreen}
        options={{ title: 'Venue profile' }}
      />
      <Stack.Screen
        name="QuoteRequest"
        component={QuoteRequestScreen}
        options={{ title: 'Request a quote' }}
      />
      <Stack.Screen
        name="BookTour"
        component={BookTourScreen}
        options={{ title: 'Book a venue tour' }}
      />
      <Stack.Screen
        name="Planner"
        component={PlannerScreen}
        options={{ title: 'My planner (demo)' }}
      />
    </Stack.Navigator>
  );
}
