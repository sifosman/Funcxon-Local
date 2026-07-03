import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';
import { FileText, MessageSquare, Loader2, ArrowRight } from 'lucide-react';
import { quoteStatusLabel, isQuoteRespondable } from '../lib/quoting';

interface QuoteRequest {
  id: number;
  name: string;
  email?: string | null;
  event_type?: string | null;
  event_date?: string | null;
  budget?: string | null;
  status?: string;
  created_at?: string;
}

export default function QuoteRequestsPage() {
  const { user } = useAuth();
  const [vendorId, setVendorId] = useState<number | null>(null);
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    fetchRequests();
  }, [user?.id]);

  async function fetchRequests() {
    setLoading(true);
    try {
      const { data: vendor } = await supabase.from('vendors').select('id').eq('user_id', user!.id).maybeSingle();
      if (!vendor) {
        setVendorId(null);
        setLoading(false);
        return;
      }
      setVendorId(vendor.id);
      const { data, error } = await supabase
        .from('quote_requests')
        .select('id, name, email, event_type, event_date, budget, status, created_at')
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRequests((data || []) as QuoteRequest[]);
    } catch (err) {
      console.error('Error fetching quote requests:', err);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (s?: string | null) => s ? new Date(s).toLocaleDateString('en-ZA') : '—';

  const statusClass = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'quoted': return 'bg-info-container text-info';
      case 'accepted': return 'bg-success-container text-success';
      case 'rejected': return 'bg-error-container text-error';
      case 'finalised': return 'bg-primary-container text-primary';
      case 'cancelled': return 'bg-surface-container text-on-surface-variant';
      default: return 'bg-warning-container text-warning';
    }
  };

  if (!user) {
    return (
      <div className="fx-container flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-on-surface-variant" />
          <h2 className="mt-4 font-display text-xl font-bold text-on-surface">Sign in to view quote requests</h2>
          <Link to="/signin" className="mt-4 inline-block rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-2xl font-bold text-on-surface md:text-3xl">Quote Requests</h1>
        <p className="text-sm text-on-surface-variant">Enquiries from potential clients</p>

        {loading ? (
          <div className="mt-6 flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !vendorId ? (
          <div className="mt-12 rounded-xl bg-white p-12 text-center shadow-sm border border-outline-variant">
            <FileText className="mx-auto h-12 w-12 text-on-surface-variant" />
            <h3 className="mt-4 font-display text-lg font-semibold text-on-surface">Vendor profile required</h3>
            <p className="mt-2 text-on-surface-variant">Apply as a vendor to receive quote requests.</p>
            <Link to="/apply" className="mt-4 inline-block rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white">Apply Now</Link>
          </div>
        ) : requests.length === 0 ? (
          <div className="mt-12 rounded-xl bg-white p-12 text-center shadow-sm border border-outline-variant">
            <MessageSquare className="mx-auto h-12 w-12 text-on-surface-variant" />
            <h3 className="mt-4 font-display text-lg font-semibold text-on-surface">No quote requests yet</h3>
            <p className="mt-2 text-on-surface-variant">Promote your profile to get more enquiries.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {requests.map(req => (
              <div key={req.id} className="rounded-xl bg-white p-5 shadow-sm border border-outline-variant">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-semibold text-on-surface">{req.name}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${statusClass(req.status)}`}>
                        {quoteStatusLabel(req.status || 'pending')}
                      </span>
                    </div>
                    <p className="text-sm text-on-surface-variant">{req.email}</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-sm text-on-surface-variant">
                      {req.event_type && <span>{req.event_type}</span>}
                      {req.event_date && <span>{formatDate(req.event_date)}</span>}
                      {req.budget && <span className="font-medium text-primary">Budget: {req.budget}</span>}
                    </div>
                  </div>
                  {isQuoteRespondable(req.status || 'pending') && (
                    <Link
                      to={`/vendor/quotes/create?quoteRequestId=${req.id}`}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white"
                      title="Create quote"
                    >
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
