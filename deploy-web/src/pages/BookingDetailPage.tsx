import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';
import { ChevronLeft, CalendarCheck, Calendar, Clock, User, Mail, Phone, MapPin, Loader2, Check, X, MessageSquare } from 'lucide-react';
import { AppAlert } from '../components/AppAlert';

interface BookingDetail {
  id: number;
  venue_name?: string;
  venue_id?: number;
  requester_name?: string | null;
  requester_email?: string | null;
  requester_phone?: string | null;
  requested_date?: string | null;
  requested_time?: string | null;
  status: string;
  message?: string | null;
  countered_date?: string | null;
  countered_time?: string | null;
  countered_message?: string | null;
  created_at?: string;
}

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ title: string; message: string; type: 'error' | 'success' } | null>(null);

  useEffect(() => {
    if (!user || !id) return;
    fetchBooking();
  }, [id, user]);

  async function fetchBooking() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('venue_tour_bookings')
        .select('id, venue:listing_id(id, name), requester_name, requester_email, requester_phone, requested_date, requested_time, status, message, countered_date, countered_time, countered_message, created_at')
        .eq('id', id)
        .eq('requester_email', user?.email)
        .maybeSingle();

      if (error) throw error;
      const b = data as any;
      if (!b) {
        setBooking(null);
        return;
      }
      setBooking({
        id: b.id,
        venue_name: b.venue?.name,
        venue_id: b.venue?.id,
        requester_name: b.requester_name,
        requester_email: b.requester_email,
        requester_phone: b.requester_phone,
        requested_date: b.requested_date,
        requested_time: b.requested_time,
        status: b.status,
        message: b.message,
        countered_date: b.countered_date,
        countered_time: b.countered_time,
        countered_message: b.countered_message,
        created_at: b.created_at,
      });
    } catch (err) {
      console.error('Error fetching booking:', err);
    } finally {
      setLoading(false);
    }
  }

  const updateStatus = async (status: string) => {
    if (!booking || !id) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('venue_tour_bookings').update({ status }).eq('id', id);
      if (error) throw error;
      setBooking({ ...booking, status });
      setAlert({ title: status === 'confirmed' ? 'Tour confirmed' : 'Tour declined', message: `The tour has been ${status}.`, type: 'success' });
    } catch (err: any) {
      setAlert({ title: 'Error', message: err?.message || 'Failed to update booking.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

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

  const finalDate = booking?.status === 'confirmed' || booking?.status === 'completed'
    ? (booking?.countered_date || booking?.requested_date)
    : undefined;
  const finalTime = booking?.status === 'confirmed' || booking?.status === 'completed'
    ? (booking?.countered_time || booking?.requested_time)
    : undefined;

  if (!user) {
    return (
      <div className="fx-container flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
        <div className="text-center">
          <CalendarCheck className="mx-auto h-12 w-12 text-on-surface-variant" />
          <h2 className="mt-4 font-display text-xl font-bold text-on-surface">Sign in to view this booking</h2>
          <Link to="/signin" className="mt-4 inline-block rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white">Sign In</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="fx-container flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="fx-container fx-section">
        <div className="mx-auto max-w-2xl text-center">
          <CalendarCheck className="mx-auto h-12 w-12 text-on-surface-variant" />
          <h2 className="mt-4 font-display text-xl font-bold text-on-surface">Booking not found</h2>
          <Link to="/my-tours" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">Back to My Bookings</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-2xl">
        <button onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary">
          <ChevronLeft className="h-4 w-4" /> Back
        </button>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-outline-variant">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-muted">
                <CalendarCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-on-surface">Tour Booking</h1>
                <p className="text-sm text-on-surface-variant">{booking.venue_name || 'Venue'}</p>
              </div>
            </div>
            <span className={`rounded-full px-3 py-1 text-sm font-semibold capitalize ${statusClass(booking.status)}`}>
              {booking.status === 'countered' ? 'Alternative proposed' : booking.status}
            </span>
          </div>

          {booking.status === 'confirmed' && (
            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-center">
              <p className="text-sm font-semibold text-green-800">Tour Confirmed</p>
              <p className="text-sm text-green-700">{formatDate(finalDate)} {finalTime}</p>
            </div>
          )}

          {booking.status === 'cancelled' && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-center">
              <p className="text-sm font-semibold text-red-800">Tour Cancelled</p>
              <p className="text-sm text-red-700">This tour request has been cancelled.</p>
            </div>
          )}

          {booking.status === 'completed' && (
            <div className="mb-6 rounded-lg border border-primary/20 bg-primary-container/30 p-4 text-center">
              <p className="text-sm font-semibold text-primary">Tour Completed</p>
              <p className="text-sm text-on-surface-variant">{formatDate(finalDate)} {finalTime}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border border-outline-variant p-4">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-on-surface-variant">Your requested date</p>
                <p className="text-sm font-semibold text-on-surface">{formatDate(booking.requested_date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-outline-variant p-4">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-on-surface-variant">Your requested time</p>
                <p className="text-sm font-semibold text-on-surface">{booking.requested_time || 'Any time'}</p>
              </div>
            </div>

            {booking.status === 'countered' && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  <p className="text-sm font-semibold text-blue-800">Venue proposed an alternative</p>
                </div>
                <p className="text-sm text-blue-900"><span className="font-medium">Date:</span> {formatDate(booking.countered_date)}</p>
                {booking.countered_time && <p className="text-sm text-blue-900"><span className="font-medium">Time:</span> {booking.countered_time}</p>}
                {booking.countered_message && <p className="mt-2 text-sm text-blue-800">{booking.countered_message}</p>}
              </div>
            )}

            <div className="flex items-center gap-3 rounded-lg border border-outline-variant p-4">
              <User className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-on-surface-variant">Visitor</p>
                <p className="text-sm font-semibold text-on-surface">{booking.requester_name || '—'}</p>
              </div>
            </div>
            {booking.requester_email && (
              <div className="flex items-center gap-3 rounded-lg border border-outline-variant p-4">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-on-surface-variant">Email</p>
                  <p className="text-sm font-semibold text-on-surface">{booking.requester_email}</p>
                </div>
              </div>
            )}
            {booking.requester_phone && (
              <div className="flex items-center gap-3 rounded-lg border border-outline-variant p-4">
                <Phone className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-on-surface-variant">Phone</p>
                  <p className="text-sm font-semibold text-on-surface">{booking.requester_phone}</p>
                </div>
              </div>
            )}
            {booking.message && (
              <div className="rounded-lg bg-surface-container p-4">
                <p className="text-xs text-on-surface-variant">Message</p>
                <p className="mt-1 text-sm text-on-surface">{booking.message}</p>
              </div>
            )}
          </div>

          {booking.status === 'countered' && (
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button onClick={() => updateStatus('confirmed')} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-bold text-white disabled:opacity-60" style={{ background: '#16A34A' }}>
                <Check className="h-4 w-4" /> Accept alternative
              </button>
              <button onClick={() => updateStatus('cancelled')} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg border border-error py-2.5 text-sm font-bold text-error disabled:opacity-60">
                <X className="h-4 w-4" /> Decline
              </button>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            {booking.venue_id && (
              <Link
                to={`/venue/${booking.venue_id}`}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-bold text-white"
              >
                <MapPin className="h-4 w-4" /> View Venue
              </Link>
            )}
            <Link
              to="/my-tours"
              className="inline-flex flex-1 items-center justify-center rounded-lg border border-border-subtle py-2.5 text-sm font-bold text-on-surface hover:bg-surface-container"
            >
              Back to My Bookings
            </Link>
          </div>
        </div>
      </div>
      {alert && <AppAlert visible={true} title={alert.title} message={alert.message} type={alert.type} onDismiss={() => setAlert(null)} />}
    </div>
  );
}
