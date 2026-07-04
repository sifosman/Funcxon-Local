import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';
import { isFavourite, toggleFavourite } from '../lib/favourites';
import { MapPin, ChevronLeft, FolderOpen } from 'lucide-react';
import { ImageZoomModal, type GalleryItem } from '../components/ImageZoomModal';
import { ReviewsSection } from '../components/ReviewsSection';
import { SocialLinks } from '../components/SocialLinks';

interface Vendor {
  id: string;
  name: string;
  description?: string;
  location?: string;
  city?: string;
  province?: string;
  email?: string;
  whatsapp_number?: string;
  website_url?: string;
  instagram_url?: string;
  facebook_url?: string;
  tiktok_url?: string;
  twitter_url?: string;
  youtube_url?: string;
  image_url?: string;
  additional_photos?: string[];
  rating?: number;
  price_range?: string;
  services?: string[];
  service_options?: string[];
  vendor_tags?: string[];
  dietary_options?: string[];
  cuisine_types?: string[];
  amenities?: string[];
  category_id?: number;
  address_line_1?: string;
  address_line_2?: string;
  suburb?: string;
  postal_code?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  google_maps_link?: string;
}

export default function VendorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [isFav, setIsFav] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [reviewCount, setReviewCount] = useState<number | null>(null);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoomIndex, setZoomIndex] = useState(0);

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
      const legacyImages = data.additional_photos?.length ? data.additional_photos : (data.image_url ? [data.image_url] : []);

      // Load gallery media (images + videos) from new gallery_media table
      let mediaItems: GalleryItem[] = [];
      try {
        const { data: mediaData } = await supabase
          .from('gallery_media')
          .select('media_url, media_type, sort_order')
          .eq('vendor_id', id)
          .eq('is_active', true)
          .order('sort_order', { ascending: true });
        if (mediaData && mediaData.length > 0) {
          mediaItems = mediaData.map((m: any) => ({ url: m.media_url, type: m.media_type }));
        }
      } catch (err) {
        console.warn('gallery_media fetch failed, falling back to legacy photos:', err);
      }
      const legacyItems = legacyImages.map((url: string) => ({ url, type: 'image' as const }));
      const seen = new Set<string>();
      const items = [...legacyItems, ...mediaItems]
        .filter((item) => {
          if (seen.has(item.url)) return false;
          seen.add(item.url);
          return true;
        })
        .sort((a, b) => {
          if (a.type === 'video' && b.type !== 'video') return 1;
          if (a.type !== 'video' && b.type === 'video') return -1;
          return 0;
        });
      setGalleryItems(items);
      setSelectedImage(items[0]?.url || null);

      if (user && id) {
        const fav = await isFavourite(user, Number(id), 'vendor');
        setIsFav(fav);
      }

      const { count } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', id);
      setReviewCount(count ?? 0);
    } catch (err) {
      console.error('Error fetching vendor:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleFavourite = async () => {
    if (!user || !id) return;
    setFavLoading(true);
    try {
      await toggleFavourite(user, Number(id), 'vendor');
      setIsFav(!isFav);
    } catch (err) {
      console.error('Error toggling favourite:', err);
    } finally {
      setFavLoading(false);
    }
  };

  const handleShare = async () => {
    const url = `https://funxon-web.vercel.app/vendor/${id}`;
    const message = encodeURIComponent(`Check out ${vendor?.name} on Funxon: ${url}`);
    const whatsappUrl = `https://wa.me/?text=${message}`;
    try {
      if (navigator.share && navigator.userAgent.includes('Mobile')) {
        await navigator.share({ title: vendor?.name, text: `Check out ${vendor?.name} on Funxon!`, url });
      } else {
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      }
    } catch {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const [activeTab, setActiveTab] = useState<'about' | 'features' | 'reviews'>('about');

  const openZoom = (idx: number) => {
    setZoomIndex(idx);
    setZoomOpen(true);
  };

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
        <h2 className="mt-4 text-xl font-bold text-on-surface" >Vendor not found</h2>
        <Link to="/discover" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">Browse vendors</Link>
      </div>
    );
  }

  const fullAddress = [vendor?.address_line_1, vendor?.address_line_2, vendor?.suburb, vendor?.city, vendor?.province, vendor?.postal_code].filter(Boolean).join(', ');
  const hasCoordinates = vendor?.latitude != null && vendor?.longitude != null;
  const mapSrc = vendor?.google_maps_link
    ? vendor.google_maps_link
    : hasCoordinates
      ? `https://www.google.com/maps?q=${vendor!.latitude},${vendor!.longitude}&z=14&output=embed`
      : vendor?.location || fullAddress
        ? `https://www.google.com/maps?q=${encodeURIComponent(vendor?.location || fullAddress)}&z=14&output=embed`
        : null;

  return (
    <div className="bg-background">
      {/* Breadcrumb */}
      <div className="fx-container pt-4">
        <Link to="/discover" className="inline-flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary">
          <ChevronLeft className="h-4 w-4" /> Back to Discover
        </Link>
      </div>

      {/* ── Hero Image ── */}
      <section className="relative mx-auto w-full max-w-[1280px] overflow-hidden px-4 pt-4 md:px-6">
        <div className="relative h-[300px] overflow-hidden rounded-xl bg-surface-variant md:h-[400px] lg:h-[500px]">
          {selectedImage
            ? (() => {
                const selectedIndex = galleryItems.findIndex(item => item.url === selectedImage);
                const selectedItem = galleryItems[selectedIndex];
                return selectedItem?.type === 'video' ? (
                  <div className="relative h-full w-full cursor-pointer bg-black" onClick={() => openZoom(selectedIndex)}>
                    <video src={selectedItem.url} className="h-full w-full object-contain" preload="metadata" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="material-symbols-outlined text-6xl text-white/90">play_circle</span>
                    </div>
                  </div>
                ) : (
                  <img src={selectedImage} alt={vendor.name} className="h-full w-full cursor-zoom-in object-cover" onClick={() => openZoom(Math.max(0, selectedIndex))} />
                );
              })()
            : <div className="flex h-full w-full items-center justify-center bg-surface-container"><MapPin className="h-16 w-16 text-on-surface-variant" /></div>
          }
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute right-4 top-4 flex gap-3">
            <button onClick={handleFavourite} disabled={favLoading} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-primary shadow-sm backdrop-blur-sm transition-all hover:bg-white">
              <span className={`material-symbols-outlined text-[20px] ${isFav ? 'text-brand-rose' : ''}`} style={{ fontVariationSettings: isFav ? "'FILL' 1" : undefined }}>favorite</span>
            </button>
            <button onClick={handleShare} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-primary shadow-sm backdrop-blur-sm transition-all hover:bg-white">
              <span className="material-symbols-outlined text-[20px]">share</span>
            </button>
          </div>
        </div>
        {/* Thumbnail Gallery */}
        {galleryItems.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
            {galleryItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(item.url)}
                onDoubleClick={() => openZoom(idx)}
                className={`h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${selectedImage === item.url ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'}`}
                title={item.type === 'video' ? 'Double-click to play video' : 'Double-click to zoom'}
              >
                {item.type === 'video' ? (
                  <div className="relative h-full w-full bg-black">
                    <video src={item.url} className="h-full w-full object-cover" preload="metadata" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="material-symbols-outlined text-2xl text-white/90">play_circle</span>
                    </div>
                  </div>
                ) : (
                  <img src={item.url} alt={`${vendor.name} ${idx + 1}`} className="h-full w-full object-cover" />
                )}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ── Profile Content ── */}
      <div className="fx-container py-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">

          {/* Left: Info */}
          <div className="w-full space-y-8 lg:w-2/3">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {vendor.category_id && (
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {vendor.category_id === 1 ? 'Photographer' : vendor.category_id === 2 ? 'Caterer' : vendor.category_id === 3 ? 'Decor' : vendor.category_id === 4 ? 'Music' : vendor.category_id === 5 ? 'Transport' : vendor.category_id === 6 ? 'Attire' : 'Vendor'}
                  </span>
                )}
                  {vendor.rating && (
                    <div className="flex items-center text-brand-pink">
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span className="ml-1 text-sm font-semibold text-on-surface">{vendor.rating}{reviewCount !== null ? ` (${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'})` : ''}</span>
                    </div>
                  )}
              </div>
              <h1 className="text-[24px] font-semibold text-primary" >{vendor.name}</h1>
              <p className="flex items-center text-base text-on-surface-variant" >
                <span className="material-symbols-outlined mr-2 text-primary">location_on</span>
                {vendor.location || [vendor.city, vendor.province].filter(Boolean).join(', ') || 'South Africa'}
              </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-border-subtle">
              <nav className="flex gap-8">
                {(['about', 'features', 'reviews'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`border-b-2 px-1 py-4 text-sm font-semibold capitalize transition-colors ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant'}`}
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
            </div>

            {activeTab === 'about' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h2 className="text-[18px] font-semibold text-primary" >About this Vendor</h2>
                  <p className="text-sm leading-relaxed text-on-surface-variant" >
                    {vendor.description || 'No description available.'}
                  </p>
                </div>
                {/* Contact Buttons */}
                <div className="flex flex-wrap gap-4">
                  {vendor.website_url && (
                    <a href={vendor.website_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex h-12 items-center justify-center rounded-lg border border-primary px-6 text-sm font-bold text-primary transition-colors hover:bg-surface-container">
                      <span className="material-symbols-outlined mr-2 text-[18px]">language</span> Website
                    </a>
                  )}
                  {vendor.whatsapp_number && (
                    <a href={`https://wa.me/${vendor.whatsapp_number.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex h-12 items-center justify-center rounded-lg px-6 text-sm font-bold text-white transition-all hover:brightness-110"
                      style={{ background: '#25D366' }}>
                      <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      WhatsApp
                    </a>
                  )}
                  {vendor.email && (
                    <a href={`mailto:${vendor.email}`}
                      className="inline-flex h-12 items-center justify-center rounded-lg border border-primary px-6 text-sm font-bold text-primary transition-colors hover:bg-surface-container">
                      <span className="material-symbols-outlined mr-2 text-[18px]">mail</span> Email
                    </a>
                  )}
                </div>

                {/* Address & Map */}
                {(fullAddress || vendor?.location) && (
                  <div className="space-y-3 pt-4">
                    <h2 className="text-[18px] font-semibold text-primary">Location</h2>
                    <p className="flex items-start gap-2 text-sm text-on-surface-variant">
                      <span className="material-symbols-outlined mt-0.5 text-[18px] text-primary">location_on</span>
                      <span>{fullAddress || vendor?.location}</span>
                    </p>
                    {mapSrc && (
                      <div className="overflow-hidden rounded-xl border border-border-subtle">
                        <iframe
                          src={mapSrc}
                          width="100%"
                          height="300"
                          style={{ border: 0 }}
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          title={`${vendor.name} location map`}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Social Links */}
                {(vendor.instagram_url || vendor.facebook_url || vendor.tiktok_url || vendor.twitter_url || vendor.youtube_url) && (
                  <div className="space-y-3 pt-4">
                    <h2 className="text-[18px] font-semibold text-primary">Follow Us</h2>
                    <SocialLinks
                      instagram_url={vendor.instagram_url}
                      facebook_url={vendor.facebook_url}
                      tiktok_url={vendor.tiktok_url}
                      twitter_url={vendor.twitter_url}
                      youtube_url={vendor.youtube_url}
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'features' && (
              <div className="space-y-6">
                {/* Service Options */}
                {((vendor.service_options?.length ?? 0) + (vendor.services?.length ?? 0)) > 0 && (
                  <div className="space-y-3">
                    <h2 className="text-[18px] font-semibold text-primary">Service Options</h2>
                    <div className="flex flex-wrap gap-2">
                      {(vendor.service_options || vendor.services || []).map(s => (
                        <span key={s} className="flex items-center gap-1 rounded-full bg-surface-container-high px-3 py-1.5 text-sm font-medium text-on-surface-variant">
                          <span className="material-symbols-outlined text-secondary text-[16px]">check_circle</span> {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Specialties */}
                {vendor.vendor_tags && vendor.vendor_tags.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="text-[18px] font-semibold text-primary">Specialties</h2>
                    <div className="flex flex-wrap gap-2">
                      {vendor.vendor_tags.map(tag => (
                        <span key={tag} className="rounded-full bg-primary-muted px-3 py-1.5 text-sm font-medium text-primary">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dietary Options */}
                {vendor.dietary_options && vendor.dietary_options.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="text-[18px] font-semibold text-primary">Dietary Options</h2>
                    <div className="flex flex-wrap gap-2">
                      {vendor.dietary_options.map(opt => (
                        <span key={opt} className="flex items-center gap-1 rounded-full bg-surface-container-high px-3 py-1.5 text-sm font-medium text-on-surface-variant">
                          <span className="material-symbols-outlined text-secondary text-[16px]">restaurant</span> {opt}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cuisine Types */}
                {vendor.cuisine_types && vendor.cuisine_types.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="text-[18px] font-semibold text-primary">Cuisine Types</h2>
                    <div className="flex flex-wrap gap-2">
                      {vendor.cuisine_types.map(ct => (
                        <span key={ct} className="flex items-center gap-1 rounded-full bg-surface-container-high px-3 py-1.5 text-sm font-medium text-on-surface-variant">
                          <span className="material-symbols-outlined text-secondary text-[16px]">dining</span> {ct}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Amenities */}
                {vendor.amenities && vendor.amenities.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="text-[18px] font-semibold text-primary">Amenities</h2>
                    <div className="flex flex-wrap gap-2">
                      {vendor.amenities.map(a => (
                        <span key={a} className="flex items-center gap-1 rounded-full bg-surface-container-high px-3 py-1.5 text-sm font-medium text-on-surface-variant">
                          <span className="material-symbols-outlined text-secondary text-[16px]">check_circle</span> {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Coverage Area */}
                {(vendor.province || vendor.city) && (
                  <div className="space-y-3">
                    <h2 className="text-[18px] font-semibold text-primary">Coverage Area</h2>
                    <div className="rounded-xl border border-border-subtle bg-white p-5">
                      {vendor.province && (
                        <p className="text-sm text-on-surface">Province: {vendor.province}</p>
                      )}
                      {vendor.city && (
                        <p className="text-sm text-on-surface">City: {vendor.city}</p>
                      )}
                      <p className="mt-2 text-xs text-on-surface-variant">Willing to travel to selected coverage areas.</p>
                    </div>
                  </div>
                )}

                {/* No features fallback */}
                {!(vendor.service_options?.length || vendor.services?.length || vendor.vendor_tags?.length || vendor.dietary_options?.length || vendor.cuisine_types?.length || vendor.amenities?.length || vendor.province || vendor.city) && (
                  <p className="text-sm text-on-surface-variant">No features listed.</p>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <ReviewsSection type="vendor" targetId={vendor.id} tableName="reviews" idColumn="vendor_id" />
            )}
          </div>

          {/* Right: Sticky Sidebar */}
          <div className="w-full lg:w-1/3">
            <div
              className="sticky top-24 space-y-6 rounded-xl border border-border-subtle bg-white p-6 shadow-[0_4px_15px_rgba(0,0,0,0.05)]"
            >
              <div className="border-b border-border-subtle pb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant" >Starting from</span>
                <div className="mt-1 text-2xl font-semibold text-primary" >
                  {vendor.price_range ? vendor.price_range : 'Request for pricing'}
                  {vendor.price_range && <span className="ml-1 text-sm font-normal text-on-surface-variant">/ event</span>}
                </div>
              </div>

              <ul className="space-y-3">
                {['Professional & vetted', 'Flexible packages', 'Direct communication'].map(feat => (
                  <li key={feat} className="flex items-start gap-3">
                    <span className="material-symbols-outlined mt-0.5 text-[18px] text-secondary">check_circle</span>
                    <span className="text-sm text-on-surface" >{feat}</span>
                  </li>
                ))}
              </ul>

              <Link
                to={`/quotes?vendor=${vendor.id}`}
                className="flex h-12 w-full items-center justify-center rounded-lg bg-primary font-bold text-white transition-colors hover:bg-primary/90"
              >
                Request a Quote
              </Link>
              <Link
                to={`/vendor/${vendor.id}/portfolio`}
                className="flex h-12 w-full items-center justify-center rounded-lg border border-primary font-bold text-primary transition-colors hover:bg-surface-container"
              >
                <FolderOpen className="mr-2 h-4 w-4" /> View Portfolio
              </Link>
              {vendor.whatsapp_number && (
                <a href={`https://wa.me/${vendor.whatsapp_number.replace(/[^0-9]/g, '')}`}
                  className="flex h-12 w-full items-center justify-center rounded-lg font-bold text-white transition-all hover:brightness-110"
                  style={{ background: '#25D366' }}>
                  WhatsApp
                </a>
              )}
              <p className="text-center text-xs text-on-surface-variant" >No commitment required.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Image Zoom Modal */}
      <ImageZoomModal
        items={galleryItems}
        startIndex={zoomIndex}
        alt={vendor.name}
        open={zoomOpen}
        onClose={() => setZoomOpen(false)}
      />
    </div>
  );
}
