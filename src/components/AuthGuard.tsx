import { useAuth } from '../auth/AuthContext';
import GuestPromptScreen from '../screens/GuestPromptScreen';

interface AuthGuardProps {
  children: React.ReactNode;
  label: string;
}

export default function AuthGuard({ children, label }: AuthGuardProps) {
  const { session } = useAuth();

  if (!session) {
    return <GuestPromptScreen label={label} />;
  }

  return <>{children}</>;
}
