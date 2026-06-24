// WEB ONLY — deploy-web/src/lib/pendingSubscriptionCheckout.ts

const PENDING_SUBSCRIPTION_CHECKOUT_KEY = 'pending_subscription_checkout';

export type PendingSubscriptionCheckoutParams = {
  vendorId?: number;
  venueId?: number;
  planId?: number;
  planKey?: string;
  tierName?: string;
  billingPeriod?: 'monthly' | 'yearly' | '6_month' | '12_month';
  returnPath?: string;
};

export function savePendingSubscriptionCheckout(params: PendingSubscriptionCheckoutParams) {
  localStorage.setItem(PENDING_SUBSCRIPTION_CHECKOUT_KEY, JSON.stringify(params));
}

export function getPendingSubscriptionCheckout(): PendingSubscriptionCheckoutParams | null {
  const rawValue = localStorage.getItem(PENDING_SUBSCRIPTION_CHECKOUT_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as PendingSubscriptionCheckoutParams;
  } catch {
    localStorage.removeItem(PENDING_SUBSCRIPTION_CHECKOUT_KEY);
    return null;
  }
}

export function clearPendingSubscriptionCheckout() {
  localStorage.removeItem(PENDING_SUBSCRIPTION_CHECKOUT_KEY);
}
