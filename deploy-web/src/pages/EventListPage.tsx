import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';
import { Calendar, FileText, CalendarCheck, Loader2, Plus } from 'lucide-react';

interface EventItem {
  id: string;
  type: 'quote' | 'tour';
  title: string;
  date: string | null;
  status: string;
  link: string;
}

export default function EventListPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchEvents();
  }, [user]);

  async function fetchEvents() {
    setLoading(true);
    try {
      const { data: quotes } = await supabase
        .from('quotes')
        .select('id, event_type, event_date, status')
        .eq('user_id', user!.id)
        .order('event_date', { ascending: true })
        .limit(20);
      const { data: tours } = await supabase
        .from('venue_tour_bookings')
        .select('id, venue:listing_id(name), preferred_date, status')
        .eq('visitor_email', user?.email)
        .order('preferred_date', { ascending: true })
        .limit(20);

      const items: EventItem[] = [
        ...(quotes || []).map((q: any) => ({
          id: `q-${q.id}`,
          type: 'quote' as const,
          title: q.event_type || 'Event',
          date: q.event_date || null,
          status: q.status || 'pending',
          link: `/quotes/${q.id}`,
        })),
        ...(tours || []).map((t: any) => ({
          id: `t-${t.id}`,
          type: 'tour' as const,
          title: `${t.venue?.name || 'Venue'} tour`,
          date: t.preferred_date || null,
          status: t.status || 'pending',
          link: `/bookings/${t.id}`,
        })),
      ];
      items.sort((a, b) => {
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
      setEvents(items);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (s?: string | null) => s ? new Date(s).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Date TBC';

  const statusClass = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'accepted': case 'confirmed': return 'bg-success-container text-success';
      case 'cancelled': case 'rejected': return 'bg-error-container text-error';
      case 'completed': return 'bg-primary-container text-primary';
      default: return 'bg-warning-container text-warning';
    }
  };

  if (!user) {
    return (
      <div className="fx-container flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
        <div className="text-center">
          <Calendar className="mx-auto h-12 w-12 text-on-surface-variant" />
          <h2 className="mt-4 font-display text-xl font-bold text-on-surface">Sign in to view your events</h2>
          <Link to="/signin" className="mt-4 inline-block rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-on-surface md:text-3xl">Your Events</h1>
            <p className="text-sm text-on-surface-variant">Upcoming quotes and venue tours</p>
          </div>
          <Link to="/planner" className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white">
            <Plus className="h-4 w-4" /> Planner
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-xl bg-white p-12 text-center shadow-sm border border-outline-variant">
            <Calendar className="mx-auto h-12 w-12 text-on-surface-variant" />
            <h3 className="mt-4 font-display text-lg font-semibold text-on-surface">No upcoming events</h3>
            <p className="mt-2 text-on-surface-variant">Create a quote request or book a tour to see events here.</p>
            <div className="mt-4 flex justify-center gap-3">
              <Link to="/discover" className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white">Browse Venues</Link>
              <Link to="/planner" className="rounded-lg border border-border-subtle px-6 py-2 text-sm font-medium text-on-surface">Open Planner</Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map(event => {
              const Icon = event.type === 'quote' ? FileText : CalendarCheck;
              return (
                <Link
                  key={event.id}
                  to={event.link}
                  className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm border border-outline-variant transition-colors hover:border-primary"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-on-surface">{event.title}</p>
                    <p className="text-sm text-on-surface-variant">{formatDate(event.date)}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusClass(event.status)}`}>
                    {event.status}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
