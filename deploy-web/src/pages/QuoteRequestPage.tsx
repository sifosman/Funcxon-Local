import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus, Minus } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';
import { AppAlert } from '../components/AppAlert';

interface LineItem {
  title: string;
  quantity: number;
  price: number;
}

export default function QuoteRequestPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const venueId = Number(searchParams.get('venueId')) || null;
  const venueName = searchParams.get('venueName') || 'Venue';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [message, setMessage] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [selectedHall, setSelectedHall] = useState('');
  const [halls, setHalls] = useState<string[]>([]);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ title: string; message: string; type: 'error' | 'success' } | null>(null);

  const prefillLineItems = useMemo(() => {
    const items: LineItem[] = [];
    for (let i = 0; i < 100; i++) {
      const title = searchParams.get(`item_${i}_title`);
      if (!title) break;
      const quantity = Number(searchParams.get(`item_${i}_quantity`)) || 1;
      const price = Number(searchParams.get(`item_${i}_price`)) || 0;
      items.push({ title, quantity, price });
    }
    return items;
  }, [searchParams]);

  useEffect(() => {
    const init = async () => {
      if (user?.id) {
        const { data } = await supabase.from('users').select('full_name, email, phone').eq('auth_user_id', user.id).maybeSingle();
        if (data) {
          setName(data.full_name ?? '');
          setEmail(data.email ?? user.email ?? '');
          setContactPhone(data.phone ?? '');
        } else {
          setEmail(user.email ?? '');
        }
      }
      if (venueId) {
        const { data } = await supabase.from('venue_listings').select('features').eq('id', venueId).maybeSingle();
        const features = (data as any)?.features ?? {};
        const hallList = ((features?.halls ?? []) as any[]).map((h) => h?.name).filter((n): n is string => !!n);
        setHalls(hallList);
      }
      setLineItems(prefillLineItems);
      setLoading(false);
    };
    init();
  }, [user?.id, user?.email, venueId, prefillLineItems]);

  const total = useMemo(() => {
    return lineItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [lineItems]);

  const updateQuantity = (index: number, delta: number) => {
    setLineItems((prev) => {
      const next = [...prev];
      const current = next[index];
      if (current) {
        current.quantity = Math.max(1, current.quantity + delta);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!venueId) {
      setAlert({ title: 'Error', message: 'Venue not found.', type: 'error' });
      return;
    }
    if (!name.trim() || !email.trim()) {
      setAlert({ title: 'Required', message: 'Name and email are required.', type: 'error' });
      return;
    }
    if (!eventDate) {
      setAlert({ title: 'Required', message: 'Event date is required.', type: 'error' });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('venue_quote_requests').insert({
        listing_id: venueId,
        requester_user_id: user?.id || null,
        requester_name: name.trim(),
        requester_email: email.trim(),
        requester_phone: contactPhone.trim() || null,
        contact_phone: contactPhone.trim() || null,
        event_date: eventDate,
        end_date: isMultiDay ? endDate || null : null,
        selected_hall: selectedHall || null,
        message: message.trim() || null,
        line_items: lineItems as any,
        status: 'pending',
      });
      if (error) throw error;
      try {
        await supabase.functions.invoke('send-quote-notifications', {
          body: {
            type: 'quote-requested-venue',
            venueQuoteRequestId: null,
            venueId,
            clientName: name.trim(),
            clientEmail: email.trim(),
          },
        });
      } catch (err) {
        console.error('Failed to send venue notification:', err);
      }
      setAlert({ title: 'Quote Requested', message: 'Your request has been sent to the venue.', type: 'success' });
      setTimeout(() => navigate('/quotes'), 1200);
    } catch (err: any) {
      setAlert({ title: 'Error', message: err?.message || 'Failed to submit quote request.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fx-container flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-3xl">
        <Link to={venueId ? `/catalogue/venue/${venueId}` : '/discover'} className="mb-4 inline-flex items-center text-sm font-medium hover:underline" style={{ color: '#123f5c' }}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Link>
        <h1 className="mb-2 text-3xl font-bold" style={{ color: '#123f5c' }}>Request a Quote</h1>
        <p className="mb-6 text-sm" style={{ color: '#72787e' }}>{venueName}</p>

        <div className="space-y-6 rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-on-surface">Your Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-outline-variant px-4 py-2 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-on-surface">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-outline-variant px-4 py-2 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-on-surface">Contact Phone</label>
              <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="w-full rounded-lg border border-outline-variant px-4 py-2 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-on-surface">Event Date</label>
              <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="w-full rounded-lg border border-outline-variant px-4 py-2 text-sm outline-none focus:border-primary" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="multiDay" checked={isMultiDay} onChange={(e) => setIsMultiDay(e.target.checked)} className="h-4 w-4 accent-primary" />
            <label htmlFor="multiDay" className="text-sm text-on-surface">Multi-day event</label>
          </div>

          {isMultiDay && (
            <div>
              <label className="mb-1 block text-sm font-medium text-on-surface">End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-lg border border-outline-variant px-4 py-2 text-sm outline-none focus:border-primary" />
            </div>
          )}

          {halls.length > 0 && (
            <div>
              <label className="mb-1 block text-sm font-medium text-on-surface">Preferred Hall</label>
              <select value={selectedHall} onChange={(e) => setSelectedHall(e.target.value)} className="w-full rounded-lg border border-outline-variant px-4 py-2 text-sm outline-none focus:border-primary">
                <option value="">No preference</option>
                {halls.map((hall) => (
                  <option key={hall} value={hall}>{hall}</option>
                ))}
              </select>
            </div>
          )}

          {lineItems.length > 0 && (
            <div>
              <h2 className="mb-3 font-display text-lg font-semibold" style={{ color: '#123f5c' }}>Selected Items</h2>
              <div className="space-y-3">
                {lineItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-lg bg-surface-container p-3">
                    <div className="flex-1">
                      <p className="font-medium text-on-surface">{item.title}</p>
                      <p className="text-sm text-on-surface-variant">R{item.price.toLocaleString()} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(idx, -1)} className="rounded-full bg-surface p-1 text-on-surface"><Minus className="h-4 w-4" /></button>
                      <span className="min-w-[1.5rem] text-center text-sm font-semibold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(idx, 1)} className="rounded-full bg-surface p-1 text-on-surface"><Plus className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-between text-lg font-bold text-on-surface">
                <span>Total</span>
                <span>R{total.toLocaleString()}</span>
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-on-surface">Additional Comments</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="w-full rounded-lg border border-outline-variant px-4 py-2 text-sm outline-none focus:border-primary" placeholder="Tell us more about your event..." />
          </div>

          <button onClick={handleSubmit} disabled={submitting} className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-white disabled:opacity-60" style={{ background: '#123f5c' }}>
            {submitting ? 'Submitting...' : 'Submit Quote Request'}
          </button>
        </div>
      </div>
      {alert && <AppAlert visible={true} title={alert.title} message={alert.message} type={alert.type} onDismiss={() => setAlert(null)} />}
    </div>
  );
}
