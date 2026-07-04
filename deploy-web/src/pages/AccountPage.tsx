import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';
import { HelpCenterModal } from '../components/HelpCenterModal';
import { User, Heart, CalendarDays, LogOut, ChevronRight, Settings, LayoutDashboard, Store, FolderKanban, BarChart3, Ticket, CalendarCheck, ListChecks, Calendar, CreditCard, Lock, Trash2, HelpCircle, Crown } from 'lucide-react';

const MENU_ITEMS = [
  { label: 'Favourites', href: '/account/favourites', icon: Heart },
  { label: 'My Bookings', href: '/my-tours', icon: CalendarCheck },
  { label: 'Event Planner', href: '/planner', icon: CalendarDays },
  { label: 'Billing & Payments', href: '/account/billing', icon: CreditCard },
  { label: 'Settings', href: '/account/settings', icon: Settings },
  { label: 'Change Password', href: '/account/change-password', icon: Lock },
  { label: 'Help Center', href: '#help', icon: HelpCircle, onClick: 'help' },
  { label: 'Delete Account', href: '/account/delete', icon: Trash2, variant: 'danger' },
];

const VENDOR_MENU_ITEMS = [
  { label: 'Vendor Dashboard', href: '/vendor-dashboard', icon: LayoutDashboard },
  { label: 'Venue Dashboard', href: '/venue-dashboard', icon: Store },
  { label: 'Vendor Catalogue', href: '/catalogue/vendor', icon: FolderKanban },
  { label: 'Venue Catalogue', href: '/catalogue/venue', icon: FolderKanban },
  { label: 'Venue Analytics', href: '/venue/analytics', icon: BarChart3 },
  { label: 'Venue Quote Requests', href: '/venue/quotes', icon: Ticket },
  { label: 'Venue Tour Bookings', href: '/venue/tours', icon: CalendarCheck },
  { label: 'Action Items', href: '/vendor/action-items', icon: ListChecks },
  { label: 'Calendar Updates', href: '/vendor/calendar', icon: Calendar },
  { label: 'Venue Listing Plans', href: '/venue-listing-plans', icon: Store },
];

export default function AccountPage() {
  const { user, userRole, signOut, isLoading } = useAuth();
  const navigate = useNavigate();
  const [helpOpen, setHelpOpen] = useState(false);
  const [tier, setTier] = useState<string | null>(null);
  const [tierLoading, setTierLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/signin');
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (!user?.id) return;
    async function loadTier() {
      setTierLoading(true);
      try {
        const [{ data: vendorRow }, { data: venueRow }] = await Promise.all([
          supabase.from('vendors').select('subscription_tier').eq('user_id', user!.id).maybeSingle(),
          supabase.from('venue_listings').select('subscription_plan').eq('user_id', user!.id).maybeSingle(),
        ]);
        const raw = vendorRow?.subscription_tier || venueRow?.subscription_plan || 'Free';
        setTier(raw);
      } catch (err) {
        console.error('Error loading tier:', err);
        setTier('Free');
      } finally {
        setTierLoading(false);
      }
    }
    loadTier();
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="fx-container py-20 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  const displayName = user.user_metadata?.display_name || user.user_metadata?.full_name || user.email?.split('@')[0];
  const tierLabel = tierLoading ? '...' : (tier || 'Free');
  const isFree = tierLabel.toLowerCase() === 'free' || tierLabel.toLowerCase() === 'get_started' || tierLabel.toLowerCase() === 'get started';

  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-2xl">
        {/* Profile Card */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-outline-variant">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white">
              <User className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h1 className="font-display text-xl font-bold text-on-surface">{displayName}</h1>
              <p className="text-sm text-on-surface-variant">{user.email}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-block rounded-full bg-primary-muted px-2 py-0.5 text-xs font-medium text-primary">
                  {userRole === 'vendor' ? 'Vendor' : 'Attendee'}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-surface-container px-2 py-0.5 text-xs font-medium text-on-surface">
                  <Crown className="h-3 w-3" />
                  {tierLabel}
                </span>
              </div>
            </div>
            {isFree && (
              <Link
                to="/subscription-plans"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white"
              >
                Upgrade
              </Link>
            )}
          </div>
        </div>

        {/* Menu */}
        <div className="mt-6 space-y-2">
          {MENU_ITEMS.map(item => {
            const Icon = item.icon;
            const isHelp = item.onClick === 'help';
            const isDanger = item.variant === 'danger';
            const content = (
              <>
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isDanger ? 'bg-error-container' : 'bg-brand-pink'}`}>
                    <Icon className={`h-5 w-5 ${isDanger ? 'text-error' : 'text-primary'}`} />
                  </div>
                  <span className={`font-medium ${isDanger ? 'text-error' : 'text-on-surface'}`}>{item.label}</span>
                </div>
                <ChevronRight className={`h-5 w-5 ${isDanger ? 'text-error' : 'text-on-surface-variant'}`} />
              </>
            );
            return isHelp ? (
              <button
                key={item.label}
                onClick={() => setHelpOpen(true)}
                className={`flex w-full items-center justify-between rounded-xl bg-white p-4 shadow-sm border transition-colors ${isDanger ? 'border-error/30 hover:border-error' : 'border-border-subtle hover:border-primary'}`}
              >
                {content}
              </button>
            ) : (
              <Link
                key={item.label}
                to={item.href}
                className={`flex w-full items-center justify-between rounded-xl bg-white p-4 shadow-sm border transition-colors ${isDanger ? 'border-error/30 hover:border-error' : 'border-border-subtle hover:border-primary'}`}
              >
                {content}
              </Link>
            );
          })}

          {userRole === 'vendor' && (
            <div className="pt-4">
              <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Vendor & Subscriber</p>
              {VENDOR_MENU_ITEMS.map(item => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    to={item.href}
                    className="mb-2 flex items-center justify-between rounded-xl bg-white p-4 shadow-sm border border-border-subtle hover:border-primary transition-colors"
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
            </div>
          )}

          <button
            onClick={async () => { await signOut(); navigate('/'); }}
            className="flex w-full items-center justify-between rounded-xl bg-white p-4 shadow-sm border border-border-subtle hover:border-destructive transition-colors"
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

      <HelpCenterModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
