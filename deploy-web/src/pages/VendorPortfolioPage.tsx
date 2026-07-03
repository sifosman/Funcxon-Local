import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { ImageZoomModal } from '../components/ImageZoomModal';
import { ChevronLeft, FolderKanban, Loader2 } from 'lucide-react';

export default function VendorPortfolioPage() {
  const { id } = useParams<{ id: string }>();
  const [vendorName, setVendorName] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [zoomIndex, setZoomIndex] = useState(0);

  useEffect(() => {
    if (id) fetchPortfolio();
  }, [id]);

  async function fetchPortfolio() {
    setLoading(true);
    try {
      const { data: vendor, error } = await supabase
        .from('vendors')
        .select('name, image_url, additional_photos')
        .eq('id', id)
        .maybeSingle();
      if (error || !vendor) {
        setVendorName(null);
        setPhotos([]);
        setLoading(false);
        return;
      }
      setVendorName(vendor.name);
      const additional = Array.isArray(vendor.additional_photos) ? vendor.additional_photos : [];
      const all = [vendor.image_url, ...additional].filter(Boolean) as string[];
      setPhotos(all);

      const { data: portfolioItems } = await supabase.from('vendor_portfolio_items').select('image_url').eq('vendor_id', id).order('created_at', { ascending: false });
      const portfolioImages = (portfolioItems || []).map((i: any) => i.image_url).filter(Boolean);
      if (portfolioImages.length > 0) {
        setPhotos(prev => Array.from(new Set([...prev, ...portfolioImages])));
      }
    } catch (err) {
      console.error('Error fetching portfolio:', err);
    } finally {
      setLoading(false);
    }
  }

  const openZoom = (idx: number) => {
    setZoomIndex(idx);
    setZoomOpen(true);
  };

  if (loading) {
    return (
      <div className="fx-container flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!vendorName) {
    return (
      <div className="fx-container fx-section">
        <div className="mx-auto max-w-2xl text-center">
          <FolderKanban className="mx-auto h-12 w-12 text-on-surface-variant" />
          <h2 className="mt-4 font-display text-xl font-bold text-on-surface">Vendor not found</h2>
          <Link to="/discover" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">Browse Vendors</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-4xl">
        <Link to={`/vendor/${id}`} className="mb-4 inline-flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary">
          <ChevronLeft className="h-4 w-4" /> Back to {vendorName}
        </Link>
        <h1 className="font-display text-2xl font-bold text-on-surface md:text-3xl">{vendorName} — Portfolio</h1>

        {photos.length === 0 ? (
          <div className="mt-12 rounded-xl bg-white p-12 text-center shadow-sm border border-outline-variant">
            <FolderKanban className="mx-auto h-12 w-12 text-on-surface-variant" />
            <h3 className="mt-4 font-display text-lg font-semibold text-on-surface">No portfolio images yet</h3>
            <p className="mt-2 text-on-surface-variant">This vendor hasn't uploaded any portfolio photos.</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo, idx) => (
              <button
                key={idx}
                onClick={() => openZoom(idx)}
                className="aspect-square overflow-hidden rounded-xl bg-surface-container shadow-sm border border-outline-variant transition-transform hover:scale-[1.02]"
              >
                <img src={photo} alt={`Portfolio ${idx + 1}`} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <ImageZoomModal
        images={photos}
        startIndex={zoomIndex}
        alt={vendorName}
        open={zoomOpen}
        onClose={() => setZoomOpen(false)}
      />
    </div>
  );
}
