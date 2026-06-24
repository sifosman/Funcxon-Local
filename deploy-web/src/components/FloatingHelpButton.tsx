// WEB ONLY — deploy-web/src/components/FloatingHelpButton.tsx
import { useAuth } from '../auth/AuthContext';

interface FloatingHelpButtonProps {
  onClick?: () => void;
}

export function FloatingHelpButton({ onClick }: FloatingHelpButtonProps) {
  const { user } = useAuth();
  const isVendor = user?.user_metadata?.role === 'vendor' || user?.user_metadata?.role === 'venue';

  if (!isVendor) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-teal text-white shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-brand-teal focus:ring-offset-2"
      aria-label="Help"
    >
      <span className="material-symbols-outlined text-2xl">help</span>
    </button>
  );
}
