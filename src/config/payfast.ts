// PayFast Payment Gateway Configuration
// Docs: https://developers.payfast.co.za/docs

export const payfastConfig = {
  merchantId: process.env.EXPO_PUBLIC_PAYFAST_MERCHANT_ID || '',
  merchantKey: process.env.EXPO_PUBLIC_PAYFAST_MERCHANT_KEY || '',
  // Passphrase should only be used server-side; kept here for signature generation reference
  sandbox: process.env.EXPO_PUBLIC_PAYFAST_SANDBOX === 'true',
};

export const PAYFAST_BASE_URL = payfastConfig.sandbox
  ? 'https://sandbox.payfast.co.za/eng/process'
  : 'https://www.payfast.co.za/eng/process';

export type PayFastPaymentData = {
  // Merchant details
  merchant_id: string;
  merchant_key: string;
  // Merchant payment reference
  m_payment_id?: string;
  // Transaction details
  amount: string;
  item_name: string;
  item_description?: string;
  // Buyer details
  name_first?: string;
  name_last?: string;
  email_address?: string;
  cell_number?: string;
  // Recurring billing
  subscription_type?: '1' | '2'; // 1 = subscription, 2 = ad-hoc
  billing_date?: string;
  recurring_amount?: string;
  frequency?: '3' | '4' | '5' | '6'; // 3=monthly, 4=quarterly, 5=biannually, 6=annually
  cycles?: string; // 0 = indefinite
  // URLs
  return_url?: string;
  cancel_url?: string;
  notify_url?: string;
};

/**
 * Build payment parameters for a PayFast checkout redirect.
 */
export function buildPayFastPaymentData(opts: {
  amount: number;
  itemName: string;
  itemDescription?: string;
  paymentId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  returnUrl?: string;
  cancelUrl?: string;
  notifyUrl?: string;
  subscriptionType?: '1' | '2';
  frequency?: '3' | '4' | '5' | '6';
  recurringAmount?: number;
  cycles?: number;
}): PayFastPaymentData {
  const data: PayFastPaymentData = {
    merchant_id: payfastConfig.merchantId,
    merchant_key: payfastConfig.merchantKey,
    amount: opts.amount.toFixed(2),
    item_name: opts.itemName,
  };

  if (opts.paymentId) data.m_payment_id = opts.paymentId;
  if (opts.itemDescription) data.item_description = opts.itemDescription;
  if (opts.firstName) data.name_first = opts.firstName;
  if (opts.lastName) data.name_last = opts.lastName;
  if (opts.email) data.email_address = opts.email;
  if (opts.phone) data.cell_number = opts.phone;
  if (opts.returnUrl) data.return_url = opts.returnUrl;
  if (opts.cancelUrl) data.cancel_url = opts.cancelUrl;
  if (opts.notifyUrl) data.notify_url = opts.notifyUrl;

  if (opts.subscriptionType) {
    data.subscription_type = opts.subscriptionType;
    if (opts.frequency) data.frequency = opts.frequency;
    if (opts.recurringAmount) data.recurring_amount = opts.recurringAmount.toFixed(2);
    if (opts.cycles !== undefined) data.cycles = String(opts.cycles);
  }

  return data;
}

/**
 * Build a URL-encoded query string from PayFast payment data.
 * The resulting string can be used for form submission or URL redirect.
 */
export function buildPayFastQueryString(data: PayFastPaymentData): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== '') {
      params.append(key, value);
    }
  }
  return params.toString();
}

/**
 * Get the full PayFast checkout URL for a payment.
 */
export function getPayFastCheckoutUrl(data: PayFastPaymentData): string {
  return `${PAYFAST_BASE_URL}?${buildPayFastQueryString(data)}`;
}
