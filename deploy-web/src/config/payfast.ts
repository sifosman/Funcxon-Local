// PayFast Payment Gateway Configuration
// Docs: https://developers.payfast.co.za/docs

import { PAYFAST_SANDBOX, PAYFAST_MERCHANT_ID, PAYFAST_MERCHANT_KEY, PAYFAST_PASSPHRASE } from '../utils/env';
import { md5 } from '../utils/md5';

const SANDBOX_TEST_MERCHANT_ID = '10000100';
const SANDBOX_TEST_MERCHANT_KEY = '46f0cd694581a';

export const payfastConfig = {
  merchantId: PAYFAST_SANDBOX && !PAYFAST_MERCHANT_ID ? SANDBOX_TEST_MERCHANT_ID : PAYFAST_MERCHANT_ID,
  merchantKey: PAYFAST_SANDBOX && !PAYFAST_MERCHANT_KEY ? SANDBOX_TEST_MERCHANT_KEY : PAYFAST_MERCHANT_KEY,
  passphrase: PAYFAST_SANDBOX ? '' : PAYFAST_PASSPHRASE,
  sandbox: PAYFAST_SANDBOX,
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
  // Security
  signature?: string;
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

  // Generate PayFast security signature
  data.signature = generatePayFastSignature(data, payfastConfig.passphrase);

  return data;
}

/**
 * Generate the PayFast MD5 security signature.
 * Pairs must be in the ORDER they appear in the PayFast form spec (NOT alphabetical).
 * The passphrase is appended as &passphrase=<encoded> before hashing.
 */
export function generatePayFastSignature(data: PayFastPaymentData, passphrase?: string): string {
  const orderedKeys = [
    'merchant_id', 'merchant_key', 'return_url', 'cancel_url', 'notify_url',
    'name_first', 'name_last', 'email_address', 'cell_number',
    'm_payment_id', 'amount', 'item_name', 'item_description',
    'custom_int1', 'custom_int2', 'custom_int3', 'custom_int4', 'custom_int5',
    'custom_str1', 'custom_str2', 'custom_str3', 'custom_str4', 'custom_str5',
    'email_confirmation', 'confirmation_address', 'payment_method',
    'subscription_type', 'billing_date', 'recurring_amount', 'frequency', 'cycles',
  ];

  const parts: string[] = [];
  for (const key of orderedKeys) {
    const value = (data as any)[key];
    if (value !== undefined && value !== '') {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
  }

  let payload = parts.join('&');
  if (passphrase) {
    payload += `&passphrase=${encodeURIComponent(passphrase)}`;
  }

  return md5(payload);
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
