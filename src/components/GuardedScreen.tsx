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

  // Serialize route.params to a stable string for dependency comparison.
  // route.params is a new object on every render, which would cause an
  // infinite re-render loop if used directly as a useEffect dependency.
  // Use individual scalar fields instead of the params object itself.
  const paramsScreen = (route.params as any)?.screen as string | undefined;

  // Check if the target screen is in the allowed list for guests
  // This allows guests to view subscription plans before signing up
  useEffect(() => {
    const checkAllowedScreen = () => {
      // Check route params for nested screen navigation
      if (paramsScreen && GUEST_ALLOWED_SCREENS.includes(paramsScreen)) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsScreen, session]);

  if (!session && !allowedScreen) {
    return <GuestPromptScreen label={label} />;
  }

  return <Component />;
}
