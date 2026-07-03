import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';
import { isFavourite, toggleFavourite } from '../lib/favourites';
import { MapPin, ChevronLeft, CalendarDays, ExternalLink, FolderOpen } from 'lucide-react';
import { ImageZoomModal, type GalleryItem } from '../components/ImageZoomModal';
import { ReviewsSection } from '../components/ReviewsSection';
import { SocialLinks } from '../components/SocialLinks';

interface Venue {
  id: string;
  name: string;
  description?: string;
  location?: string;
  city?: string;
  province?: string;
  contact_email?: string;
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
  venue_capacity?: string;
  amenities?: string[];
  venue_type?: string;
  event_types?: string[];
  features?: Record<string, any>;
  address_line_1?: string;
  address_line_2?: string;
  suburb?: string;
  postal_code?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  google_maps_link?: string;
}

interface AvailabilitySlot {
  id: string;
  date: string;
  is_available?: boolean;
  notes?: string;
}

export default function VenueProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [isFav, setIsFav] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [reviewCount, setReviewCount] = useState<number | null>(null);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoomIndex, setZoomIndex] = useState(0);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [ratingBreakdown, setRatingBreakdown] = useState<Record<number, number>>({});

  useEffect(() => {
    if (id) fetchVenue();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    async function loadBreakdown() {
      try {
        const { data } = await supabase
          .from('venue_reviews')
          .select('rating')
          .eq('venue_id', id);
        const counts: Record<number, number> = {};
        (data || []).forEach((r: any) => {
          const rating = Math.round(Number(r.rating));
          if (rating >= 1 && rating <= 5) counts[rating] = (counts[rating] || 0) + 1;
        });
        setRatingBreakdown(counts);
      } catch (err) {
        console.error('Error loading rating breakdown:', err);
      }
    }
    loadBreakdown();
  }, [id]);

  async function fetchVenue() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('venue_listings')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setVenue(data);
      const legacyImages = data.additional_photos?.length ? data.additional_photos : (data.image_url ? [data.image_url] : []);

      // Load gallery media (images + videos) from new gallery_media table
      let mediaItems: GalleryItem[] = [];
      try {
        const { data: mediaData } = await supabase
          .from('gallery_media')
          .select('media_url, media_type, sort_order')
          .eq('venue_id', id)
          .eq('is_active', true)
          .order('sort_order', { ascending: true });
        if (mediaData && mediaData.length > 0) {
          mediaItems = mediaData.map((m: any) => ({ url: m.media_url, type: m.media_type }));
        }
      } catch (err) {
        console.warn('gallery_media fetch failed, falling back to legacy photos:', err);
      }
      const items = mediaItems.length > 0 ? mediaItems : legacyImages.map((url: string) => ({ url, type: 'image' as const }));
      setGalleryItems(items);
      setSelectedImage(items[0]?.url || null);

      if (user && id) {
        const fav = await isFavourite(user, Number(id), 'venue');
        setIsFav(fav);
      }

      const { count } = await supabase
        .from('venue_reviews')
        .select('*', { count: 'exact', head: true })
        .eq('venue_id', id);
      setReviewCount(count ?? 0);

      // Fetch availability calendar
      const { data: availData } = await supabase
        .from('venue_availability_calendar')
        .select('id, date, is_available, notes')
        .eq('venue_id', id)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .limit(20);
      if (availData) setAvailability(availData as AvailabilitySlot[]);
    } catch (err) {
      console.error('Error fetching venue:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleFavourite = async () => {
    if (!user || !id) return;
    setFavLoading(true);
    try {
      await toggleFavourite(user, Number(id), 'venue');
      setIsFav(!isFav);
    } catch (err) {
      console.error('Error toggling favourite:', err);
    } finally {
      setFavLoading(false);
    }
  };

  const handleShare = async () => {
    const url = `https://funxon-web.vercel.app/venue/${id}`;
    const message = encodeURIComponent(`Check out ${venue?.name} on Funxon: ${url}`);
    const whatsappUrl = `https://wa.me/?text=${message}`;
    try {
      if (navigator.share && navigator.userAgent.includes('Mobile')) {
        await navigator.share({ title: venue?.name, text: `Check out ${venue?.name} on Funxon!`, url });
      } else {
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      }
    } catch {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const [activeTab, setActiveTab] = useState<'about' | 'amenities' | 'calendar' | 'reviews'>('about');

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

  if (!venue) {
    return (
      <div className="fx-container py-20 text-center">
        <MapPin className="mx-auto h-12 w-12 text-on-surface-variant" />
        <h2 className="mt-4 text-xl font-bold text-on-surface" >Venue not found</h2>
        <Link to="/discover" className="mt-4 inline-block text-sm font-semibold hover:underline" style={{ color: '#123f5c' }}>Browse venues</Link>
      </div>
    );
  }

  const fullAddress = [venue?.address_line_1, venue?.address_line_2, venue?.suburb, venue?.city, venue?.province, venue?.postal_code].filter(Boolean).join(', ');
  const hasCoordinates = venue?.latitude != null && venue?.longitude != null;
  const mapSrc = venue?.google_maps_link
    ? venue.google_maps_link
    : hasCoordinates
      ? `https://www.google.com/maps?q=${venue!.latitude},${venue!.longitude}&z=14&output=embed`
      : venue?.location || fullAddress
        ? `https://www.google.com/maps?q=${encodeURIComponent(venue?.location || fullAddress)}&z=14&output=embed`
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
                  <img src={selectedImage} alt={venue.name} className="h-full w-full cursor-zoom-in object-cover" onClick={() => openZoom(Math.max(0, selectedIndex))} />
                );
              })()
            : <div className="flex h-full w-full items-center justify-center bg-surface-container"><MapPin className="h-16 w-16 text-on-surface-variant" /></div>
          }
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          {/* Actions */}
          <div className="absolute right-4 top-4 flex gap-3">
            <button onClick={handleFavourite} disabled={favLoading} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-primary shadow-sm backdrop-blur-sm transition-all hover:bg-white">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: isFav ? "'FILL' 1" : undefined, color: isFav ? '#aa7478' : undefined }}>favorite</span>
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
                  <img src={item.url} alt={`${venue.name} ${idx + 1}`} className="h-full w-full object-cover" />
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
            {/* Header */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {venue.venue_type && (
                  <span className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: '#b9c4eb', color: '#123f5c' }}>
                    {venue.venue_type}
                  </span>
                )}
                {venue.rating && (
                  <div className="flex items-center" style={{ color: '#aa7478' }}>
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="ml-1 text-sm font-semibold text-on-surface" >{venue.rating}{reviewCount !== null ? ` (${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'})` : ''}</span>
                  </div>
                )}
              </div>
              <h1 className="text-[24px] font-semibold text-primary" >{venue.name}</h1>
              <p className="flex items-center text-base text-on-surface-variant" >
                <span className="material-symbols-outlined mr-2 text-primary">location_on</span>
                {venue.location || [venue.city, venue.province].filter(Boolean).join(', ') || 'South Africa'}
              </p>
            </div>

            {/* Tabs */}
            <div className="border-b" style={{ borderColor: '#f7f5f0' }}>
              <nav className="flex gap-8">
                {(['about', 'amenities', 'calendar', 'reviews'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="border-b-2 px-1 py-4 text-sm font-semibold capitalize transition-colors"
                    style={{
                      fontFamily: "'Montserrat', sans-serif",
                      borderColor: activeTab === tab ? '#123f5c' : 'transparent',
                      color: activeTab === tab ? '#123f5c' : '#42474d',
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'about' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <h2 className="text-[18px] font-semibold text-primary" >About this Venue</h2>
                  <p className="text-sm leading-relaxed text-on-surface-variant" >
                    {venue.description || 'No description available.'}
                  </p>
                </div>
                {/* Contact Buttons */}
                <div className="flex flex-wrap gap-4">
                  {venue.website_url && (
                    <a href={venue.website_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex h-12 items-center justify-center rounded-lg border px-6 text-sm font-bold transition-colors hover:bg-surface-container"
                      style={{ borderColor: '#123f5c', color: '#123f5c' }}>
                      <span className="material-symbols-outlined mr-2 text-[18px]">language</span> Website
                    </a>
                  )}
                  {venue.whatsapp_number && (
                    <a href={`https://wa.me/${venue.whatsapp_number.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex h-12 items-center justify-center rounded-lg px-6 text-sm font-bold text-white transition-all hover:brightness-110"
                      style={{ background: '#25D366' }}>
                      <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      WhatsApp
                    </a>
                  )}
                  {venue.contact_email && (
                    <a href={`mailto:${venue.contact_email}`}
                      className="inline-flex h-12 items-center justify-center rounded-lg border px-6 text-sm font-bold transition-colors hover:bg-surface-container"
                      style={{ borderColor: '#123f5c', color: '#123f5c' }}>
                      <span className="material-symbols-outlined mr-2 text-[18px]">mail</span> Email
                    </a>
                  )}
                </div>

                {/* Address & Map */}
                {(fullAddress || venue?.location) && (
                  <div className="space-y-3 pt-4">
                    <h2 className="text-[18px] font-semibold text-primary">Location</h2>
                    <p className="flex items-start gap-2 text-sm text-on-surface-variant">
                      <span className="material-symbols-outlined mt-0.5 text-[18px] text-primary">location_on</span>
                      <span>{fullAddress || venue?.location}</span>
                    </p>
                    {mapSrc && (
                      <div className="overflow-hidden rounded-xl border" style={{ borderColor: '#f7f5f0' }}>
                        <iframe
                          src={mapSrc}
                          width="100%"
                          height="300"
                          style={{ border: 0 }}
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          title={`${venue.name} location map`}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Feature cards */}
                <div className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2">
                  {venue.venue_capacity && (
                    <div className="rounded-xl border bg-white p-6" style={{ borderColor: '#f7f5f0', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
                      <span className="material-symbols-outlined mb-3 text-2xl text-secondary">groups</span>
                      <h3 className="mb-1 text-sm font-semibold text-primary">Capacity</h3>
                      <p className="text-xs text-on-surface-variant">{venue.venue_capacity} guests</p>
                    </div>
                  )}
                  {venue.event_types && venue.event_types.length > 0 && (
                    <div className="rounded-xl border bg-white p-6" style={{ borderColor: '#f7f5f0', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
                      <span className="material-symbols-outlined mb-3 text-2xl text-secondary">celebration</span>
                      <h3 className="mb-1 text-sm font-semibold text-primary">Event Types</h3>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {venue.event_types.map(et => (
                          <span key={et} className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: '#f0eee9', color: '#42474d' }}>{et}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Halls & Capacities */}
                {venue.features?.halls && Array.isArray(venue.features.halls) && venue.features.halls.length > 0 && (
                  <div className="space-y-3 pt-4">
                    <h2 className="text-[18px] font-semibold text-primary">Halls & Capacities</h2>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {venue.features.halls.map((hall: any, idx: number) => (
                        <div key={idx} className="rounded-xl border bg-white p-5" style={{ borderColor: '#f7f5f0' }}>
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-secondary">meeting_room</span>
                            <h3 className="text-sm font-semibold text-primary">{hall.name || `Hall ${idx + 1}`}</h3>
                          </div>
                          <p className="mt-1 text-xs text-on-surface-variant">{hall.capacity || 'Flexible'} guests</p>
                          {hall.description && <p className="mt-1 text-xs text-on-surface-variant">{hall.description}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Social Links */}
                {(venue.instagram_url || venue.facebook_url || venue.tiktok_url || venue.twitter_url || venue.youtube_url) && (
                  <div className="space-y-3 pt-4">
                    <h2 className="text-[18px] font-semibold text-primary">Follow Us</h2>
                    <SocialLinks
                      instagram_url={venue.instagram_url}
                      facebook_url={venue.facebook_url}
                      tiktok_url={venue.tiktok_url}
                      twitter_url={venue.twitter_url}
                      youtube_url={venue.youtube_url}
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'amenities' && (
              <div className="space-y-6">
                {/* Halls & Spaces */}
                {venue.features?.halls && Array.isArray(venue.features.halls) && venue.features.halls.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-[18px] font-semibold text-primary">Halls & Spaces</h2>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {venue.features.halls.map((hall: any, idx: number) => (
                        <div key={idx} className="rounded-xl border bg-white p-5" style={{ borderColor: '#f7f5f0' }}>
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-secondary">meeting_room</span>
                            <h3 className="text-sm font-semibold text-primary">{hall.name || `Hall ${idx + 1}`}</h3>
                          </div>
                          <p className="mt-1 text-xs text-on-surface-variant">{hall.capacity || 'Flexible'} guests</p>
                          {hall.description && <p className="mt-1 text-xs text-on-surface-variant">{hall.description}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Amenities */}
                <div className="space-y-4">
                  <h2 className="text-[18px] font-semibold text-primary">Amenities</h2>
                  {venue.amenities && venue.amenities.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {venue.amenities.map(a => (
                        <span key={a} className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium" style={{ background: '#f0eee9', color: '#42474d' }}>
                          <span className="material-symbols-outlined text-secondary text-[16px]">check_circle</span> {a}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-on-surface-variant">No amenities listed.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'calendar' && (
              <div className="space-y-4">
                <h2 className="text-[18px] font-semibold text-primary">Calendar & Availability</h2>
                {availability.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {availability.map(slot => {
                      const date = new Date(slot.date);
                      return (
                        <div
                          key={slot.id}
                          className={`rounded-xl border p-4 ${slot.is_available === false ? 'opacity-50' : ''}`}
                          style={{ borderColor: '#f7f5f0', background: slot.is_available === false ? '#f0eee9' : '#fff' }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-secondary text-[20px]">event</span>
                            <div>
                              <p className="text-sm font-semibold text-on-surface">{date.toLocaleDateString('en-ZA', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                            </div>
                          </div>
                          {slot.is_available === false && <p className="mt-2 text-xs font-medium text-error">Unavailable</p>}
                          {slot.notes && <p className="mt-1 text-xs text-on-surface-variant">{slot.notes}</p>}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border bg-white p-8 text-center" style={{ borderColor: '#f7f5f0' }}>
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-40">calendar_month</span>
                    <p className="mt-3 text-sm font-medium text-on-surface">No upcoming availability listed</p>
                    <p className="mt-1 text-xs text-on-surface-variant">Contact the venue directly to check dates.</p>
                  </div>
                )}
                <Link
                  to={`/book-tour?venue=${venue.id}`}
                  className="inline-flex h-11 items-center justify-center rounded-lg border px-5 text-sm font-bold transition-colors hover:bg-surface-container"
                  style={{ borderColor: '#123f5c', color: '#123f5c' }}
                >
                  <CalendarDays className="mr-2 h-4 w-4" /> Request a Tour Date
                </Link>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {Object.keys(ratingBreakdown).length > 0 && (
                  <div className="rounded-xl border border-border-subtle bg-white p-5 shadow-sm">
                    <h2 className="text-[18px] font-semibold text-primary">Rating Breakdown</h2>
                    <div className="mt-3 space-y-2">
                      {[5, 4, 3, 2, 1].map(star => {
                        const count = ratingBreakdown[star] || 0;
                        const total = Object.values(ratingBreakdown).reduce((a, b) => a + b, 0) || 1;
                        const pct = Math.round((count / total) * 100);
                        return (
                          <div key={star} className="flex items-center gap-3">
                            <span className="w-8 text-sm font-semibold text-on-surface">{star} ★</span>
                            <div className="flex-1 overflow-hidden rounded-full bg-surface-container">
                              <div className="h-2 rounded-full bg-secondary" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-8 text-right text-xs text-on-surface-variant">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="rounded-xl border border-border-subtle bg-brand-pink p-5">
                  <h2 className="text-[18px] font-semibold text-primary">How ratings work</h2>
                  <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                    Our ratings are based on verified feedback from couples and event planners who have booked this venue through Funxon. Each review is scored from 1 to 5 stars across service, value, and experience. The overall rating is the average of all reviews.
                  </p>
                </div>

                <ReviewsSection type="venue" targetId={venue.id} tableName="venue_reviews" idColumn="venue_id" />
              </div>
            )}
          </div>

          {/* Right: Sticky Sidebar */}
          <div className="w-full lg:w-1/3">
            <div
              className="sticky top-24 space-y-6 rounded-xl bg-white p-6"
              style={{ border: '1px solid #f7f5f0', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}
            >
              {/* Pricing */}
              <div className="border-b pb-4" style={{ borderColor: '#f7f5f0' }}>
                <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant" >Starting from</span>
                <div className="mt-1 text-2xl font-semibold text-primary" >
                  {venue.price_range ? venue.price_range : 'Request for pricing'}
                  {venue.price_range && <span className="ml-1 text-sm font-normal text-on-surface-variant">/ event</span>}
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3">
                {[
                  venue.venue_capacity ? `${venue.venue_capacity} guests` : 'Flexible capacity',
                  'Professional event support',
                  'Customizable packages available',
                ].map(feat => (
                  <li key={feat} className="flex items-start gap-3">
                    <span className="material-symbols-outlined mt-0.5 text-[18px] text-secondary">check_circle</span>
                    <span className="text-sm text-on-surface" >{feat}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Buttons */}
              <Link
                to={`/quotes?venue=${venue.id}`}
                className="flex h-12 w-full items-center justify-center rounded-lg font-bold text-white transition-colors hover:bg-primary"
                style={{ background: '#123f5c' }}
              >
                Request a Quote
              </Link>
              <Link
                to={`/catalogue/venue/${venue.id}`}
                className="flex h-12 w-full items-center justify-center rounded-lg border font-bold transition-colors hover:bg-surface-container"
                style={{ borderColor: '#123f5c', color: '#123f5c' }}
              >
                <FolderOpen className="mr-2 h-4 w-4" /> View Catalogue
              </Link>
              {venue.features?.instant_tour_bookings !== false && (
                <Link
                  to={`/book-tour?venue=${venue.id}`}
                  className="flex h-12 w-full items-center justify-center rounded-lg border font-bold transition-colors hover:bg-surface-container"
                  style={{ borderColor: '#123f5c', color: '#123f5c' }}
                >
                  <CalendarDays className="mr-2 h-4 w-4" /> Book a Tour
                </Link>
              )}
              {mapSrc && (
                <a
                  href={`https://www.google.com/maps?q=${venue.latitude != null && venue.longitude != null ? `${venue.latitude},${venue.longitude}` : encodeURIComponent(venue.location || fullAddress || venue.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-12 w-full items-center justify-center rounded-lg border font-bold transition-colors hover:bg-surface-container"
                  style={{ borderColor: '#123f5c', color: '#123f5c' }}
                >
                  <ExternalLink className="mr-2 h-4 w-4" /> Open in Google Maps
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
        alt={venue.name}
        open={zoomOpen}
        onClose={() => setZoomOpen(false)}
      />
    </div>
  );
}
