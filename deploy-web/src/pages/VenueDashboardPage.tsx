import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';
import { Store, FolderKanban, CalendarCheck, Ticket, Calendar, Star, Loader2, ArrowRight } from 'lucide-react';

interface TourBooking {
  id: number;
  visitor_name?: string | null;
  preferred_date?: string | null;
  status?: string;
}

export default function VenueDashboardPage() {
  const { user } = useAuth();
  const [listingId, setListingId] = useState<number | null>(null);
  const [listingName, setListingName] = useState<string | null>(null);
  const [stats, setStats] = useState({ tourBookings: 0, quoteRequests: 0, reviews: 0, catalogueItems: 0 });
  const [recentTours, setRecentTours] = useState<TourBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    fetchDashboard();
  }, [user?.id]);

  async function fetchDashboard() {
    setLoading(true);
    try {
      let { data: listing } = await supabase.from('venue_listings').select('id, name').eq('user_id', user!.id).maybeSingle();
      if (!listing) {
        const { data: legacy } = await supabase.from('venues').select('id, name').eq('user_id', user!.id).maybeSingle();
        if (legacy) {
          const { data: created } = await supabase.from('venue_listings').upsert({ user_id: user!.id, name: legacy.name || 'Venue Listing' }, { onConflict: 'user_id' }).select('id, name').single();
          listing = created;
        }
      }
      if (!listing) {
        setListingId(null);
        setLoading(false);
        return;
      }
      setListingId(listing.id);
      setListingName(listing.name);
      const [
        { data: tours },
        { data: quoteRequests },
        { data: reviews },
        { data: catalogueItems },
        { data: recentTourRows },
      ] = await Promise.all([
        supabase.from('venue_tour_bookings').select('id', { count: 'exact' }).eq('listing_id', listing.id),
        supabase.from('venue_quote_requests').select('id', { count: 'exact' }).eq('listing_id', listing.id),
        supabase.from('venue_reviews').select('id', { count: 'exact' }).eq('venue_id', listing.id),
        supabase.from('venue_catalogue_items').select('id', { count: 'exact' }).eq('listing_id', listing.id),
        supabase.from('venue_tour_bookings').select('id, visitor_name, preferred_date, status').eq('listing_id', listing.id).order('created_at', { ascending: false }).limit(5),
      ]);
      setStats({
        tourBookings: tours?.length || 0,
        quoteRequests: quoteRequests?.length || 0,
        reviews: reviews?.length || 0,
        catalogueItems: catalogueItems?.length || 0,
      });
      setRecentTours((recentTourRows || []) as TourBooking[]);
    } catch (err) {
      console.error('Error fetching venue dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  const quickActions = [
    { label: 'Update Portfolio', href: '/portfolio/venue', icon: FolderKanban, desc: 'Edit photos, description, and amenities' },
    { label: 'Manage Catalogue', href: '/catalogue/venue', icon: Store, desc: 'Update venue packages and pricing' },
    { label: 'Tour Bookings', href: '/venue/tours', icon: CalendarCheck, desc: 'View and confirm tour requests' },
    { label: 'Quote Requests', href: '/venue/quotes', icon: Ticket, desc: 'Respond to venue enquiries' },
  ];

  if (loading) {
    return (
      <div className="fx-container flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!listingId) {
    return (
      <div className="fx-container fx-section">
        <div className="mx-auto max-w-2xl text-center">
          <Store className="mx-auto h-12 w-12 text-on-surface-variant" />
          <h2 className="mt-4 font-display text-xl font-bold text-on-surface">No venue listing found</h2>
          <p className="mt-2 text-on-surface-variant">Create a venue application to access your dashboard.</p>
          <Link to="/apply" className="mt-4 inline-block rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white">Apply Now</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-on-surface md:text-3xl">Venue Dashboard</h1>
          {listingName && <p className="text-sm text-on-surface-variant">{listingName}</p>}
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Tour Bookings', value: stats.tourBookings, icon: CalendarCheck },
            { label: 'Quote Requests', value: stats.quoteRequests, icon: Ticket },
            { label: 'Reviews', value: stats.reviews, icon: Star },
            { label: 'Catalogue Items', value: stats.catalogueItems, icon: Store },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-xl bg-white p-5 shadow-sm border border-outline-variant">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-muted">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant">{s.label}</p>
                    <p className="text-2xl font-bold text-on-surface">{s.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="mb-4 font-display text-lg font-semibold text-on-surface">Quick Actions</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map(action => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  to={action.href}
                  className="rounded-xl bg-white p-5 shadow-sm border border-outline-variant transition-all hover:border-primary hover:shadow-md"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-pink">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-medium text-on-surface">{action.label}</span>
                  </div>
                  <p className="mt-2 text-xs text-on-surface-variant">{action.desc}</p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Tours */}
        <div className="mt-8 rounded-xl bg-white p-6 shadow-sm border border-outline-variant">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-on-surface">Recent Tours</h2>
            <Link to="/venue/tours" className="text-sm font-medium text-primary hover:underline">View All</Link>
          </div>
          {recentTours.length === 0 ? (
            <p className="text-sm text-on-surface-variant">No tour bookings yet. Promote your venue to get more enquiries.</p>
          ) : (
            <div className="space-y-3">
              {recentTours.map(tour => (
                <div key={tour.id} className="flex items-center justify-between rounded-lg border border-outline-variant p-4">
                  <div>
                    <p className="font-medium text-on-surface">{tour.visitor_name || 'Visitor'}</p>
                    <p className="text-xs text-on-surface-variant">
                      <Calendar className="mr-1 inline h-3 w-3" />
                      {tour.preferred_date ? new Date(tour.preferred_date).toLocaleDateString('en-ZA') : '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-surface-container px-2 py-0.5 text-xs capitalize text-on-surface">{tour.status || 'pending'}</span>
                    <Link to="/venue/tours" className="text-sm font-medium text-primary hover:underline">
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
