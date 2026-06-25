import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, FileText, ExternalLink } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { AppAlert } from '../components/AppAlert';

type QuoteAttachment = { url: string; name: string; type?: string };

type QuoteRevision = {
  id: number;
  quote_request_id: number;
  quote_amount: number | null;
  description: string | null;
  validity_days: number;
  terms: string | null;
  revision_number: number;
  status: string;
  notes: string | null;
  client_notes: string | null;
  responded_at: string | null;
  created_at: string;
  created_by: string;
  attachments: QuoteAttachment[] | null;
};

type QuoteComment = {
  id: number;
  quote_revision_id: number;
  author_type: string;
  message: string;
  is_internal: boolean;
  created_at: string;
};

export default function VendorQuoteHistoryPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const quoteRequestId = Number(searchParams.get('quoteRequestId'));

  const [loading, setLoading] = useState(true);
  const [revisions, setRevisions] = useState<QuoteRevision[]>([]);
  const [comments, setComments] = useState<Record<number, QuoteComment[]>>({});
  const [expandedRevision, setExpandedRevision] = useState<number | null>(null);
  const [alert, setAlert] = useState<{ title: string; message: string; type: 'error' } | null>(null);

  useEffect(() => {
    if (!quoteRequestId || Number.isNaN(quoteRequestId)) { setLoading(false); return; }
    const load = async () => {
      if (!user?.id) return;
      try {
        const { data: vendor } = await supabase.from('vendors').select('id').eq('user_id', user.id).maybeSingle();
        if (!vendor) { setAlert({ title: 'Error', message: 'Vendor profile not found.', type: 'error' }); setLoading(false); return; }
        const { data: revs, error: revError } = await supabase.from('quote_revisions').select('*').eq('quote_request_id', quoteRequestId).order('revision_number', { ascending: false });
        if (revError) throw revError;
        setRevisions((revs || []) as QuoteRevision[]);
        const revisionIds = (revs || []).map((r) => r.id);
        if (revisionIds.length > 0) {
          const { data: coms } = await supabase.from('quote_comments').select('*').in('quote_revision_id', revisionIds).order('created_at', { ascending: true });
          const byRevision: Record<number, QuoteComment[]> = {};
          (coms || []).forEach((c) => { if (!byRevision[c.quote_revision_id]) byRevision[c.quote_revision_id] = []; byRevision[c.quote_revision_id].push(c as QuoteComment); });
          setComments(byRevision);
        }
      } catch (err: any) { setAlert({ title: 'Error', message: err?.message || 'Failed to load quote history.', type: 'error' }); } finally { setLoading(false); }
    };
    load();
  }, [quoteRequestId, user?.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return '#16A34A';
      case 'rejected': return '#DC2626';
      case 'sent': return '#2B9EB3';
      case 'draft': return '#6B7280';
      case 'expired': return '#92400E';
      default: return '#72787e';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'accepted': return '#DCFCE7';
      case 'rejected': return '#FEE2E2';
      case 'sent': return '#E0F2FE';
      case 'draft': return '#F3F4F6';
      case 'expired': return '#FFEDD5';
      default: return '#f7f5f0';
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const isQuoteExpired = (rev: QuoteRevision) => {
    if (rev.status !== 'sent') return false;
    const created = new Date(rev.created_at);
    const validUntil = new Date(created);
    validUntil.setDate(validUntil.getDate() + (rev.validity_days || 7));
    return new Date() > validUntil;
  };

  if (loading) return <div className="fx-container py-20 text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-3xl">
        <Link to="/quote-requests" className="mb-4 inline-flex items-center text-sm font-medium hover:underline" style={{ fontFamily: "'Montserrat', sans-serif", color: '#123f5c' }}><ArrowLeft className="mr-1 h-4 w-4" /> Back to Quote Requests</Link>
        <h1 className="mb-2 text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: '#123f5c' }}>Quote History</h1>
        <p className="mb-6 text-sm" style={{ fontFamily: "'Montserrat', sans-serif", color: '#72787e' }}>{revisions.length} revision{revisions.length !== 1 ? 's' : ''}</p>

        {revisions.length === 0 ? (
          <div className="rounded-xl border border-outline-variant bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-on-surface-variant">No quote history yet. Create your first quote to see it here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {revisions.map((rev, index) => {
              const expired = isQuoteExpired(rev);
              const displayStatus = expired && rev.status === 'sent' ? 'expired' : rev.status;
              const isExpanded = expandedRevision === rev.id;
              const revisionComments = comments[rev.id] || [];
              return (
                <div key={rev.id} className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm" style={{ opacity: rev.status === 'draft' ? 0.7 : 1 }}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-on-surface">Revision #{rev.revision_number}</h3>
                      <p className="text-xs text-on-surface-variant">{formatDate(rev.created_at)}</p>
                    </div>
                    <span className="rounded-full px-3 py-1 text-xs font-semibold uppercase" style={{ color: getStatusColor(displayStatus), backgroundColor: getStatusBg(displayStatus) }}>{displayStatus}</span>
                  </div>
                  {rev.quote_amount && <p className="mt-3 text-2xl font-bold text-on-surface">R{rev.quote_amount.toLocaleString()}</p>}
                  {rev.description && <p className={`mt-2 text-sm text-on-surface-variant ${isExpanded ? '' : 'line-clamp-2'}`}>{rev.description}</p>}
                  {(rev.terms || rev.notes || rev.client_notes || revisionComments.length > 0) && (
                    <button onClick={() => setExpandedRevision(isExpanded ? null : rev.id)} className="mt-2 text-sm font-medium text-primary">{isExpanded ? 'Show Less' : 'Show More'}</button>
                  )}
                  {isExpanded && (
                    <div className="mt-4 space-y-3">
                      {rev.terms && <div><p className="text-xs text-on-surface-variant">Terms</p><p className="text-sm text-on-surface">{rev.terms}</p></div>}
                      {rev.validity_days && <div><p className="text-xs text-on-surface-variant">Validity</p><p className="text-sm text-on-surface">{rev.validity_days} days</p></div>}
                      {rev.notes && <div className="rounded-lg border-l-4 border-l-outline-variant bg-surface-container p-3"><p className="text-xs text-on-surface-variant">Internal Notes</p><p className="text-sm text-on-surface">{rev.notes}</p></div>}
                      {rev.client_notes && <div className="rounded-lg border-l-4 border-l-amber-500 bg-amber-50 p-3"><p className="text-xs font-semibold text-amber-800">Client Feedback</p><p className="text-sm text-on-surface">{rev.client_notes}</p>{rev.responded_at && <p className="text-xs text-on-surface-variant">{formatDate(rev.responded_at)}</p>}</div>}
                      {rev.attachments && rev.attachments.length > 0 && (
                        <div>
                          <p className="mb-2 text-xs text-on-surface-variant">Attachments ({rev.attachments.length})</p>
                          {rev.attachments.map((a, i) => (
                            <a key={i} href={a.url} target="_blank" rel="noreferrer" className="mb-2 flex items-center justify-between rounded-lg border-l-4 border-l-error bg-red-50 p-2 text-sm text-on-surface hover:underline">
                              <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-error" /> {a.name || 'Attachment'}</span>
                              <ExternalLink className="h-4 w-4 text-on-surface-variant" />
                            </a>
                          ))}
                        </div>
                      )}
                      {revisionComments.length > 0 && (
                        <div>
                          <p className="mb-2 text-xs text-on-surface-variant">Comments ({revisionComments.length})</p>
                          {revisionComments.map((c) => (
                            <div key={c.id} className={`mb-2 rounded-lg border-l-2 p-2 text-sm ${c.is_internal ? 'border-l-outline-variant bg-surface-container' : 'border-l-primary bg-blue-50'}`}>
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold">{c.author_type === 'vendor' ? 'You' : 'Client'}{c.is_internal && ' (Internal)'}</span>
                                <span className="text-on-surface-variant">{new Date(c.created_at).toLocaleDateString()}</span>
                              </div>
                              <p className="mt-1 text-on-surface">{c.message}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {rev.status === 'draft' && index === 0 && (
                    <Link to={`/vendor/quotes/create?quoteRequestId=${quoteRequestId}`} className="mt-4 block rounded-lg border border-primary py-2 text-center text-sm font-semibold text-primary">Continue Editing Draft</Link>
                  )}
                  {rev.status === 'rejected' && index === 0 && (
                    <Link to={`/vendor/quotes/create?quoteRequestId=${quoteRequestId}`} className="mt-4 block rounded-lg bg-primary py-2 text-center text-sm font-semibold text-white" style={{ background: '#123f5c' }}>Submit Revised Quote</Link>
                  )}
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
