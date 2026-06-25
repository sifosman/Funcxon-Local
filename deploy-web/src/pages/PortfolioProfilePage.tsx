import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Store, Wrench, MapPin, Mail, Phone, Globe, Instagram, Image, Calendar, Star } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../lib/supabaseClient';

export default function PortfolioProfilePage() {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState<Record<string, any> | null>(null);
  const [type, setType] = useState<'vendor' | 'venue' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      const { data: vendor } = await supabase.from('vendors').select('*').eq('user_id', user.id).maybeSingle();
      if (vendor) {
        setPortfolio(vendor);
        setType('vendor');
        setLoading(false);
        return;
      }
      const { data: venue } = await supabase.from('venue_listings').select('*').eq('user_id', user.id).maybeSingle();
      if (venue) {
        setPortfolio(venue);
        setType('venue');
      }
      setLoading(false);
    };
    load();
  }, [user?.id]);

  const title = portfolio?.name || 'Your Portfolio';
  const description = portfolio?.description || 'No description yet.';
  const image = portfolio?.image_url || portfolio?.additional_photos?.[0] || '';
  const photos = portfolio?.additional_photos || [];
  const rating = portfolio?.rating || 0;
  const reviewCount = portfolio?.review_count || 0;
  const updateRoute = type === 'vendor' ? '/portfolio/vendor' : type === 'venue' ? '/portfolio/venue' : '/portfolio/update';

  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/subscriber-suite"
          className="mb-4 inline-flex items-center text-sm font-medium hover:underline"
          style={{ fontFamily: "'Montserrat', sans-serif", color: '#123f5c' }}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Subscriber Suite
        </Link>

        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: '#123f5c' }}>
            Portfolio Profile
          </h1>
          <div className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: '#f2f7ff', color: '#123f5c' }}>
            {type === 'vendor' ? <span className="flex items-center gap-1"><Wrench className="h-3 w-3" /> Vendor</span> : type === 'venue' ? <span className="flex items-center gap-1"><Store className="h-3 w-3" /> Venue</span> : 'No portfolio'}
          </div>
        </div>

        {loading && <div className="py-12 text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}

        {!loading && !portfolio && (
          <div className="rounded-2xl border border-outline-variant bg-white p-8 text-center" style={{ boxShadow: '0 4px 10px rgba(0,0,0,0.08)' }}>
            <p className="mb-4 text-sm" style={{ fontFamily: "'Montserrat', sans-serif", color: '#72787e' }}>
              You do not have an approved portfolio yet. Complete your application to create one.
            </p>
            <Link
              to="/listers-portal"
              className="inline-flex rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
              style={{ fontFamily: "'Montserrat', sans-serif", background: '#123f5c' }}
            >
              Start Application
            </Link>
          </div>
        )}

        {!loading && portfolio && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-outline-variant bg-white p-6" style={{ boxShadow: '0 4px 10px rgba(0,0,0,0.08)' }}>
              <div className="flex flex-col gap-6 md:flex-row">
                {image && (
                  <img src={image} alt={title} className="h-40 w-full rounded-xl object-cover md:w-40" />
                )}
                <div className="flex-1">
                  <h2 className="mb-1 text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: '#123f5c' }}>{title}</h2>
                  <p className="mb-3 text-sm" style={{ fontFamily: "'Montserrat', sans-serif", color: '#72787e' }}>{description}</p>
                  <div className="flex items-center gap-4 text-sm" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                    <span className="flex items-center gap-1"><Star className="h-4 w-4 text-amber-500" /> {rating.toFixed(1)} ({reviewCount})</span>
                    {portfolio.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {portfolio.location}</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-outline-variant bg-white p-6" style={{ boxShadow: '0 4px 10px rgba(0,0,0,0.08)' }}>
                <h3 className="mb-4 font-bold" style={{ fontFamily: "'Playfair Display', serif", color: '#123f5c' }}>Contact</h3>
                <div className="space-y-3 text-sm" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  {portfolio.email && <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> {portfolio.email}</p>}
                  {portfolio.whatsapp_number && <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> {portfolio.whatsapp_number}</p>}
                  {portfolio.website_url && <p className="flex items-center gap-2"><Globe className="h-4 w-4" /> {portfolio.website_url}</p>}
                  {portfolio.instagram_url && <p className="flex items-center gap-2"><Instagram className="h-4 w-4" /> {portfolio.instagram_url}</p>}
                </div>
              </div>

              <div className="rounded-2xl border border-outline-variant bg-white p-6" style={{ boxShadow: '0 4px 10px rgba(0,0,0,0.08)' }}>
                <h3 className="mb-4 font-bold" style={{ fontFamily: "'Playfair Display', serif", color: '#123f5c' }}>Subscription</h3>
                <p className="text-sm" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  <span className="font-semibold">Tier:</span> {portfolio.subscription_tier || portfolio.subscription_plan || 'Free'}
                </p>
                <p className="text-sm" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  <span className="font-semibold">Status:</span> {portfolio.subscription_status || 'Active'}
                </p>
                {portfolio.subscription_expires_at && (
                  <p className="text-sm" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                    <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Expires {new Date(portfolio.subscription_expires_at).toLocaleDateString('en-ZA')}</span>
                  </p>
                )}
              </div>
            </div>

            {photos.length > 0 && (
              <div className="rounded-2xl border border-outline-variant bg-white p-6" style={{ boxShadow: '0 4px 10px rgba(0,0,0,0.08)' }}>
                <h3 className="mb-4 flex items-center gap-2 font-bold" style={{ fontFamily: "'Playfair Display', serif", color: '#123f5c' }}>
                  <Image className="h-5 w-5" /> Gallery
                </h3>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {photos.map((url: string, i: number) => (
                    <img key={i} src={url} alt="" className="aspect-square rounded-lg object-cover" />
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Link
                to={updateRoute}
                className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
                style={{ fontFamily: "'Montserrat', sans-serif", background: '#123f5c' }}
              >
                Update Portfolio
              </Link>
              <Link
                to={type === 'vendor' ? `/vendor/${portfolio.id}` : type === 'venue' ? `/venue/${portfolio.id}` : '#'}
                className="rounded-lg border border-outline-variant bg-white px-6 py-3 text-sm font-semibold text-on-surface hover:bg-surface-container-low"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                View Public Profile
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
