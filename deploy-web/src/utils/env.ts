// WEB ONLY — deploy-web/src/utils/env.ts
function getEnv(key: string, fallback: string): string {
  const val = import.meta.env[key];
  if (val) return String(val);
  return fallback;
}

export const SUPPORT_EMAIL = getEnv('VITE_SUPPORT_EMAIL', 'support@funxon.co.za');
export const SUPPORT_WHATSAPP = getEnv('VITE_SUPPORT_WHATSAPP', '+27837093579');
export const PAYFAST_SANDBOX = getEnv('VITE_PAYFAST_SANDBOX', 'true') === 'true';
export const PAYFAST_MERCHANT_ID = getEnv('VITE_PAYFAST_MERCHANT_ID', '');
export const PAYFAST_MERCHANT_KEY = getEnv('VITE_PAYFAST_MERCHANT_KEY', '');
export const GOOGLE_MAPS_API_KEY = getEnv('VITE_GOOGLE_MAPS_API_KEY', '');
