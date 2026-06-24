import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { MapPin, Phone, Mail, Globe, Star, ChevronLeft, ExternalLink } from 'lucide-react';

interface Lister {
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
  review_count?: number;
}

export default function ListerPortfolioPage() {
  const { id } = useParams<{ id: string }>();
  const [lister, setLister] = useState<Lister | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchLister();
  }, [id]);

  async function fetchLister() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      setLister(data);
    } catch (err) {
      console.error('Error fetching lister:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="fx-container py-12">
        <div className="mx-auto max-w-4xl">
          <div className="h-[300px] animate-pulse rounded-xl bg-surface-container" />
          <div className="mt-6 h-8 w-1/2 animate-pulse rounded bg-surface-container" />
        </div>
      </div>
    );
  }

  if (!lister) {
    return (
      <div className="fx-container py-20 text-center">
        <MapPin className="mx-auto h-12 w-12 text-on-surface-variant" />
        <h2 className="mt-4 font-display text-xl font-bold text-on-surface">Portfolio not found</h2>
        <Link to="/listers-portal" className="mt-4 inline-block text-primary hover:underline">Back to listers</Link>
      </div>
    );
  }

  return (
    <div className="fx-container py-6 md:py-10">
      <div className="mx-auto max-w-5xl">
        <Link to="/listers-portal" className="mb-4 inline-flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary">
          <ChevronLeft className="h-4 w-4" /> Back
        </Link>

        <div className="relative overflow-hidden rounded-xl bg-surface-container">
          {lister.featured_image_url ? (
            <img src={lister.featured_image_url} alt={lister.name} className="h-[250px] w-full object-cover md:h-[350px]" />
          ) : (
            <div className="flex h-[250px] w-full items-center justify-center bg-surface-container md:h-[350px]">
              <MapPin className="h-16 w-16 text-on-surface-variant" />
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="font-display text-2xl font-bold text-on-surface md:text-3xl">{lister.name}</h1>
                <div className="mt-2 flex items-center gap-1 text-sm text-on-surface-variant">
                  <MapPin className="h-4 w-4" />
                  <span>{lister.location || `${lister.city}, ${lister.province}` || 'South Africa'}</span>
                </div>
              </div>
              {lister.rating && (
                <div className="flex items-center gap-1 rounded-lg bg-secondary-fixed px-3 py-1.5">
                  <Star className="h-4 w-4 fill-current text-secondary" />
                  <span className="text-sm font-semibold text-secondary-container">{lister.rating}</span>
                  {lister.review_count && <span className="text-xs text-secondary-container">({lister.review_count})</span>}
                </div>
              )}
            </div>

            {lister.description && (
              <div className="mt-4 rounded-lg bg-surface-container p-4">
                <h2 className="font-display text-lg font-semibold text-on-surface">About</h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-on-surface-variant">{lister.description}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-xl bg-white p-5 shadow-sm border border-outline-variant">
              <h3 className="font-display font-semibold text-on-surface">Contact</h3>
              <div className="mt-3 space-y-2">
                {lister.phone && <a href={`tel:${lister.phone}`} className="fx-btn-secondary w-full"><Phone className="mr-2 h-4 w-4" /> Call</a>}
                {lister.email && <a href={`mailto:${lister.email}`} className="fx-btn-ghost w-full border border-outline-variant"><Mail className="mr-2 h-4 w-4" /> Email</a>}
                {lister.website && <a href={lister.website} target="_blank" rel="noopener noreferrer" className="fx-btn-ghost w-full border border-outline-variant"><Globe className="mr-2 h-4 w-4" /> Website</a>}
                <Link to={`/quotes?vendor=${lister.id}`} className="fx-btn-primary w-full"><ExternalLink className="mr-2 h-4 w-4" /> Request Quote</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
