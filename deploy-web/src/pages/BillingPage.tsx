import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../auth/AuthContext';
import { ChevronLeft, CreditCard, FileText, Calendar, Crown } from 'lucide-react';

interface Invoice {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  description?: string;
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  method?: string;
}

export default function BillingPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [tier, setTier] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<string>('monthly');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/signin');
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (!user?.id) return;
    async function loadBilling() {
      setLoading(true);
      try {
        const [{ data: vendorRow }, { data: venueRow }] = await Promise.all([
          supabase.from('vendors').select('subscription_tier, billing_period').eq('user_id', user!.id).maybeSingle(),
          supabase.from('venue_listings').select('subscription_plan, billing_period').eq('user_id', user!.id).maybeSingle(),
        ]);
        setTier(vendorRow?.subscription_tier || venueRow?.subscription_plan || 'Free');
        setBillingPeriod(vendorRow?.billing_period || venueRow?.billing_period || 'monthly');

        // These tables may not exist; gracefully fall back to empty arrays.
        const [{ data: invoiceData }, { data: paymentData }] = await Promise.all([
          supabase.from('invoices').select('id, amount, status, created_at, description').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(20),
          supabase.from('payments').select('id, amount, status, created_at, method').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(20),
        ]);
        setInvoices((invoiceData || []) as Invoice[]);
        setPayments((paymentData || []) as Payment[]);
      } catch (err) {
        console.error('Error loading billing:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBilling();
  }, [user?.id]);

  if (isLoading || !user) {
    return (
      <div className="fx-container flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const formatCurrency = (n: number) => `R${(n || 0).toLocaleString()}`;
  const formatDate = (s?: string) => s ? new Date(s).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-3xl">
        <Link to="/account" className="mb-4 inline-flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary">
          <ChevronLeft className="h-4 w-4" /> Back to Account
        </Link>
        <h1 className="font-display text-2xl font-bold text-on-surface">Billing & Payments</h1>
        <p className="text-sm text-on-surface-variant">Manage your subscription and payment history.</p>

        {/* Subscription Card */}
        <div className="mt-6 rounded-xl bg-white p-6 shadow-sm border border-outline-variant">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-muted">
                <Crown className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-on-surface-variant">Current Plan</p>
                <p className="font-display text-xl font-bold text-on-surface">{tier || 'Free'}</p>
              </div>
            </div>
            <span className="rounded-full bg-surface-container px-3 py-1 text-sm font-medium capitalize text-on-surface">
              {billingPeriod}
            </span>
          </div>
          <div className="mt-4 flex gap-3">
            <Link to="/subscription-plans" className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-bold text-white">
              Upgrade Plan
            </Link>
            <Link to="/payment" className="inline-flex h-11 items-center justify-center rounded-lg border border-border-subtle px-5 text-sm font-bold text-on-surface hover:bg-surface-container">
              Make Payment
            </Link>
          </div>
        </div>

        {/* Invoices */}
        <div className="mt-6">
          <h2 className="mb-3 font-display text-lg font-semibold text-on-surface flex items-center gap-2">
            <FileText className="h-5 w-5" /> Invoices
          </h2>
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-container" />)}
            </div>
          ) : invoices.length === 0 ? (
            <div className="rounded-xl border border-outline-variant bg-white p-6 text-center">
              <p className="text-sm text-on-surface-variant">No invoices yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {invoices.map(inv => (
                <div key={inv.id} className="flex items-center justify-between rounded-xl border border-outline-variant bg-white p-4">
                  <div>
                    <p className="text-sm font-semibold text-on-surface">{inv.description || 'Invoice'}</p>
                    <p className="text-xs text-on-surface-variant">{formatDate(inv.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">{formatCurrency(inv.amount)}</p>
                    <span className="inline-block rounded-full bg-surface-container px-2 py-0.5 text-xs capitalize text-on-surface">{inv.status || 'pending'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment History */}
        <div className="mt-6">
          <h2 className="mb-3 font-display text-lg font-semibold text-on-surface flex items-center gap-2">
            <CreditCard className="h-5 w-5" /> Payment History
          </h2>
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-container" />)}
            </div>
          ) : payments.length === 0 ? (
            <div className="rounded-xl border border-outline-variant bg-white p-6 text-center">
              <p className="text-sm text-on-surface-variant">No payments recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {payments.map(p => (
                <div key={p.id} className="flex items-center justify-between rounded-xl border border-outline-variant bg-white p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container">
                      <Calendar className="h-5 w-5 text-on-surface-variant" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-on-surface">{p.method || 'Payment'}</p>
                      <p className="text-xs text-on-surface-variant">{formatDate(p.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">{formatCurrency(p.amount)}</p>
                    <span className="inline-block rounded-full bg-surface-container px-2 py-0.5 text-xs capitalize text-on-surface">{p.status || 'completed'}</span>
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
