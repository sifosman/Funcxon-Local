import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CalendarCheck } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { getMyVenueEntitlement, isVenueFeatureEnabled } from '../lib/venueSubscription';
import { AppAlert } from '../components/AppAlert';

type VenueListingRow = { id: number; name: string };

type TourBookingRow = {
  id: number;
  listing_id: number;
  visitor_name: string | null;
  visitor_email: string | null;
  visitor_phone: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  status: string;
  notes: string | null;
  created_at: string;
};

const STATUS_OPTIONS = ['pending', 'confirmed', 'cancelled', 'completed'] as const;

export default function VenueTourBookingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [listing, setListing] = useState<VenueListingRow | null>(null);
  const [bookings, setBookings] = useState<TourBookingRow[]>([]);
  const [canUseTours, setCanUseTours] = useState(false);
  const [alert, setAlert] = useState<{ title: string; message: string; type: 'error' } | null>(null);

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    const ent = await getMyVenueEntitlement(user.id);
    setCanUseTours(isVenueFeatureEnabled(ent, 'instant_tour_bookings'));
    try {
      const { data: listingRow } = await supabase.from('venue_listings').select('id, name').eq('user_id', user.id).maybeSingle();
      if (!listingRow) { setListing(null); setBookings([]); return; }
      setListing({ id: listingRow.id, name: listingRow.name });
      const { data } = await supabase.from('venue_tour_bookings').select('id, listing_id, visitor_name, visitor_email, visitor_phone, preferred_date, preferred_time, status, notes, created_at').eq('listing_id', listingRow.id).order('created_at', { ascending: false }).limit(100);
      setBookings((data || []) as TourBookingRow[]);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user?.id]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const updateStatus = async (booking: TourBookingRow) => {
    const currentIndex = STATUS_OPTIONS.indexOf(booking.status as typeof STATUS_OPTIONS[number]);
    const next = STATUS_OPTIONS[(currentIndex + 1) % STATUS_OPTIONS.length];
    setSaving(true);
    try {
      const { error } = await supabase.from('venue_tour_bookings').update({ status: next }).eq('id', booking.id);
      if (error) throw error;
      setBookings((prev) => prev.map((b) => (b.id === booking.id ? { ...b, status: next } : b)));
    } catch (err: any) { setAlert({ title: 'Error', message: err?.message || 'Failed to update status.', type: 'error' }); } finally { setSaving(false); }
  };

  if (loading) return <div className="fx-container py-20 text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  if (!canUseTours) {
    return (
      <div className="fx-container fx-section">
        <div className="mx-auto max-w-2xl">
          <Link to="/venue-dashboard" className="mb-4 inline-flex items-center text-sm font-medium hover:underline" style={{ color: '#123f5c' }}><ArrowLeft className="mr-1 h-4 w-4" /> Back to Venue Dashboard</Link>
          <h1 className="mb-2 text-3xl font-bold" style={{ color: '#123f5c' }}>Tour Bookings</h1>
          <p className="mb-6 text-sm text-on-surface-variant">Instant tour bookings are available on paid venue plans.</p>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
            <h2 className="mb-2 font-display text-lg font-semibold text-amber-800">Upgrade required</h2>
            <p className="mb-4 text-sm text-amber-800">Upgrade your venue plan to manage instant tour bookings.</p>
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
          <Link to="/venue-dashboard" className="mb-4 inline-flex items-center text-sm font-medium hover:underline" style={{ color: '#123f5c' }}><ArrowLeft className="mr-1 h-4 w-4" /> Back to Venue Dashboard</Link>
          <h1 className="mb-2 text-3xl font-bold" style={{ color: '#123f5c' }}>Tour Bookings</h1>
          <p className="mb-6 text-sm text-on-surface-variant">Create your venue listing first.</p>
          <div className="rounded-xl border border-outline-variant bg-surface-container p-6 text-center">
            <p className="text-sm">You don’t have a venue listing yet. Please create it in “Update Venue Portfolio” before managing tour bookings.</p>
            <Link to="/portfolio/venue" className="mt-4 inline-block rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white" style={{ background: '#123f5c' }}>Update Venue Portfolio</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-3xl">
        <Link to="/venue-dashboard" className="mb-4 inline-flex items-center text-sm font-medium hover:underline" style={{ color: '#123f5c' }}><ArrowLeft className="mr-1 h-4 w-4" /> Back to Venue Dashboard</Link>
        <h1 className="mb-2 text-3xl font-bold" style={{ color: '#123f5c' }}>Tour Bookings</h1>
        <p className="mb-6 text-sm" style={{ color: '#72787e' }}>{listing.name}</p>

        {bookings.length === 0 ? (
          <div className="rounded-xl border border-outline-variant bg-white p-10 text-center shadow-sm">
            <CalendarCheck className="mx-auto h-12 w-12 text-on-surface-variant" />
            <p className="mt-4 text-sm text-on-surface-variant">No tour bookings yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => (
              <div key={b.id} className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-on-surface">{b.visitor_name || 'Visitor'}</h3>
                    <p className="text-xs text-on-surface-variant">Requested: {formatDate(b.created_at)}</p>
                    <p className="text-xs text-on-surface-variant">Preferred: {formatDate(b.preferred_date)} {b.preferred_time}</p>
                  </div>
                  <span className="rounded-full px-3 py-1 text-xs font-semibold uppercase" style={{ color: b.status === 'confirmed' ? '#16A34A' : b.status === 'cancelled' ? '#DC2626' : b.status === 'completed' ? '#123f5c' : '#F59E0B', backgroundColor: `${b.status === 'confirmed' ? '#16A34A' : b.status === 'cancelled' ? '#DC2626' : b.status === 'completed' ? '#123f5c' : '#F59E0B'}20` }}>{b.status}</span>
                </div>
                {(b.visitor_email || b.visitor_phone) && (
                  <div className="mt-3 space-y-1 text-sm">
                    {b.visitor_email && <p className="text-on-surface">Email: {b.visitor_email}</p>}
                    {b.visitor_phone && <p className="text-on-surface">Phone: {b.visitor_phone}</p>}
                  </div>
                )}
                {b.notes && <p className="mt-3 text-sm text-on-surface"><span className="text-xs text-on-surface-variant">Notes:</span> {b.notes}</p>}
                <button onClick={() => updateStatus(b)} disabled={saving} className="mt-4 w-full rounded-lg border border-primary py-2 text-sm font-semibold text-primary disabled:opacity-60">Change status</button>
              </div>
            ))}
          </div>
        )}
      </div>
      {alert && <AppAlert visible={true} title={alert.title} message={alert.message} type="error" onDismiss={() => setAlert(null)} />}
    </div>
  );
}
