// WEB ONLY — deploy-web/src/components/GuardedRoute.tsx
import { useAuth } from '../auth/AuthContext';
import GuestPrompt from './GuestPrompt';

interface GuardedRouteProps {
  children: React.ReactNode;
  label?: string;
}

export function GuardedRoute({ children, label = 'this page' }: GuardedRouteProps) {
  const { session } = useAuth();

  if (!session) {
    return <GuestPrompt label={label} />;
  }

  return <>{children}</>;
}
