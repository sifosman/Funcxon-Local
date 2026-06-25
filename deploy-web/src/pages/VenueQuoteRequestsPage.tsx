import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { getMyVenueEntitlement, isVenueFeatureEnabled } from '../lib/venueSubscription';
import { AppAlert } from '../components/AppAlert';

type VenueListingRow = { id: number; name: string };

type QuoteRequestRow = {
  id: number;
  listing_id: number;
  requester_name: string | null;
  requester_email: string | null;
  requester_phone: string | null;
  event_date: string | null;
  message: string | null;
  status: string;
  created_at: string;
};

const STATUS_OPTIONS = ['new', 'in_progress', 'resolved', 'closed'] as const;

export default function VenueQuoteRequestsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [listing, setListing] = useState<VenueListingRow | null>(null);
  const [requests, setRequests] = useState<QuoteRequestRow[]>([]);
  const [canUseQuotes, setCanUseQuotes] = useState(false);
  const [alert, setAlert] = useState<{ title: string; message: string; type: 'error' } | null>(null);

  const loadEntitlement = async () => {
    if (!user?.id) return;
    const ent = await getMyVenueEntitlement(user.id);
    setCanUseQuotes(isVenueFeatureEnabled(ent, 'quote_requests'));
  };

  const loadListingAndRequests = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data: listingRow } = await supabase.from('venue_listings').select('id, name').eq('user_id', user.id).maybeSingle();
      if (!listingRow) { setListing(null); setRequests([]); return; }
      setListing({ id: listingRow.id, name: listingRow.name });
      const { data: reqRows, error: reqErr } = await supabase.from('venue_quote_requests').select('id, listing_id, requester_name, requester_email, requester_phone, event_date, message, status, created_at').eq('listing_id', listingRow.id).order('created_at', { ascending: false }).limit(100);
      if (reqErr) { setRequests([]); return; }
      setRequests((reqRows || []) as QuoteRequestRow[]);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadEntitlement(); loadListingAndRequests(); }, [user?.id]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const statusColor = useMemo(() => (status: string) => {
    switch (status) {
      case 'new': return '#3B82F6';
      case 'in_progress': return '#F59E0B';
      case 'resolved': return '#16A34A';
      case 'closed': return '#72787e';
      default: return '#72787e';
    }
  }, []);

  const updateStatus = async (req: QuoteRequestRow) => {
    const currentIndex = STATUS_OPTIONS.indexOf(req.status as typeof STATUS_OPTIONS[number]);
    const next = STATUS_OPTIONS[(currentIndex + 1) % STATUS_OPTIONS.length];
    setSaving(true);
    try {
      const { error } = await supabase.from('venue_quote_requests').update({ status: next }).eq('id', req.id);
      if (error) throw error;
      setRequests((prev) => prev.map((r) => (r.id === req.id ? { ...r, status: next } : r)));
    } catch (err: any) { setAlert({ title: 'Error', message: err?.message || 'Failed to update status.', type: 'error' }); } finally { setSaving(false); }
  };

  if (loading) return <div className="fx-container py-20 text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  if (!canUseQuotes) {
    return (
      <div className="fx-container fx-section">
        <div className="mx-auto max-w-2xl">
          <Link to="/venue-dashboard" className="mb-4 inline-flex items-center text-sm font-medium hover:underline" style={{ fontFamily: "'Montserrat', sans-serif", color: '#123f5c' }}><ArrowLeft className="mr-1 h-4 w-4" /> Back to Venue Dashboard</Link>
          <h1 className="mb-2 text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: '#123f5c' }}>Quote Requests</h1>
          <p className="mb-6 text-sm text-on-surface-variant">This feature is available on paid venue plans.</p>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
            <h2 className="mb-2 font-display text-lg font-semibold text-amber-800">Upgrade required</h2>
            <p className="mb-4 text-sm text-amber-800">Upgrade your venue plan to receive and manage online quote requests.</p>
            <Link to="/venue-listing-plans" className="inline-block rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white" style={{ background: '#123f5c' }}>View Venue Plans</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="fx-container fx-section">
        <div className="mx-auto max-w-2xl">
          <Link to="/venue-dashboard" className="mb-4 inline-flex items-center text-sm font-medium hover:underline" style={{ fontFamily: "'Montserrat', sans-serif", color: '#123f5c' }}><ArrowLeft className="mr-1 h-4 w-4" /> Back to Venue Dashboard</Link>
          <h1 className="mb-2 text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: '#123f5c' }}>Quote Requests</h1>
          <p className="mb-6 text-sm text-on-surface-variant">Create your venue listing first.</p>
          <div className="rounded-xl border border-outline-variant bg-surface-container p-6 text-center">
            <p className="text-sm">You don’t have a venue listing yet. Please create it in “Update Venue Portfolio” before managing quote requests.</p>
            <Link to="/portfolio/venue" className="mt-4 inline-block rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white" style={{ background: '#123f5c' }}>Update Venue Portfolio</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-3xl">
        <Link to="/venue-dashboard" className="mb-4 inline-flex items-center text-sm font-medium hover:underline" style={{ fontFamily: "'Montserrat', sans-serif", color: '#123f5c' }}><ArrowLeft className="mr-1 h-4 w-4" /> Back to Venue Dashboard</Link>
        <h1 className="mb-2 text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: '#123f5c' }}>Quote Requests</h1>
        <p className="mb-6 text-sm" style={{ fontFamily: "'Montserrat', sans-serif", color: '#72787e' }}>{listing.name}</p>

        {requests.length === 0 ? (
          <div className="rounded-xl border border-outline-variant bg-white p-10 text-center shadow-sm">
            <FileText className="mx-auto h-12 w-12 text-on-surface-variant" />
            <p className="mt-4 text-sm text-on-surface-variant">No quote requests yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div key={req.id} className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-on-surface">{req.requester_name || 'New Request'}</h3>
                    <p className="text-xs text-on-surface-variant">Requested: {formatDate(req.created_at)}</p>
                    {req.event_date && <p className="text-xs text-on-surface-variant">Event date: {formatDate(req.event_date)}</p>}
                  </div>
                  <span className="rounded-full px-3 py-1 text-xs font-semibold uppercase" style={{ color: statusColor(req.status), backgroundColor: `${statusColor(req.status)}20` }}>{req.status}</span>
                </div>
                {(req.requester_email || req.requester_phone) && (
                  <div className="mt-3 space-y-1 text-sm">
                    {req.requester_email && <p className="text-on-surface">Email: {req.requester_email}</p>}
                    {req.requester_phone && <p className="text-on-surface">Phone: {req.requester_phone}</p>}
                  </div>
                )}
                {req.message && (
                  <div className="mt-3">
                    <p className="text-xs text-on-surface-variant">Message</p>
                    <p className="text-sm text-on-surface">{req.message}</p>
                  </div>
                )}
                <button onClick={() => updateStatus(req)} disabled={saving} className="mt-4 w-full rounded-lg border border-primary py-2 text-sm font-semibold text-primary disabled:opacity-60">Change status</button>
              </div>
            ))}
          </div>
        )}
      </div>
      {alert && <AppAlert visible={true} title={alert.title} message={alert.message} type="error" onDismiss={() => setAlert(null)} />}
    </div>
  );
}
