import * as Crypto from 'expo-crypto';

// PayFast Sandbox Credentials
const MERCHANT_ID = '10000100';
const MERCHANT_KEY = '46f0cd694581a';
const PASSPHRASE = ''; // Leave empty for default sandbox

// Base URL
const PAYFAST_URL = 'https://sandbox.payfast.co.za/eng/process';

export type PaymentDetails = {
    amount: number;
    item_name: string;
    email_address: string;
    m_payment_id: string; // Internal reference
};

export const PayfastService = {
    async generatePaymentUrl(details: PaymentDetails) {
        const data: Record<string, string> = {
            merchant_id: MERCHANT_ID,
            merchant_key: MERCHANT_KEY,
            return_url: 'https://vibeventz.app/payment/return', // We will intercept this in WebView
            cancel_url: 'https://vibeventz.app/payment/cancel',
            notify_url: 'https://vibeventz.app/payment/notify',

            name_first: 'Vibeventz',
            name_last: 'User',
            email_address: details.email_address,

            m_payment_id: details.m_payment_id,
            amount: details.amount.toFixed(2),
            item_name: details.item_name,
        };

        // Create parameter string - PayFast requires alphabetically sorted keys
        // See: https://developers.payfast.co.za/docs#step_1_form_fields
        const sortedKeys = Object.keys(data).sort();
        let pfParamString = '';
        
        for (const key of sortedKeys) {
            if (pfParamString !== '') {
                pfParamString += '&';
            }
            pfParamString += `${key}=${encodeURIComponent(data[key])}`;
        }

        if (PASSPHRASE) {
            pfParamString += `&passphrase=${encodeURIComponent(PASSPHRASE)}`;
        }

        const signature = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.MD5,
            pfParamString
        );

        return `${PAYFAST_URL}?${pfParamString}&signature=${signature}`;
    }
};
