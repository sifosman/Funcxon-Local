import { useAuth } from '../auth/AuthContext';
import GuestPromptScreen from '../screens/GuestPromptScreen';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useState } from 'react';

interface GuardedScreenProps {
  component: React.ComponentType<any>;
  label: string;
}

// Screens that guests can access without authentication
const GUEST_ALLOWED_SCREENS = ['SubscriptionPlans', 'VenueListingPlans'];

export default function GuardedScreen({ component: Component, label }: GuardedScreenProps) {
  const { session } = useAuth();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [allowedScreen, setAllowedScreen] = useState(false);

  // Check if the target screen is in the allowed list for guests
  // This allows guests to view subscription plans before signing up
  useEffect(() => {
    const checkAllowedScreen = () => {
      // Check route params for nested screen navigation
      const params = route.params as any;
      if (params?.screen && GUEST_ALLOWED_SCREENS.includes(params.screen)) {
        setAllowedScreen(true);
        return;
      }
      
      // Check navigation state for nested routes (handles deep linking)
      const state = navigation.getState();
      if (state?.routes) {
        for (const r of state.routes) {
          if (GUEST_ALLOWED_SCREENS.includes(r.name)) {
            setAllowedScreen(true);
            return;
          }
          if (r.params?.screen && GUEST_ALLOWED_SCREENS.includes(r.params.screen)) {
            setAllowedScreen(true);
            return;
          }
        }
      }
      
      setAllowedScreen(false);
    };
    
    checkAllowedScreen();
  }, [route.params, navigation]);

  if (!session && !allowedScreen) {
    return <GuestPromptScreen label={label} />;
  }

  return <Component />;
}
