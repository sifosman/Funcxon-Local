import { Platform } from 'react-native';

export const linking = {
  prefixes: [
    'funxon://',
    'https://funxon.co.za',
    ...(Platform.OS === 'web' && typeof window !== 'undefined' ? [window.location.origin] : []),
  ],
  config: {
    screens: {
      Main: {
        screens: {
          Home: {
            path: '',
            screens: {
              VendorList: '',
              SubscriptionPlans: 'subscription-plans',
              VenueListingPlans: 'venue-listing-plans',
              ListersPortal: 'listers-portal',
            },
          },
          Favourites: 'favourites',
          Quotes: {
            path: 'quotes',
            screens: {
              QuotesList: '',
              QuoteDetail: 'detail/:quoteId',
              QuoteResponse: 'response/:revisionId',
              QuoteHistory: 'history/:quoteRequestId',
            },
          },
          Planner: 'planner',
          Account: {
            path: 'account',
            screens: {
              AccountMain: '',
              ApplicationStatus: 'application-status',
              VenueQuoteRequests: 'vendor/quotes',
              VendorQuoteCreate: 'vendor/quote/:quoteRequestId',
              VendorCatalogue: 'vendor-catalogue',
              VenueCatalogue: 'venue-catalogue',
              Billing: {
                path: 'payment/success',
                alias: ['payment/cancel'],
              },
            },
          },
        },
      },
      Auth: 'auth',
    },
  },
};
