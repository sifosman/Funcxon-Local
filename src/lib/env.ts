/**
 * Runtime environment variable loader.
 * Web builds inject env vars via window.__ENV (avoids bundling secrets).
 * Native builds fall back to process.env and @env (react-native-dotenv).
 */
import {
  EXPO_PUBLIC_HUBSPOT_ACCESS_TOKEN,
  EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY,
  EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
} from '@env';

const ENV_MAP: Record<string, string | undefined> = {
  EXPO_PUBLIC_HUBSPOT_ACCESS_TOKEN: EXPO_PUBLIC_HUBSPOT_ACCESS_TOKEN,
  EXPO_PUBLIC_SUPABASE_URL: EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: EXPO_PUBLIC_SUPABASE_ANON_KEY,
  EXPO_PUBLIC_GOOGLE_MAPS_API_KEY: EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
};

export function getEnv(key: string, fallback?: string): string | undefined {
  if (typeof window !== 'undefined' && (window as any).__ENV?.[key]) {
    return (window as any).__ENV[key];
  }
  return ENV_MAP[key] || process?.env?.[key] || fallback;
}
