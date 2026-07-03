import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';
import { LayoutDashboard, FolderKanban, FileText, BarChart3, Briefcase, Star, MessageSquare, Loader2, ArrowRight } from 'lucide-react';

interface Lead {
  id: number;
  name: string;
  event_type?: string | null;
  created_at?: string;
  status?: string;
}

export default function VendorDashboardPage() {
  const { user } = useAuth();
  const [vendorId, setVendorId] = useState<number | null>(null);
  const [vendorName, setVendorName] = useState<string | null>(null);
  const [stats, setStats] = useState({ profileViews: 0, quoteRequests: 0, leads: 0, reviews: 0 });
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    fetchDashboard();
  }, [user?.id]);

  async function fetchDashboard() {
    setLoading(true);
    try {
      const { data: vendor, error } = await supabase.from('vendors').select('id, name').eq('user_id', user!.id).maybeSingle();
      if (error || !vendor) {
        setVendorId(null);
        setLoading(false);
        return;
      }
      setVendorId(vendor.id);
      setVendorName(vendor.name);
      const [
        { data: reviews },
        { data: quoteRequests },
        { data: leads },
      ] = await Promise.all([
        supabase.from('reviews').select('id', { count: 'exact' }).eq('vendor_id', vendor.id),
        supabase.from('quote_requests').select('id', { count: 'exact' }).eq('vendor_id', vendor.id),
        supabase.from('quote_requests').select('id, name, event_type, created_at, status').eq('vendor_id', vendor.id).order('created_at', { ascending: false }).limit(5),
      ]);
      setStats({
        profileViews: 0,
        quoteRequests: quoteRequests?.length || 0,
        leads: leads?.length || 0,
        reviews: reviews?.length || 0,
      });
      setRecentLeads((leads || []) as Lead[]);
    } catch (err) {
      console.error('Error fetching vendor dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  const quickActions = [
    { label: 'Update Portfolio', href: '/portfolio/vendor', icon: FolderKanban, desc: 'Edit your profile, photos, and social links' },
    { label: 'Manage Catalogue', href: '/catalogue/vendor', icon: Briefcase, desc: 'Update services, pricing, and packages' },
    { label: 'Quote Requests', href: '/vendor/quotes/history', icon: FileText, desc: 'View and respond to enquiries' },
    { label: 'Analytics', href: '/vendor/analytics', icon: BarChart3, desc: 'See profile views and quote requests' },
  ];

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
          <LayoutDashboard className="mx-auto h-12 w-12 text-on-surface-variant" />
          <h2 className="mt-4 font-display text-xl font-bold text-on-surface">No vendor profile found</h2>
          <p className="mt-2 text-on-surface-variant">Create a vendor application to access your dashboard.</p>
          <Link to="/apply" className="mt-4 inline-block rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white">Apply Now</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-on-surface md:text-3xl">Vendor Dashboard</h1>
          {vendorName && <p className="text-sm text-on-surface-variant">{vendorName}</p>}
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Profile Views', value: stats.profileViews, icon: LayoutDashboard },
            { label: 'Quote Requests', value: stats.quoteRequests, icon: FileText },
            { label: 'Leads', value: stats.leads, icon: MessageSquare },
            { label: 'Reviews', value: stats.reviews, icon: Star },
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

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="mb-4 font-display text-lg font-semibold text-on-surface">Quick Actions</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map(action => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  to={action.href}
                  className="rounded-xl bg-white p-5 shadow-sm border border-outline-variant transition-all hover:border-primary hover:shadow-md"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-pink">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-medium text-on-surface">{action.label}</span>
                  </div>
                  <p className="mt-2 text-xs text-on-surface-variant">{action.desc}</p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Leads */}
        <div className="mt-8 rounded-xl bg-white p-6 shadow-sm border border-outline-variant">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-on-surface">Recent Leads</h2>
            <Link to="/vendor/quotes/history" className="text-sm font-medium text-primary hover:underline">View All</Link>
          </div>
          {recentLeads.length === 0 ? (
            <p className="text-sm text-on-surface-variant">No leads yet. Check back after your profile goes live.</p>
          ) : (
            <div className="space-y-3">
              {recentLeads.map(lead => (
                <div key={lead.id} className="flex items-center justify-between rounded-lg border border-outline-variant p-4">
                  <div>
                    <p className="font-medium text-on-surface">{lead.name}</p>
                    <p className="text-xs text-on-surface-variant">{lead.event_type || 'Event enquiry'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-surface-container px-2 py-0.5 text-xs capitalize text-on-surface">{lead.status || 'new'}</span>
                    <Link to={`/vendor/quotes/create?quoteRequestId=${lead.id}`} className="text-sm font-medium text-primary hover:underline">
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
