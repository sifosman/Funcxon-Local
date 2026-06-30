// WEB ONLY — deploy-web/src/components/GuestPrompt.tsx
import { Link } from 'react-router-dom';
import logoUrl from '../../assets/assets/logo.png';

interface GuestPromptProps {
  label: string;
}

export default function GuestPrompt({ label }: GuestPromptProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-8 h-24 w-24 overflow-hidden rounded-full border border-outline-variant bg-brand-cream p-3">
        <img src={logoUrl} alt="Funxon" className="h-full w-full object-contain" />
      </div>

      <h1 className="font-display mb-3 text-2xl font-bold text-on-surface">
        Sign in to access {label.toLowerCase()}
      </h1>
      <p className="mb-8 max-w-xs text-sm text-on-surface-variant">
        Create a free account or sign in to unlock all features and save your preferences.
      </p>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <Link
          to="/signin"
          className="fx-btn-primary inline-flex h-12 items-center justify-center rounded-lg px-6 text-base font-bold"
        >
          Log in
        </Link>
        <Link
          to="/signup"
          className="fx-btn-outline inline-flex h-12 items-center justify-center rounded-lg px-6 text-base font-bold"
        >
          Get started
        </Link>
      </div>

      <Link to="/" className="mt-6 text-sm text-on-surface-variant hover:text-brand-teal">
        Continue browsing
      </Link>
    </div>
  );
}
