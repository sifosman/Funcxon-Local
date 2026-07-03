import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';
import { FileText, ChevronRight, Calendar, Clock, CheckCircle, XCircle, Clock3, Loader2 } from 'lucide-react';
import { quoteStatusLabel, getQuoteEffectiveStatus } from '../lib/quoting';

type QuoteSource = 'vendor' | 'venue';

interface Quote {
  id: number;
  source: QuoteSource;
  vendor_name?: string | null;
  venue_name?: string | null;
  event_type?: string | null;
  event_date?: string | null;
  end_date?: string | null;
  status: string;
  quote_amount?: number | null;
  created_at: string;
}

const STATUS_TABS = ['all', 'pending', 'quoted', 'amended', 'accepted', 'finalised', 'rejected', 'cancelled'] as const;
type StatusTab = typeof STATUS_TABS[number];

export default function QuotesPage() {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<StatusTab>('all');

  useEffect(() => {
    if (user) fetchQuotes();
    else setLoading(false);
  }, [user]);

  async function fetchQuotes() {
    setLoading(true);
    try {
      const userId = user?.id;
      const [{ data: vendorRows, error: vendorError }, { data: venueRows, error: venueError }] = await Promise.all([
        supabase.from('quote_requests').select('id, vendor:vendors(name), event_type, event_date, end_date, status, quote_amount, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('venue_quote_requests').select('id, venue:venue_listings(name), event_type, event_date, end_date, status, quote_amount, created_at').eq('requester_user_id', userId).order('created_at', { ascending: false }),
      ]);
      if (vendorError) throw vendorError;
      if (venueError) throw venueError;

      const mapped: Quote[] = [
        ...(vendorRows || []).map((q: any) => ({
          id: q.id,
          source: 'vendor' as QuoteSource,
          vendor_name: q.vendor?.name ?? null,
          event_type: q.event_type,
          event_date: q.event_date,
          end_date: q.end_date,
          status: getQuoteEffectiveStatus(q.status, q.quote_amount),
          quote_amount: q.quote_amount,
          created_at: q.created_at,
        })),
        ...(venueRows || []).map((q: any) => ({
          id: q.id,
          source: 'venue' as QuoteSource,
          venue_name: q.venue?.name ?? null,
          event_type: q.event_type,
          event_date: q.event_date,
          end_date: q.end_date,
          status: getQuoteEffectiveStatus(q.status, q.quote_amount),
          quote_amount: q.quote_amount,
          created_at: q.created_at,
        })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setQuotes(mapped);
    } catch (err) {
      console.error('Error fetching quotes:', err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    if (activeTab === 'all') return quotes;
    return quotes.filter((q) => q.status.toLowerCase() === activeTab);
  }, [quotes, activeTab]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: quotes.length };
    STATUS_TABS.slice(1).forEach((tab) => { counts[tab] = quotes.filter((q) => q.status.toLowerCase() === tab).length; });
    return counts;
  }, [quotes]);

  const getStatusIcon = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'accepted': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-error" />;
      case 'finalised': return <CheckCircle className="h-4 w-4 text-primary" />;
      case 'quoted': return <Clock3 className="h-4 w-4 text-info" />;
      case 'pending': return <Clock3 className="h-4 w-4 text-warning" />;
      case 'amended': return <Clock className="h-4 w-4 text-warning" />;
      default: return <Clock className="h-4 w-4 text-on-surface-variant" />;
    }
  };

  const getStatusClass = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'accepted': return 'bg-success-container text-success';
      case 'rejected': return 'bg-error-container text-error';
      case 'finalised': return 'bg-primary-container text-primary';
      case 'quoted': return 'bg-info-container text-info';
      case 'pending': return 'bg-warning-container text-warning';
      case 'amended': return 'bg-warning-container text-warning';
      case 'cancelled': return 'bg-surface-container text-on-surface-variant';
      default: return 'bg-surface-container text-on-surface-variant';
    }
  };

  const formatDate = (s?: string | null) => s ? new Date(s).toLocaleDateString('en-ZA') : null;

  if (!user) {
    return (
      <div className="fx-container flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-on-surface-variant" />
          <h2 className="mt-4 font-display text-xl font-bold text-on-surface">Sign in to view quotes</h2>
          <Link to="/signin" className="mt-4 inline-block rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-display text-2xl font-bold text-on-surface md:text-3xl">My Quotes</h1>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium capitalize ${activeTab === tab ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}`}
              style={activeTab === tab ? { background: '#123f5c' } : undefined}
            >
              {tab} ({statusCounts[tab] || 0})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mt-6 flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-12 rounded-xl bg-white p-12 text-center shadow-sm border border-outline-variant">
            <FileText className="mx-auto h-12 w-12 text-on-surface-variant" />
            <h3 className="mt-4 font-display text-lg font-semibold text-on-surface">No {activeTab === 'all' ? '' : activeTab} quotes</h3>
            <p className="mt-2 text-on-surface-variant">Request a quote from a venue or vendor to get started.</p>
            <Link to="/discover" className="mt-4 inline-block rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white">Browse Listings</Link>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {filtered.map((quote) => (
              <Link
                key={`${quote.source}-${quote.id}`}
                to={`/quotes/${quote.source}-${quote.id}`}
                className="flex items-center justify-between rounded-xl bg-white p-5 shadow-sm border border-outline-variant hover:border-primary transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display font-semibold text-on-surface">{quote.venue_name || quote.vendor_name || 'Quote'}</h3>
                    <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${getStatusClass(quote.status)}`}>
                      {getStatusIcon(quote.status)}
                      {quoteStatusLabel(quote.status)}
                    </span>
                    {(quote.status === 'quoted' || quote.status === 'amended') && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-white">Action required</span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-sm text-on-surface-variant">
                    {quote.event_type && <span>{quote.event_type}</span>}
                    {quote.event_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(quote.event_date)}
                        {quote.end_date && ` - ${formatDate(quote.end_date)}`}
                      </span>
                    )}
                  </div>
                  {quote.quote_amount != null && (
                    <p className="mt-2 text-sm font-semibold text-primary">R{quote.quote_amount.toLocaleString()}</p>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 text-on-surface-variant" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
