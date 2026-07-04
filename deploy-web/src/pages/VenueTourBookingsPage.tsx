import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CalendarCheck, Check, X, Calendar, Clock, MessageSquare, CheckCircle } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { getMyVenueEntitlement, isVenueFeatureEnabled } from '../lib/venueSubscription';
import { createTourResponseNotification } from '../lib/notifications';
import { AppAlert } from '../components/AppAlert';

type VenueListingRow = { id: number; name: string };

type TourBookingRow = {
  id: number;
  listing_id: number;
  requester_user_id: string | null;
  requester_name: string | null;
  requester_email: string | null;
  requester_phone: string | null;
  requested_date: string | null;
  requested_time: string | null;
  status: string;
  message: string | null;
  countered_date: string | null;
  countered_time: string | null;
  countered_message: string | null;
  created_at: string;
};

const STATUS_ORDER: Record<string, number> = {
  pending: 0,
  countered: 1,
  confirmed: 2,
  completed: 3,
  cancelled: 4,
};

export default function VenueTourBookingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [listing, setListing] = useState<VenueListingRow | null>(null);
  const [bookings, setBookings] = useState<TourBookingRow[]>([]);
  const [canUseTours, setCanUseTours] = useState(false);
  const [alert, setAlert] = useState<{ title: string; message: string; type: 'error' | 'success' } | null>(null);
  const [counterModal, setCounterModal] = useState<TourBookingRow | null>(null);
  const [counterDate, setCounterDate] = useState('');
  const [counterTime, setCounterTime] = useState('');
  const [counterMessage, setCounterMessage] = useState('');

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    const ent = await getMyVenueEntitlement(user.id);
    setCanUseTours(isVenueFeatureEnabled(ent, 'instant_tour_bookings'));
    try {
      const { data: listingRow } = await supabase.from('venue_listings').select('id, name').eq('user_id', user.id).maybeSingle();
      if (!listingRow) { setListing(null); setBookings([]); return; }
      setListing({ id: listingRow.id, name: listingRow.name });
      const { data } = await supabase
        .from('venue_tour_bookings')
        .select('id, listing_id, requester_user_id, requester_name, requester_email, requester_phone, requested_date, requested_time, status, message, countered_date, countered_time, countered_message, created_at')
        .eq('listing_id', listingRow.id)
        .order('created_at', { ascending: false })
        .limit(100);
      const sorted = (data || []) as TourBookingRow[];
      sorted.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
      setBookings(sorted);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user?.id]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, { text: string; bg: string; label: string }> = {
      pending: { text: '#F59E0B', bg: '#F59E0B20', label: 'Pending' },
      countered: { text: '#3B82F6', bg: '#3B82F620', label: 'Alternative proposed' },
      confirmed: { text: '#16A34A', bg: '#16A34A20', label: 'Confirmed' },
      cancelled: { text: '#DC2626', bg: '#DC262620', label: 'Cancelled' },
      completed: { text: '#123f5c', bg: '#123f5c20', label: 'Completed' },
    };
    const style = colors[status] || colors.pending;
    return (
      <span className="rounded-full px-3 py-1 text-xs font-semibold uppercase" style={{ color: style.text, backgroundColor: style.bg }}>
        {style.label}
      </span>
    );
  };

  const updateBooking = async (booking: TourBookingRow, patch: Partial<TourBookingRow>) => {
    setSaving(true);
    try {
      const { error } = await supabase.from('venue_tour_bookings').update(patch).eq('id', booking.id);
      if (error) throw error;
      setBookings((prev) =>
        prev
          .map((b) => (b.id === booking.id ? { ...b, ...patch } : b))
          .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
      );
      if (patch.status && booking.requester_user_id && booking.requester_user_id !== user?.id) {
        await createTourResponseNotification(booking.requester_user_id, listing?.name || 'Venue', patch.status, booking.id).catch(() => {});
      }
      if (patch.status === 'confirmed') setAlert({ title: 'Confirmed', message: 'Tour confirmed and visitor notified.', type: 'success' });
      else if (patch.status === 'cancelled') setAlert({ title: 'Cancelled', message: 'Tour cancelled and visitor notified.', type: 'success' });
      else if (patch.status === 'completed') setAlert({ title: 'Completed', message: 'Tour marked as completed.', type: 'success' });
    } catch (err: any) { setAlert({ title: 'Error', message: err?.message || 'Failed to update booking.', type: 'error' }); } finally { setSaving(false); }
  };

  const openCounter = (booking: TourBookingRow) => {
    setCounterModal(booking);
    setCounterDate(booking.requested_date || '');
    setCounterTime(booking.requested_time || '');
    setCounterMessage('');
  };

  const submitCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!counterModal || !counterDate) return;
    const patch = {
      status: 'countered',
      countered_date: counterDate,
      countered_time: counterTime || null,
      countered_message: counterMessage || null,
    };
    await updateBooking(counterModal, patch);
    setCounterModal(null);
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
                    <h3 className="font-semibold text-on-surface">{b.requester_name || 'Visitor'}</h3>
                    <p className="text-xs text-on-surface-variant">Requested: {formatDate(b.created_at)}</p>
                    <p className="text-xs text-on-surface-variant">Preferred: {formatDate(b.requested_date)} {b.requested_time}</p>
                  </div>
                  {statusBadge(b.status)}
                </div>
                {(b.requester_email || b.requester_phone) && (
                  <div className="mt-3 space-y-1 text-sm">
                    {b.requester_email && <p className="text-on-surface">Email: {b.requester_email}</p>}
                    {b.requester_phone && <p className="text-on-surface">Phone: {b.requester_phone}</p>}
                  </div>
                )}
                {b.message && <p className="mt-3 text-sm text-on-surface"><span className="text-xs text-on-surface-variant">Message:</span> {b.message}</p>}

                {b.status === 'countered' && (
                  <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <p className="text-xs font-semibold uppercase text-blue-700">Your proposed alternative</p>
                    <p className="text-sm text-blue-900">{formatDate(b.countered_date)} {b.countered_time}</p>
                    {b.countered_message && <p className="mt-1 text-sm text-blue-800">{b.countered_message}</p>}
                    <p className="mt-2 text-xs text-blue-700">Waiting for visitor response.</p>
                  </div>
                )}

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {b.status === 'pending' && (
                    <>
                      <button onClick={() => updateBooking(b, { status: 'confirmed' })} disabled={saving} className="inline-flex items-center justify-center gap-1 rounded-lg bg-primary py-2 text-sm font-semibold text-white disabled:opacity-60" style={{ background: '#16A34A' }}>
                        <Check className="h-4 w-4" /> Accept as-is
                      </button>
                      <button onClick={() => openCounter(b)} disabled={saving} className="inline-flex items-center justify-center gap-1 rounded-lg border border-primary py-2 text-sm font-semibold text-primary disabled:opacity-60">
                        <Calendar className="h-4 w-4" /> Propose alternative
                      </button>
                    </>
                  )}
                  {b.status === 'countered' && (
                    <>
                      <button onClick={() => updateBooking(b, { status: 'confirmed' })} disabled={saving} className="inline-flex items-center justify-center gap-1 rounded-lg bg-primary py-2 text-sm font-semibold text-white disabled:opacity-60" style={{ background: '#16A34A' }}>
                        <Check className="h-4 w-4" /> Accept as-is
                      </button>
                      <button onClick={() => updateBooking(b, { status: 'cancelled' })} disabled={saving} className="inline-flex items-center justify-center gap-1 rounded-lg border border-error py-2 text-sm font-semibold text-error disabled:opacity-60">
                        <X className="h-4 w-4" /> Cancel
                      </button>
                    </>
                  )}
                  {b.status === 'confirmed' && (
                    <>
                      <button onClick={() => updateBooking(b, { status: 'completed' })} disabled={saving} className="inline-flex items-center justify-center gap-1 rounded-lg bg-primary py-2 text-sm font-semibold text-white disabled:opacity-60" style={{ background: '#123f5c' }}>
                        <CheckCircle className="h-4 w-4" /> Mark completed
                      </button>
                      <button onClick={() => updateBooking(b, { status: 'cancelled' })} disabled={saving} className="inline-flex items-center justify-center gap-1 rounded-lg border border-error py-2 text-sm font-semibold text-error disabled:opacity-60">
                        <X className="h-4 w-4" /> Cancel
                      </button>
                    </>
                  )}
                  {(b.status === 'cancelled' || b.status === 'completed') && (
                    <div className="col-span-2 text-center text-xs text-on-surface-variant">
                      This tour is {b.status}. No further action available.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {counterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h2 className="font-display text-lg font-bold text-on-surface">Propose alternative date</h2>
            <p className="text-sm text-on-surface-variant">Suggest a new date/time for {counterModal.requester_name || 'the visitor'}.</p>
            <form onSubmit={submitCounter} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-on-surface">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                  <input type="date" required value={counterDate} onChange={e => setCounterDate(e.target.value)} className="fx-input pl-10" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-on-surface">Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                  <input type="time" value={counterTime} onChange={e => setCounterTime(e.target.value)} className="fx-input pl-10" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-on-surface">Message (optional)</label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-on-surface-variant" />
                  <textarea value={counterMessage} onChange={e => setCounterMessage(e.target.value)} className="fx-input min-h-[80px] pl-10 pt-2" placeholder="Explain why you’re proposing a different time..." />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setCounterModal(null)} disabled={saving} className="flex-1 rounded-lg border border-outline-variant py-2 text-sm font-semibold text-on-surface">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-white">Send proposal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {alert && <AppAlert visible={true} title={alert.title} message={alert.message} type={alert.type} onDismiss={() => setAlert(null)} />}
    </div>
  );
}
