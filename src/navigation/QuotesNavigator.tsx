import { createNativeStackNavigator } from '@react-navigation/native-stack';

import QuotesScreen from '../screens/QuotesScreen';
import QuoteDetailScreen from '../screens/QuoteDetailScreen';
import QuoteResponseScreen from '../screens/QuoteResponseScreen';
import QuoteHistoryScreen from '../screens/QuoteHistoryScreen';
import { colors } from '../theme';

export type QuotesStackParamList = {
  QuotesList: undefined;
  QuoteDetail: { quoteId: number };
  QuoteResponse: {
    revisionId: number;
    quoteRequestId: number;
    vendorName?: string;
    amount?: number;
    description?: string;
  };
  QuoteHistory: { quoteRequestId: number };
};

const Stack = createNativeStackNavigator<QuotesStackParamList>();

export function QuotesNavigator() {
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
        name="QuotesList"
        component={QuotesScreen}
        options={{ title: 'My quotes' }}
      />
      <Stack.Screen
        name="QuoteDetail"
        component={QuoteDetailScreen}
        options={{ title: 'Quote details' }}
      />
      <Stack.Screen
        name="QuoteResponse"
        component={QuoteResponseScreen}
        options={{ title: 'Review quote' }}
      />
      <Stack.Screen
        name="QuoteHistory"
        component={QuoteHistoryScreen}
        options={{ title: 'Quote history' }}
      />
    </Stack.Navigator>
  );
}
