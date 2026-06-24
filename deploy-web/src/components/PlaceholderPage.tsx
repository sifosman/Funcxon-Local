// WEB ONLY — deploy-web/src/components/PlaceholderPage.tsx
import { Link } from 'react-router-dom';

interface PlaceholderPageProps {
  title: string;
  description?: string;
  backTo?: { label: string; href: string };
}

export function PlaceholderPage({ title, description, backTo }: PlaceholderPageProps) {
  return (
    <div className="fx-container flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <span className="material-symbols-outlined mb-4 text-6xl text-brand-teal/40">construction</span>
      <h1 className="font-display mb-2 text-2xl font-bold text-on-surface">{title}</h1>
      <p className="mb-6 max-w-md text-sm text-on-surface-variant">
        {description || 'This feature is being built for the Funxon web app. Check back soon.'}
      </p>
      {backTo ? (
        <Link to={backTo.href} className="fx-btn-outline inline-flex h-12 items-center justify-center rounded-lg px-6 text-base font-bold">
          {backTo.label}
        </Link>
      ) : (
        <Link to="/" className="fx-btn-primary inline-flex h-12 items-center justify-center rounded-lg px-6 text-base font-bold">
          Back to Home
        </Link>
      )}
    </div>
  );
}
