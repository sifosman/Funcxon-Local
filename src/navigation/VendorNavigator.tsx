import { createNativeStackNavigator } from '@react-navigation/native-stack';

import VendorDashboardScreen from '../screens/VendorDashboardScreen';
import VendorOnboardingScreen from '../screens/VendorOnboardingScreen';
import VendorTagSelectionScreen from '../screens/VendorTagSelectionScreen';
import VendorCatalogScreen from '../screens/VendorCatalogScreen';
import VendorCatalogItemFormScreen from '../screens/VendorCatalogItemFormScreen';

export type VendorStackParamList = {
  VendorDashboard: undefined;
  VendorOnboarding: { vendorId: number };
  VendorTagSelection: { vendorId: number };
  VendorCatalog: undefined;
  VendorCatalogItemForm: { itemId?: number };
};

const Stack = createNativeStackNavigator<VendorStackParamList>();

export default function VendorNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerTintColor: '#0F3B57',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="VendorDashboard"
        component={VendorDashboardScreen}
        options={{ title: 'Vendor Dashboard' }}
      />
      <Stack.Screen
        name="VendorOnboarding"
        component={VendorOnboardingScreen}
        options={{ title: 'Vendor Registration' }}
      />
      <Stack.Screen
        name="VendorTagSelection"
        component={VendorTagSelectionScreen}
        options={{ title: 'Select Tags' }}
      />
      <Stack.Screen
        name="VendorCatalog"
        component={VendorCatalogScreen}
        options={{ title: 'My Catalog' }}
      />
      <Stack.Screen
        name="VendorCatalogItemForm"
        component={VendorCatalogItemFormScreen}
        options={{ title: 'Add/Edit Item' }}
      />
    </Stack.Navigator>
  );
}
