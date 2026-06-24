import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';
import { FileText, ChevronRight, Calendar, Clock, CheckCircle, XCircle, Clock3 } from 'lucide-react';

interface Quote {
  id: string;
  event_type?: string;
  event_date?: string;
  status?: string;
  created_at?: string;
  venue_name?: string;
  vendor_name?: string;
  total_amount?: number;
}

export default function QuotesPage() {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchQuotes();
    else setLoading(false);
  }, [user]);

  async function fetchQuotes() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('id, event_type, event_date, status, created_at, total_amount, venue:venue_id(name), vendor:vendor_id(name)')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped = (data || []).map((q: any) => ({
        id: q.id,
        event_type: q.event_type,
        event_date: q.event_date,
        status: q.status,
        created_at: q.created_at,
        venue_name: q.venue?.name,
        vendor_name: q.vendor?.name,
        total_amount: q.total_amount,
      }));
      setQuotes(mapped);
    } catch (err) {
      console.error('Error fetching quotes:', err);
    } finally {
      setLoading(false);
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'accepted': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-error" />;
      case 'pending': return <Clock3 className="h-4 w-4 text-warning" />;
      default: return <Clock className="h-4 w-4 text-on-surface-variant" />;
    }
  };

  const getStatusClass = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'accepted': return 'bg-success-container text-success';
      case 'rejected': return 'bg-error-container text-error';
      case 'pending': return 'bg-warning-container text-warning';
      default: return 'bg-surface-container text-on-surface-variant';
    }
  };

  if (!user) {
    return (
      <div className="fx-container flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-on-surface-variant" />
          <h2 className="mt-4 font-display text-xl font-bold text-on-surface">Sign in to view quotes</h2>
          <Link to="/signin" className="mt-4 inline-block rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-display text-2xl font-bold text-on-surface md:text-3xl">My Quotes</h1>

        {loading ? (
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-surface-container" />
            ))}
          </div>
        ) : quotes.length === 0 ? (
          <div className="mt-12 rounded-xl bg-white p-12 text-center shadow-sm border border-outline-variant">
            <FileText className="mx-auto h-12 w-12 text-on-surface-variant" />
            <h3 className="mt-4 font-display text-lg font-semibold text-on-surface">No quotes yet</h3>
            <p className="mt-2 text-on-surface-variant">Request a quote from a venue or vendor to get started.</p>
            <Link to="/discover" className="mt-4 inline-block rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white">
              Browse Listings
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {quotes.map(quote => (
              <Link
                key={quote.id}
                to={`/quotes/${quote.id}`}
                className="flex items-center justify-between rounded-xl bg-white p-5 shadow-sm border border-outline-variant hover:border-primary transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-semibold text-on-surface">
                      {quote.venue_name || quote.vendor_name || 'Quote'}
                    </h3>
                    <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${getStatusClass(quote.status)}`}>
                      {getStatusIcon(quote.status)}
                      {quote.status || 'Draft'}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-sm text-on-surface-variant">
                    {quote.event_type && <span>{quote.event_type}</span>}
                    {quote.event_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(quote.event_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {quote.total_amount && (
                    <p className="mt-2 text-sm font-semibold text-primary">R{quote.total_amount}</p>
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
