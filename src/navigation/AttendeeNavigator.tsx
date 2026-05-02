import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import AttendeeHomeScreen from '../screens/AttendeeHomeScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import VendorProfileScreen from '../screens/VendorProfileScreen';
import VenueProfileScreen from '../screens/VenueProfileScreen';
import BookTourScreen from '../screens/BookTourScreen';
import QuoteRequestScreen from '../screens/QuoteRequestScreen';
import CreateReviewScreen from '../screens/CreateReviewScreen';
import PlannerScreen from '../screens/PlannerScreen';
import BlogListScreen from '../screens/BlogListScreen';
import BlogDetailScreen from '../screens/BlogDetailScreen';
import ListersPortalScreen from '../screens/ListersPortalScreen';
import { colors, typography } from '../theme';

export type AttendeeStackParamList = {
  VendorList: undefined;
  Discover:
    | {
        category?: 'all' | 'venues' | 'vendors' | 'services';
        initialSearch?: string;
        searchTitle?: string;
        presetFilter?: 'location' | 'categories' | 'amenities' | 'services' | 'featured';
        showFilters?: boolean;
      }
    | undefined;
  VendorProfile: { vendorId: number; from?: 'Favourites' | 'Quotes' };
  VenueProfile: { venueId: number; from?: 'Favourites' | 'Quotes' };
  QuoteRequest: { vendorId: number; vendorName: string; type?: 'vendor' | 'venue' };
  BookTour: { venueId: number; venueName: string };
  CreateReview: { type: 'vendor' | 'venue'; targetId: number; targetName: string };
  Planner: undefined;
  BlogList: undefined;
  BlogDetail: { slug: string };
  ListersPortal: undefined;
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
        name="Discover"
        component={DiscoverScreen}
        options={{ title: 'Discover' }}
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
        name="CreateReview"
        component={CreateReviewScreen}
        options={{ title: 'Leave a review' }}
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
      <Stack.Screen
        name="BlogList"
        component={BlogListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BlogDetail"
        component={BlogDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ListersPortal"
        component={ListersPortalScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
