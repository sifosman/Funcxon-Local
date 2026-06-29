import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { MapPin } from 'lucide-react';

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
        .limit(6);

      setVendors((vendorData || []).map(item => {
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
    navigate(`/discover?${params.toString()}`);
  };

  return (
    <div className="bg-background text-on-surface">
      {/* ── Hero ── */}
      <section
        className="relative w-full overflow-hidden pb-32 pt-20 md:pt-28"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1920&q=80')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative fx-container flex flex-col items-center text-center">
          <h1
            className="mb-4 text-[28px] font-bold leading-tight tracking-tight text-white md:text-[36px]"
            style={{ fontFamily: "'Playfair Display', serif", letterSpacing: '-0.02em', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
          >
            Connect, Collaborate, Celebrate
          </h1>
          <p className="max-w-2xl text-base text-white/90" style={{ fontFamily: "'Montserrat', sans-serif", textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
            Let's get this party started!!
          </p>
        </div>

        {/* Floating Search Card */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-1/2 px-4 md:px-6 z-10 flex justify-center">
          <div
            className="w-full max-w-4xl overflow-hidden border border-outline-variant bg-white p-2 md:p-3"
            style={{ borderRadius: '32px', boxShadow: '0 4px 10px rgba(0,0,0,0.08)' }}
          >
            <div className="flex flex-col md:flex-row items-stretch">
              {/* Location */}
              <div className="flex-1 cursor-pointer border-b border-outline-variant px-6 py-3 transition-colors hover:bg-surface-container-low md:border-b-0 md:border-r">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant" style={{ fontFamily: "'Montserrat', sans-serif" }}>Location</label>
                <div className="flex items-center">
                  <span className="material-symbols-outlined mr-2 text-primary text-[20px]">location_on</span>
                  <input
                    className="w-full border-none bg-transparent p-0 text-sm font-semibold text-primary placeholder-outline focus:outline-none focus:ring-0"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                    placeholder="Where is your event?"
                    type="text"
                    value={searchLocation}
                    onChange={e => setSearchLocation(e.target.value)}
                  />
                </div>
              </div>
              {/* Event Date */}
              <div className="flex-1 cursor-pointer border-b border-outline-variant px-6 py-3 transition-colors hover:bg-surface-container-low md:border-b-0 md:border-r">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant" style={{ fontFamily: "'Montserrat', sans-serif" }}>Event Date</label>
                <div className="flex items-center">
                  <span className="material-symbols-outlined mr-2 text-primary text-[20px]">calendar_month</span>
                  <input
                    className="w-full border-none bg-transparent p-0 text-sm font-semibold text-primary placeholder-outline focus:outline-none focus:ring-0"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                    placeholder="Select date"
                    type="text"
                    value={searchDate}
                    onChange={e => setSearchDate(e.target.value)}
                  />
                </div>
              </div>
              {/* Guest Count */}
              <div className="flex-1 cursor-pointer px-6 py-3 transition-colors hover:bg-surface-container-low">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant" style={{ fontFamily: "'Montserrat', sans-serif" }}>Guest Count</label>
                <div className="flex items-center">
                  <span className="material-symbols-outlined mr-2 text-primary text-[20px]">group</span>
                  <input
                    className="w-full border-none bg-transparent p-0 text-sm font-semibold text-primary placeholder-outline focus:outline-none focus:ring-0"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                    placeholder="How many guests?"
                    type="text"
                    value={searchGuests}
                    onChange={e => setSearchGuests(e.target.value)}
                  />
                </div>
              </div>
              {/* Search Button */}
              <div className="flex items-center p-1">
                <button
                  onClick={handleSearch}
                  className="h-14 w-full rounded-full px-10 font-bold text-white transition-all hover:scale-[1.02] active:scale-95 md:w-auto"
                  style={{ background: '#123f5c', fontFamily: "'Montserrat', sans-serif", boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Spacer for floating search card */}
      <div className="h-24 md:h-20 bg-background" />

      {/* ── Explore By ── */}
      <section className="fx-container py-16">
        <h2
          className="mb-6 text-2xl font-semibold text-primary"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Explore by
        </h2>

        {/* Provinces */}
        <div className="mb-6">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Provinces
          </h3>
          <div className="flex flex-wrap gap-3">
            {PROVINCES.map(p => (
              <button
                key={p}
                onClick={() => setSelectedProvince(selectedProvince === p ? '' : p)}
                className="rounded-full px-4 py-2 text-sm font-semibold transition-colors"
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  background: selectedProvince === p ? '#b9c4eb' : 'transparent',
                  color: selectedProvince === p ? '#002940' : '#1b1c19',
                  border: selectedProvince === p ? 'none' : '1px solid #72787e',
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Categories
          </h3>
          <div className="flex flex-wrap gap-3">
            {CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => setSelectedCategory(selectedCategory === c ? '' : c)}
                className="rounded-full px-4 py-2 text-sm font-semibold transition-colors"
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  background: selectedCategory === c ? '#aa7478' : 'transparent',
                  color: selectedCategory === c ? '#ffffff' : '#1b1c19',
                  border: selectedCategory === c ? 'none' : '1px solid #72787e',
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Venues ── */}
      <section className="py-16">
        <div className="fx-container mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-semibold text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>
            Featured Venues
          </h2>
          <Link
            to="/discover?category=venues"
            className="flex items-center text-sm font-semibold hover:underline"
            style={{ fontFamily: "'Montserrat', sans-serif", color: '#123f5c' }}
          >
            View all
            <span className="material-symbols-outlined ml-1 text-sm">arrow_forward</span>
          </Link>
        </div>

        <div className="scroll-row fx-container pb-8 snap-x snap-mandatory">
          {loading
            ? [1, 2, 3, 4].map(i => (
                <div key={i} className="min-w-[300px] w-[300px] h-[280px] flex-shrink-0 animate-pulse rounded-lg bg-surface-container" />
              ))
            : featured.map(item => (
                <Link
                  key={item.id}
                  to={`/venue/${item.id}`}
                  className="group min-w-[300px] w-[300px] flex-shrink-0 cursor-pointer snap-start overflow-hidden rounded-lg bg-white"
                  style={{ border: '1px solid #f7f5f0', boxShadow: '0 4px 10px rgba(0,0,0,0.08)' }}
                >
                  <div className="relative h-48 w-full overflow-hidden bg-surface-dim">
                    {item.image_url
                      ? <img src={item.image_url} alt={item.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                      : <div className="flex h-full w-full items-center justify-center bg-surface-container"><MapPin className="h-8 w-8 text-on-surface-variant" /></div>
                    }
                    <div
                      className="absolute left-3 top-3 rounded px-2 py-1 text-xs font-semibold text-white"
                      style={{ background: '#aa7478', fontFamily: "'Montserrat', sans-serif" }}
                    >
                      Featured
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="mb-1 text-[18px] font-semibold text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {item.name}
                    </h3>
                    <p className="mb-3 flex items-center text-xs text-on-surface-variant" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                      <span className="material-symbols-outlined mr-1 text-sm">location_on</span>
                      {item.province || item.city || 'South Africa'}
                    </p>
                    <div className="flex items-center justify-between border-t pt-3" style={{ borderColor: '#f7f5f0' }}>
                      <span className="text-sm font-semibold" style={{ fontFamily: "'Montserrat', sans-serif", color: '#123f5c' }}>
                        {item.price_range ? item.price_range : 'Request quote'}
                      </span>
                      {item.rating && (
                        <span className="flex items-center text-xs text-outline" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                          <span className="material-symbols-outlined mr-1 text-sm" style={{ color: '#aa7478', fontVariationSettings: "'FILL' 1" }}>star</span>
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
      {vendors.length > 0 && (
        <section className="py-16" style={{ background: '#f5f3ee' }}>
          <div className="fx-container mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-semibold text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>
              Top Vendors
            </h2>
            <Link
              to="/discover?category=vendors"
              className="flex items-center text-sm font-semibold hover:underline"
              style={{ fontFamily: "'Montserrat', sans-serif", color: '#123f5c' }}
            >
              View all
              <span className="material-symbols-outlined ml-1 text-sm">arrow_forward</span>
            </Link>
          </div>
          <div className="scroll-row fx-container pb-8">
            {vendors.map(item => (
              <Link
                key={item.id}
                to={`/vendor/${item.id}`}
                className="group min-w-[300px] w-[300px] flex-shrink-0 cursor-pointer snap-start overflow-hidden rounded-lg bg-white"
                style={{ border: '1px solid #f7f5f0', boxShadow: '0 4px 10px rgba(0,0,0,0.08)' }}
              >
                <div className="relative h-48 w-full overflow-hidden bg-surface-dim">
                  {item.image_url
                    ? <img src={item.image_url} alt={item.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                    : <div className="flex h-full w-full items-center justify-center bg-surface-container"><MapPin className="h-8 w-8 text-on-surface-variant" /></div>
                  }
                </div>
                <div className="p-4">
                  <h3 className="mb-1 text-[18px] font-semibold text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {item.name}
                  </h3>
                  <p className="mb-3 flex items-center text-xs text-on-surface-variant" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                    <span className="material-symbols-outlined mr-1 text-sm">location_on</span>
                    {item.province || item.city || 'South Africa'}
                  </p>
                  <div className="flex items-center justify-between border-t pt-3" style={{ borderColor: '#f7f5f0' }}>
                    <span className="text-sm font-semibold" style={{ fontFamily: "'Montserrat', sans-serif", color: '#123f5c' }}>
                      {item.price_range ? item.price_range : 'Request quote'}
                    </span>
                    {item.rating && (
                      <span className="flex items-center text-xs text-outline" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                        <span className="material-symbols-outlined mr-1 text-sm" style={{ color: '#aa7478', fontVariationSettings: "'FILL' 1" }}>star</span>
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
      <section className="py-16" style={{ background: '#f5f3ee' }}>
        <div className="fx-container">
          <h2 className="mb-8 text-center text-2xl font-semibold text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>
            Inspiration &amp; Ideas
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { tag: 'Weddings', title: 'Integrating Indigenous Flora into Your Decor', body: 'Discover elegant ways to use Proteas and Fynbos to create breathtaking, culturally resonant centerpieces for your special day.', href: '/blog' },
              { tag: 'Corporate', title: 'Hosting High-Impact Corporate Retreats', body: 'Learn how to blend professional development with the serene landscapes of the Western Cape to maximize team engagement.', href: '/blog' },
              { tag: 'Parties', title: 'The Rise of the Luxury Outdoor Festival', body: 'How event planners are transforming open spaces into exclusive, comfortable, and highly curated party experiences.', href: '/blog' },
            ].map(({ tag, title, body, href }) => (
              <article
                key={title}
                className="overflow-hidden rounded-lg bg-white"
                style={{ border: '1px solid #f7f5f0', boxShadow: '0 4px 10px rgba(0,0,0,0.08)' }}
              >
                <div className="h-40 w-full bg-surface-dim" />
                <div className="p-5">
                  <span
                    className="mb-2 block text-xs uppercase tracking-wide"
                    style={{ fontFamily: "'Montserrat', sans-serif", color: '#b9c4eb' }}
                  >
                    {tag}
                  </span>
                  <h3 className="mb-2 text-[18px] font-semibold text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {title}
                  </h3>
                  <p className="line-clamp-2 text-sm text-on-surface-variant" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                    {body}
                  </p>
                  <Link
                    to={href}
                    className="mt-4 inline-block text-sm font-semibold hover:underline"
                    style={{ fontFamily: "'Montserrat', sans-serif", color: '#123f5c' }}
                  >
                    Read More
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
