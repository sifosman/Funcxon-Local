import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';
import { CalendarCheck, ChevronRight, Calendar, Loader2 } from 'lucide-react';

interface Booking {
  id: number;
  venue_name?: string;
  requested_date?: string;
  requested_time?: string;
  countered_date?: string | null;
  countered_time?: string | null;
  status: string;
  requester_name?: string | null;
  created_at?: string;
}

export default function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchBookings();
  }, [user]);

  async function fetchBookings() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('venue_tour_bookings')
        .select('id, venue:listing_id(name), requested_date, requested_time, countered_date, countered_time, status, requester_name, created_at')
        .eq('requester_email', user?.email)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const mapped = (data || []).map((b: any) => ({
        id: b.id,
        venue_name: b.venue?.name,
        requested_date: b.requested_date,
        requested_time: b.requested_time,
        countered_date: b.countered_date,
        countered_time: b.countered_time,
        status: b.status,
        requester_name: b.requester_name,
        created_at: b.created_at,
      }));
      setBookings(mapped);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (s?: string | null) => s ? new Date(s).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

  const statusClass = (status?: string) => {
    switch (status) {
      case 'confirmed': return 'bg-success-container text-success';
      case 'cancelled': return 'bg-error-container text-error';
      case 'completed': return 'bg-primary-container text-primary';
      case 'countered': return 'bg-blue-100 text-blue-700';
      default: return 'bg-warning-container text-warning';
    }
  };

  const displayDate = (booking: Booking) =>
    booking.status === 'countered' && booking.countered_date
      ? booking.countered_date
      : booking.requested_date;

  const displayTime = (booking: Booking) =>
    booking.status === 'countered' && booking.countered_time
      ? booking.countered_time
      : booking.requested_time;

  if (!user) {
    return (
      <div className="fx-container flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
        <div className="text-center">
          <CalendarCheck className="mx-auto h-12 w-12 text-on-surface-variant" />
          <h2 className="mt-4 font-display text-xl font-bold text-on-surface">Sign in to view bookings</h2>
          <Link to="/signin" className="mt-4 inline-block rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-2xl font-bold text-on-surface md:text-3xl">My Bookings</h1>
        <p className="text-sm text-on-surface-variant">Track your venue tours and upcoming bookings.</p>

        {loading ? (
          <div className="mt-6 flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="mt-12 rounded-xl bg-white p-12 text-center shadow-sm border border-outline-variant">
            <CalendarCheck className="mx-auto h-12 w-12 text-on-surface-variant" />
            <h3 className="mt-4 font-display text-lg font-semibold text-on-surface">No bookings yet</h3>
            <p className="mt-2 text-on-surface-variant">Book a tour from a venue profile to see it here.</p>
            <Link to="/discover" className="mt-4 inline-block rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white">Browse Venues</Link>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {bookings.map(booking => (
              <Link
                key={booking.id}
                to={`/bookings/${booking.id}`}
                className="flex items-center justify-between rounded-xl bg-white p-5 shadow-sm border border-outline-variant hover:border-primary transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-semibold text-on-surface">{booking.venue_name || 'Venue Tour'}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusClass(booking.status)}`}>
                      {booking.status === 'countered' ? 'Alternative proposed' : booking.status}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-sm text-on-surface-variant">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(displayDate(booking))}</span>
                    {displayTime(booking) && <span>{displayTime(booking)}</span>}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-on-surface-variant" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
