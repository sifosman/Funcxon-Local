// Centralized environment variable access with safe fallbacks.
// Expo automatically injects EXPO_PUBLIC_* into process.env.
// We also read from Constants for EAS builds.

import Constants from 'expo-constants';

function getEnv(key: string, fallback: string): string {
  // Try process.env first (works in dev and EAS builds with EXPO_PUBLIC_ prefix)
  const val = process.env[key];
  if (val) return val;

  // Fallback to Constants extra config
  const extra = Constants.expoConfig?.extra ?? (Constants.manifest as any)?.extra ?? {};
  if (extra[key]) return String(extra[key]);

  return fallback;
}

export const SUPPORT_EMAIL = getEnv('EXPO_PUBLIC_SUPPORT_EMAIL', 'support@funxon.co.za');
export const SUPPORT_WHATSAPP = getEnv('EXPO_PUBLIC_SUPPORT_WHATSAPP', '+27837093579');
export const PAYFAST_SANDBOX = getEnv('EXPO_PUBLIC_PAYFAST_SANDBOX', 'true') === 'true';
export const PAYFAST_MERCHANT_ID = getEnv('EXPO_PUBLIC_PAYFAST_MERCHANT_ID', '');
export const PAYFAST_MERCHANT_KEY = getEnv('EXPO_PUBLIC_PAYFAST_MERCHANT_KEY', '');
export const PAYFAST_PASSPHRASE = getEnv('EXPO_PUBLIC_PAYFAST_PASSPHRASE', '');
