import { useSearchParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { buildPayFastPaymentData, getPayFastCheckoutUrl } from '../config/payfast';

const PLANS: Record<string, { name: string; price: number; period: string }> = {
  pro: { name: 'Pro', price: 299, period: 'month' },
  premium: { name: 'Premium', price: 599, period: 'month' },
};

const SOUTH_AFRICAN_PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape',
  'Western Cape',
];

const normalizePayFastPhone = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return { normalized: '', error: 'Phone number is required' };
  }

  const digits = trimmed.replace(/\D/g, '');
  let normalized = digits;

  if (normalized.startsWith('27') && normalized.length === 11) {
    normalized = `0${normalized.slice(2)}`;
  }

  if (normalized.length !== 10 || !normalized.startsWith('0')) {
    return {
      normalized: '',
      error: 'Enter a valid South African mobile number like 0821234567 or +27821234567',
    };
  }

  if (!/^0[6-8][0-9]{8}$/.test(normalized)) {
    return {
      normalized: '',
      error: 'PayFast requires a valid South African mobile number',
    };
  }

  return { normalized, error: '' };
};

export default function SubscriptionCheckoutPage() {
  const [searchParams] = useSearchParams();
  const planKey = searchParams.get('plan') || 'pro';
  const plan = PLANS[planKey] || PLANS.pro;
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [province, setProvince] = useState('');

  const handlePhoneChange = (value: string) => {
    const { normalized, error } = normalizePayFastPhone(value);
    setPhone(normalized);
    setPhoneError(error);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (phoneError) {
      return;
    }

    setLoading(true);

    const paymentData = buildPayFastPaymentData({
      amount: plan.price,
      itemName: `${plan.name} Plan - ${plan.period}`,
      itemDescription: `Funxon ${plan.name} subscription plan`,
      firstName,
      lastName,
      email,
      phone,
      returnUrl: `${window.location.origin}/subscription-plans?success=true`,
      cancelUrl: `${window.location.origin}/subscription-plans?cancelled=true`,
      subscriptionType: '1',
      frequency: '3',
      recurringAmount: plan.price,
      cycles: 0,
    });

    const checkoutUrl = getPayFastCheckoutUrl(paymentData);
    window.location.href = checkoutUrl;
  };

  return (
    <div className="fx-container flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
      <div className="w-full max-w-md">
        <Link to="/subscription-plans" className="mb-4 inline-flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to plans
        </Link>
        <div className="rounded-xl bg-white p-8 shadow-sm border border-outline-variant">
          <h1 className="font-display text-2xl font-bold text-on-surface">Checkout</h1>
          <div className="mt-4 rounded-lg bg-surface-container p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-on-surface">{plan.name} Plan</span>
              <span className="font-bold text-primary">R{plan.price}/{plan.period}</span>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-on-surface">First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="fx-input"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-on-surface">Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="fx-input"
                  placeholder="Doe"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-on-surface">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="fx-input"
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-on-surface">Phone Number</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className={`fx-input ${phoneError ? 'border-red-500' : ''}`}
                placeholder="0821234567"
              />
              {phoneError && <p className="mt-1 text-xs text-red-500">{phoneError}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-on-surface">Province</label>
              <select
                required
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="fx-input"
              >
                <option value="">Select province</option>
                {SOUTH_AFRICAN_PROVINCES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={loading || !!phoneError}
              className="fx-btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Pay with PayFast'}
            </button>
          </form>
          <p className="mt-4 text-center text-xs text-on-surface-variant">
            Secure payment powered by PayFast
          </p>
        </div>
      </div>
    </div>
  );
}
