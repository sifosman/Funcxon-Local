import { createNativeStackNavigator } from '@react-navigation/native-stack';
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
import SubscriptionPlansScreen from '../screens/SubscriptionPlansScreen';
import VenueListingPlansScreen from '../screens/VenueListingPlansScreen';
import VenueCatalogueViewScreen from '../screens/VenueCatalogueViewScreen';
import TermsAndPoliciesScreen from '../screens/TermsAndPoliciesScreen';
import LegalDocumentScreen from '../screens/LegalDocumentScreen';
import PortfolioAssistanceScreen from '../screens/PortfolioAssistanceScreen';

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
  QuoteRequest: {
    vendorId: number;
    vendorName: string;
    type?: 'vendor' | 'venue';
    editMode?: boolean;
    quoteId?: number;
    initialLineItems?: Array<{ name: string; quantity: string; price: string }>;
  };
  BookTour: { venueId: number; venueName: string };
  CreateReview: { type: 'vendor' | 'venue'; targetId: number; targetName: string };
  VenueCatalogueView: { venueId: number; venueName: string };
  Planner: undefined;
  BlogList: undefined;
  BlogDetail: { slug: string };
  ListersPortal: undefined;
  SubscriptionPlans: undefined;
  VenueListingPlans: undefined;
  TermsAndPolicies: undefined;
  LegalDocument: { documentId: string };
  PortfolioAssistance: { openFaqs?: boolean } | undefined;
};

const Stack = createNativeStackNavigator<AttendeeStackParamList>();

export function AttendeeNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
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
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="VendorProfile"
        component={VendorProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="VenueProfile"
        component={VenueProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="QuoteRequest"
        component={QuoteRequestScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateReview"
        component={CreateReviewScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="BookTour"
        component={BookTourScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Planner"
        component={PlannerScreen}
        options={{ headerShown: false }}
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
        name="VenueCatalogueView"
        component={VenueCatalogueViewScreen}
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
      <Stack.Screen
        name="PortfolioAssistance"
        component={PortfolioAssistanceScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
