import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

const PLANS = [
  {
    name: 'Free',
    price: 0,
    period: 'forever',
    description: 'Get started with basic listing',
    features: ['Basic profile', 'Up to 3 photos', 'Contact enquiries'],
    cta: 'Get Started',
    href: '/signup',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: 299,
    period: 'month',
    description: 'For growing event businesses',
    features: ['Featured profile', 'Unlimited photos', 'Priority search ranking', 'Quote requests', 'Analytics dashboard'],
    cta: 'Subscribe',
    href: '/subscription/checkout?plan=pro',
    highlighted: true,
  },
  {
    name: 'Premium',
    price: 599,
    period: 'month',
    description: 'Maximum exposure and leads',
    features: ['Everything in Pro', 'Homepage featured spot', 'Social media promotion', 'Dedicated support', 'Custom branding'],
    cta: 'Subscribe',
    href: '/subscription/checkout?plan=premium',
    highlighted: false,
  },
];

export default function SubscriptionPlansPage() {
  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-5xl text-center">
        <h1 className="font-display text-3xl font-bold text-on-surface md:text-4xl">Subscription Plans</h1>
        <p className="mt-4 text-on-surface-variant">Choose the plan that works for your event business</p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {PLANS.map(plan => (
            <div
              key={plan.name}
              className={`relative rounded-xl p-6 text-left shadow-sm border ${
                plan.highlighted
                  ? 'border-primary bg-white ring-2 ring-primary/20'
                  : 'border-outline-variant bg-white'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
                  Most Popular
                </div>
              )}
              <h3 className="font-display text-xl font-bold text-on-surface">{plan.name}</h3>
              <p className="mt-1 text-sm text-on-surface-variant">{plan.description}</p>
              <div className="mt-4">
                <span className="text-3xl font-bold text-on-surface">R{plan.price}</span>
                <span className="text-sm text-on-surface-variant">/{plan.period}</span>
              </div>
              <ul className="mt-6 space-y-2">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <CheckCircle className="h-4 w-4 flex-shrink-0 text-success" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to={plan.href}
                className={`mt-6 block rounded-lg px-4 py-2.5 text-center text-sm font-semibold ${
                  plan.highlighted
                    ? 'bg-primary text-white hover:bg-primary-container'
                    : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
