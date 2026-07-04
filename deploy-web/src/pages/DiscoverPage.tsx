import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';
import { toggleFavourite, getFavourites } from '../lib/favourites';
import { MapPin, ChevronDown, ChevronUp, X, Map, List } from 'lucide-react';
import {
  VENUE_TYPES,
  VENDOR_CATEGORIES,
  VENDOR_SUBCATEGORIES,
  AMENITIES,
  CAPACITY_BANDS,
  SORT_OPTIONS,
  MIN_RATING_OPTIONS,
  PROVINCES,
  CITIES_BY_PROVINCE,
} from '../config/filters';

interface Listing {
  id: string;
  name: string;
  location?: string;
  city?: string;
  province?: string;
  image_url?: string;
  category?: string;
  price_range?: string;
  rating?: number;
  type?: 'venue' | 'vendor';
  description?: string;
  review_count?: number;
  is_featured?: boolean;
  amenities?: string[];
  venue_type?: string;
  category_id?: string;
  capacity?: number;
}

const CATEGORY_TABS = [
  { label: 'All', value: 'all' },
  { label: 'Venues', value: 'venues' },
  { label: 'Vendors', value: 'vendors' },
];

export default function DiscoverPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || 'all';
  const activePreset = searchParams.get('preset') || '';
  const activeLocation = searchParams.get('location') || '';
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(activeLocation);
  const [favIds, setFavIds] = useState<Set<string>>(new Set());

  // Filter state
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedVenueTypes, setSelectedVenueTypes] = useState<string[]>([]);
  const [selectedVendorCategories, setSelectedVendorCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [capacityBand, setCapacityBand] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  const [minRating, setMinRating] = useState(0);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [onlyWithPrice, setOnlyWithPrice] = useState(false);
  const [showFilters, setShowFilters] = useState(!!activePreset);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  // Apply preset mode
  useEffect(() => {
    if (activePreset === 'location') {
      setShowFilters(true);
    } else if (activePreset === 'categories') {
      setShowFilters(true);
    } else if (activePreset === 'amenities') {
      setShowFilters(true);
    } else if (activePreset === 'services') {
      setShowFilters(true);
    }
  }, [activePreset]);

  const availableCities = useMemo(() => {
    if (selectedProvinces.length === 0) return [];
    const cities = new Set<string>();
    selectedProvinces.forEach(p => {
      (CITIES_BY_PROVINCE[p] || []).forEach(c => cities.add(c));
    });
    return Array.from(cities);
  }, [selectedProvinces]);

  const availableSubcategories = useMemo(() => {
    if (selectedVendorCategories.length === 0) return [];
    const subs = new Set<string>();
    selectedVendorCategories.forEach(c => {
      (VENDOR_SUBCATEGORIES[c] || []).forEach(s => subs.add(s));
    });
    return Array.from(subs);
  }, [selectedVendorCategories]);

  useEffect(() => { fetchListings(); }, []);

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
      const isVendorOnly = activeCategory === 'vendors';
      const isVenueOnly = activeCategory === 'venues';

      const results: Listing[] = [];

      if (!isVendorOnly) {
        const { data } = await supabase
          .from('venue_listings')
          .select('id, name, location, city, province, image_url, venue_type, rating, description, review_count, amenities, venue_capacity')
          .limit(100);
        (data || []).forEach(item => results.push({
          id: item.id, name: item.name, location: item.location, city: item.city, province: item.province,
          image_url: item.image_url, category: item.venue_type, rating: item.rating, type: 'venue',
          description: item.description, review_count: item.review_count, is_featured: false,
          amenities: item.amenities, venue_type: item.venue_type, capacity: item.venue_capacity ? parseInt(String(item.venue_capacity)) || 0 : 0,
        }));
      }

      if (!isVenueOnly) {
        const { data } = await supabase
          .from('vendors')
          .select('id, name, location, city, province, image_url, category_id, price_range, rating, description, review_count, featured_listing, amenities')
          .limit(100);
        (data || []).forEach(item => results.push({
          id: item.id, name: item.name, location: item.location, city: item.city, province: item.province,
          image_url: item.image_url, category: item.category_id?.toString(), price_range: item.price_range,
          rating: item.rating, type: 'vendor', description: item.description, review_count: item.review_count,
          is_featured: item.featured_listing, category_id: item.category_id?.toString(),
          amenities: item.amenities,
        }));
      }

      setListings(results);
    } catch (err) {
      console.error('Error fetching listings:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleToggleFav = async (e: React.MouseEvent, id: number, type: 'vendor' | 'venue') => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
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

  const filtered = useMemo(() => {
    let result = listings.filter(item => {
      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!item.name?.toLowerCase().includes(q) && !item.city?.toLowerCase().includes(q) && !item.location?.toLowerCase().includes(q))
          return false;
      }
      // Category filter
      if (activeCategory === 'venues' && item.type !== 'venue') return false;
      if (activeCategory === 'vendors' && item.type !== 'vendor') return false;

      // Province filter
      if (selectedProvinces.length > 0 && !selectedProvinces.includes(item.province || '')) return false;

      // City filter
      if (selectedCities.length > 0 && !selectedCities.includes(item.city || '')) return false;

      // Venue type filter
      if (selectedVenueTypes.length > 0 && item.type === 'venue') {
        if (!selectedVenueTypes.includes(item.venue_type || '')) return false;
      }

      // Vendor category filter
      if (selectedVendorCategories.length > 0 && item.type === 'vendor') {
        if (!selectedVendorCategories.includes(item.category_id || '')) return false;
      }

      // Subcategory filter (simplified — checks if any subcategory is in the item name/description)
      if (selectedSubcategories.length > 0) {
        const text = `${item.name} ${item.description || ''}`.toLowerCase();
        if (!selectedSubcategories.some(s => text.includes(s.toLowerCase()))) return false;
      }

      // Amenities filter
      if (selectedAmenities.length > 0 && item.type === 'venue') {
        const itemAmenities = item.amenities || [];
        if (!selectedAmenities.every(a => itemAmenities.includes(a))) return false;
      }

      // Capacity filter
      if (capacityBand && item.type === 'venue') {
        const [min, max] = capacityBand.split('-').map(Number);
        const cap = item.capacity || 0;
        if (cap < min || cap > max) return false;
      }

      // Min rating filter
      if (minRating > 0 && (item.rating || 0) < minRating) return false;

      // Featured only
      if (featuredOnly && !item.is_featured) return false;

      // Only with price
      if (onlyWithPrice && !item.price_range) return false;

      return true;
    });

    // Sort
    const [sortField, sortDir] = sortBy.split('-');
    result.sort((a, b) => {
      let valA: any, valB: any;
      if (sortField === 'name') { valA = a.name?.toLowerCase() || ''; valB = b.name?.toLowerCase() || ''; }
      else if (sortField === 'rating') { valA = a.rating || 0; valB = b.rating || 0; }
      else if (sortField === 'price') {
        const parsePrice = (p?: string) => { const m = p?.match(/\d+/); return m ? parseInt(m[0]) : 0; };
        valA = parsePrice(a.price_range); valB = parsePrice(b.price_range);
      }
      else return 0;
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [listings, searchQuery, activeCategory, selectedProvinces, selectedCities, selectedVenueTypes, selectedVendorCategories, selectedSubcategories, selectedAmenities, capacityBand, minRating, featuredOnly, onlyWithPrice, sortBy]);

  const toggleArrayFilter = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    setter(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  const clearAllFilters = () => {
    setSelectedProvinces([]);
    setSelectedCities([]);
    setSelectedVenueTypes([]);
    setSelectedVendorCategories([]);
    setSelectedSubcategories([]);
    setSelectedAmenities([]);
    setCapacityBand('');
    setMinRating(0);
    setFeaturedOnly(false);
    setOnlyWithPrice(false);
  };

  const activeFilterCount = selectedProvinces.length + selectedCities.length + selectedVenueTypes.length + selectedVendorCategories.length + selectedSubcategories.length + selectedAmenities.length + (capacityBand ? 1 : 0) + (minRating > 0 ? 1 : 0) + (featuredOnly ? 1 : 0) + (onlyWithPrice ? 1 : 0);

  return (
    <div className="bg-background min-h-screen">
      {/* ── Search Bar ── */}
      <div className="border-b border-border-subtle bg-brand-pink py-6">
        <div className="fx-container">
          <div
            className="flex items-center gap-3 overflow-hidden border border-border-subtle bg-white px-4 py-3"
            style={{ borderRadius: '12px' }}
          >
            <span className="material-symbols-outlined text-on-surface-variant">search</span>
            <input
              type="text"
              placeholder="Search venues, vendors, cities..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 border-none bg-transparent p-0 text-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-0"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="mt-4 flex flex-wrap gap-2">
            {CATEGORY_TABS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setSearchParams(value === 'all' ? {} : { category: value })}
                className="rounded-full px-4 py-2 text-sm font-semibold transition-colors"
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  background: activeCategory === value ? 'var(--color-primary, #123f5c)' : 'transparent',
                  color: activeCategory === value ? '#ffffff' : 'var(--color-on-surface-variant, #42474d)',
                  border: activeCategory === value ? '1.5px solid var(--color-primary, #123f5c)' : '1px solid var(--color-border-subtle, #d0d0d0)',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="border-b border-border-subtle bg-white py-3">
        <div className="fx-container flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 rounded-lg border border-border-subtle bg-white px-4 py-2 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-white">
                {activeFilterCount}
              </span>
            )}
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="rounded-lg border border-border-subtle bg-white px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
          >
            {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>

          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              <X className="h-3.5 w-3.5" />
              Clear all
            </button>
          )}
        </div>

        {/* Collapsible Filter Panel */}
        {showFilters && (
          <div className="border-t border-border-subtle bg-surface-container-low">
            <div className="fx-container py-6 space-y-6">
              {/* Province multi-select */}
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Province</p>
                <div className="flex flex-wrap gap-2">
                  {PROVINCES.map(p => (
                    <button
                      key={p}
                      onClick={() => toggleArrayFilter(setSelectedProvinces, p)}
                      className="rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
                      style={{
                        background: selectedProvinces.includes(p) ? '#123f5c' : 'transparent',
                        color: selectedProvinces.includes(p) ? '#fff' : '#42474d',
                        border: selectedProvinces.includes(p) ? '1.5px solid #123f5c' : '1px solid #d0d0d0',
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* City multi-select (filtered by provinces) */}
              {availableCities.length > 0 && (
                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">City</p>
                  <div className="flex flex-wrap gap-2">
                    {availableCities.map(c => (
                      <button
                        key={c}
                        onClick={() => toggleArrayFilter(setSelectedCities, c)}
                        className="rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
                        style={{
                          background: selectedCities.includes(c) ? '#123f5c' : 'transparent',
                          color: selectedCities.includes(c) ? '#fff' : '#42474d',
                          border: selectedCities.includes(c) ? '1.5px solid #123f5c' : '1px solid #d0d0d0',
                        }}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Venue type multi-select */}
              {(activeCategory === 'all' || activeCategory === 'venues') && (
                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Venue Type</p>
                  <div className="flex flex-wrap gap-2">
                    {VENUE_TYPES.map(t => (
                      <button
                        key={t}
                        onClick={() => toggleArrayFilter(setSelectedVenueTypes, t)}
                        className="rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
                        style={{
                          background: selectedVenueTypes.includes(t) ? '#123f5c' : 'transparent',
                          color: selectedVenueTypes.includes(t) ? '#fff' : '#42474d',
                          border: selectedVenueTypes.includes(t) ? '1.5px solid #123f5c' : '1px solid #d0d0d0',
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Vendor category multi-select */}
              {(activeCategory === 'all' || activeCategory === 'vendors') && (
                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Vendor Category</p>
                  <div className="flex flex-wrap gap-2">
                    {VENDOR_CATEGORIES.map(c => (
                      <button
                        key={c}
                        onClick={() => toggleArrayFilter(setSelectedVendorCategories, c)}
                        className="rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
                        style={{
                          background: selectedVendorCategories.includes(c) ? 'var(--color-brand-pink, #aa7478)' : 'transparent',
                          color: selectedVendorCategories.includes(c) ? '#fff' : '#42474d',
                          border: selectedVendorCategories.includes(c) ? '1.5px solid #aa7478' : '1px solid #d0d0d0',
                        }}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Vendor subcategory multi-select */}
              {availableSubcategories.length > 0 && (
                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Subcategory</p>
                  <div className="flex flex-wrap gap-2">
                    {availableSubcategories.map(s => (
                      <button
                        key={s}
                        onClick={() => toggleArrayFilter(setSelectedSubcategories, s)}
                        className="rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
                        style={{
                          background: selectedSubcategories.includes(s) ? '#aa7478' : 'transparent',
                          color: selectedSubcategories.includes(s) ? '#fff' : '#42474d',
                          border: selectedSubcategories.includes(s) ? '1.5px solid #aa7478' : '1px solid #d0d0d0',
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Amenities multi-select */}
              {(activeCategory === 'all' || activeCategory === 'venues') && (
                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Venue Amenities</p>
                  <div className="flex flex-wrap gap-2">
                    {AMENITIES.map(a => (
                      <button
                        key={a}
                        onClick={() => toggleArrayFilter(setSelectedAmenities, a)}
                        className="rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
                        style={{
                          background: selectedAmenities.includes(a) ? '#123f5c' : 'transparent',
                          color: selectedAmenities.includes(a) ? '#fff' : '#42474d',
                          border: selectedAmenities.includes(a) ? '1.5px solid #123f5c' : '1px solid #d0d0d0',
                        }}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Dropdowns row */}
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-on-surface-variant">Capacity</label>
                  <select
                    value={capacityBand}
                    onChange={e => setCapacityBand(e.target.value)}
                    className="rounded-lg border border-border-subtle bg-white px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
                  >
                    {CAPACITY_BANDS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-on-surface-variant">Min Rating</label>
                  <select
                    value={minRating}
                    onChange={e => setMinRating(Number(e.target.value))}
                    className="rounded-lg border border-border-subtle bg-white px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
                  >
                    {MIN_RATING_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Toggles row */}
              <div className="flex flex-wrap gap-6">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={featuredOnly}
                    onChange={e => setFeaturedOnly(e.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="text-sm font-medium text-on-surface">Featured only</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={onlyWithPrice}
                    onChange={e => setOnlyWithPrice(e.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="text-sm font-medium text-on-surface">Only with price</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Results ── */}
      <div className="fx-container py-8">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-on-surface-variant">
            {loading ? 'Loading...' : `${filtered.length} result${filtered.length !== 1 ? 's' : ''} found`}
          </p>
          <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-white p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-surface-container'}`}
            >
              <List className="h-4 w-4" /> List
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium ${viewMode === 'map' ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-surface-container'}`}
            >
              <Map className="h-4 w-4" /> Map
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-[300px] animate-pulse rounded-xl bg-surface-container" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant">location_off</span>
            <p className="mt-4 text-base text-on-surface-variant">No listings found</p>
            <p className="mt-1 text-sm text-on-surface-variant">Try adjusting your filters or search query</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map(item => (
              <Link
                key={`${item.type}-${item.id}`}
                to={`/${item.type === 'vendor' ? 'vendor' : 'venue'}/${item.id}`}
                className="group cursor-pointer overflow-hidden rounded-xl bg-white transition-all hover:-translate-y-0.5 border border-border-subtle shadow-sm"
              >
                <div className="relative h-48 overflow-hidden bg-surface-dim">
                  {item.image_url
                    ? <img src={item.image_url} alt={item.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                    : <div className="flex h-full w-full items-center justify-center bg-surface-container"><MapPin className="h-8 w-8 text-on-surface-variant" /></div>
                  }
                  <div className="absolute right-2 top-2">
                    <button
                      onClick={e => handleToggleFav(e, Number(item.id), item.type!)}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition-colors hover:bg-white"
                    >
                      <span className={`material-symbols-outlined text-[18px] ${favIds.has(`${item.type}-${item.id}`) ? 'text-brand-rose' : ''}`} style={{ fontVariationSettings: favIds.has(`${item.type}-${item.id}`) ? "'FILL' 1" : undefined }}>favorite</span>
                    </button>
                  </div>
                  {/* Type label */}
                  <div
                    className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                    style={{ background: item.type === 'venue' ? 'var(--color-primary, #123f5c)' : 'var(--color-brand-pink, #aa7478)' }}
                  >
                    {item.type === 'venue' ? 'Venue' : 'Vendor'}
                  </div>
                  {/* Featured badge */}
                  {item.is_featured && (
                    <div
                      className="absolute left-2 top-9 rounded-full bg-featured-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                    >
                      Featured
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="mb-1 truncate text-[18px] font-semibold text-primary">
                    {item.name}
                  </h3>
                  <p className="mb-2 flex items-center text-xs text-on-surface-variant">
                    <span className="material-symbols-outlined mr-1 text-sm">location_on</span>
                    {item.city || item.province || 'South Africa'}
                  </p>
                  {item.description && (
                    <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-on-surface-variant">{item.description}</p>
                  )}
                  <div className="flex items-center justify-between border-t border-border-subtle pt-3">
                    <span className="text-sm font-semibold text-primary">
                      {item.price_range ? item.price_range : 'Request quote'}
                    </span>
                    <div className="flex items-center gap-2">
                      {item.review_count != null && item.review_count > 0 && (
                        <span className="text-xs text-on-surface-variant">({item.review_count})</span>
                      )}
                      {item.rating && (
                        <span className="flex items-center text-xs text-outline">
                          <span className="material-symbols-outlined mr-0.5 text-sm text-brand-rose" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          {item.rating}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-1 lg:max-h-[calc(100vh-220px)] lg:overflow-y-auto">
              {filtered.map(item => (
                <Link
                  key={`map-${item.type}-${item.id}`}
                  to={`/${item.type === 'vendor' ? 'vendor' : 'venue'}/${item.id}`}
                  className="flex gap-3 rounded-xl bg-white p-3 shadow-sm border border-outline-variant transition-colors hover:border-primary"
                >
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-surface-container">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center"><MapPin className="h-6 w-6 text-on-surface-variant" /></div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-primary">{item.name}</h3>
                    <p className="text-xs text-on-surface-variant">{item.city || item.province || 'South Africa'}</p>
                    <span className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ background: item.type === 'venue' ? 'var(--color-primary, #123f5c)' : 'var(--color-brand-pink, #aa7478)' }}>
                      {item.type === 'venue' ? 'Venue' : 'Vendor'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            <div className="lg:col-span-2">
              <div className="sticky top-4 h-[calc(100vh-220px)] overflow-hidden rounded-xl border border-outline-variant bg-surface-container">
                <iframe
                  title="Discover map"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}&q=${encodeURIComponent(searchQuery || 'South Africa')}`}
                />
                {!import.meta.env.VITE_GOOGLE_MAPS_API_KEY && (
                  <div className="absolute inset-0 flex items-center justify-center bg-surface-container/90 p-6 text-center">
                    <div>
                      <Map className="mx-auto h-12 w-12 text-on-surface-variant" />
                      <p className="mt-2 text-sm font-semibold text-on-surface">Map preview</p>
                      <p className="text-xs text-on-surface-variant">Add a Google Maps API key for full interactive map support.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
