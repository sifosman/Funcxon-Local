import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { AttendeeNavigator } from './AttendeeNavigator';
import { QuotesNavigator } from './QuotesNavigator';
import { ProfileNavigator } from './ProfileNavigator';
import DiscoverScreen from '../screens/DiscoverScreen';
import PlannerScreen from '../screens/PlannerScreen';
import FavouritesScreen from '../screens/FavouritesScreen';
import { colors, typography } from '../theme';

export type RootTabParamList = {
  Home: undefined;
  Discover: undefined;
  Favourites: undefined;
  Quotes: undefined;
  Planner: undefined;
  Account: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: colors.primaryTeal,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderSubtle,
          height: 80,
          paddingTop: 8,
          paddingBottom: 18,
          borderTopWidth: 1,
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -2 },
          elevation: 8,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        },
        tabBarLabelStyle: {
          ...typography.caption,
        },
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTitleStyle: {
          color: colors.textPrimary,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: keyof typeof MaterialIcons.glyphMap = 'home';

          if (route.name === 'Home') {
            iconName = 'search';
          } else if (route.name === 'Discover') {
            iconName = 'travel-explore';
          } else if (route.name === 'Favourites') {
            iconName = 'favorite';
          } else if (route.name === 'Quotes') {
            iconName = 'request-quote';
          } else if (route.name === 'Planner') {
            iconName = 'event-note';
          } else if (route.name === 'Account') {
            iconName = 'person';
          }

          const icon = <MaterialIcons name={iconName} size={size} color={focused ? colors.primaryTeal : colors.textMuted} />;

          if (!focused) {
            return icon;
          }

          return (
            <View
              style={{
                shadowColor: colors.primaryTeal,
                shadowOpacity: 0.5,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 0 },
                elevation: 8,
              }}
            >
              {icon}
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={AttendeeNavigator}
        options={{ headerShown: false, tabBarLabel: 'Search' }}
      />
      <Tab.Screen
        name="Favourites"
        component={FavouritesScreen}
        options={{ headerTitle: 'Favourites', tabBarLabel: 'Favourites' }}
      />
      <Tab.Screen
        name="Quotes"
        component={QuotesNavigator}
        options={{ headerShown: false, tabBarLabel: 'Quotes' }}
      />
      <Tab.Screen
        name="Planner"
        component={PlannerScreen}
        options={{ headerTitle: 'My planner', tabBarLabel: 'Planner' }}
      />
      <Tab.Screen
        name="Account"
        component={ProfileNavigator}
        options={{ headerShown: false, tabBarLabel: 'Account' }}
      />
    </Tab.Navigator>
  );
}
