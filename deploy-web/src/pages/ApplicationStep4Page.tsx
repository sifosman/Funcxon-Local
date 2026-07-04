import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Loader2, AlertCircle } from 'lucide-react';
import { useApplicationForm } from '../context/ApplicationFormContext';
import { validateStep4 } from '../utils/formValidation';
import { submitApplication } from '../lib/applicationService';
import { getSubscriptionTiers, type SubscriptionTier } from '../lib/subscription';
import { ApplicationProgress } from '../components/ApplicationProgress';

const BILLING_PERIODS: { value: 'monthly' | 'yearly' | '6_month' | '12_month'; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: '6_month', label: '6 Months' },
  { value: 'yearly', label: 'Yearly' },
  { value: '12_month', label: '12 Months' },
];

function formatPrice(tier: SubscriptionTier, period: 'monthly' | 'yearly' | '6_month' | '12_month') {
  if (period === 'yearly' || period === '12_month') return tier.price_yearly ?? 0;
  return tier.price_monthly ?? 0;
}

export default function ApplicationStep4Page() {
  const navigate = useNavigate();
  const { state, updateStep4 } = useApplicationForm();
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!state.portfolioType) {
      navigate('/portfolio-type');
      return;
    }
    getSubscriptionTiers()
      .then((data) => setTiers(data))
      .catch((err) => {
        console.error('Failed to load subscription tiers:', err);
        setError('Could not load subscription plans. Please try again.');
      })
      .finally(() => setLoading(false));
  }, [state.portfolioType, navigate]);

  const handlePlanSelect = (plan: string) => {
    updateStep4({ subscriptionPlan: plan });
    if (errors.subscriptionPlan) setErrors((prev) => ({ ...prev, subscriptionPlan: '' }));
  };

  const handleBillingChange = (period: 'monthly' | 'yearly' | '6_month' | '12_month') => {
    updateStep4({ billingPeriod: period });
  };

  const handleSubmit = async () => {
    const result = validateStep4(state.step4);
    setErrors(result.errors);
    if (!result.isValid) return;

    if (!state.portfolioType) return;
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        existing_application_id: state.editingApplicationId,
        portfolio_type: (state.portfolioType === 'venues' ? 'venue' : 'vendor') as 'venue' | 'vendor',
        company_details: state.step1,
        service_categories: state.step2,
        coverage_provinces: state.step2.provinces,
        coverage_cities: state.step2.cities,
        business_description: state.step2.description,
        portfolio_images: state.step3.images.map((i) => i.uri),
        portfolio_videos: state.step3.videos.map((v) => v.uri),
        subscription_tier: state.step4.subscriptionPlan,
        terms_accepted: state.step4.termsAccepted,
        privacy_accepted: state.step4.privacyAccepted,
        marketing_consent: state.step4.marketingConsent,
      };

      const submitResult = await submitApplication(payload);
      if (!submitResult.success || !submitResult.data) {
        throw new Error('error' in submitResult ? submitResult.error : 'Submission failed');
      }

      const selectedTier = tiers.find((t) => t.tier_name === state.step4.subscriptionPlan);
      if (!selectedTier) {
        throw new Error('Selected subscription plan not found');
      }
      const price = formatPrice(selectedTier, state.step4.billingPeriod || 'monthly');
      if (price > 0) {
        const productType = state.portfolioType === 'venues' ? 'venue' : 'vendor';
        const params = new URLSearchParams();
        params.set('tierId', String(selectedTier.id));
        params.set('billingPeriod', state.step4.billingPeriod || 'monthly');
        params.set('productType', productType);
        params.set('applicationId', submitResult.data.id);
        navigate(`/subscription-checkout?${params.toString()}`);
        return;
      }

      navigate('/apply/success');
    } catch (err) {
      console.error('Application submission error:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fx-container py-20 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-3xl">
        <Link
          to="/apply/step3"
          className="mb-4 inline-flex items-center text-sm font-medium hover:underline"
          style={{ color: '#123f5c' }}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Link>

        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold" style={{ color: '#123f5c' }}>
            Step 4: Subscription Plan
          </h1>
          <ApplicationProgress currentStep={4} />
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700" >
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-8">
          <div>
            <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant" >
              Select a Plan *
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              {tiers.map((tier) => {
                const selected = state.step4.subscriptionPlan === tier.tier_name;
                const price = formatPrice(tier, state.step4.billingPeriod || 'monthly');
                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => handlePlanSelect(tier.tier_name)}
                    className={`relative rounded-2xl border p-5 text-left transition-all ${selected ? 'border-primary' : 'border-outline-variant bg-white'}`}
                    style={selected ? { background: '#f2f7ff', borderColor: '#123f5c' } : { boxShadow: '0 4px 10px rgba(0,0,0,0.08)' }}
                  >
                    {selected && <Check className="absolute right-3 top-3 h-5 w-5 text-primary" />}
                    <h3 className="mb-1 font-bold" style={{ color: '#123f5c' }}>{tier.tier_name}</h3>
                    <p className="mb-2 text-2xl font-bold" style={{ color: '#123f5c' }}>
                      {price > 0 ? `R${price}` : 'Free'}
                    </p>
                    <p className="text-xs text-on-surface-variant" >
                      {tier.photo_limit} photos
                    </p>
                  </button>
                );
              })}
            </div>
            {errors.subscriptionPlan && <p className="mt-2 text-xs text-red-500">{errors.subscriptionPlan}</p>}
          </div>

          <div>
            <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant" >
              Billing Period
            </label>
            <div className="flex flex-wrap gap-2">
              {BILLING_PERIODS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => handleBillingChange(p.value)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    state.step4.billingPeriod === p.value ? 'border-primary text-white' : 'border-outline-variant bg-white text-on-surface'
                  }`}
                  style={state.step4.billingPeriod === p.value ? { background: '#123f5c' } : { fontFamily: "'Montserrat', sans-serif" }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-outline-variant bg-white p-5" style={{ boxShadow: '0 4px 10px rgba(0,0,0,0.08)' }}>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={state.step4.termsAccepted}
                onChange={(e) => updateStep4({ termsAccepted: e.target.checked })}
                className="mt-1 h-4 w-4 accent-primary"
              />
              <span className="text-sm" >
                I accept the <Link to="/terms" className="font-semibold underline" style={{ color: '#123f5c' }}>Terms and Conditions</Link> *
              </span>
            </label>
            {errors.termsAccepted && <p className="text-xs text-red-500">{errors.termsAccepted}</p>}

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={state.step4.privacyAccepted}
                onChange={(e) => updateStep4({ privacyAccepted: e.target.checked })}
                className="mt-1 h-4 w-4 accent-primary"
              />
              <span className="text-sm" >
                I accept the <Link to="/privacy" className="font-semibold underline" style={{ color: '#123f5c' }}>Privacy Policy</Link> *
              </span>
            </label>
            {errors.privacyAccepted && <p className="text-xs text-red-500">{errors.privacyAccepted}</p>}

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={state.step4.marketingConsent}
                onChange={(e) => updateStep4({ marketingConsent: e.target.checked })}
                className="mt-1 h-4 w-4 accent-primary"
              />
              <span className="text-sm" >
                I would like to receive marketing communications (optional)
              </span>
            </label>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between">
          <Link
            to="/apply/step3"
            className="rounded-lg border border-outline-variant px-6 py-3 text-sm font-semibold text-on-surface hover:bg-surface-container-low"
            
          >
            Previous
          </Link>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-lg bg-primary px-8 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            style={{ background: '#123f5c' }}
          >
            {submitting ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</span> : 'Submit Application'}
          </button>
        </div>
      </div>
    </div>
  );
}
