import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { User, Heart, FileText, CalendarDays, LogOut, ChevronRight, Settings } from 'lucide-react';

const MENU_ITEMS = [
  { label: 'Favourites', href: '/account/favourites', icon: Heart },
  { label: 'My Quotes', href: '/quotes', icon: FileText },
  { label: 'Event Planner', href: '/planner', icon: CalendarDays },
  { label: 'Settings', href: '#', icon: Settings },
];

export default function AccountPage() {
  const { user, userRole, signOut, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/signin');
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="fx-container py-20 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  const displayName = user.user_metadata?.display_name || user.user_metadata?.full_name || user.email?.split('@')[0];

  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-2xl">
        {/* Profile Card */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-outline-variant">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white">
              <User className="h-8 w-8" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-on-surface">{displayName}</h1>
              <p className="text-sm text-on-surface-variant">{user.email}</p>
              <span className="mt-1 inline-block rounded-full bg-primary-fixed px-2 py-0.5 text-xs font-medium text-primary">
                {userRole === 'vendor' ? 'Vendor' : 'Attendee'}
              </span>
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="mt-6 space-y-2">
          {MENU_ITEMS.map(item => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.href}
                className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm border border-outline-variant hover:border-primary transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-medium text-on-surface">{item.label}</span>
                </div>
                <ChevronRight className="h-5 w-5 text-on-surface-variant" />
              </Link>
            );
          })}

          <button
            onClick={async () => { await signOut(); navigate('/'); }}
            className="flex w-full items-center justify-between rounded-xl bg-white p-4 shadow-sm border border-outline-variant hover:border-destructive transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-error-container">
                <LogOut className="h-5 w-5 text-error" />
              </div>
              <span className="font-medium text-error">Sign Out</span>
            </div>
            <ChevronRight className="h-5 w-5 text-on-surface-variant" />
          </button>
        </div>
      </div>
    </div>
  );
}
