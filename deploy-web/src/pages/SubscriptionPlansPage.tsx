// WEB ONLY — deploy-web/src/pages/SubscriptionPlansPage.tsx
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';
import { getSubscriptionTiers, type SubscriptionTier } from '../lib/subscription';

function getPlanFeatures(tier: SubscriptionTier): string[] {
  const features = tier.features;
  if (features && typeof features === 'object' && !Array.isArray(features)) {
    const list = features.features;
    if (Array.isArray(list)) return list.filter((f): f is string => typeof f === 'string');
  }
  return [`Up to ${tier.photo_limit} photos`, 'Public profile listing', 'Search discoverability'];
}

function formatPlanPrice(tier: SubscriptionTier): { price: number; period: string } {
  const monthly = tier.price_monthly ?? 0;
  const yearly = tier.price_yearly ?? 0;
  if (monthly > 0) return { price: monthly, period: 'month' };
  if (yearly > 0) return { price: yearly, period: 'year' };
  return { price: 0, period: 'forever' };
}

export default function SubscriptionPlansPage() {
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSubscriptionTiers()
      .then((data) => setTiers(data))
      .catch((err) => {
        console.error('Failed to load subscription plans:', err);
        setError('Could not load plans. Please try again later.');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="fx-container fx-section">
        <div className="mx-auto max-w-5xl py-20 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-on-surface-variant">Loading plans...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fx-container fx-section">
        <div className="mx-auto max-w-5xl py-20 text-center">
          <p className="text-on-surface-variant">{error}</p>
        </div>
      </div>
    );
  }

  const sorted = [...tiers].sort((a, b) => {
    const pa = a.price_monthly ?? a.price_yearly ?? 0;
    const pb = b.price_monthly ?? b.price_yearly ?? 0;
    return pa - pb;
  });

  const midIndex = Math.floor(sorted.length / 2);

  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-5xl text-center">
        <h1 className="font-display text-3xl font-bold text-on-surface md:text-4xl">Subscription Plans</h1>
        <p className="mt-4 text-on-surface-variant">Choose the plan that works for your event business</p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {sorted.map((tier, index) => {
            const { price, period } = formatPlanPrice(tier);
            const isFree = price === 0;
            const highlighted = index === midIndex && sorted.length > 1;
            const href = `/subscription-checkout?tierId=${tier.id}`;

            return (
              <div
                key={tier.id}
                className={`relative rounded-xl p-6 text-left shadow-sm border ${
                  highlighted
                    ? 'border-primary bg-white ring-2 ring-primary/20'
                    : 'border-outline-variant bg-white'
                }`}
              >
                {highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </div>
                )}
                <h3 className="font-display text-xl font-bold text-on-surface">{tier.tier_name}</h3>
                <p className="mt-1 text-sm text-on-surface-variant">{isFree ? 'Basic listing to get started' : 'Vendor subscription plan'}</p>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-on-surface">{isFree ? 'Free' : `R${price}`}</span>
                  {!isFree && <span className="text-sm text-on-surface-variant">/{period}</span>}
                </div>
                <ul className="mt-6 space-y-2">
                  {getPlanFeatures(tier).map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-on-surface-variant">
                      <CheckCircle className="h-4 w-4 flex-shrink-0 text-success" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to={href}
                  className={`mt-6 block rounded-lg px-4 py-2.5 text-center text-sm font-semibold ${
                    highlighted
                      ? 'bg-primary text-white hover:bg-primary-container'
                      : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  {isFree ? 'Get Started' : 'Subscribe'}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
