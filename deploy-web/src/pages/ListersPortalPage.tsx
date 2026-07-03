import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Store, ArrowRight, CheckCircle, LayoutDashboard, FolderKanban, Ticket, CalendarCheck, BarChart3, ListChecks, Calendar, PlusCircle } from 'lucide-react';

const PORTAL_LINKS = [
  { label: 'Vendor Dashboard', href: '/vendor-dashboard', icon: LayoutDashboard, description: 'Manage your vendor profile' },
  { label: 'Venue Dashboard', href: '/venue-dashboard', icon: Store, description: 'Manage your venue listing' },
  { label: 'Vendor Catalogue', href: '/catalogue/vendor', icon: FolderKanban, description: 'Products and PDF pricelist' },
  { label: 'Venue Catalogue', href: '/catalogue/venue', icon: FolderKanban, description: 'Menu and pricelist items' },
  { label: 'Venue Quotes', href: '/venue/quotes', icon: Ticket, description: 'Incoming quote requests' },
  { label: 'Venue Tours', href: '/venue/tours', icon: CalendarCheck, description: 'Instant tour bookings' },
  { label: 'Venue Analytics', href: '/venue/analytics', icon: BarChart3, description: 'Performance and counts' },
  { label: 'Action Items', href: '/vendor/action-items', icon: ListChecks, description: 'Your task list' },
  { label: 'Calendar', href: '/vendor/calendar', icon: Calendar, description: 'Events and due dates' },
  { label: 'Venue Plans', href: '/venue-listing-plans', icon: PlusCircle, description: 'Upgrade or change plan' },
];

const BENEFITS = [
  'Reach thousands of event planners',
  'Receive direct quote requests',
  'Manage your portfolio and reviews',
  'Grow your event business',
];

export default function ListersPortalPage() {
  const { user, userRole, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user && userRole === 'vendor') {
      navigate('/account', { replace: true });
    }
  }, [isLoading, user, userRole, navigate]);

  return (
    <div>
      {/* Hero */}
      <section className="bg-primary text-white">
        <div className="fx-container py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-display text-3xl font-bold md:text-5xl">List Your Business on Funxon</h1>
            <p className="mt-4 text-lg text-white/80">Join South Africa's premier event marketplace and connect with clients looking for venues and vendors like you.</p>
            <div className="mt-8 flex justify-center gap-3">
              <Link to="/signup" className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-primary hover:bg-brand-pink">Get Started</Link>
              <Link to="/subscription-plans" className="rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10">View Plans</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="fx-section fx-container">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center font-display text-2xl font-bold text-on-surface">Why list with us?</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {BENEFITS.map(b => (
              <div key={b} className="flex items-center gap-3 rounded-xl bg-white p-5 shadow-sm border border-border-subtle">
                <CheckCircle className="h-6 w-6 flex-shrink-0 text-success" />
                <span className="font-medium text-on-surface">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subscriber Portal Links */}
      <section className="fx-section fx-container bg-surface-container-low">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center font-display text-2xl font-bold text-on-surface">Subscriber Portal</h2>
          <p className="mt-2 text-center text-sm text-on-surface-variant">Manage your listings and leads</p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {PORTAL_LINKS.map(link => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.label}
                  to={link.href}
                  className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm border border-border-subtle hover:border-primary transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-on-surface">{link.label}</p>
                    <p className="text-xs text-on-surface-variant">{link.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="fx-section fx-container">
        <div className="mx-auto max-w-2xl rounded-2xl bg-primary p-8 text-center text-white md:p-12">
          <h2 className="font-display text-2xl font-bold md:text-3xl">Ready to grow your business?</h2>
          <p className="mt-3 text-white/80">Create your listing in minutes and start receiving enquiries.</p>
          <Link to="/signup" className="mt-6 inline-block rounded-lg bg-white px-8 py-3 text-sm font-semibold text-primary hover:bg-brand-pink">
            Become a Lister <ArrowRight className="ml-1 inline h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
