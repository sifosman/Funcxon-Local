import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { FolderKanban, Store, Briefcase, ChevronRight } from 'lucide-react';

export default function CataloguePage() {
  const { user } = useAuth();

  const CATALOGUE_OPTIONS = [
    { label: 'Venue Catalogue', href: '/catalogue/venue', icon: Store, desc: 'Manage venue packages, pricing, and PDF pricelists.' },
    { label: 'Vendor Catalogue', href: '/catalogue/vendor', icon: Briefcase, desc: 'Manage vendor services, packages, and pricing.' },
  ];

  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-muted">
            <FolderKanban className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-on-surface">Catalogues</h1>
            <p className="text-sm text-on-surface-variant">Choose which catalogue to manage.</p>
          </div>
        </div>

        <div className="space-y-3">
          {CATALOGUE_OPTIONS.map(option => {
            const Icon = option.icon;
            return (
              <Link
                key={option.label}
                to={option.href}
                className="flex items-center justify-between rounded-xl bg-white p-5 shadow-sm border border-outline-variant hover:border-primary transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-pink">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-on-surface">{option.label}</p>
                    <p className="text-xs text-on-surface-variant">{option.desc}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-on-surface-variant" />
              </Link>
            );
          })}
        </div>

        {!user && (
          <div className="mt-8 rounded-xl border border-outline-variant bg-white p-6 text-center">
            <p className="text-sm text-on-surface-variant">Sign in to manage your catalogues.</p>
            <Link to="/signin" className="mt-3 inline-block rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white">Sign In</Link>
          </div>
        )}
      </div>
    </div>
  );
}
