import { createNativeStackNavigator } from '@react-navigation/native-stack';

import QuotesScreen from '../screens/QuotesScreen';
import QuoteDetailScreen from '../screens/QuoteDetailScreen';
import { colors } from '../theme';

export type QuotesStackParamList = {
  QuotesList: undefined;
  QuoteDetail: { quoteId: number };
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
    </Stack.Navigator>
  );
}
