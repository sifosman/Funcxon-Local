// WEB ONLY — deploy-web/src/pages/SubscriptionCheckoutPage.tsx
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle, Loader2, AlertCircle, CreditCard } from 'lucide-react';
import { buildPayFastPaymentData, getPayFastCheckoutUrl } from '../config/payfast';
import { supabase, SUPABASE_URL } from '../lib/supabaseClient';
import { getSubscriptionTiers, type SubscriptionTier } from '../lib/subscription';
import { getLatestUserApplicationByType, updateUserRoleToVendor } from '../lib/applicationService';

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

type ProductType = 'vendor' | 'venue';

interface ApplicationRecord {
  id: string;
  user_id: string;
  portfolio_type: 'venue' | 'vendor';
  subscription_tier: string | null;
  company_details?: Record<string, any> | null;
  service_categories?: Record<string, any> | null;
  coverage_provinces?: string[] | null;
  coverage_cities?: string[] | null;
  business_description?: string | null;
  portfolio_images?: string[] | null;
  portfolio_videos?: string[] | null;
}

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

function formatPrice(tier: SubscriptionTier, period: 'monthly' | 'yearly' | '6_month' | '12_month') {
  if (period === 'yearly' || period === '12_month') return tier.price_yearly ?? 0;
  return tier.price_monthly ?? 0;
}

function normalizeTierKey(raw: string): string {
  const t = (raw ?? '').trim().toLowerCase();
  if (t === 'get started' || t === 'get_started' || t === 'free') return 'get_started';
  if (t === 'premium plus' || t === 'premium_plus' || t === 'premiumplus') return 'premium_plus';
  if (t === 'premium') return 'premium';
  return t.replace(/\s+/g, '_');
}

function periodLabel(period: string) {
  switch (period) {
    case 'yearly':
    case '12_month':
      return 'Yearly';
    case '6_month':
      return '6 Months';
    default:
      return 'Monthly';
  }
}

