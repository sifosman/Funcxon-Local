import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Eye, ClipboardList, CalendarCheck } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { getMyVenueEntitlement, isVenueFeatureEnabled } from '../lib/venueSubscription';
import { AppAlert } from '../components/AppAlert';

export default function VenueAnalyticsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState<{ id: number; name: string } | null>(null);
  const [counts, setCounts] = useState({ profileViews: 0, catalogueItems: 0, quoteRequests: 0, tourBookings: 0 });
  const [canUseAnalytics, setCanUseAnalytics] = useState(false);
  const [alert, setAlert] = useState<{ title: string; message: string; type: 'error' } | null>(null);

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    const ent = await getMyVenueEntitlement(user.id);
    setCanUseAnalytics(isVenueFeatureEnabled(ent, 'analytics'));
    try {
      const { data: listingRow } = await supabase.from('venue_listings').select('id, name').eq('user_id', user.id).maybeSingle();
      if (!listingRow) { setListing(null); setCounts({ profileViews: 0, catalogueItems: 0, quoteRequests: 0, tourBookings: 0 }); return; }
      setListing({ id: listingRow.id, name: listingRow.name });
      const [
        { data: catalogue },
        { data: quotes },
        { data: tours },
        { data: views },
      ] = await Promise.all([
        supabase.from('venue_catalogue_items').select('id', { count: 'exact' }).eq('venue_id', listingRow.id),
        supabase.from('venue_quote_requests').select('id', { count: 'exact' }).eq('listing_id', listingRow.id),
        supabase.from('venue_tour_bookings').select('id', { count: 'exact' }).eq('listing_id', listingRow.id),
        supabase.from('venue_listing_views').select('id', { count: 'exact' }).eq('venue_id', listingRow.id),
      ]);
      setCounts({ profileViews: views?.length ?? 0, catalogueItems: catalogue?.length ?? 0, quoteRequests: quotes?.length ?? 0, tourBookings: tours?.length ?? 0 });
    } catch (err: any) { setAlert({ title: 'Error', message: err?.message || 'Failed to load analytics.', type: 'error' }); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user?.id]);

  if (loading) return <div className="fx-container py-20 text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  if (!canUseAnalytics) {
    return (
      <div className="fx-container fx-section">
        <div className="mx-auto max-w-2xl">
          <Link to="/account" className="mb-4 inline-flex items-center text-sm font-medium hover:underline" style={{ color: '#123f5c' }}><ArrowLeft className="mr-1 h-4 w-4" /> Back to Account</Link>
          <h1 className="mb-2 text-3xl font-bold" style={{ color: '#123f5c' }}>Venue Analytics</h1>
          <p className="mb-6 text-sm text-on-surface-variant">Analytics is available on paid venue plans.</p>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
            <h2 className="mb-2 font-display text-lg font-semibold text-amber-800">Upgrade required</h2>
            <p className="mb-4 text-sm text-amber-800">Upgrade your venue plan to access analytics and performance stats.</p>
            <Link to="/venue-listing-plans" className="inline-block rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white" style={{ background: '#123f5c' }}>View Venue Plans</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="fx-container fx-section">
        <div className="mx-auto max-w-2xl">
          <Link to="/account" className="mb-4 inline-flex items-center text-sm font-medium hover:underline" style={{ color: '#123f5c' }}><ArrowLeft className="mr-1 h-4 w-4" /> Back to Account</Link>
          <h1 className="mb-2 text-3xl font-bold" style={{ color: '#123f5c' }}>Venue Analytics</h1>
          <p className="mb-6 text-sm text-on-surface-variant">Create your venue listing first.</p>
          <div className="rounded-xl border border-outline-variant bg-surface-container p-6 text-center">
            <p className="text-sm">You don’t have a venue listing yet. Please create it in “Update Venue Portfolio”.</p>
            <Link to="/portfolio/venue" className="mt-4 inline-block rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white" style={{ background: '#123f5c' }}>Update Venue Portfolio</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-3xl">
        <Link to="/account" className="mb-4 inline-flex items-center text-sm font-medium hover:underline" style={{ color: '#123f5c' }}><ArrowLeft className="mr-1 h-4 w-4" /> Back to Account</Link>
        <h1 className="mb-2 text-3xl font-bold" style={{ color: '#123f5c' }}>Venue Analytics</h1>
        <p className="mb-6 text-sm" style={{ color: '#72787e' }}>{listing.name}</p>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50"><Eye className="h-6 w-6 text-blue-600" /></div>
              <div>
                <p className="text-xs uppercase tracking-wider text-on-surface-variant">Profile Views</p>
                <p className="font-display text-3xl font-bold text-on-surface">{counts.profileViews}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50"><ClipboardList className="h-6 w-6 text-green-600" /></div>
              <div>
                <p className="text-xs uppercase tracking-wider text-on-surface-variant">Catalogue Items</p>
                <p className="font-display text-3xl font-bold text-on-surface">{counts.catalogueItems}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-50"><ClipboardList className="h-6 w-6 text-purple-600" /></div>
              <div>
                <p className="text-xs uppercase tracking-wider text-on-surface-variant">Quote Requests</p>
                <p className="font-display text-3xl font-bold text-on-surface">{counts.quoteRequests}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50"><CalendarCheck className="h-6 w-6 text-amber-600" /></div>
              <div>
                <p className="text-xs uppercase tracking-wider text-on-surface-variant">Tour Bookings</p>
                <p className="font-display text-3xl font-bold text-on-surface">{counts.tourBookings}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <Link to="/catalogue/venue" className="rounded-lg bg-primary py-3 text-center text-sm font-semibold text-white" style={{ background: '#123f5c' }}>Manage Catalogue</Link>
          <Link to="/venue/quotes" className="rounded-lg border border-outline-variant bg-white py-3 text-center text-sm font-semibold text-on-surface">Manage Quotes</Link>
        </div>
      </div>
      {alert && <AppAlert visible={true} title={alert.title} message={alert.message} type="error" onDismiss={() => setAlert(null)} />}
    </div>
  );
}
