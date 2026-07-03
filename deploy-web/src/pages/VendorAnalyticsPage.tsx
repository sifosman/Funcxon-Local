import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';
import { BarChart3, Eye, MessageSquare, Star, TrendingUp, Loader2 } from 'lucide-react';

export default function VendorAnalyticsPage() {
  const { user } = useAuth();
  const [vendorId, setVendorId] = useState<number | null>(null);
  const [stats, setStats] = useState({
    profileViews: 0,
    quoteRequests: 0,
    reviews: 0,
    avgRating: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    fetchAnalytics();
  }, [user?.id]);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      const { data: vendor, error } = await supabase.from('vendors').select('id').eq('user_id', user!.id).maybeSingle();
      if (error || !vendor) {
        setVendorId(null);
        setLoading(false);
        return;
      }
      setVendorId(vendor.id);
      const [
        { data: reviews },
        { data: quoteRequests },
      ] = await Promise.all([
        supabase.from('reviews').select('rating').eq('vendor_id', vendor.id),
        supabase.from('quote_requests').select('id', { count: 'exact' }).eq('vendor_id', vendor.id),
      ]);
      const ratings = (reviews || []).map((r: any) => r.rating).filter((r: any) => typeof r === 'number');
      const avgRating = ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0;
      setStats({
        profileViews: 0,
        quoteRequests: quoteRequests?.length || 0,
        reviews: reviews?.length || 0,
        avgRating: Math.round(avgRating * 10) / 10,
      });
    } catch (err) {
      console.error('Error fetching vendor analytics:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="fx-container flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!vendorId) {
    return (
      <div className="fx-container fx-section">
        <div className="mx-auto max-w-2xl text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-on-surface-variant" />
          <h2 className="mt-4 font-display text-xl font-bold text-on-surface">No vendor profile found</h2>
          <Link to="/apply" className="mt-4 inline-block rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white">Apply Now</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-display text-2xl font-bold text-on-surface md:text-3xl">Vendor Analytics</h1>
        <p className="text-sm text-on-surface-variant">Performance overview for your vendor profile.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Profile Views', value: stats.profileViews, icon: Eye },
            { label: 'Quote Requests', value: stats.quoteRequests, icon: MessageSquare },
            { label: 'Reviews', value: stats.reviews, icon: Star },
            { label: 'Avg Rating', value: stats.avgRating.toFixed(1), icon: TrendingUp },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-xl bg-white p-5 shadow-sm border border-outline-variant">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-muted">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant">{s.label}</p>
                    <p className="text-2xl font-bold text-on-surface">{s.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 rounded-xl bg-white p-6 shadow-sm border border-outline-variant">
          <h2 className="font-display text-lg font-semibold text-on-surface">About these metrics</h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            Profile views are tracked whenever someone visits your vendor page. Quote requests are enquiries submitted directly through your profile.
          </p>
        </div>
      </div>
    </div>
  );
}
