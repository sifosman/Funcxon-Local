import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';
import { toggleFavourite, getFavourites } from '../lib/favourites';
import { fetchBlogPosts, AppBlogPost } from '../lib/hubspotBlog';
import { MapPin, Heart } from 'lucide-react';

interface Listing {
  id: string;
  name: string;
  location?: string;
  city?: string;
  province?: string;
  image_url?: string;
  rating?: number;
  category?: string;
  price_range?: string;
  is_featured?: boolean;
  description?: string;
  review_count?: number;
  type: 'venue' | 'vendor';
}

function parseLocation(location?: string | null): { city: string; province: string } {
  if (!location) return { city: '', province: '' };
  const parts = location.split(',').map(p => p.trim());
  return parts.length >= 2 ? { city: parts[0], province: parts[parts.length - 1] } : { city: location, province: '' };
}

const EXPLORE_CARDS = [
  { title: 'By Location', subtitle: 'Find venues & vendors near you', preset: 'location', image: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=400&q=80' },
  { title: 'By Categories', subtitle: 'Browse by event type', preset: 'categories', image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=400&q=80' },
  { title: 'By Venue Amenities', subtitle: 'Filter by features & facilities', preset: 'amenities', category: 'venues', image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=400&q=80' },
  { title: 'By Services', subtitle: 'Photographers, caterers & more', preset: 'services', category: 'services', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80' },
];

const GET_LISTED_CARDS = [
  { badge: 'VENUE', title: 'List Your Venue', desc: 'Showcase your space to thousands of event planners', image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=400&q=80' },
  { badge: 'VENDOR', title: 'List Your Services', desc: 'Reach clients looking for photographers, caterers & more', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80' },
  { badge: 'PORTAL', title: 'Listers Portal', desc: 'Manage your listings, enquiries and subscriptions', image: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=400&q=80' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [featured, setFeatured] = useState<Listing[]>([]);
  const [vendors, setVendors] = useState<Listing[]>([]);
  const [blogPosts, setBlogPosts] = useState<AppBlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [favIds, setFavIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchListings();
    fetchBlogPosts(6).then(setBlogPosts).catch(() => {});
  }, []);

  const loadFavourites = useCallback(async () => {
    if (!user) return;
    try {
      const { vendorIds, venueIds } = await getFavourites(user);
      const ids = new Set<string>();
      vendorIds.forEach(id => ids.add(`vendor-${id}`));
      venueIds.forEach(id => ids.add(`venue-${id}`));
      setFavIds(ids);
    } catch (err) {
      console.error('Error loading favourites:', err);
    }
  }, [user]);

  useEffect(() => { loadFavourites(); }, [loadFavourites]);

  async function fetchListings() {
    setLoading(true);
    try {
      const { data: featuredData } = await supabase
        .from('venue_listings')
        .select('id, name, location, city, province, image_url, venue_type, rating, description, review_count')
        .limit(8);

      setFeatured((featuredData || []).map(item => {
        const parsed = parseLocation(item.location);
        return { id: item.id, name: item.name, location: item.location, city: item.city || parsed.city, province: item.province || parsed.province, image_url: item.image_url, category: item.venue_type, rating: item.rating, is_featured: false, description: item.description, review_count: item.review_count, type: 'venue' as const };
      }));

      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id, name, location, city, province, image_url, category_id, price_range, rating, description, review_count, featured_listing')
        .gt('rating', 0)
        .limit(6);

      setVendors((vendorData || []).filter(item =>
        item.name && !item.name.toLowerCase().includes('demo')
      ).map(item => {
        const parsed = parseLocation(item.location);
        return { id: item.id, name: item.name, location: item.location, city: item.city || parsed.city, province: item.province || parsed.province, image_url: item.image_url, category: item.category_id?.toString(), price_range: item.price_range, rating: item.rating, is_featured: item.featured_listing, description: item.description, review_count: item.review_count, type: 'vendor' as const };
      }));
    } catch (err) {
      console.error('Error fetching listings:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleToggleFav = async (e: React.MouseEvent, id: number, type: 'vendor' | 'venue') => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      alert('Please sign in to save favourites.');
      return;
    }
    const key = `${type}-${id}`;
    try {
      await toggleFavourite(user, id, type);
      setFavIds(prev => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    } catch (err) {
      console.error('Error toggling favourite:', err);
    }
  };

  return (
    <div className="bg-background text-on-surface">

      {/* ── Hero ── */}
      <section className="relative flex min-h-[88vh] w-full flex-col items-center justify-center overflow-hidden px-4">
        {/* Background video */}
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disableRemotePlayback
          poster="https://images.pexels.com/videos/31501465/event-marquee-wedding-31501465.jpeg?auto=compress&cs=tinysrgb&w=1920"
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src="https://videos.pexels.com/video-files/31501465/13430839_1920_1080_60fps.mp4" type="video/mp4" />
        </video>

        {/* Gradient overlay — darker at top for nav, strong at bottom for search legibility */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.72) 100%)' }}
        />

        {/* Hero copy */}
        <div className="relative z-10 mb-6 max-w-3xl text-center">
          <h1
            className="mb-5 font-bold leading-[1.1] text-white"
            style={{
              fontSize: 'clamp(2.4rem, 5.5vw, 4.2rem)',
              letterSpacing: '-0.025em',
              textShadow: '0 3px 18px rgba(0,0,0,0.5)',
            }}
          >
            Connect, Collaborate,<br />Celebrate
          </h1>
          <p
            className="mx-auto max-w-xl text-lg font-medium text-white/85"
            style={{ textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}
          >
            South Africa's premier event platform — find the perfect venues &amp; vendors for every occasion.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => navigate('/discover?category=venues')}
              className="rounded-lg bg-primary px-8 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl"
            >
              Explore Venues
            </button>
            <button
              onClick={() => navigate('/discover?category=vendors')}
              className="rounded-lg border-2 border-white/80 bg-white/10 px-8 py-3 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20"
            >
              Find Vendors
            </button>
          </div>
        </div>
      </section>

      {/* ── Party Heading ── */}
      <section className="bg-white py-10 text-center">
        <div className="fx-container">
          <h2
            className="font-bold text-primary"
            style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)' }}
          >
            Let's get this party started!
          </h2>
        </div>
      </section>

      {/* ── Explore By ── */}
      <section className="bg-white pb-10">
        <div className="fx-container">
          <h2 className="mb-6 text-xl font-bold text-primary">
            Explore by
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {EXPLORE_CARDS.map(card => (
              <button
                key={card.preset}
                onClick={() => {
                  const params = new URLSearchParams({ preset: card.preset });
                  if (card.category) params.set('category', card.category);
                  navigate(`/discover?${params.toString()}`);
                }}
                className="group relative overflow-hidden rounded-2xl text-left"
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
              >
                <div className="h-32 w-full overflow-hidden md:h-40">
                  <img src={card.image} alt={card.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                </div>
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 to-transparent p-4">
                  <h3 className="text-base font-bold text-white">{card.title}</h3>
                  <p className="text-xs text-white/80">{card.subtitle}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Venues ── */}
      <section className="py-14 bg-surface-container">
        <div className="fx-container mb-7 flex items-end justify-between">
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-gray-400">Hand-picked for you</p>
            <h2 className="text-2xl font-bold text-primary">Featured Venues</h2>
          </div>
          <Link
            to="/discover?category=venues"
            className="flex items-center gap-1 text-sm font-bold text-primary hover:underline"
          >
            View all
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>

        <div className="scroll-row fx-container pb-8 snap-x snap-mandatory">
          {loading
            ? [1, 2, 3, 4].map(i => (
                <div key={i} className="min-w-[300px] w-[300px] h-[340px] flex-shrink-0 animate-pulse rounded-2xl bg-gray-200" />
              ))
            : featured.map(item => (
                <Link
                  key={item.id}
                  to={`/venue/${item.id}`}
                  className="group min-w-[300px] w-[300px] flex-shrink-0 cursor-pointer snap-start overflow-hidden rounded-2xl bg-white border border-border-subtle shadow-sm"
                >
                  <div className="relative h-52 w-full overflow-hidden bg-gray-100">
                    {item.image_url
                      ? <img src={item.image_url} alt={item.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                      : <div className="flex h-full w-full items-center justify-center bg-gray-100"><MapPin className="h-8 w-8 text-gray-300" /></div>
                    }
                    {/* Type label */}
                    <div
                      className="absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white bg-primary"
                    >
                      Venue
                    </div>
                    {/* Featured gold badge */}
                    {item.is_featured && (
                      <div
                        className="absolute left-3 top-10 rounded-full bg-featured-gold px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                      >
                        Featured
                      </div>
                    )}
                    {/* Favourite heart */}
                    <button
                      onClick={e => handleToggleFav(e, Number(item.id), 'venue')}
                      className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition-colors hover:bg-white"
                    >
                      <Heart
                        className="h-4 w-4"
                        style={{
                          fill: favIds.has(`venue-${item.id}`) ? 'var(--color-brand-pink, #aa7478)' : 'none',
                          color: favIds.has(`venue-${item.id}`) ? 'var(--color-brand-pink, #aa7478)' : 'var(--color-on-surface-variant, #72787e)',
                        }}
                      />
                    </button>
                  </div>
                  <div className="p-4">
                    <h3 className="mb-1 truncate text-base font-bold text-primary">
                      {item.name}
                    </h3>
                    <p className="mb-2 flex items-center text-xs text-gray-500">
                      <span className="material-symbols-outlined mr-1 text-sm text-brand-pink">location_on</span>
                      {item.province || item.city || 'South Africa'}
                    </p>
                    {item.description && (
                      <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-gray-500">{item.description}</p>
                    )}
                    <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                      <span className="text-sm font-bold text-primary">
                        {item.price_range || 'Request quote'}
                      </span>
                      <div className="flex items-center gap-2">
                        {item.review_count != null && item.review_count > 0 && (
                          <span className="text-xs text-gray-400">({item.review_count})</span>
                        )}
                        {item.rating && (
                          <span className="flex items-center gap-0.5 text-xs font-semibold text-gray-500">
                            <span className="material-symbols-outlined text-sm text-brand-pink" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            {item.rating}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))
          }
        </div>
      </section>

      {/* ── Featured Vendors ── */}
      {(loading || vendors.length > 0) && (
        <section className="py-14 bg-white">
          <div className="fx-container mb-7 flex items-end justify-between">
            <div>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-gray-400">Top rated</p>
              <h2 className="text-2xl font-bold text-primary">Top Vendors</h2>
            </div>
            <Link
              to="/discover?category=vendors"
              className="flex items-center gap-1 text-sm font-bold text-primary hover:underline"
            >
              View all
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
          <div className="scroll-row fx-container pb-8">
            {loading
              ? [1, 2, 3, 4].map(i => (
                  <div key={i} className="min-w-[300px] w-[300px] h-[340px] flex-shrink-0 animate-pulse rounded-2xl bg-gray-200" />
                ))
              : vendors.map(item => (
              <Link
                key={item.id}
                to={`/vendor/${item.id}`}
                className="group min-w-[300px] w-[300px] flex-shrink-0 cursor-pointer snap-start overflow-hidden rounded-2xl bg-white border border-border-subtle shadow-sm"
              >
                <div className="relative h-52 w-full overflow-hidden bg-gray-100">
                  {item.image_url
                    ? <img src={item.image_url} alt={item.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                    : <div className="flex h-full w-full items-center justify-center bg-gray-100"><MapPin className="h-8 w-8 text-gray-300" /></div>
                  }
                  {/* Type label */}
                  <div
                    className="absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white bg-brand-pink"
                  >
                    Vendor
                  </div>
                  {/* Featured gold badge */}
                  {item.is_featured && (
                    <div
                      className="absolute left-3 top-10 rounded-full bg-featured-gold px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                    >
                      Featured
                    </div>
                  )}
                  {/* Favourite heart */}
                  <button
                    onClick={e => handleToggleFav(e, Number(item.id), 'vendor')}
                    className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition-colors hover:bg-white"
                  >
                    <Heart
                      className="h-4 w-4"
                      style={{
                        fill: favIds.has(`vendor-${item.id}`) ? 'var(--color-brand-pink, #aa7478)' : 'none',
                        color: favIds.has(`vendor-${item.id}`) ? 'var(--color-brand-pink, #aa7478)' : 'var(--color-on-surface-variant, #72787e)',
                      }}
                    />
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="mb-1 truncate text-base font-bold text-primary">
                    {item.name}
                  </h3>
                  <p className="mb-2 flex items-center text-xs text-gray-500">
                    <span className="material-symbols-outlined mr-1 text-sm text-brand-pink">location_on</span>
                    {item.province || item.city || 'South Africa'}
                  </p>
                  {item.description && (
                    <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-gray-500">{item.description}</p>
                  )}
                  <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                    <span className="text-sm font-bold text-primary">
                      {item.price_range || 'Request quote'}
                    </span>
                    <div className="flex items-center gap-2">
                      {item.review_count != null && item.review_count > 0 && (
                        <span className="text-xs text-gray-400">({item.review_count})</span>
                      )}
                      {item.rating && (
                        <span className="flex items-center gap-0.5 text-xs font-semibold text-gray-500">
                          <span className="material-symbols-outlined text-sm text-brand-pink" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          {item.rating}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Get Listed! ── */}
      <section className="py-14 bg-white">
        <div className="fx-container mb-7">
          <h2 className="text-2xl font-bold text-primary">Get Listed!</h2>
        </div>
        <div className="scroll-row fx-container pb-8">
          {GET_LISTED_CARDS.map(card => (
            <div
              key={card.badge}
              className="group min-w-[300px] w-[300px] flex-shrink-0 snap-start overflow-hidden rounded-2xl bg-white border border-border-subtle shadow-sm"
            >
              <div className="relative h-44 w-full overflow-hidden bg-gray-100">
                <img src={card.image} alt={card.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                <div
                  className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white ${card.badge === 'VENUE' ? 'bg-primary' : card.badge === 'VENDOR' ? 'bg-brand-rose' : 'bg-featured-gold'}`}
                >
                  {card.badge}
                </div>
              </div>
              <div className="p-4">
                <h3 className="mb-2 text-base font-bold text-primary">{card.title}</h3>
                <p className="mb-4 text-xs leading-relaxed text-gray-500">{card.desc}</p>
                <button
                  onClick={() => navigate(user ? '/listers-portal' : '/signin')}
                  className="w-full rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all hover:brightness-110 bg-primary"
                >
                  {user ? 'Go to portal' : 'Sign in to get started'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Blog / Inspiration ── */}
      {blogPosts.length > 0 && (
      <section className="py-14 bg-surface-container">
        <div className="fx-container">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-gray-400">Tips &amp; Trends</p>
              <h2 className="text-2xl font-bold text-primary">Inspiration &amp; Ideas</h2>
            </div>
            <Link to="/blog" className="flex items-center gap-1 text-sm font-bold text-primary hover:underline">
              View all
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
          <div className="scroll-row pb-4">
            {blogPosts.map(post => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="group min-w-[300px] w-[300px] flex-shrink-0 snap-start overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-[0_2px_12px_rgba(0,0,0,0.07)]"
              >
                <div className="h-40 w-full overflow-hidden bg-gray-100">
                  {post.cover_image_url
                    ? <img src={post.cover_image_url} alt={post.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                    : <div className="flex h-full w-full items-center justify-center bg-gray-100"><span className="material-symbols-outlined text-3xl text-gray-300">article</span></div>
                  }
                </div>
                <div className="p-5">
                  <span
                    className="mb-2 inline-block rounded-full bg-primary-muted px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary"
                  >
                    {post.category}
                  </span>
                  <h3 className="mb-2 line-clamp-3 text-base font-bold leading-snug text-primary">
                    {post.title}
                  </h3>
                  <p className="mb-4 line-clamp-4 text-sm leading-relaxed text-gray-500">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    {post.read_time_minutes} min read
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      )}
    </div>
  );
}
