import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, X, Loader2 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { uploadFileToStorage } from '../lib/applicationService';
import { AppAlert } from '../components/AppAlert';

type QuoteRequest = {
  id: number;
  vendor_id: number;
  user_id: number;
  name: string;
  email: string;
  phone?: string | null;
  contact_phone?: string | null;
  status: string;
  details: string | null;
  event_type: string | null;
  event_date: string | null;
  end_date: string | null;
  budget: string | null;
  quote_amount: number | null;
  amended_message: string | null;
  response_message: string | null;
  created_at: string;
};

type QuoteAttachment = { url: string; name: string; type: string };

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
  attachments: QuoteAttachment[] | null;
  created_at: string;
};

export default function VendorQuoteCreatePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const quoteRequestId = Number(searchParams.get('quoteRequestId'));
  const clientName = searchParams.get('clientName') || undefined;
  const clientEmail = searchParams.get('clientEmail') || undefined;
  const eventDetails = searchParams.get('eventDetails') || undefined;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quoteRequest, setQuoteRequest] = useState<QuoteRequest | null>(null);
  const [existingRevisions, setExistingRevisions] = useState<QuoteRevision[]>([]);
  const [alert, setAlert] = useState<{ title: string; message: string; type: 'error' | 'success' } | null>(null);

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [terms, setTerms] = useState('');
  const [validityDays, setValidityDays] = useState('7');
  const [internalNotes, setInternalNotes] = useState('');
  const [attachments, setAttachments] = useState<{ id: string; name: string; url?: string; uploading?: boolean }[]>([]);

  useEffect(() => {
    if (!quoteRequestId || Number.isNaN(quoteRequestId)) {
      setAlert({ title: 'Error', message: 'Quote request ID is required.', type: 'error' });
      setLoading(false);
      return;
    }
    const load = async () => {
      if (!user?.id) return;
      try {
        const { data: vendor } = await supabase.from('vendors').select('id, name, user_id').eq('user_id', user.id).maybeSingle();
        if (!vendor) { setAlert({ title: 'Error', message: 'Vendor profile not found.', type: 'error' }); setLoading(false); return; }
        const { data: qr } = await supabase.from('quote_requests').select('*').eq('id', quoteRequestId).eq('vendor_id', vendor.id).maybeSingle();
        if (!qr) { setAlert({ title: 'Error', message: 'Quote request not found or not assigned to you.', type: 'error' }); setLoading(false); return; }
        setQuoteRequest(qr as QuoteRequest);
        const { data: revisions } = await supabase.from('quote_revisions').select('*').eq('quote_request_id', quoteRequestId).order('revision_number', { ascending: false });
        setExistingRevisions((revisions || []) as QuoteRevision[]);
        const draft = revisions?.find((r) => r.status === 'draft');
        if (draft) {
          setAmount(draft.quote_amount?.toString() || '');
          setDescription(draft.description || '');
          setTerms(draft.terms || '');
          setValidityDays(draft.validity_days?.toString() || '7');
          setInternalNotes(draft.notes || '');
          if (draft.attachments) setAttachments(draft.attachments.map((a: QuoteAttachment, i: number) => ({ id: `draft-${i}`, name: a.name, url: a.url })));
        } else if (qr.status === 'amended' && qr.response_message) {
          setDescription(qr.response_message || '');
        }
      } catch (err: any) {
        setAlert({ title: 'Error', message: err?.message || 'Failed to load quote request.', type: 'error' });
      } finally { setLoading(false); }
    };
    load();
  }, [quoteRequestId, user?.id]);

  const handleAttachPdf = async (files: FileList | null) => {
    if (!files || files.length === 0 || !user?.id) return;
    const file = files[0];
    const id = `${Date.now()}-${file.name}`;
    setAttachments((prev) => [...prev, { id, name: file.name, uploading: true }]);
    const { url, error } = await uploadFileToStorage('quote-attachments', file, user.id);
    setAttachments((prev) => prev.map((a) => (a.id === id ? { ...a, url, uploading: false } : a)));
    if (error || !url) {
      setAttachments((prev) => prev.filter((a) => a.id !== id));
      setAlert({ title: 'Upload Failed', message: error || 'Could not upload attachment.', type: 'error' });
    }
  };

  const removeAttachment = (id: string) => setAttachments((prev) => prev.filter((a) => a.id !== id));

  const validateForm = (): boolean => {
    if (!amount.trim() || Number.isNaN(Number(amount)) || Number(amount) <= 0) { setAlert({ title: 'Invalid Amount', message: 'Please enter a valid quote amount.', type: 'error' }); return false; }
    if (!description.trim()) { setAlert({ title: 'Missing Description', message: 'Please provide a description of what the quote includes.', type: 'error' }); return false; }
    return true;
  };

  const buildRevisionPayload = (vendorId: number, status: 'draft' | 'sent') => ({
    quote_request_id: quoteRequestId,
    vendor_id: vendorId,
    quote_amount: Number(amount),
    description: description.trim(),
    terms: terms.trim() || null,
    validity_days: parseInt(validityDays) || 7,
    status,
    notes: internalNotes.trim() || null,
    attachments: attachments.filter((a) => a.url).map((a) => ({ url: a.url, name: a.name, type: 'application/pdf' })),
  });

  const saveDraft = async () => {
    if (!quoteRequest || !user?.id) return;
    setSaving(true);
    try {
      const { data: vendor } = await supabase.from('vendors').select('id, name').eq('user_id', user.id).maybeSingle();
      if (!vendor) { setAlert({ title: 'Error', message: 'Vendor not found.', type: 'error' }); return; }
      const existingDraft = existingRevisions.find((r) => r.status === 'draft');
      const payload = buildRevisionPayload(vendor.id, 'draft');
      if (existingDraft) {
        const { error } = await supabase.from('quote_revisions').update(payload).eq('id', existingDraft.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('quote_revisions').insert(payload);
        if (error) throw error;
      }
      setAlert({ title: 'Draft Saved', message: 'Your quote has been saved as a draft.', type: 'success' });
    } catch (err: any) { setAlert({ title: 'Error', message: err?.message || 'Failed to save draft.', type: 'error' }); } finally { setSaving(false); }
  };

  const sendQuote = async () => {
    if (!validateForm() || !quoteRequest || !user?.id) return;
    setSaving(true);
    try {
      const { data: vendor } = await supabase.from('vendors').select('id, name, user_id').eq('user_id', user.id).maybeSingle();
      if (!vendor) { setAlert({ title: 'Error', message: 'Vendor not found.', type: 'error' }); return; }
      const existingDraft = existingRevisions.find((r) => r.status === 'draft');
      const payload = buildRevisionPayload(vendor.id, 'sent');
      let revisionId: number;
      if (existingDraft) {
        const { error } = await supabase.from('quote_revisions').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', existingDraft.id);
        if (error) throw error;
        revisionId = existingDraft.id;
      } else {
        const { data, error } = await supabase.from('quote_revisions').insert(payload).select('id').single();
        if (error) throw error;
        revisionId = data?.id;
      }
      await supabase.from('quote_requests').update({ status: 'quoted', quote_amount: Number(amount) }).eq('id', quoteRequestId);
      await sendClientNotification(revisionId, vendor.name);
      setAlert({ title: 'Quote Sent', message: 'Your quote has been sent to the client.', type: 'success' });
      setTimeout(() => navigate('/quote-requests'), 1200);
    } catch (err: any) { setAlert({ title: 'Error', message: err?.message || 'Failed to send quote.', type: 'error' }); } finally { setSaving(false); }
  };

  const sendClientNotification = async (revisionId: number, vendorName: string) => {
    try {
      const revisionNumber = existingRevisions.filter((r) => r.status === 'sent').length + 1;
      const isRevision = revisionNumber > 1;
      const attachmentUrls = attachments.filter((a) => a.url).map((a) => ({ url: a.url, name: a.name }));
      await supabase.functions.invoke('send-quote-notifications', {
        body: {
          type: isRevision ? 'quote-revised-client' : 'quote-created-client',
          quoteRequestId,
          quoteRevisionId: revisionId,
          clientName: quoteRequest?.name || clientName,
          clientEmail: quoteRequest?.email || clientEmail,
          vendorBusinessName: vendorName,
          quoteAmount: Number(amount),
          quoteDescription: description.trim(),
          revisionNumber,
          attachments: attachmentUrls,
        },
      });
    } catch (err) { console.error('Failed to send client notification:', err); }
  };

  if (loading) return <div className="fx-container py-20 text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-3xl">
        <Link to="/quote-requests" className="mb-4 inline-flex items-center text-sm font-medium hover:underline" style={{ color: '#123f5c' }}><ArrowLeft className="mr-1 h-4 w-4" /> Back to Quote Requests</Link>
        <h1 className="mb-2 text-3xl font-bold" style={{ color: '#123f5c' }}>Create Quote</h1>
        <p className="mb-6 text-sm" style={{ color: '#72787e' }}>For: {clientName || quoteRequest?.name || 'Client'}</p>

        <div className="mb-6 rounded-xl border border-outline-variant bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-display text-lg font-semibold" style={{ color: '#123f5c' }}>Request Details</h2>
          {eventDetails || quoteRequest?.details ? <p className="text-sm text-on-surface">{eventDetails || quoteRequest?.details}</p> : null}
          {quoteRequest?.event_type && <p className="mt-1 text-xs text-on-surface-variant">Event Type: {quoteRequest.event_type}</p>}
          {quoteRequest?.event_date && <p className="mt-1 text-xs text-on-surface-variant">Event Date: {new Date(quoteRequest.event_date).toLocaleDateString()}</p>}
          {quoteRequest?.end_date && <p className="mt-1 text-xs text-on-surface-variant">End Date: {new Date(quoteRequest.end_date).toLocaleDateString()}</p>}
          {quoteRequest?.budget && <p className="mt-1 text-xs text-on-surface-variant">Client Budget: {quoteRequest.budget}</p>}
          {(quoteRequest?.phone || quoteRequest?.contact_phone) && <p className="mt-1 text-xs text-on-surface-variant">Contact: {quoteRequest?.phone || quoteRequest?.contact_phone}</p>}
          {quoteRequest?.amended_message && (
            <div className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              <span className="font-semibold">Amendment request:</span> {quoteRequest.amended_message}
            </div>
          )}
        </div>

        <div className="space-y-4 rounded-xl border border-outline-variant bg-white p-5 shadow-sm">
          <h2 className="mb-2 font-display text-lg font-semibold" style={{ color: '#123f5c' }}>Quote Details</h2>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Quote Amount (R)</label>
            <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 5000" className="w-full rounded-lg border border-outline-variant px-4 py-2 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Description of Services</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Describe what this quote includes..." className="w-full rounded-lg border border-outline-variant px-4 py-2 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Terms & Conditions</label>
            <textarea value={terms} onChange={(e) => setTerms(e.target.value)} rows={3} placeholder="Payment terms, delivery details, cancellation policy..." className="w-full rounded-lg border border-outline-variant px-4 py-2 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Quote Valid (Days)</label>
            <input type="text" value={validityDays} onChange={(e) => setValidityDays(e.target.value)} placeholder="7" className="w-full rounded-lg border border-outline-variant px-4 py-2 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Internal Notes (Not visible to client)</label>
            <textarea value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} rows={2} placeholder="Private notes about this quote..." className="w-full rounded-lg border border-outline-variant bg-surface-container px-4 py-2 text-sm outline-none focus:border-primary" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Attachments (PDF)</label>
            {attachments.map((a) => (
              <div key={a.id} className="mb-2 flex items-center justify-between rounded-lg border border-outline-variant bg-surface-container p-2">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-error" />
                  <span className={a.uploading ? 'text-on-surface-variant' : 'text-on-surface'}>{a.name} {a.uploading && '(uploading...)'}</span>
                </div>
                {!a.uploading && <button onClick={() => removeAttachment(a.id)} className="text-on-surface-variant hover:text-error"><X className="h-4 w-4" /></button>}
              </div>
            ))}
            <div className="rounded-lg border border-dashed border-outline-variant p-3 text-center">
              <input type="file" accept="application/pdf" onChange={(e) => handleAttachPdf(e.target.files)} className="hidden" id="quote-attachment" />
              <label htmlFor="quote-attachment" className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-primary">
                <Loader2 className={`h-4 w-4 ${attachments.some((a) => a.uploading) ? 'animate-spin' : 'hidden'}`} /> Add PDF Attachment
              </label>
            </div>
          </div>
        </div>

        {existingRevisions.length > 0 && (
          <Link to={`/vendor/quotes/history?quoteRequestId=${quoteRequestId}`} className="mt-6 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
            <span>View Quote History ({existingRevisions.length} revision{existingRevisions.length !== 1 ? 's' : ''})</span>
            <span className="material-symbols-outlined">chevron_right</span>
          </Link>
        )}

        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <button onClick={sendQuote} disabled={saving} className="flex-1 rounded-lg bg-primary py-3 text-sm font-semibold text-white disabled:opacity-60" style={{ background: '#123f5c' }}>{saving ? 'Sending...' : 'Send Quote to Client'}</button>
          <button onClick={saveDraft} disabled={saving} className="flex-1 rounded-lg border border-outline-variant bg-white py-3 text-sm font-semibold text-on-surface disabled:opacity-60">{saving ? 'Saving...' : 'Save as Draft'}</button>
        </div>
      </div>
      {alert && <AppAlert visible={true} title={alert.title} message={alert.message} type={alert.type} onDismiss={() => setAlert(null)} />}
    </div>
  );
}
