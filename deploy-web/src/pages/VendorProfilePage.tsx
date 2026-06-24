import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { MapPin } from 'lucide-react';

interface Vendor {
  id: string;
  name: string;
  description?: string;
  location?: string;
  city?: string;
  province?: string;
  phone?: string;
  email?: string;
  website?: string;
  featured_image_url?: string;
  images?: string[];
  rating?: number;
  price_from?: number;
  services?: string[];
  category?: string;
}

export default function VendorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Keep selectedImage in a stable ref so it can be wired to a lightbox later
  void selectedImage;

  useEffect(() => {
    if (id) fetchVendor();
  }, [id]);

  async function fetchVendor() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setVendor(data);
      if (data.featured_image_url) setSelectedImage(data.featured_image_url);
    } catch (err) {
      console.error('Error fetching vendor:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleShare = async () => {
    try {
      await navigator.share({
        title: vendor?.name,
        text: `Check out ${vendor?.name} on Funxon!`,
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const [activeTab, setActiveTab] = useState<'about' | 'services' | 'reviews'>('about');

  if (loading) {
    return (
      <div className="fx-container py-12">
        <div className="h-[400px] animate-pulse rounded-xl bg-surface-container" />
        <div className="mt-6 h-8 w-1/2 animate-pulse rounded bg-surface-container" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="fx-container py-20 text-center">
        <MapPin className="mx-auto h-12 w-12 text-on-surface-variant" />
        <h2 className="mt-4 text-xl font-bold text-on-surface" style={{ fontFamily: "'Playfair Display', serif" }}>Vendor not found</h2>
        <Link to="/discover" className="mt-4 inline-block text-sm font-semibold hover:underline" style={{ color: '#123f5c' }}>Browse vendors</Link>
      </div>
    );
  }

  return (
    <div className="bg-background">
      {/* ── Hero Image ── */}
      <section className="relative mx-auto w-full max-w-[1280px] overflow-hidden px-4 pt-6 md:px-6">
        <div className="relative h-[300px] overflow-hidden rounded-xl bg-surface-variant md:h-[400px] lg:h-[500px]">
          {vendor.featured_image_url
            ? <img src={vendor.featured_image_url} alt={vendor.name} className="h-full w-full object-cover" />
            : <div className="flex h-full w-full items-center justify-center bg-surface-container"><MapPin className="h-16 w-16 text-on-surface-variant" /></div>
          }
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute right-4 top-4 flex gap-3">
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-primary shadow-sm backdrop-blur-sm transition-all hover:bg-white">
              <span className="material-symbols-outlined text-[20px]">favorite</span>
            </button>
            <button onClick={handleShare} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-primary shadow-sm backdrop-blur-sm transition-all hover:bg-white">
              <span className="material-symbols-outlined text-[20px]">share</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Profile Content ── */}
      <div className="fx-container py-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">

          {/* Left: Info */}
          <div className="w-full space-y-8 lg:w-2/3">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {vendor.category && (
                  <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: '#b9c4eb', color: '#1a2544', fontFamily: "'Montserrat', sans-serif" }}>
                    {vendor.category}
                  </span>
                )}
                {vendor.rating && (
                  <div className="flex items-center" style={{ color: '#aa7478' }}>
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="ml-1 text-sm font-semibold text-on-surface" style={{ fontFamily: "'Montserrat', sans-serif" }}>{vendor.rating}</span>
                  </div>
                )}
              </div>
              <h1 className="text-[24px] font-semibold text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>{vendor.name}</h1>
              <p className="flex items-center text-base text-on-surface-variant" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                <span className="material-symbols-outlined mr-2 text-primary">location_on</span>
                {vendor.location || [vendor.city, vendor.province].filter(Boolean).join(', ') || 'South Africa'}
              </p>
            </div>

            {/* Tabs */}
            <div className="border-b" style={{ borderColor: '#f7f5f0' }}>
              <nav className="flex gap-8">
                {(['about', 'services', 'reviews'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="border-b-2 px-1 py-4 text-sm font-semibold capitalize transition-colors"
                    style={{
                      fontFamily: "'Montserrat', sans-serif",
                      borderColor: activeTab === tab ? '#002940' : 'transparent',
                      color: activeTab === tab ? '#002940' : '#42474d',
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
            </div>

            {activeTab === 'about' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h2 className="text-[18px] font-semibold text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>About this Vendor</h2>
                  <p className="text-sm leading-relaxed text-on-surface-variant" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                    {vendor.description || 'No description available.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-4">
                  {vendor.website && (
                    <a href={vendor.website} target="_blank" rel="noopener noreferrer"
                      className="inline-flex h-12 items-center justify-center rounded-lg border px-6 text-sm font-bold transition-colors hover:bg-surface-container"
                      style={{ borderColor: '#123f5c', color: '#123f5c', fontFamily: "'Montserrat', sans-serif" }}>
                      <span className="material-symbols-outlined mr-2 text-[18px]">language</span> Website
                    </a>
                  )}
                  {vendor.phone && (
                    <a href={`tel:${vendor.phone}`}
                      className="inline-flex h-12 items-center justify-center rounded-lg border px-6 text-sm font-bold transition-colors hover:bg-surface-container"
                      style={{ borderColor: '#123f5c', color: '#123f5c', fontFamily: "'Montserrat', sans-serif" }}>
                      <span className="material-symbols-outlined mr-2 text-[18px]">call</span> Call
                    </a>
                  )}
                  {vendor.email && (
                    <a href={`mailto:${vendor.email}`}
                      className="inline-flex h-12 items-center justify-center rounded-lg border px-6 text-sm font-bold transition-colors hover:bg-surface-container"
                      style={{ borderColor: '#123f5c', color: '#123f5c', fontFamily: "'Montserrat', sans-serif" }}>
                      <span className="material-symbols-outlined mr-2 text-[18px]">chat</span> Chat
                    </a>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'services' && (
              <div className="space-y-4">
                <h2 className="text-[18px] font-semibold text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>Services Offered</h2>
                {vendor.services && vendor.services.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {vendor.services.map(s => (
                      <span key={s} className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium" style={{ background: '#f0eee9', color: '#42474d', fontFamily: "'Montserrat', sans-serif" }}>
                        <span className="material-symbols-outlined text-secondary text-[16px]">check_circle</span> {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-on-surface-variant">No services listed.</p>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-4">
                <h2 className="text-[18px] font-semibold text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>Reviews</h2>
                <p className="text-sm text-on-surface-variant" style={{ fontFamily: "'Montserrat', sans-serif" }}>Reviews coming soon.</p>
              </div>
            )}
          </div>

          {/* Right: Sticky Sidebar */}
          <div className="w-full lg:w-1/3">
            <div
              className="sticky top-24 space-y-6 rounded-xl bg-white p-6"
              style={{ border: '1px solid #f7f5f0', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}
            >
              <div className="border-b pb-4" style={{ borderColor: '#f7f5f0' }}>
                <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant" style={{ fontFamily: "'Montserrat', sans-serif" }}>Starting from</span>
                <div className="mt-1 text-2xl font-semibold text-primary" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {vendor.price_from ? `R ${vendor.price_from.toLocaleString()}` : 'Request for pricing'}
                  {vendor.price_from && <span className="ml-1 text-sm font-normal text-on-surface-variant">/ event</span>}
                </div>
              </div>

              <ul className="space-y-3">
                {['Professional & vetted', 'Flexible packages', 'Direct communication'].map(feat => (
                  <li key={feat} className="flex items-start gap-3">
                    <span className="material-symbols-outlined mt-0.5 text-[18px] text-secondary">check_circle</span>
                    <span className="text-sm text-on-surface" style={{ fontFamily: "'Montserrat', sans-serif" }}>{feat}</span>
                  </li>
                ))}
              </ul>

              <Link
                to={`/quotes?vendor=${vendor.id}`}
                className="flex h-12 w-full items-center justify-center rounded-lg font-bold text-white transition-colors hover:bg-primary"
                style={{ background: '#123f5c', fontFamily: "'Montserrat', sans-serif" }}
              >
                Request a Quote
              </Link>
              {vendor.phone && (
                <a href={`tel:${vendor.phone}`}
                  className="flex h-12 w-full items-center justify-center rounded-lg border font-bold transition-colors hover:bg-surface-container"
                  style={{ borderColor: '#123f5c', color: '#123f5c', fontFamily: "'Montserrat', sans-serif" }}>
                  Call Vendor
                </a>
              )}
              <p className="text-center text-xs text-on-surface-variant" style={{ fontFamily: "'Montserrat', sans-serif" }}>No commitment required.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
