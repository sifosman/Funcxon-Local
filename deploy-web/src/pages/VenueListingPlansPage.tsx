import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { AppAlert } from '../components/AppAlert';

type PlanKey = 'get_started' | 'monthly' | '6_month' | '12_month';

type VenuePlan = {
  key: PlanKey;
  title: string;
  subtitle: string;
  badge?: string;
  priceNow: string;
  priceWas?: string;
  saveLabel?: string;
  outcomes: string;
  theme: {
    background: string;
    text: string;
    textMuted: string;
    accent: string;
    buttonBg: string;
    buttonText: string;
  };
};

type VenueFeature = { label: string } & Record<PlanKey, string | boolean>;

export default function VenueListingPlansPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(1);
  const [existingVenueId, setExistingVenueId] = useState<number | null>(null);
  const [alert, setAlert] = useState<{ title: string; message: string; type: 'error' } | null>(null);

  const plans: VenuePlan[] = useMemo(() => [
    { key: 'get_started', title: 'Get Started', subtitle: '2 months free', badge: 'Free', priceNow: 'R0', outcomes: 'Get Noticed', theme: { background: '#FFFFFF', text: '#1f2937', textMuted: '#72787e', accent: '#123f5c', buttonBg: '#123f5c', buttonText: '#FFFFFF' } },
    { key: 'monthly', title: 'Monthly', subtitle: 'Unlock Full Features', priceWas: 'R2,499', priceNow: 'R1,750', saveLabel: 'SAVE 30%', outcomes: 'Unlock Full Features', theme: { background: '#030255', text: '#FFFFFF', textMuted: 'rgba(255,255,255,0.75)', accent: '#b9c4eb', buttonBg: '#FFFFFF', buttonText: '#030255' } },
    { key: '6_month', title: '6-Month', subtitle: 'Most popular choice', badge: 'Most Popular', priceWas: 'R15,000', priceNow: 'R9,750', saveLabel: 'SAVE 35%', outcomes: 'Maximum Exposure', theme: { background: '#1e3a8a', text: '#FFFFFF', textMuted: 'rgba(255,255,255,0.75)', accent: '#FFD700', buttonBg: '#FFD700', buttonText: '#000000' } },
    { key: '12_month', title: '12-Month', subtitle: 'Maximum savings', badge: 'Maximum savings', priceWas: 'R30,000', priceNow: 'R18,000', saveLabel: 'SAVE 40%', outcomes: 'Maximum Exposure', theme: { background: '#000000', text: '#FFFFFF', textMuted: 'rgba(255,255,255,0.75)', accent: '#b9c4eb', buttonBg: '#b9c4eb', buttonText: '#000000' } },
  ], []);

  const features: VenueFeature[] = useMemo(() => [
    { label: 'Photo Uploads', get_started: '10', monthly: '40', '6_month': '40', '12_month': '40' },
    { label: 'Video uploads', get_started: '1', monthly: '4', '6_month': '4', '12_month': '4' },
    { label: 'Catalogue / Pricelist', get_started: 'Limited', monthly: 'Full', '6_month': 'Full', '12_month': 'Full' },
    { label: 'Portfolio Build & Manage assistance', get_started: true, monthly: true, '6_month': true, '12_month': true },
    { label: 'Full-time helpdesk support', get_started: true, monthly: true, '6_month': true, '12_month': true },
    { label: 'Dedicated Funxon Portfolio Manager', get_started: false, monthly: true, '6_month': true, '12_month': true },
    { label: 'Analytics & stats', get_started: 'Limited', monthly: 'Full', '6_month': 'Full', '12_month': 'Full' },
    { label: 'Online quote requests & updates', get_started: true, monthly: true, '6_month': true, '12_month': true },
    { label: 'Calendar availability & updates', get_started: true, monthly: true, '6_month': true, '12_month': true },
    { label: 'Map location display', get_started: true, monthly: true, '6_month': true, '12_month': true },
    { label: 'Website & social media links', get_started: false, monthly: false, '6_month': true, '12_month': true },
    { label: 'Live WhatsApp chat', get_started: true, monthly: true, '6_month': true, '12_month': true },
    { label: 'Ratings & reviews', get_started: true, monthly: true, '6_month': true, '12_month': true },
    { label: 'Instant venue tour bookings', get_started: false, monthly: true, '6_month': true, '12_month': true },
    { label: 'Featured Listings', get_started: false, monthly: true, '6_month': true, '12_month': true },
  ], []);

  const selectedPlan = plans[activeIndex];

  useEffect(() => {
    if (!user?.id) return;
    supabase.from('venue_listings').select('id').eq('user_id', user.id).maybeSingle().then(({ data }) => { if (data?.id) setExistingVenueId(data.id); });
  }, [user?.id]);

  const next = useCallback(() => setActiveIndex((i) => (i + 1) % plans.length), [plans.length]);
  const prev = useCallback(() => setActiveIndex((i) => (i - 1 + plans.length) % plans.length), [plans.length]);

  const selectPlan = (key: PlanKey) => setActiveIndex(plans.findIndex((p) => p.key === key));

  const handleSelectPlan = async () => {
    const isFree = selectedPlan.key === 'get_started';
    const priceLabel = isFree ? 'Free' : `R${Number((selectedPlan.priceNow || '0').replace(/[^0-9.]/g, '')).toLocaleString()}`;
    const billingPeriod = selectedPlan.key === 'get_started' ? 'monthly' : selectedPlan.key;
    const checkoutParams = { tierName: selectedPlan.title, billing: billingPeriod, priceLabel, isFree, productType: 'venue', planKey: selectedPlan.key };

    if (!user) {
      localStorage.setItem('pendingSubscriptionCheckout', JSON.stringify(checkoutParams));
      navigate('/signin');
      return;
    }
    if (existingVenueId) {
      navigate(`/subscription-checkout?${new URLSearchParams(checkoutParams as any).toString()}`);
      return;
    }
    navigate('/apply/step1');
  };

  const renderFeatureValue = (value: string | boolean) => {
    if (typeof value === 'boolean') return value ? <CheckCircle className="h-5 w-5 text-success" /> : <XCircle className="h-5 w-5 text-on-surface-variant" />;
    return <span className="text-sm font-semibold text-on-surface">{value}</span>;
  };

  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-4xl">
        <Link to="/subscriber-suite" className="mb-4 inline-flex items-center text-sm font-medium hover:underline" style={{ color: '#123f5c' }}><ArrowLeft className="mr-1 h-4 w-4" /> Back to Subscriber Suite</Link>
        <h1 className="mb-2 text-3xl font-bold" style={{ color: '#123f5c' }}>Venue Listing Plans</h1>
        <p className="mb-8 text-sm" style={{ color: '#72787e' }}>Limited-time launch offer — no hidden fees, zero commissions</p>

        <div className="relative mx-auto max-w-sm">
          <div className="overflow-hidden rounded-2xl p-6 shadow-lg transition-colors" style={{ background: selectedPlan.theme.background, color: selectedPlan.theme.text }}>
            {selectedPlan.badge && <span className="mb-3 inline-block rounded-full px-3 py-1 text-xs font-semibold" style={{ background: selectedPlan.theme.accent, color: selectedPlan.theme.buttonText }}>{selectedPlan.badge}</span>}
            <h2 className="font-display text-2xl font-bold">{selectedPlan.title}</h2>
            <p style={{ color: selectedPlan.theme.textMuted }}>{selectedPlan.subtitle}</p>
            {selectedPlan.priceWas && <p className="mt-2 text-sm line-through" style={{ color: selectedPlan.theme.textMuted }}>{selectedPlan.priceWas}</p>}
            <p className="font-display text-4xl font-bold">{selectedPlan.priceNow}</p>
            {selectedPlan.saveLabel && <p className="text-sm font-semibold" style={{ color: selectedPlan.theme.accent }}>{selectedPlan.saveLabel}</p>}
            <div className="mt-6">
              <p className="text-xs uppercase tracking-wider" style={{ color: selectedPlan.theme.textMuted }}>Top features</p>
              <div className="mt-2 space-y-1">
                {features.slice(0, 5).map((f) => {
                  const value = f[selectedPlan.key];
                  return (
                    <div key={f.label} className="flex items-center gap-2 text-xs" style={{ color: selectedPlan.theme.textMuted }}>
                      {typeof value === 'boolean' ? (value ? <CheckCircle className="h-3 w-3" style={{ color: selectedPlan.theme.accent }} /> : <XCircle className="h-3 w-3" />) : <span style={{ color: selectedPlan.theme.text }} className="font-semibold">{value}</span>}
                      <span>{f.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <button onClick={handleSelectPlan} className="mt-6 w-full rounded-lg py-3 text-sm font-semibold" style={{ background: selectedPlan.theme.buttonBg, color: selectedPlan.theme.buttonText }}>{selectedPlan.key === 'get_started' ? 'Choose Free' : 'Choose'}</button>
          </div>

          <button onClick={prev} className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-white p-2 shadow-lg"><ChevronLeft className="h-5 w-5 text-on-surface" /></button>
          <button onClick={next} className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-white p-2 shadow-lg"><ChevronRight className="h-5 w-5 text-on-surface" /></button>
        </div>

        <div className="mt-6 flex justify-center gap-2">
          {plans.map((p, i) => (
            <button key={p.key} onClick={() => selectPlan(p.key)} className="h-2 rounded-full transition-all" style={{ width: activeIndex === i ? 24 : 8, background: activeIndex === i ? '#123f5c' : '#d1d5db' }} aria-label={p.title} />
          ))}
        </div>

        <div className="mt-10">
          <h2 className="mb-4 font-display text-xl font-semibold" style={{ color: '#123f5c' }}>Full Feature Comparison</h2>
          <div className="overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-sm">
            {features.map((feature, idx) => {
              const value = feature[selectedPlan.key];
              return (
                <div key={feature.label} className="flex items-center justify-between px-5 py-3" style={{ borderBottom: idx < features.length - 1 ? '1px solid #f7f5f0' : 'none' }}>
                  <span className="text-sm text-on-surface">{feature.label}</span>
                  <div className="w-24 text-right">{renderFeatureValue(value)}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 text-center">
          <button onClick={handleSelectPlan} className="w-full rounded-xl bg-primary py-4 text-sm font-semibold text-white md:w-auto md:px-12" style={{ background: '#123f5c' }}>
            {selectedPlan.key === 'get_started' ? 'Confirm Free Plan' : `Continue with ${selectedPlan.title}`}
          </button>
          <p className="mt-4 text-xs text-on-surface-variant">Upgrade or cancel anytime. No hidden fees.</p>
        </div>
      </div>
      {alert && <AppAlert visible={true} title={alert.title} message={alert.message} type="error" onDismiss={() => setAlert(null)} />}
    </div>
  );
}
