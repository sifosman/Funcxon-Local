import { useAuth } from '../auth/AuthContext';
import GuestPromptScreen from '../screens/GuestPromptScreen';

interface GuardedScreenProps {
  component: React.ComponentType<any>;
  label: string;
}

export default function GuardedScreen({ component: Component, label }: GuardedScreenProps) {
  const { session } = useAuth();

  if (!session) {
    return <GuestPromptScreen label={label} />;
  }

  return <Component />;
}
