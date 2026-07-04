import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';
import { CalendarCheck, Calendar, Clock, MapPin, Loader2, Search, AlertCircle, FileText } from 'lucide-react';

type BookingItem = {
  id: number | string;
  type: 'tour' | 'quote';
  title: string;
  targetId?: number | null;
  targetType?: 'venue' | 'vendor';
  requested_date?: string | null;
  requested_time?: string | null;
  countered_date?: string | null;
  countered_time?: string | null;
  status: string;
  created_at?: string;
  event_date?: string | null;
  quote_amount?: number | null;
};

export default function MyToursPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchItems();
  }, [user]);

  async function fetchItems() {
    setLoading(true);
    try {
      const [tourData, vendorData, venueData, vendorQuoteData, venueQuoteData] = await Promise.all([
        supabase
          .from('venue_tour_bookings')
          .select('id, venue:listing_id(id, name), requested_date, requested_time, countered_date, countered_time, status, created_at')
          .eq('requester_email', user?.email)
          .order('created_at', { ascending: false }),
        supabase.from('vendors').select('id, name'),
        supabase.from('venue_listings').select('id, name'),
        supabase
          .from('quote_requests')
          .select('id, vendor_id, name, email, status, event_date, budget, quote_amount, created_at')
          .eq('requester_email', user?.email)
          .order('id', { ascending: false })
          .limit(50),
        supabase
          .from('venue_quote_requests')
          .select('id, listing_id, requester_name, requester_email, status, event_date, created_at')
          .eq('requester_email', user?.email)
          .order('id', { ascending: false })
          .limit(50),
      ]);

      const vendorNameMap = new Map((vendorData.data || []).map((v: any) => [v.id, v.name]));
      const venueNameMap = new Map((venueData.data || []).map((v: any) => [v.id, v.name]));

      const tours: BookingItem[] = (tourData.data || []).map((b: any) => ({
        id: b.id,
        type: 'tour',
        title: b.venue?.name || 'Venue Tour',
        targetId: b.venue?.id,
        targetType: 'venue',
        requested_date: b.requested_date,
        requested_time: b.requested_time,
        countered_date: b.countered_date,
        countered_time: b.countered_time,
        status: b.status,
        created_at: b.created_at,
      }));

      const vendorQuotes: BookingItem[] = (vendorQuoteData.data || []).map((q: any) => ({
        id: `vendor-quote-${q.id}`,
        type: 'quote',
        title: vendorNameMap.get(q.vendor_id) || q.name || 'Vendor Quote',
        targetId: q.vendor_id,
        targetType: 'vendor',
        status: q.status,
        created_at: q.created_at,
        event_date: q.event_date,
        quote_amount: q.quote_amount,
      }));

      const venueQuotes: BookingItem[] = (venueQuoteData.data || []).map((q: any) => ({
        id: `venue-quote-${q.id}`,
        type: 'quote',
        title: venueNameMap.get(q.listing_id) || 'Venue Quote',
        targetId: q.listing_id,
        targetType: 'venue',
        status: q.status,
        created_at: q.created_at,
        event_date: q.event_date,
      }));

      const allItems = [...tours, ...vendorQuotes, ...venueQuotes].sort(
        (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
      setItems(allItems);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (s?: string | null) => s ? new Date(s).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

  const statusClass = (status?: string) => {
    switch (status) {
      case 'confirmed':
      case 'accepted':
      case 'finalised': return 'bg-success-container text-success';
      case 'cancelled':
      case 'rejected': return 'bg-error-container text-error';
      case 'completed': return 'bg-primary-container text-primary';
      case 'countered': return 'bg-blue-100 text-blue-700';
      default: return 'bg-warning-container text-warning';
    }
  };

  const statusLabel = (status?: string) => {
    switch (status) {
      case 'countered': return 'Alternative proposed';
      case 'accepted': return 'Accepted';
      case 'finalised': return 'Finalised';
      default: return status;
    }
  };

  const displayDate = (item: BookingItem) =>
    item.status === 'countered' && item.countered_date ? item.countered_date : (item.event_date || item.requested_date);
  const displayTime = (item: BookingItem) =>
    item.status === 'countered' && item.countered_time ? item.countered_time : item.requested_time;

  const upcoming = items
    .filter(b => b.status === 'confirmed' || b.status === 'countered' || b.status === 'pending' || b.status === 'accepted')
    .sort((a, b) => new Date(displayDate(a) || '').getTime() - new Date(displayDate(b) || '').getTime());

  const past = items
    .filter(b => b.status === 'completed' || b.status === 'finalised' || b.status === 'cancelled' || b.status === 'rejected')
    .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());

  const stats = {
    total: items.length,
    confirmed: items.filter(b => b.status === 'confirmed' || b.status === 'accepted').length,
    pending: items.filter(b => b.status === 'pending' || b.status === 'countered').length,
    completed: items.filter(b => b.status === 'completed' || b.status === 'finalised').length,
  };

  const itemHref = (item: BookingItem) => {
    if (item.type === 'tour') return `/bookings/${item.id}`;
    if (item.targetType === 'venue' && item.targetId) return `/venue/${item.targetId}`;
    if (item.targetType === 'vendor' && item.targetId) return `/vendor/${item.targetId}`;
    return '/discover';
  };

  if (!user) {
    return (
      <div className="fx-container flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
        <div className="text-center">
          <CalendarCheck className="mx-auto h-12 w-12 text-on-surface-variant" />
          <h2 className="mt-4 font-display text-xl font-bold text-on-surface">Sign in to view your bookings</h2>
          <Link to="/signin" className="mt-4 inline-block rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-on-surface md:text-3xl">My Bookings</h1>
            <p className="text-sm text-on-surface-variant">Manage your venue tours and quotes in one place.</p>
          </div>
          <Link to="/discover" className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white">
            <Search className="h-4 w-4" /> Browse
          </Link>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-outline-variant bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-primary">{stats.total}</p>
            <p className="text-xs text-on-surface-variant">Total</p>
          </div>
          <div className="rounded-xl border border-outline-variant bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
            <p className="text-xs text-on-surface-variant">Confirmed</p>
          </div>
          <div className="rounded-xl border border-outline-variant bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
            <p className="text-xs text-on-surface-variant">Pending</p>
          </div>
          <div className="rounded-xl border border-outline-variant bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-primary">{stats.completed}</p>
            <p className="text-xs text-on-surface-variant">Completed</p>
          </div>
        </div>

        {loading ? (
          <div className="mt-6 flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="mt-12 rounded-xl bg-white p-12 text-center shadow-sm border border-outline-variant">
            <CalendarCheck className="mx-auto h-12 w-12 text-on-surface-variant" />
            <h3 className="mt-4 font-display text-lg font-semibold text-on-surface">No bookings yet</h3>
            <p className="mt-2 text-on-surface-variant">Book a tour or request a quote to see it here.</p>
            <Link to="/discover" className="mt-4 inline-block rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white">Browse</Link>
          </div>
        ) : (
          <div className="space-y-8">
            {(upcoming.length > 0) && (
              <section>
                <h2 className="mb-3 font-display text-lg font-semibold text-on-surface">Upcoming & Pending</h2>
                <div className="space-y-3">
                  {upcoming.map(item => (
                    <Link
                      key={`${item.type}-${item.id}`}
                      to={itemHref(item)}
                      className="flex flex-col gap-3 rounded-xl bg-white p-5 shadow-sm border border-outline-variant hover:border-primary transition-colors md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-semibold text-on-surface">{item.title}</h3>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusClass(item.status)}`}>
                            {statusLabel(item.status)}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-on-surface-variant">
                          <span className="flex items-center gap-1">
                            {item.type === 'tour' ? <Calendar className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                            {formatDate(displayDate(item))}
                          </span>
                          {displayTime(item) && (
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {displayTime(item)}</span>
                          )}
                        </div>
                        {item.quote_amount !== undefined && item.quote_amount !== null && (
                          <p className="mt-2 text-xs text-on-surface-variant">Quote amount: R{item.quote_amount.toLocaleString('en-ZA')}</p>
                        )}
                        {item.status === 'countered' && (
                          <p className="mt-2 text-xs text-blue-700">
                            {item.type === 'tour' ? 'Venue proposed an alternative date. Tap to respond.' : 'Alternative proposal received. Tap to view.'}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm font-medium text-primary">
                        {item.type === 'tour' ? <><MapPin className="h-4 w-4" /> View details</> : <><FileText className="h-4 w-4" /> View profile</>}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {past.length > 0 && (
              <section>
                <h2 className="mb-3 font-display text-lg font-semibold text-on-surface">Past Bookings</h2>
                <div className="space-y-3">
                  {past.map(item => (
                    <Link
                      key={`${item.type}-${item.id}`}
                      to={itemHref(item)}
                      className="flex flex-col gap-3 rounded-xl bg-white p-5 shadow-sm border border-outline-variant hover:border-primary transition-colors md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-semibold text-on-surface">{item.title}</h3>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusClass(item.status)}`}>
                            {statusLabel(item.status)}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-on-surface-variant">
                          <span className="flex items-center gap-1">
                            {item.type === 'tour' ? <Calendar className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                            {formatDate(displayDate(item))}
                          </span>
                          {displayTime(item) && (
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {displayTime(item)}</span>
                          )}
                        </div>
                        {item.quote_amount !== undefined && item.quote_amount !== null && (
                          <p className="mt-2 text-xs text-on-surface-variant">Quote amount: R{item.quote_amount.toLocaleString('en-ZA')}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm font-medium text-primary">
                        {item.type === 'tour' ? <><MapPin className="h-4 w-4" /> View details</> : <><FileText className="h-4 w-4" /> View profile</>}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {upcoming.length === 0 && past.length === 0 && (
              <div className="rounded-xl bg-white p-8 text-center shadow-sm border border-outline-variant">
                <AlertCircle className="mx-auto h-10 w-10 text-on-surface-variant" />
                <p className="mt-3 text-sm text-on-surface-variant">No bookings match your filters.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
