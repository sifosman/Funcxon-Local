import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { MapPin } from 'lucide-react';

interface Listing {
  id: string;
  name: string;
  location?: string;
  city?: string;
  province?: string;
  image_url?: string;
  category?: string;
  price_from?: number;
  rating?: number;
  type?: 'venue' | 'vendor';
}

const CATEGORY_PILLS = [
  { label: 'All', value: 'all' },
  { label: 'Venues', value: 'venues' },
  { label: 'Vendors', value: 'vendors' },
  { label: 'Weddings', value: 'weddings' },
  { label: 'Corporate', value: 'corporate' },
  { label: 'Parties', value: 'parties' },
];

const PROVINCES = ['All', 'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State', 'Mpumalanga', 'Limpopo', 'North West', 'Northern Cape'];

export default function DiscoverPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || 'all';
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('All');

  useEffect(() => { fetchListings(); }, [activeCategory, selectedProvince]);

  async function fetchListings() {
    setLoading(true);
    try {
      const isVendorOnly = activeCategory === 'vendors';
      const isVenueOnly = activeCategory === 'venues';

      const results: Listing[] = [];

      if (!isVendorOnly) {
        let q = supabase.from('venue_listings').select('id, name, location, city, province, featured_image_url, category, price_from, rating');
        if (selectedProvince !== 'All') q = q.eq('province', selectedProvince);
        const { data } = await q.limit(50);
        (data || []).forEach(item => results.push({ id: item.id, name: item.name, location: item.location, city: item.city, province: item.province, image_url: item.featured_image_url, category: item.category, price_from: item.price_from, rating: item.rating, type: 'venue' }));
      }

      if (!isVenueOnly) {
        let q = supabase.from('vendors').select('id, name, location, city, province, featured_image_url, category, price_from, rating');
        if (selectedProvince !== 'All') q = q.eq('province', selectedProvince);
        const { data } = await q.limit(50);
        (data || []).forEach(item => results.push({ id: item.id, name: item.name, location: item.location, city: item.city, province: item.province, image_url: item.featured_image_url, category: item.category, price_from: item.price_from, rating: item.rating, type: 'vendor' }));
      }

      setListings(results);
    } catch (err) {
      console.error('Error fetching listings:', err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = listings.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return item.name?.toLowerCase().includes(q) || item.city?.toLowerCase().includes(q) || item.location?.toLowerCase().includes(q);
  });

  return (
    <div className="bg-background min-h-screen">
      {/* ── Search Bar ── */}
      <div className="border-b border-outline-variant bg-surface-container py-6">
        <div className="fx-container">
          <div
            className="flex items-center gap-3 overflow-hidden border border-outline-variant bg-white px-4 py-3"
            style={{ borderRadius: '12px' }}
          >
            <span className="material-symbols-outlined text-on-surface-variant">search</span>
            <input
              type="text"
              placeholder="Search venues, vendors, cities..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 border-none bg-transparent p-0 text-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-0"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>

          {/* Category Pills */}
          <div className="mt-4 flex flex-wrap gap-2">
            {CATEGORY_PILLS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setSearchParams(value === 'all' ? {} : { category: value })}
                className="rounded-full px-4 py-2 text-sm font-semibold transition-colors"
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  background: activeCategory === value ? '#b9c4eb' : 'transparent',
                  color: activeCategory === value ? '#002940' : '#42474d',
                  border: activeCategory === value ? 'none' : '1px solid #c2c7ce',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="border-b border-outline-variant bg-surface py-3">
        <div className="fx-container flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant" style={{ fontFamily: "'Montserrat', sans-serif" }}>Filter:</span>
          <select
            value={selectedProvince}
            onChange={e => setSelectedProvince(e.target.value)}
            className="rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface focus:border-primary-container focus:outline-none"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            {PROVINCES.map(p => <option key={p} value={p}>{p === 'All' ? 'All Provinces' : p}</option>)}
          </select>
        </div>
      </div>

      {/* ── Results Grid ── */}
      <div className="fx-container py-8">
        <p className="mb-6 text-sm text-on-surface-variant" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          {loading ? 'Loading...' : `${filtered.length} result${filtered.length !== 1 ? 's' : ''} found`}
        </p>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-[300px] animate-pulse rounded-xl bg-surface-container" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant">location_off</span>
            <p className="mt-4 text-base text-on-surface-variant" style={{ fontFamily: "'Montserrat', sans-serif" }}>No listings found</p>
            <p className="mt-1 text-sm text-on-surface-variant">Try adjusting your filters or search query</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map(item => (
              <Link
                key={`${item.type}-${item.id}`}
                to={`/${item.type === 'vendor' ? 'vendor' : 'venue'}/${item.id}`}
                className="group cursor-pointer overflow-hidden rounded-xl bg-white transition-all hover:-translate-y-0.5"
                style={{ border: '1px solid #f7f5f0', boxShadow: '0 4px 10px rgba(0,0,0,0.08)' }}
              >
                <div className="relative h-48 overflow-hidden bg-surface-dim">
                  {item.image_url
                    ? <img src={item.image_url} alt={item.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                    : <div className="flex h-full w-full items-center justify-center bg-surface-container"><MapPin className="h-8 w-8 text-on-surface-variant" /></div>
                  }
                  <div className="absolute right-2 top-2">
                    <button
                      onClick={e => e.preventDefault()}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-on-surface-variant shadow-sm transition-colors hover:bg-white hover:text-error"
                    >
                      <span className="material-symbols-outlined text-[18px]">favorite</span>
                    </button>
                  </div>
                  {item.category && (
                    <div
                      className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{ background: '#b9c4eb', color: '#1a2544', fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {item.category}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="mb-1 truncate text-[18px] font-semibold text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {item.name}
                  </h3>
                  <p className="mb-3 flex items-center text-xs text-on-surface-variant" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                    <span className="material-symbols-outlined mr-1 text-sm">location_on</span>
                    {item.city || item.province || 'South Africa'}
                  </p>
                  <div className="flex items-center justify-between border-t pt-3" style={{ borderColor: '#f7f5f0' }}>
                    <span className="text-sm font-semibold" style={{ fontFamily: "'Montserrat', sans-serif", color: '#123f5c' }}>
                      {item.price_from ? `From R ${item.price_from.toLocaleString()}` : 'Request quote'}
                    </span>
                    {item.rating && (
                      <span className="flex items-center text-xs" style={{ fontFamily: "'Montserrat', sans-serif", color: '#72787e' }}>
                        <span className="material-symbols-outlined mr-0.5 text-sm" style={{ color: '#aa7478', fontVariationSettings: "'FILL' 1" }}>star</span>
                        {item.rating}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
