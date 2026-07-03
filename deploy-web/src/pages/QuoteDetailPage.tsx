import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';
import { AppAlert } from '../components/AppAlert';
import { ChevronLeft, FileText, Calendar, CheckCircle, XCircle, MessageSquare, Send, Clock, Loader2, Edit3 } from 'lucide-react';
import { quoteStatusLabel, getQuoteEffectiveStatus } from '../lib/quoting';

interface QuoteLineItem {
  name?: string;
  title?: string;
  quantity?: number;
  unit_price?: number;
  price?: number;
}

interface QuoteMessage {
  id: string;
  sender: string;
  message: string;
  created_at: string;
}

interface QuoteDetail {
  id: number;
  source: 'vendor' | 'venue';
  event_type?: string | null;
  event_date?: string | null;
  end_date?: string | null;
  status: string;
  created_at: string;
  quote_amount?: number | null;
  amended_message?: string | null;
  response_message?: string | null;
  message?: string | null;
  venue_name?: string | null;
  vendor_name?: string | null;
  vendor_id?: number | null;
  listing_id?: number | null;
  requester_name?: string | null;
  requester_email?: string | null;
  contact_phone?: string | null;
  selected_hall?: string | null;
  line_items?: QuoteLineItem[] | null;
  revision?: {
    id: number;
    quote_amount: number | null;
    description: string | null;
    terms: string | null;
    validity_days: number | null;
    notes: string | null;
    attachments: { url: string; name: string }[] | null;
  } | null;
}

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quote, setQuote] = useState<QuoteDetail | null>(null);
  const [messages] = useState<QuoteMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ title: string; message: string; type: 'error' | 'success' } | null>(null);
  const [amendMessage, setAmendMessage] = useState('');
  const [showAmend, setShowAmend] = useState(false);

  const { source, numericId } = useMemo(() => {
    const parts = id?.split('-') || [];
    const source = (parts[0] === 'venue' ? 'venue' : 'vendor') as 'vendor' | 'venue';
    const numericId = Number(parts.slice(1).join('-')) || 0;
    return { source, numericId };
  }, [id]);

  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }
    if (numericId) fetchQuote();
  }, [numericId, source, user]);

  async function fetchQuote() {
    setLoading(true);
    try {
      let q: any = null;
      let revision: QuoteDetail['revision'] = null;
      if (source === 'vendor') {
        const { data, error } = await supabase
          .from('quote_requests')
          .select('id, vendor_id, vendor:vendors(name), user_id, name, email, contact_phone, event_type, event_date, end_date, budget, status, quote_amount, amended_message, response_message, line_items, created_at')
          .eq('id', numericId)
          .eq('user_id', user?.id)
          .maybeSingle();
        if (error) throw error;
        q = data;
        if (q) {
          const { data: rev } = await supabase.from('quote_revisions').select('id, quote_amount, description, terms, validity_days, notes, attachments').eq('quote_request_id', q.id).eq('status', 'sent').order('revision_number', { ascending: false }).limit(1).maybeSingle();
          revision = rev as any;
        }
      } else {
        const { data, error } = await supabase
          .from('venue_quote_requests')
          .select('id, listing_id, venue:venue_listings(name), requester_user_id, requester_name, requester_email, contact_phone, event_type, event_date, end_date, selected_hall, status, quote_amount, response_message, message, line_items, created_at')
          .eq('id', numericId)
          .eq('requester_user_id', user?.id)
          .maybeSingle();
        if (error) throw error;
        q = data;
      }

      if (!q) {
        setQuote(null);
        setLoading(false);
        return;
      }

      const lineItems = (q.line_items ?? []) as QuoteLineItem[];
      const quoteAmount = q.quote_amount ?? revision?.quote_amount ?? null;

      setQuote({
        id: q.id,
        source,
        event_type: q.event_type,
        event_date: q.event_date,
        end_date: q.end_date,
        status: getQuoteEffectiveStatus(q.status, quoteAmount),
        created_at: q.created_at,
        quote_amount: quoteAmount,
        amended_message: q.amended_message ?? null,
        response_message: q.response_message ?? null,
        message: q.message ?? null,
        venue_name: q.venue?.name ?? null,
        vendor_name: q.vendor?.name ?? null,
        vendor_id: q.vendor_id ?? null,
        listing_id: q.listing_id ?? null,
        requester_name: q.name || q.requester_name || null,
        requester_email: q.email || q.requester_email || null,
        contact_phone: q.contact_phone || null,
        selected_hall: q.selected_hall ?? null,
        line_items: lineItems,
        revision,
      });
      setAmendMessage(q.response_message || '');
    } catch (err: any) {
      console.error('Error fetching quote:', err);
      setAlert({ title: 'Error', message: err?.message || 'Could not load quote details.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(newStatus: string) {
    setSaving(true);
    try {
      const table = source === 'venue' ? 'venue_quote_requests' : 'quote_requests';
      const { error } = await supabase.from(table).update({ status: newStatus }).eq('id', numericId);
      if (error) throw error;
      setQuote(prev => prev ? { ...prev, status: newStatus } : prev);
      setAlert({ title: 'Status updated', message: `Quote marked as ${quoteStatusLabel(newStatus)}.`, type: 'success' });
      try {
        await supabase.functions.invoke('send-quote-notifications', {
          body: {
            type: newStatus === 'accepted' ? 'quote-accepted' : newStatus === 'rejected' ? 'quote-rejected' : 'quote-status-updated',
            quoteRequestId: source === 'vendor' ? numericId : undefined,
            venueQuoteRequestId: source === 'venue' ? numericId : undefined,
            clientName: quote?.requester_name || undefined,
            clientEmail: quote?.requester_email || undefined,
          },
        });
      } catch (err) { console.error('Notification failed:', err); }
    } catch (err: any) {
      setAlert({ title: 'Error', message: err?.message || 'Could not update status.', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function submitAmend() {
    if (!amendMessage.trim()) {
      setAlert({ title: 'Required', message: 'Please provide amendment details.', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const table = source === 'venue' ? 'venue_quote_requests' : 'quote_requests';
      const { error } = await supabase.from(table).update({ status: 'amended', response_message: amendMessage.trim(), amended_message: amendMessage.trim() }).eq('id', numericId);
      if (error) throw error;
      setQuote(prev => prev ? { ...prev, status: 'amended', response_message: amendMessage.trim() } : prev);
      setShowAmend(false);
      setAlert({ title: 'Amendment Sent', message: 'Your amendment request has been sent.', type: 'success' });
      try {
        await supabase.functions.invoke('send-quote-notifications', {
          body: {
            type: 'quote-amended',
            quoteRequestId: source === 'vendor' ? numericId : undefined,
            venueQuoteRequestId: source === 'venue' ? numericId : undefined,
            clientName: quote?.requester_name || undefined,
            clientEmail: quote?.requester_email || undefined,
          },
        });
      } catch (err) { console.error('Notification failed:', err); }
    } catch (err: any) {
      setAlert({ title: 'Error', message: err?.message || 'Could not submit amendment.', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !newMessage.trim()) return;
    setSaving(true);
    try {
      const table = source === 'venue' ? 'venue_quote_messages' : 'quote_messages';
      const column = source === 'venue' ? 'venue_quote_request_id' : 'quote_request_id';
      const { error } = await supabase.from(table).insert({
        [column]: numericId,
        sender: user?.email || 'You',
        message: newMessage.trim(),
      } as any);
      if (error) throw error;
      setNewMessage('');
      fetchQuote();
    } catch (err: any) {
      setAlert({ title: 'Error', message: err?.message || 'Could not send message.', type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  const formatCurrency = (n?: number | null) => n != null ? `R${Number(n).toLocaleString()}` : '—';
  const formatDate = (s?: string | null) => s ? new Date(s).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
  const lineItemName = (item: QuoteLineItem) => item.name || item.title || 'Item';
  const lineItemQty = (item: QuoteLineItem) => item.quantity ?? 1;
  const lineItemPrice = (item: QuoteLineItem) => item.unit_price ?? item.price ?? 0;
  const total = useMemo(() => {
    if (quote?.quote_amount != null) return quote.quote_amount;
    return (quote?.line_items || []).reduce((sum, item) => sum + lineItemPrice(item) * lineItemQty(item), 0);
  }, [quote]);

  const getStatusBadge = (status?: string) => {
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

  if (loading) {
    return (
      <div className="fx-container flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="fx-container fx-section">
        <div className="mx-auto max-w-2xl text-center">
          <FileText className="mx-auto h-12 w-12 text-on-surface-variant" />
          <h2 className="mt-4 font-display text-xl font-bold text-on-surface">Quote not found</h2>
          <Link to="/quotes" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">Back to Quotes</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-3xl">
        <Link to="/quotes" className="mb-4 inline-flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary">
          <ChevronLeft className="h-4 w-4" /> Back to Quotes
        </Link>

        {/* Header */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-outline-variant">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-on-surface">Quote Details</h1>
              <p className="mt-1 text-sm text-on-surface-variant">
                {quote.venue_name || quote.vendor_name || 'Quote'} • {quote.event_type || 'Event'}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-on-surface-variant">
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {formatDate(quote.event_date)}</span>
                {quote.end_date && <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Ends {formatDate(quote.end_date)}</span>}
                <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> Created {formatDate(quote.created_at)}</span>
              </div>
              {quote.selected_hall && <p className="mt-1 text-sm text-on-surface-variant">Hall: {quote.selected_hall}</p>}
              {quote.contact_phone && <p className="mt-1 text-sm text-on-surface-variant">Contact: {quote.contact_phone}</p>}
            </div>
            <span className={`rounded-full px-3 py-1 text-sm font-semibold capitalize ${getStatusBadge(quote.status)}`}>
              {quoteStatusLabel(quote.status)}
            </span>
          </div>

          {(quote.status === 'quoted' || quote.status === 'amended') && (
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={() => updateStatus('accepted')} disabled={saving} className="inline-flex h-11 items-center gap-2 rounded-lg bg-success px-5 text-sm font-bold text-white transition-colors disabled:opacity-60">
                <CheckCircle className="h-4 w-4" /> Accept
              </button>
              <button onClick={() => setShowAmend(true)} disabled={saving} className="inline-flex h-11 items-center gap-2 rounded-lg bg-warning px-5 text-sm font-bold text-white transition-colors disabled:opacity-60">
                <Edit3 className="h-4 w-4" /> Amend
              </button>
              <button onClick={() => updateStatus('rejected')} disabled={saving} className="inline-flex h-11 items-center gap-2 rounded-lg bg-error px-5 text-sm font-bold text-white transition-colors disabled:opacity-60">
                <XCircle className="h-4 w-4" /> Decline
              </button>
            </div>
          )}

          {quote.status === 'accepted' && (
            <div className="mt-6 rounded-lg bg-success-container p-4 text-success">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">Quote accepted! Awaiting final confirmation.</span>
              </div>
            </div>
          )}
        </div>

        {/* Amendment form */}
        {showAmend && (
          <div className="mt-6 rounded-xl bg-white p-6 shadow-sm border border-outline-variant">
            <h2 className="mb-3 font-display text-lg font-semibold text-on-surface">Request Amendment</h2>
            <textarea value={amendMessage} onChange={(e) => setAmendMessage(e.target.value)} rows={4} placeholder="Describe what needs to change..." className="w-full rounded-lg border border-outline-variant px-4 py-2 text-sm outline-none focus:border-primary" />
            <div className="mt-3 flex gap-3">
              <button onClick={submitAmend} disabled={saving} className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white disabled:opacity-60" style={{ background: '#123f5c' }}>{saving ? 'Submitting...' : 'Submit Amendment'}</button>
              <button onClick={() => setShowAmend(false)} className="rounded-lg border border-outline-variant px-5 py-2 text-sm font-semibold text-on-surface">Cancel</button>
            </div>
          </div>
        )}

        {quote.amended_message && !showAmend && (
          <div className="mt-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
            <span className="font-semibold">Amendment request:</span> {quote.amended_message}
          </div>
        )}

        {/* Items */}
        <div className="mt-6 rounded-xl bg-white p-6 shadow-sm border border-outline-variant">
          <h2 className="mb-4 font-display text-lg font-semibold text-on-surface">Quote Items</h2>
          {(quote.line_items || []).length === 0 ? (
            <p className="text-sm text-on-surface-variant">No line items recorded.</p>
          ) : (
            <div className="space-y-3">
              {(quote.line_items || []).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg border border-outline-variant p-3">
                  <div>
                    <p className="text-sm font-medium text-on-surface">{lineItemName(item)}</p>
                    <p className="text-xs text-on-surface-variant">Qty: {lineItemQty(item)}</p>
                  </div>
                  <p className="text-sm font-bold text-primary">{formatCurrency(lineItemPrice(item) * lineItemQty(item))}</p>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 flex items-center justify-between border-t border-outline-variant pt-4">
            <span className="text-sm font-semibold text-on-surface">Total</span>
            <span className="text-xl font-bold text-primary">{formatCurrency(total)}</span>
          </div>
          {quote.revision?.description && (
            <div className="mt-4 rounded-lg bg-surface-container p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Description</p>
              <p className="mt-1 text-sm text-on-surface">{quote.revision.description}</p>
            </div>
          )}
          {quote.revision?.terms && (
            <div className="mt-4 rounded-lg bg-surface-container p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Terms</p>
              <p className="mt-1 text-sm text-on-surface">{quote.revision.terms}</p>
            </div>
          )}
          {quote.revision?.attachments && quote.revision.attachments.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Attachments</p>
              <div className="mt-2 space-y-2">
                {quote.revision.attachments.map((a, i) => (
                  <a key={i} href={a.url} target="_blank" rel="noreferrer" className="block text-sm text-primary hover:underline">{a.name || 'Attachment'}</a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="mt-6 rounded-xl bg-white p-6 shadow-sm border border-outline-variant">
          <h2 className="mb-4 font-display text-lg font-semibold text-on-surface flex items-center gap-2">
            <MessageSquare className="h-5 w-5" /> Messages
          </h2>
          {messages.length === 0 ? (
            <p className="text-sm text-on-surface-variant">No messages yet.</p>
          ) : (
            <div className="mb-4 max-h-[400px] space-y-3 overflow-y-auto">
              {messages.map(msg => (
                <div key={msg.id} className="rounded-lg border border-outline-variant p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-on-surface">{msg.sender}</span>
                    <span className="text-xs text-on-surface-variant">{formatDate(msg.created_at)}</span>
                  </div>
                  <p className="mt-1 text-sm text-on-surface-variant">{msg.message}</p>
                </div>
              ))}
            </div>
          )}
          <form onSubmit={sendMessage} className="flex items-start gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="fx-input flex-1 rounded-lg border border-border-subtle px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={saving || !newMessage.trim()}
              className="inline-flex h-11 items-center gap-1 rounded-lg bg-primary px-4 text-sm font-bold text-white transition-colors disabled:opacity-60"
            >
              <Send className="h-4 w-4" /> Send
            </button>
          </form>
        </div>
      </div>
      {alert && <AppAlert visible={true} title={alert.title} message={alert.message} type={alert.type} onDismiss={() => setAlert(null)} />}
    </div>
  );
}
