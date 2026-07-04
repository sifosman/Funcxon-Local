import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { getMyVenueEntitlement, isVenueFeatureEnabled } from '../lib/venueSubscription';
import { AppAlert } from '../components/AppAlert';
import { quoteStatusLabel } from '../lib/quoting';
import { createQuoteQuotedNotification } from '../lib/notifications';

type VenueListingRow = { id: number; name: string; user_id?: string };

type QuoteLineItem = {
  id?: string | number;
  title: string;
  description?: string | null;
  price: number;
  quantity: number;
};

type QuoteRequestRow = {
  id: number;
  listing_id: number;
  requester_name: string | null;
  requester_email: string | null;
  requester_phone: string | null;
  contact_phone: string | null;
  event_date: string | null;
  end_date: string | null;
  selected_hall: string | null;
  message: string | null;
  requirements: string | null;
  status: string;
  quote_amount: number | null;
  response_message: string | null;
  amended_message: string | null;
  line_items: QuoteLineItem[] | null;
  created_at: string;
  requester_user_id?: string | null;
};

export default function VenueQuoteRequestsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [listing, setListing] = useState<VenueListingRow | null>(null);
  const [requests, setRequests] = useState<QuoteRequestRow[]>([]);
  const [canUseQuotes, setCanUseQuotes] = useState(false);
  const [alert, setAlert] = useState<{ title: string; message: string; type: 'error' } | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [responseAmount, setResponseAmount] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [respondingId, setRespondingId] = useState<number | null>(null);

  const loadEntitlement = async () => {
    if (!user?.id) return;
    const ent = await getMyVenueEntitlement(user.id);
    setCanUseQuotes(isVenueFeatureEnabled(ent, 'quote_requests'));
  };

  const loadListingAndRequests = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data: listingRow } = await supabase.from('venue_listings').select('id, name, user_id').eq('user_id', user.id).maybeSingle();
      if (!listingRow) { setListing(null); setRequests([]); return; }
      setListing({ id: listingRow.id, name: listingRow.name, user_id: listingRow.user_id });
      const { data: reqRows, error: reqErr } = await supabase
        .from('venue_quote_requests')
        .select('id, listing_id, requester_user_id, requester_name, requester_email, requester_phone, contact_phone, event_date, end_date, selected_hall, message, requirements, status, quote_amount, response_message, amended_message, line_items, created_at')
        .eq('listing_id', listingRow.id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (reqErr) { setRequests([]); return; }
      setRequests((reqRows || []).map((r) => ({ ...r, line_items: parseLineItems(r.line_items) })) as QuoteRequestRow[]);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadEntitlement(); loadListingAndRequests(); }, [user?.id]);

  const parseLineItems = (value: unknown): QuoteLineItem[] | null => {
    if (!value) return null;
    if (Array.isArray(value)) return value as QuoteLineItem[];
    try {
      const parsed = JSON.parse(String(value));
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'quoted': return '#2B9EB3';
      case 'amended': return '#D97706';
      case 'accepted': return '#16A34A';
      case 'rejected': return '#DC2626';
      case 'finalised': return '#7C3AED';
      case 'cancelled': return '#72787e';
      default: return '#72787e';
    }
  };

  const sendNotification = async (type: 'quote-created-client', req: QuoteRequestRow) => {
    try {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-quote-notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          type,
          quoteRequestId: req.id,
          clientEmail: req.requester_email || undefined,
          clientName: req.requester_name || undefined,
          isVenue: true,
        }),
      });
    } catch (err) {
      console.error('Failed to send quote notification:', err);
    }
  };

  const handleRespond = async (req: QuoteRequestRow) => {
    const amount = Number(responseAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      setAlert({ title: 'Invalid amount', message: 'Please enter a valid quote amount.', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('venue_quote_requests')
        .update({
          status: 'quoted',
          quote_amount: amount,
          response_message: responseMessage.trim() || null,
        })
        .eq('id', req.id);
      if (error) throw error;
      setRequests((prev) =>
        prev.map((r) =>
          r.id === req.id
            ? { ...r, status: 'quoted', quote_amount: amount, response_message: responseMessage.trim() || null }
            : r
        )
      );
      setRespondingId(null);
      setResponseAmount('');
      setResponseMessage('');
      if (req.requester_user_id) {
        await createQuoteQuotedNotification(req.requester_user_id, listing?.name || 'Venue', req.id, true);
      }
      await sendNotification('quote-created-client', req);
    } catch (err: any) {
      setAlert({ title: 'Error', message: err?.message || 'Failed to respond to quote request.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (req: QuoteRequestRow, newStatus: string) => {
    setSaving(true);
    try {
      const updateData: Record<string, unknown> = { status: newStatus };
      if (newStatus === 'finalised') updateData.finalised_at = new Date().toISOString();
      if (newStatus === 'cancelled') updateData.cancelled_at = new Date().toISOString();
      if (newStatus === 'rejected') updateData.rejected_at = new Date().toISOString();
      const { error } = await supabase.from('venue_quote_requests').update(updateData).eq('id', req.id);
      if (error) throw error;
      setRequests((prev) => prev.map((r) => (r.id === req.id ? { ...r, status: newStatus } : r)));
    } catch (err: any) {
      setAlert({ title: 'Error', message: err?.message || 'Failed to update status.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="fx-container py-20 text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  if (!canUseQuotes) {
    return (
      <div className="fx-container fx-section">
        <div className="mx-auto max-w-2xl">
          <Link to="/venue-dashboard" className="mb-4 inline-flex items-center text-sm font-medium hover:underline" style={{ color: '#123f5c' }}><ArrowLeft className="mr-1 h-4 w-4" /> Back to Venue Dashboard</Link>
          <h1 className="mb-2 text-3xl font-bold" style={{ color: '#123f5c' }}>Quote Requests</h1>
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
          <Link to="/venue-dashboard" className="mb-4 inline-flex items-center text-sm font-medium hover:underline" style={{ color: '#123f5c' }}><ArrowLeft className="mr-1 h-4 w-4" /> Back to Venue Dashboard</Link>
          <h1 className="mb-2 text-3xl font-bold" style={{ color: '#123f5c' }}>Quote Requests</h1>
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
        <Link to="/venue-dashboard" className="mb-4 inline-flex items-center text-sm font-medium hover:underline" style={{ color: '#123f5c' }}><ArrowLeft className="mr-1 h-4 w-4" /> Back to Venue Dashboard</Link>
        <h1 className="mb-2 text-3xl font-bold" style={{ color: '#123f5c' }}>Quote Requests</h1>
        <p className="mb-6 text-sm" style={{ color: '#72787e' }}>{listing.name}</p>

        {requests.length === 0 ? (
          <div className="rounded-xl border border-outline-variant bg-white p-10 text-center shadow-sm">
            <FileText className="mx-auto h-12 w-12 text-on-surface-variant" />
            <p className="mt-4 text-sm text-on-surface-variant">No quote requests yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => {
              const isExpanded = expandedId === req.id;
              const isResponding = respondingId === req.id;
              const canRespond = req.status === 'pending' || req.status === 'amended';
              const canFinalise = req.status === 'accepted' || req.status === 'quoted';
              const canCancel = req.status === 'pending' || req.status === 'quoted' || req.status === 'amended';
              const canReject = req.status === 'pending' || req.status === 'quoted' || req.status === 'amended';
              return (
                <div key={req.id} className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-on-surface">{req.requester_name || 'New Request'}</h3>
                      <p className="text-xs text-on-surface-variant">Requested: {formatDate(req.created_at)}</p>
                      {req.event_date && <p className="text-xs text-on-surface-variant">Event date: {formatDate(req.event_date)}</p>}
                      {req.end_date && <p className="text-xs text-on-surface-variant">End date: {formatDate(req.end_date)}</p>}
                      {req.selected_hall && <p className="text-xs text-on-surface-variant">Hall: {req.selected_hall}</p>}
                    </div>
                    <span className="rounded-full px-3 py-1 text-xs font-semibold uppercase" style={{ color: statusColor(req.status), backgroundColor: `${statusColor(req.status)}20` }}>{quoteStatusLabel(req.status)}</span>
                  </div>
                  {(req.requester_email || req.requester_phone || req.contact_phone) && (
                    <div className="mt-3 space-y-1 text-sm">
                      {req.requester_email && <p className="text-on-surface">Email: {req.requester_email}</p>}
                      {req.requester_phone && <p className="text-on-surface">Phone: {req.requester_phone}</p>}
                      {req.contact_phone && <p className="text-on-surface">Contact: {req.contact_phone}</p>}
                    </div>
                  )}
                  {(req.message || req.requirements) && (
                    <div className="mt-3">
                      {req.message && <p className="text-sm text-on-surface"><span className="text-xs text-on-surface-variant">Message:</span> {req.message}</p>}
                      {req.requirements && <p className="text-sm text-on-surface"><span className="text-xs text-on-surface-variant">Requirements:</span> {req.requirements}</p>}
                    </div>
                  )}
                  {req.amended_message && (
                    <div className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                      <span className="font-semibold">Amendment request:</span> {req.amended_message}
                    </div>
                  )}
                  {req.response_message && (
                    <div className="mt-3 rounded-lg bg-surface-container p-3 text-sm text-on-surface">
                      <span className="font-semibold">Your response:</span> {req.response_message}
                    </div>
                  )}
                  {req.quote_amount && (
                    <div className="mt-3 text-sm font-semibold text-on-surface">
                      Quote amount: R{Number(req.quote_amount).toLocaleString()}
                    </div>
                  )}
                  {req.line_items && req.line_items.length > 0 && (
                    <div className="mt-3">
                      <button onClick={() => setExpandedId(isExpanded ? null : req.id)} className="inline-flex items-center text-sm font-medium text-primary hover:underline">
                        {isExpanded ? 'Hide line items' : 'Show line items'} {isExpanded ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
                      </button>
                      {isExpanded && (
                        <div className="mt-2 space-y-2 rounded-lg bg-surface-container p-3">
                          {req.line_items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span className="text-on-surface">{item.title} x {item.quantity}</span>
                              <span className="text-on-surface-variant">R{Number(item.price * item.quantity).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {isResponding && (
                    <div className="mt-4 space-y-3 rounded-lg bg-surface-container p-3">
                      <div>
                        <label className="block text-sm font-medium text-on-surface">Quote Amount (ZAR)</label>
                        <input type="number" value={responseAmount} onChange={(e) => setResponseAmount(e.target.value)} className="mt-1 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface" placeholder="e.g. 15000" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-on-surface">Message</label>
                        <textarea value={responseMessage} onChange={(e) => setResponseMessage(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface" placeholder="Add details or notes..." />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleRespond(req)} disabled={saving} className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-white disabled:opacity-60">Send Quote</button>
                        <button onClick={() => { setRespondingId(null); setResponseAmount(''); setResponseMessage(''); }} disabled={saving} className="flex-1 rounded-lg border border-outline-variant py-2 text-sm font-semibold text-on-surface">Cancel</button>
                      </div>
                    </div>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {canRespond && !isResponding && (
                      <button onClick={() => setRespondingId(req.id)} disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">Respond</button>
                    )}
                    {canFinalise && (
                      <button onClick={() => updateStatus(req, 'finalised')} disabled={saving} className="rounded-lg bg-success px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">Finalise</button>
                    )}
                    {canReject && (
                      <button onClick={() => updateStatus(req, 'rejected')} disabled={saving} className="rounded-lg bg-error px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">Reject</button>
                    )}
                    {canCancel && (
                      <button onClick={() => updateStatus(req, 'cancelled')} disabled={saving} className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-semibold text-on-surface disabled:opacity-60">Cancel</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {alert && <AppAlert visible={true} title={alert.title} message={alert.message} type="error" onDismiss={() => setAlert(null)} />}
    </div>
  );
}
