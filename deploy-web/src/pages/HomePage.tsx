import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { MapPin, Search, CalendarDays, Users } from 'lucide-react';

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
}

function parseLocation(location?: string | null): { city: string; province: string } {
  if (!location) return { city: '', province: '' };
  const parts = location.split(',').map(p => p.trim());
  return parts.length >= 2 ? { city: parts[0], province: parts[parts.length - 1] } : { city: location, province: '' };
}

const PROVINCES = ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape'];
const CATEGORIES = ['Weddings', 'Corporate', 'Parties', 'Festivals'];

const TRUST_STATS = [
  { icon: 'location_city', label: 'Verified Venues' },
  { icon: 'storefront', label: 'Expert Vendors' },
  { icon: 'star', label: 'Trusted Reviews' },
  { icon: 'diversity_3', label: 'Happy Clients' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState<Listing[]>([]);
  const [vendors, setVendors] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLocation, setSearchLocation] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [searchGuests, setSearchGuests] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => { fetchListings(); }, []);

  async function fetchListings() {
    setLoading(true);
    try {
      const { data: featuredData } = await supabase
        .from('venue_listings')
        .select('id, name, location, city, province, image_url, venue_type, rating')
        .limit(8);

      setFeatured((featuredData || []).map(item => {
        const parsed = parseLocation(item.location);
        return { id: item.id, name: item.name, location: item.location, city: item.city || parsed.city, province: item.province || parsed.province, image_url: item.image_url, category: item.venue_type, rating: item.rating };
      }));

      const { data: vendorData } = await supabase
        .from('vendors')
        .select('id, name, location, city, province, image_url, category_id, price_range, rating')
        .gt('rating', 0)
        .limit(6);

      setVendors((vendorData || []).filter(item =>
        item.name && !item.name.toLowerCase().includes('demo')
      ).map(item => {
        const parsed = parseLocation(item.location);
        return { id: item.id, name: item.name, location: item.location, city: item.city || parsed.city, province: item.province || parsed.province, image_url: item.image_url, category: item.category_id?.toString(), price_range: item.price_range, rating: item.rating };
      }));
    } catch (err) {
      console.error('Error fetching listings:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchLocation) params.set('location', searchLocation);
    if (selectedCategory) params.set('category', selectedCategory.toLowerCase());
    if (selectedProvince) params.set('province', selectedProvince);
    if (searchDate) params.set('date', searchDate);
    if (searchGuests) params.set('guests', searchGuests);
    navigate(`/discover?${params.toString()}`);
  };

  const handleExploreFilter = (province: string, category: string) => {
    const params = new URLSearchParams();
    if (province) params.set('province', province);
    if (category) params.set('category', category.toLowerCase());
    navigate(`/discover?${params.toString()}`);
  };

  return (
    <div className="bg-background text-on-surface">

      {/* ── Hero ── */}
      <section
        className="relative flex min-h-[88vh] w-full flex-col items-center justify-center overflow-hidden px-4"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1920&q=80')",
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
        }}
      >
        {/* Gradient overlay — darker at top for nav, strong at bottom for search legibility */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.72) 100%)' }}
        />

        {/* Hero copy */}
        <div className="relative z-10 mb-10 max-w-3xl text-center">
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
        </div>

        {/* ── Search Bar ── */}
        <div className="relative z-10 w-full max-w-5xl px-2 md:px-0">
          <div
            className="overflow-hidden bg-white"
            style={{
              borderRadius: '16px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
            }}
          >
            <div className="flex flex-col md:flex-row">
              {/* Location */}
              <label className="flex flex-1 cursor-pointer flex-col border-b border-gray-100 px-6 py-5 transition-colors hover:bg-gray-50 md:border-b-0 md:border-r">
                <span className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  <MapPin size={12} strokeWidth={2.5} /> Location
                </span>
                <input
                  className="w-full border-none bg-transparent p-0 text-base font-semibold text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-0"
                  placeholder="City or province"
                  type="text"
                  value={searchLocation}
                  onChange={e => setSearchLocation(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
              </label>

              {/* Divider */}
              <div className="hidden md:block w-px bg-gray-100 self-stretch" />

              {/* Event Date */}
              <label className="flex flex-1 cursor-pointer flex-col border-b border-gray-100 px-6 py-5 transition-colors hover:bg-gray-50 md:border-b-0 md:border-r">
                <span className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  <CalendarDays size={12} strokeWidth={2.5} /> Event Date
                </span>
                <input
                  className="w-full border-none bg-transparent p-0 text-base font-semibold text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-0"
                  placeholder="Select a date"
                  type="date"
                  value={searchDate}
                  onChange={e => setSearchDate(e.target.value)}
                />
              </label>

              {/* Divider */}
              <div className="hidden md:block w-px bg-gray-100 self-stretch" />

              {/* Guest Count */}
              <label className="flex flex-1 cursor-pointer flex-col border-b border-gray-100 px-6 py-5 transition-colors hover:bg-gray-50 md:border-b-0">
                <span className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  <Users size={12} strokeWidth={2.5} /> Guests
                </span>
                <input
                  className="w-full border-none bg-transparent p-0 text-base font-semibold text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-0"
                  placeholder="Number of guests"
                  type="number"
                  min="1"
                  value={searchGuests}
                  onChange={e => setSearchGuests(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
              </label>

              {/* Search Button */}
              <div className="flex items-center p-3">
                <button
                  onClick={handleSearch}
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-xl px-8 font-bold text-white transition-all hover:brightness-110 active:scale-95 md:w-auto"
                  style={{ background: 'linear-gradient(135deg, #123f5c 0%, #1a5a82 100%)', boxShadow: '0 4px 16px rgba(18,63,92,0.45)' }}
                >
                  <Search size={18} strokeWidth={2.5} />
                  <span>Search</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick filters below search */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {['Weddings', 'Corporate Events', 'Birthday Parties', 'Festivals'].map(tag => (
              <button
                key={tag}
                onClick={() => navigate(`/discover?category=${tag.split(' ')[0].toLowerCase()}`)}
                className="rounded-full border border-white/30 bg-white/15 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/25"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust / Stats Bar ── */}
      <div style={{ background: '#123f5c' }}>
        <div className="fx-container">
          <div className="grid grid-cols-2 divide-x divide-white/10 py-0 md:grid-cols-4">
            {TRUST_STATS.map(({ icon, label }) => (
              <div key={label} className="flex flex-col items-center justify-center gap-1.5 py-5 text-center">
                <span className="material-symbols-outlined text-[22px]" style={{ color: '#aa7478', fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-white/70">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Explore By ── */}
      <section className="bg-white py-10">
        <div className="fx-container">
          <h2 className="mb-6 text-xl font-bold" style={{ color: '#123f5c' }}>
            Explore by
          </h2>

          <div className="mb-5">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-gray-400">Province</p>
            <div className="flex flex-wrap gap-2">
              {PROVINCES.map(p => (
                <button
                  key={p}
                  onClick={() => {
                    const next = selectedProvince === p ? '' : p;
                    setSelectedProvince(next);
                    handleExploreFilter(next, selectedCategory);
                  }}
                  className="rounded-full px-5 py-2 text-sm font-semibold transition-all"
                  style={{
                    background: selectedProvince === p ? '#123f5c' : 'transparent',
                    color: selectedProvince === p ? '#ffffff' : '#1b1c19',
                    border: selectedProvince === p ? '1.5px solid #123f5c' : '1.5px solid #d0d0d0',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-gray-400">Category</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  onClick={() => {
                    const next = selectedCategory === c ? '' : c;
                    setSelectedCategory(next);
                    handleExploreFilter(selectedProvince, next);
                  }}
                  className="rounded-full px-5 py-2 text-sm font-semibold transition-all"
                  style={{
                    background: selectedCategory === c ? '#aa7478' : 'transparent',
                    color: selectedCategory === c ? '#ffffff' : '#1b1c19',
                    border: selectedCategory === c ? '1.5px solid #aa7478' : '1.5px solid #d0d0d0',
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Venues ── */}
      <section className="py-14" style={{ background: '#f8f7f4' }}>
        <div className="fx-container mb-7 flex items-end justify-between">
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-gray-400">Hand-picked for you</p>
            <h2 className="text-2xl font-bold" style={{ color: '#123f5c' }}>Featured Venues</h2>
          </div>
          <Link
            to="/discover?category=venues"
            className="flex items-center gap-1 text-sm font-bold hover:underline"
            style={{ color: '#123f5c' }}
          >
            View all
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>

        <div className="scroll-row fx-container pb-8 snap-x snap-mandatory">
          {loading
            ? [1, 2, 3, 4].map(i => (
                <div key={i} className="min-w-[300px] w-[300px] h-[300px] flex-shrink-0 animate-pulse rounded-2xl bg-gray-200" />
              ))
            : featured.map(item => (
                <Link
                  key={item.id}
                  to={`/venue/${item.id}`}
                  className="group min-w-[300px] w-[300px] flex-shrink-0 cursor-pointer snap-start overflow-hidden rounded-2xl bg-white"
                  style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #ede9e2' }}
                >
                  <div className="relative h-52 w-full overflow-hidden bg-gray-100">
                    {item.image_url
                      ? <img src={item.image_url} alt={item.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                      : <div className="flex h-full w-full items-center justify-center bg-gray-100"><MapPin className="h-8 w-8 text-gray-300" /></div>
                    }
                    <div
                      className="absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-bold text-white"
                      style={{ background: '#aa7478' }}
                    >
                      Featured
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="mb-1 truncate text-base font-bold" style={{ color: '#123f5c' }}>
                      {item.name}
                    </h3>
                    <p className="mb-3 flex items-center text-xs text-gray-500">
                      <span className="material-symbols-outlined mr-1 text-sm" style={{ color: '#aa7478' }}>location_on</span>
                      {item.province || item.city || 'South Africa'}
                    </p>
                    <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                      <span className="text-sm font-bold" style={{ color: '#123f5c' }}>
                        {item.price_range || 'Request quote'}
                      </span>
                      {item.rating && (
                        <span className="flex items-center gap-0.5 text-xs font-semibold text-gray-500">
                          <span className="material-symbols-outlined text-sm" style={{ color: '#f59e0b', fontVariationSettings: "'FILL' 1" }}>star</span>
                          {item.rating}
                        </span>
                      )}
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
              <h2 className="text-2xl font-bold" style={{ color: '#123f5c' }}>Top Vendors</h2>
            </div>
            <Link
              to="/discover?category=vendors"
              className="flex items-center gap-1 text-sm font-bold hover:underline"
              style={{ color: '#123f5c' }}
            >
              View all
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
          <div className="scroll-row fx-container pb-8">
            {loading
              ? [1, 2, 3, 4].map(i => (
                  <div key={i} className="min-w-[300px] w-[300px] h-[300px] flex-shrink-0 animate-pulse rounded-2xl bg-gray-200" />
                ))
              : vendors.map(item => (
              <Link
                key={item.id}
                to={`/vendor/${item.id}`}
                className="group min-w-[300px] w-[300px] flex-shrink-0 cursor-pointer snap-start overflow-hidden rounded-2xl bg-white"
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #ede9e2' }}
              >
                <div className="relative h-52 w-full overflow-hidden bg-gray-100">
                  {item.image_url
                    ? <img src={item.image_url} alt={item.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                    : <div className="flex h-full w-full items-center justify-center bg-gray-100"><MapPin className="h-8 w-8 text-gray-300" /></div>
                  }
                </div>
                <div className="p-4">
                  <h3 className="mb-1 truncate text-base font-bold" style={{ color: '#123f5c' }}>
                    {item.name}
                  </h3>
                  <p className="mb-3 flex items-center text-xs text-gray-500">
                    <span className="material-symbols-outlined mr-1 text-sm" style={{ color: '#aa7478' }}>location_on</span>
                    {item.province || item.city || 'South Africa'}
                  </p>
                  <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                    <span className="text-sm font-bold" style={{ color: '#123f5c' }}>
                      {item.price_range || 'Request quote'}
                    </span>
                    {item.rating && (
                      <span className="flex items-center gap-0.5 text-xs font-semibold text-gray-500">
                        <span className="material-symbols-outlined text-sm" style={{ color: '#f59e0b', fontVariationSettings: "'FILL' 1" }}>star</span>
                        {item.rating}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Blog / Inspiration ── */}
      <section className="py-14" style={{ background: '#f8f7f4' }}>
        <div className="fx-container">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-gray-400">Tips &amp; Trends</p>
              <h2 className="text-2xl font-bold" style={{ color: '#123f5c' }}>Inspiration &amp; Ideas</h2>
            </div>
            <Link to="/blog" className="flex items-center gap-1 text-sm font-bold hover:underline" style={{ color: '#123f5c' }}>
              View all
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { tag: 'Weddings', title: 'Integrating Indigenous Flora into Your Decor', body: 'Discover elegant ways to use Proteas and Fynbos to create breathtaking, culturally resonant centerpieces for your special day.', href: '/blog', image: 'https://images.unsplash.com/photo-1464366400605-716099d9aa43?auto=format&fit=crop&w=600&q=80' },
              { tag: 'Corporate', title: 'Hosting High-Impact Corporate Retreats', body: 'Learn how to blend professional development with the serene landscapes of the Western Cape to maximize team engagement.', href: '/blog', image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80' },
              { tag: 'Parties', title: 'The Rise of the Luxury Outdoor Festival', body: 'How event planners are transforming open spaces into exclusive, comfortable, and highly curated party experiences.', href: '/blog', image: 'https://images.unsplash.com/photo-1478146896981-b80fe4d6af0e?auto=format&fit=crop&w=600&q=80' },
            ].map(({ tag, title, body, href, image }) => (
              <article
                key={title}
                className="group overflow-hidden rounded-2xl bg-white"
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #ede9e2' }}
              >
                <div className="h-44 w-full overflow-hidden">
                  <img src={image} alt={title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                </div>
                <div className="p-5">
                  <span
                    className="mb-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                    style={{ background: '#f0eaf0', color: '#aa7478' }}
                  >
                    {tag}
                  </span>
                  <h3 className="mb-2 text-base font-bold leading-snug" style={{ color: '#123f5c' }}>
                    {title}
                  </h3>
                  <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-gray-500">
                    {body}
                  </p>
                  <Link
                    to={href}
                    className="inline-flex items-center gap-1 text-sm font-bold hover:underline"
                    style={{ color: '#123f5c' }}
                  >
                    Read More
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section
        className="py-16 text-center"
        style={{ background: 'linear-gradient(135deg, #123f5c 0%, #1a5a82 100%)' }}
      >
        <div className="fx-container">
          <h2 className="mb-3 text-2xl font-bold text-white md:text-3xl">
            Ready to plan your next event?
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-base text-white/75">
            Join thousands of event organisers who trust Funxon to connect them with South Africa's best venues and vendors.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/discover"
              className="rounded-xl px-8 py-3.5 text-sm font-bold text-white transition-all hover:brightness-110"
              style={{ background: '#aa7478', boxShadow: '0 4px 16px rgba(170,116,120,0.45)' }}
            >
              Browse Venues &amp; Vendors
            </Link>
            <Link
              to="/listers-portal"
              className="rounded-xl border-2 border-white/40 px-8 py-3.5 text-sm font-bold text-white transition-all hover:bg-white/10"
            >
              List Your Business
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
