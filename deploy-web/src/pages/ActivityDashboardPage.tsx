import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';
import { Activity, FileText, CalendarCheck, Star, MessageSquare, Loader2 } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'quote' | 'tour' | 'review' | 'booking' | 'message';
  title: string;
  subtitle: string;
  created_at: string;
  link: string;
}

export default function ActivityDashboardPage() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id || !user?.email) return;
    fetchActivity();
  }, [user?.id, user?.email]);

  async function fetchActivity() {
    setLoading(true);
    try {
      const { data: quotes } = await supabase.from('quotes').select('id, event_type, status, created_at').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(10);
      const { data: tours } = await supabase.from('venue_tour_bookings').select('id, venue:listing_id(name), status, created_at').eq('visitor_email', user?.email).order('created_at', { ascending: false }).limit(10);
      const { data: reviews } = await supabase.from('reviews').select('id, vendor_id, vendors(name), created_at').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(10);

      const items: ActivityItem[] = [
        ...(quotes || []).map((q: any) => ({
          id: `q-${q.id}`,
          type: 'quote' as const,
          title: 'Quote request',
          subtitle: q.event_type || 'Event',
          created_at: q.created_at,
          link: `/quotes/${q.id}`,
        })),
        ...(tours || []).map((t: any) => ({
          id: `t-${t.id}`,
          type: 'tour' as const,
          title: 'Venue tour booked',
          subtitle: t.venue?.name || 'Venue',
          created_at: t.created_at,
          link: `/bookings/${t.id}`,
        })),
        ...(reviews || []).map((r: any) => ({
          id: `r-${r.id}`,
          type: 'review' as const,
          title: 'Review submitted',
          subtitle: r.vendors?.name || 'Vendor',
          created_at: r.created_at,
          link: `/vendor/${r.vendor_id}`,
        })),
      ];
      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setActivities(items.slice(0, 20));
    } catch (err) {
      console.error('Error fetching activity:', err);
    } finally {
      setLoading(false);
    }
  }

  const iconFor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'quote': return FileText;
      case 'tour': return CalendarCheck;
      case 'review': return Star;
      default: return MessageSquare;
    }
  };

  const formatDate = (s: string) => new Date(s).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });

  if (!user) {
    return (
      <div className="fx-container flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
        <div className="text-center">
          <Activity className="mx-auto h-12 w-12 text-on-surface-variant" />
          <h2 className="mt-4 font-display text-xl font-bold text-on-surface">Sign in to view activity</h2>
          <Link to="/signin" className="mt-4 inline-block rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-muted">
            <Activity className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-on-surface md:text-3xl">Activity Dashboard</h1>
            <p className="text-sm text-on-surface-variant">Recent activity across your account</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : activities.length === 0 ? (
          <div className="rounded-xl bg-white p-12 text-center shadow-sm border border-outline-variant">
            <Activity className="mx-auto h-12 w-12 text-on-surface-variant" />
            <h3 className="mt-4 font-display text-lg font-semibold text-on-surface">No recent activity</h3>
            <p className="mt-2 text-on-surface-variant">Start exploring venues or requesting quotes to see activity here.</p>
            <Link to="/discover" className="mt-4 inline-block rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white">Discover</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map(item => {
              const Icon = iconFor(item.type);
              return (
                <Link
                  key={item.id}
                  to={item.link}
                  className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm border border-outline-variant transition-colors hover:border-primary"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-on-surface">{item.title}</p>
                    <p className="text-sm text-on-surface-variant">{item.subtitle}</p>
                  </div>
                  <span className="text-xs text-on-surface-variant">{formatDate(item.created_at)}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