export default function SubscriptionCheckoutPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const tierIdParam = searchParams.get('tierId');
  const planParam = searchParams.get('plan');
  const billingPeriod = (searchParams.get('billingPeriod') || 'monthly') as 'monthly' | 'yearly' | '6_month' | '12_month';
  const productType = (searchParams.get('productType') || 'vendor') as ProductType;
  const applicationId = searchParams.get('applicationId');
  const isSuccessReturn = searchParams.get('success') === 'true';
  const isCancelledReturn = searchParams.get('cancelled') === 'true';

  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [application, setApplication] = useState<ApplicationRecord | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const selectedTier = useMemo(() => {
    if (tierIdParam) {
      return tiers.find((t) => String(t.id) === tierIdParam) || null;
    }
    if (planParam) {
      return tiers.find((t) => normalizeTierKey(t.tier_name) === normalizeTierKey(planParam)) || null;
    }
    return tiers[0] || null;
  }, [tiers, tierIdParam, planParam]);

  const price = selectedTier ? formatPrice(selectedTier, billingPeriod) : 0;
  const isFree = !selectedTier || price === 0;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const [tierData, appResult, userResult] = await Promise.all([
          getSubscriptionTiers(),
          getLatestUserApplicationByType(productType === 'venue' ? 'venue' : 'vendor'),
          supabase
            .from('users')
            .select('full_name, email, phone, business_name, vat_number, address_line1, address_line2, city, province, postal_code')
            .eq('auth_user_id', auth.user?.id)
            .maybeSingle(),
        ]);
        if (cancelled) return;
        setTiers(tierData);
        if (appResult.success && appResult.data) {
          setApplication(appResult.data as ApplicationRecord);
        }
        const row = userResult.data as any;
        if (row) {
          if (row.full_name) setFullName(row.full_name);
          if (row.email) setEmail(row.email);
          if (row.phone) setPhone(row.phone);
          if (row.business_name) setBusinessName(row.business_name);
          if (row.vat_number) setVatNumber(row.vat_number);
          if (row.address_line1) setAddressLine1(row.address_line1);
          if (row.address_line2) setAddressLine2(row.address_line2);
          if (row.city) setCity(row.city);
          if (row.province) setProvince(row.province);
          if (row.postal_code) setPostalCode(row.postal_code);
        }
      } catch (err) {
        console.error('Checkout load error:', err);
        setError('Could not load checkout details. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [productType]);

  useEffect(() => {
    if (!loading && isSuccessReturn) {
      handlePaymentSuccess();
    }
  }, [loading, isSuccessReturn]);

  const handlePhoneChange = (value: string) => {
    const { normalized, error } = normalizePayFastPhone(value);
    setPhone(normalized);
    setPhoneError(error);
  };

  const getUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  };

  const buildVendorPayload = (overrides: { subscription_status: 'active' | 'inactive'; pending_payment_id?: string }) => {
    const app = application;
    const details = app?.company_details || {};
    const name = (details.tradingName || details.registeredBusinessName || 'Vendor Listing').trim();
    return {
      user_id: app?.user_id,
      name,
      description: app?.business_description || null,
      location: (details.businessPhysicalAddress || '').trim() || null,
      email: (details.email || '').trim() || null,
      whatsapp_number: (details.contactPhoneNumber || '').trim() || null,
      instagram_url: (details.instagram || '').trim() || null,
      facebook_url: (details.facebook || '').trim() || null,
      tiktok_url: (details.tiktok || '').trim() || null,
      image_url: app?.portfolio_images?.[0] || null,
      subscription_tier: normalizeTierKey(app?.subscription_tier || selectedTier?.tier_name || 'get_started'),
      subscription_status: overrides.subscription_status,
      billing_period: billingPeriod,
      billing_email: email.trim() || details.email?.trim() || null,
      billing_name: fullName.trim() || details.ownersName?.trim() || null,
      billing_phone: phone || details.contactPhoneNumber?.trim() || null,
      subscription_started_at: overrides.subscription_status === 'active' ? new Date().toISOString() : null,
      pending_payment_id: overrides.pending_payment_id || null,
      service_options: app?.service_categories?.categories ?? app?.service_categories?.serviceCategories ?? [],
      vendor_tags: app?.service_categories?.serviceSubcategories ?? [],
    };
  };

  const buildVenuePayload = (overrides: { subscription_status: 'active' | 'inactive'; pending_payment_id?: string }) => {
    const app = application;
    const details = app?.company_details || {};
    const name = (details.tradingName || details.registeredBusinessName || 'Venue Listing').trim();
    return {
      user_id: app?.user_id,
      name,
      description: app?.business_description || null,
      location: (details.businessPhysicalAddress || '').trim() || null,
      subscription_plan_key: normalizeTierKey(app?.subscription_tier || selectedTier?.tier_name || 'monthly'),
      subscription_status: overrides.subscription_status,
      billing_period: billingPeriod,
      billing_email: email.trim() || details.email?.trim() || null,
      billing_name: fullName.trim() || details.ownersName?.trim() || null,
      billing_phone: phone || details.contactPhoneNumber?.trim() || null,
      subscription_started_at: overrides.subscription_status === 'active' ? new Date().toISOString() : null,
      pending_payment_id: overrides.pending_payment_id || null,
    };
  };

  const upsertSubscriptionRecord = async (payload: Record<string, any>, table: 'vendors' | 'venue_listings') => {
    const { data: existing } = await supabase
      .from(table)
      .select('id')
      .eq('user_id', payload.user_id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase.from(table).update(payload).eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from(table).insert(payload);
      if (error) throw error;
    }
  };

  const sendWelcomeEmail = async () => {
    try {
      const app = application;
      const details = app?.company_details || {};
      const businessName = (details.tradingName || details.registeredBusinessName || '').trim();
      await supabase.functions.invoke('send-vendor-welcome-email', {
        body: {
          email: email.trim() || details.email?.trim() || app?.user_id,
          fullName: fullName.trim() || details.ownersName?.trim() || 'Valued Vendor',
          businessName: businessName || undefined,
          tierName: selectedTier?.tier_name || app?.subscription_tier || 'Free',
          applicationUrl: `${window.location.origin}/apply/status`,
        },
      });
    } catch (err) {
      console.error('Welcome email failed:', err);
    }
  };

  const sendAdminNotification = async (type: 'vendor-subscription-purchased' | 'venue-subscription-purchased' = 'vendor-subscription-purchased') => {
    try {
      const app = application;
      const details = app?.company_details || {};
      await supabase.functions.invoke('send-admin-notification', {
        body: {
          type,
          vendorName: fullName.trim() || details.ownersName?.trim() || 'New Vendor',
          vendorEmail: email.trim() || details.email?.trim() || null,
          businessName: (details.tradingName || details.registeredBusinessName || '').trim() || undefined,
          tierName: selectedTier?.tier_name || app?.subscription_tier || 'Free',
          amount: price,
        },
      });
    } catch (err) {
      console.error('Admin notification failed:', err);
    }
  };

  const finalizeActivation = async () => {
    try {
      await updateUserRoleToVendor();
    } catch (err) {
      console.error('Role update failed:', err);
    }
    await sendWelcomeEmail();
    await sendAdminNotification(productType === 'venue' ? 'venue-subscription-purchased' : 'vendor-subscription-purchased');
  };

  const handleFreePlanActivation = async () => {
    setProcessing(true);
    setError(null);
    try {
      const userId = await getUserId();
      if (!userId || !application) throw new Error('Missing user or application details');

      await supabase.from('users').update({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone,
        business_name: businessName.trim() || null,
        vat_number: vatNumber.trim() || null,
        address_line1: addressLine1.trim() || null,
        address_line2: addressLine2.trim() || null,
        city: city.trim() || null,
        province: province || null,
        postal_code: postalCode.trim() || null,
      }).eq('auth_user_id', userId);

      if (productType === 'venue') {
        const venuePayload = buildVenuePayload({ subscription_status: 'active' });
        await upsertSubscriptionRecord(venuePayload, 'venue_listings');
      } else {
        const vendorPayload = buildVendorPayload({ subscription_status: 'active' });
        await upsertSubscriptionRecord(vendorPayload, 'vendors');
      }

      await finalizeActivation();
      navigate('/apply/success');
    } catch (err) {
      console.error('Free plan activation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to activate free plan');
    } finally {
      setProcessing(false);
    }
  };

  const handlePaidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneError) return;
    if (!termsAccepted) {
      setError('Please accept the terms and conditions');
      return;
    }
    if (!selectedTier) {
      setError('Please select a subscription plan');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const userId = await getUserId();
      if (!userId || !application) throw new Error('Missing user or application details');

      await supabase.from('users').update({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone,
        business_name: businessName.trim() || null,
        vat_number: vatNumber.trim() || null,
        address_line1: addressLine1.trim() || null,
        address_line2: addressLine2.trim() || null,
        city: city.trim() || null,
        province: province || null,
        postal_code: postalCode.trim() || null,
      }).eq('auth_user_id', userId);

      const payfastPaymentId = `pf_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      const nameParts = fullName.trim().split(' ');
      const paymentData = buildPayFastPaymentData({
        amount: price,
        paymentId: payfastPaymentId,
        itemName: `Funxon ${productType === 'venue' ? 'Venue' : 'Vendor'} ${selectedTier.tier_name} Plan (${periodLabel(billingPeriod)})`,
        itemDescription: `${productType === 'venue' ? 'Venue' : 'Vendor'} subscription - billed ${billingPeriod}`,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: email.trim(),
        phone,
        subscriptionType: billingPeriod === '6_month' || billingPeriod === '12_month' ? '2' : '1',
        frequency: billingPeriod === 'yearly' ? '6' : '3',
        recurringAmount: billingPeriod === '6_month' || billingPeriod === '12_month' ? undefined : price,
        cycles: billingPeriod === '6_month' || billingPeriod === '12_month' ? undefined : 0,
        returnUrl: `${window.location.origin}/subscription-checkout?success=true&tierId=${selectedTier.id}&billingPeriod=${billingPeriod}&productType=${productType}&applicationId=${applicationId || ''}`,
        cancelUrl: `${window.location.origin}/subscription-checkout?cancelled=true&tierId=${selectedTier.id}&billingPeriod=${billingPeriod}&productType=${productType}&applicationId=${applicationId || ''}`,
        notifyUrl: `${SUPABASE_URL}/functions/v1/payfast-itn`,
      });

      const checkoutUrl = getPayFastCheckoutUrl(paymentData);
      window.location.href = checkoutUrl;
    } catch (err) {
      console.error('Paid checkout error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start payment. Please try again.');
      setProcessing(false);
    }
  };

  const handlePaymentSuccess = async () => {
    setProcessing(true);
    setError(null);
    try {
      const userId = await getUserId();
      if (!userId || !application) throw new Error('Missing user or application details');

      await finalizeActivation();
      const nextRoute = productType === 'venue' ? '/portfolio/venue' : '/portfolio/vendor';
      navigate(nextRoute);
    } catch (err) {
      console.error('Payment success handling error:', err);
      setError(err instanceof Error ? err.message : 'Payment succeeded but we could not complete setup. Please contact support.');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="fx-container flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-on-surface-variant">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (isSuccessReturn) {
    return (
      <div className="fx-container flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
        <div className="w-full max-w-md text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-success" />
          <h1 className="mt-6 font-display text-2xl font-bold text-on-surface">Payment Successful</h1>
          <p className="mt-2 text-on-surface-variant">Finalising your subscription. Please wait...</p>
          {processing && <Loader2 className="mx-auto mt-4 h-6 w-6 animate-spin text-primary" />}
          {error && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isCancelledReturn) {
    return (
      <div className="fx-container flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
        <div className="w-full max-w-md text-center">
          <AlertCircle className="mx-auto h-16 w-16 text-warning" />
          <h1 className="mt-6 font-display text-2xl font-bold text-on-surface">Payment Cancelled</h1>
          <p className="mt-2 text-on-surface-variant">You cancelled the payment. You can retry below.</p>
          <button
            onClick={() => setSearchParams({ tierId: tierIdParam || '', billingPeriod, productType, applicationId: applicationId || '' })}
            className="mt-6 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            Retry Checkout
          </button>
        </div>
      </div>
    );
  }

  if (!selectedTier) {
    return (
      <div className="fx-container flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
        <div className="w-full max-w-md text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-error" />
          <h1 className="mt-4 font-display text-xl font-bold text-on-surface">Plan not found</h1>
          <p className="mt-2 text-sm text-on-surface-variant">The selected subscription plan could not be loaded.</p>
          <Link to="/subscription-plans" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
            View plans
          </Link>
        </div>
      </div>
    );
  }

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
              <span className="font-medium text-on-surface">{selectedTier.tier_name} Plan</span>
              <span className="font-bold text-primary">
                {isFree ? 'Free' : `R${price}/${periodLabel(billingPeriod).toLowerCase()}`}
              </span>
            </div>
            <div className="mt-2 text-xs text-on-surface-variant">
              {productType === 'venue' ? 'Venue listing' : 'Vendor profile'} • {selectedTier.photo_limit} photos
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {isFree ? (
            <div className="mt-6 space-y-4">
              <p className="text-sm text-on-surface-variant">
                Confirm your free {productType === 'venue' ? 'venue listing' : 'vendor profile'} activation.
              </p>
              <button
                onClick={handleFreePlanActivation}
                disabled={processing}
                className="fx-btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Activating...' : 'Confirm Free Plan'}
              </button>
            </div>
          ) : (
            <form onSubmit={handlePaidSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-on-surface">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="fx-input"
                  placeholder="John Doe"
                />
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
                <label className="mb-1 block text-sm font-medium text-on-surface">Business Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="fx-input"
                  placeholder="Your business"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-on-surface">VAT Number</label>
                <input
                  type="text"
                  value={vatNumber}
                  onChange={(e) => setVatNumber(e.target.value)}
                  className="fx-input"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-on-surface">Address Line 1</label>
                <input
                  type="text"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  className="fx-input"
                  placeholder="Street address"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-on-surface">Address Line 2</label>
                <input
                  type="text"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  className="fx-input"
                  placeholder="Unit / Complex"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-on-surface">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="fx-input"
                  placeholder="City"
                />
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
              <div>
                <label className="mb-1 block text-sm font-medium text-on-surface">Postal Code</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="fx-input"
                  placeholder="Postal code"
                />
              </div>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-primary"
                />
                <span className="text-sm text-on-surface-variant">
                  I accept the <Link to="/terms" className="font-medium text-primary hover:underline">Terms and Conditions</Link>
                </span>
              </label>
              <button
                type="submit"
                disabled={processing || !!phoneError}
                className="fx-btn-primary flex w-full items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                {processing ? 'Processing...' : 'Pay with PayFast'}
              </button>
            </form>
          )}
          <p className="mt-4 text-center text-xs text-on-surface-variant">
            Secure payment powered by PayFast
          </p>
        </div>
      </div>
    </div>
  );
}
