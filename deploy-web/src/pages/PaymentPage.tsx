import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { buildPayFastPaymentData, getPayFastCheckoutUrl } from '../config/payfast';
import { CreditCard, Loader2, AlertCircle } from 'lucide-react';

export default function PaymentPage() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);

  const amount = parseFloat(searchParams.get('amount') || '0');
  const itemName = searchParams.get('item') || 'Funxon Payment';
  const itemDescription = searchParams.get('desc') || undefined;
  const paymentId = searchParams.get('paymentId') || `pf_${Date.now()}`;
  const frequency = (searchParams.get('frequency') as any) || undefined;
  const recurringAmount = searchParams.get('recurringAmount') ? parseFloat(searchParams.get('recurringAmount')!) : undefined;

  const paymentData = useMemo(() => {
    if (!amount || amount <= 0) return null;
    return buildPayFastPaymentData({
      amount,
      itemName,
      itemDescription,
      paymentId,
      firstName: user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || '',
      lastName: user?.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
      email: user?.email || '',
      returnUrl: `${window.location.origin}/account/billing`,
      cancelUrl: `${window.location.origin}/subscription-checkout`,
      frequency,
      recurringAmount,
      subscriptionType: frequency ? '1' : undefined,
    });
  }, [amount, itemName, itemDescription, paymentId, user, frequency, recurringAmount]);

  const checkoutUrl = useMemo(() => paymentData ? getPayFastCheckoutUrl(paymentData) : '', [paymentData]);

  useEffect(() => {
    if (checkoutUrl && !submitted) {
      window.location.href = checkoutUrl;
      setSubmitted(true);
    }
  }, [checkoutUrl, submitted]);

  if (!amount || amount <= 0) {
    return (
      <div className="fx-container fx-section">
        <div className="mx-auto max-w-md text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-error" />
          <h1 className="mt-4 font-display text-xl font-bold text-on-surface">Invalid Payment</h1>
          <p className="mt-2 text-sm text-on-surface-variant">No amount or payment details were provided.</p>
          <Link to="/subscription-plans" className="mt-4 inline-block rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white">View Plans</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fx-container fx-section">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-muted">
          <CreditCard className="h-8 w-8 text-primary" />
        </div>
        <h1 className="mt-6 font-display text-2xl font-bold text-on-surface">Redirecting to PayFast</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          You are being redirected to complete a secure payment of <strong className="text-on-surface">R{amount.toLocaleString()}</strong>.
        </p>
        <div className="mt-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
        {checkoutUrl && (
          <a href={checkoutUrl} className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
            Click here if you are not redirected
          </a>
        )}
      </div>
    </div>
  );
}
