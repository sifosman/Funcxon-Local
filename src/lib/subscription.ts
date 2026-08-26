import { supabase } from './supabaseClient';

export type SubscriptionTier = {
  id: number;
  tier_name: string;
  photo_limit: number;
  price_monthly: number | null;
  price_yearly: number | null;
  features: Record<string, any> | null;
  is_active: boolean;
  created_at: string;
};

export type VendorWithSubscription = {
  id: number;
  subscription_tier: string;
  photo_count: number;
};

// Canonical per-tier photo/video limits for vendor subscriptions.
// These match the agreed product spec (get_started: 5 photos / 0 videos,
// premium: 25 / 5, premium_plus: 50 / 10) and are used as a single source of
// truth when the database tier lookup is unavailable.
export const VENDOR_TIER_LIMITS: Record<string, { photos: number; videos: number }> = {
  get_started: { photos: 5, videos: 0 },
  free: { photos: 5, videos: 0 },
  basic: { photos: 10, videos: 1 },
  premium: { photos: 25, videos: 5 },
  premium_plus: { photos: 50, videos: 10 },
};

export function getVendorTierLimits(tierKey: string): { photos: number; videos: number } {
  const normalized = String(tierKey ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  return VENDOR_TIER_LIMITS[normalized] ?? VENDOR_TIER_LIMITS.get_started;
}

export async function getSubscriptionTiers(): Promise<SubscriptionTier[]> {
  const { data, error } = await supabase
    .from('subscription_tiers')
    .select('*')
    .eq('is_active', true)
    .order('price_monthly', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getVendorPhotoLimit(vendorId: number): Promise<number> {
  const { data, error } = await supabase
    .from('vendors')
    .select('subscription_tier')
    .eq('id', vendorId)
    .single();

  if (error) return VENDOR_TIER_LIMITS.get_started.photos;

  const tierKey = data.subscription_tier || 'get_started';
  const { data: tier } = await supabase
    .rpc('get_vendor_photo_limit', { vendor_tier: tierKey });

  return tier ?? getVendorTierLimits(tierKey).photos;
}

export async function getVendorVideoLimit(vendorId: number): Promise<number> {
  const { data, error } = await supabase
    .from('vendors')
    .select('subscription_tier')
    .eq('id', vendorId)
    .single();

  if (error) return VENDOR_TIER_LIMITS.get_started.videos;

  const tierKey = data.subscription_tier || 'get_started';
  const { data: limit } = await supabase
    .rpc('get_vendor_video_limit', { vendor_tier: tierKey });

  return limit ?? getVendorTierLimits(tierKey).videos;
}

export async function getVendorPhotoCount(vendorId: number): Promise<number> {
  const { data, error } = await supabase
    .from('vendors')
    .select('photo_count')
    .eq('id', vendorId)
    .single();

  if (error) return 0;
  return data?.photo_count || 0;
}

export async function incrementVendorPhotoCount(vendorId: number): Promise<void> {
  const { error } = await supabase.rpc('increment_photo_count', { vendor_id: vendorId });
  if (error) throw error;
}

export async function decrementVendorPhotoCount(vendorId: number): Promise<void> {
  const { error } = await supabase.rpc('decrement_photo_count', { vendor_id: vendorId });
  if (error) throw error;
}

export async function canUploadMorePhotos(vendorId: number): Promise<boolean> {
  const [limit, count] = await Promise.all([
    getVendorPhotoLimit(vendorId),
    getVendorPhotoCount(vendorId),
  ]);
  return count < limit;
}

export async function getRemainingPhotoSlots(vendorId: number): Promise<number> {
  const [limit, count] = await Promise.all([
    getVendorPhotoLimit(vendorId),
    getVendorPhotoCount(vendorId),
  ]);
  return Math.max(0, limit - count);
}

export function formatPhotoCountText(current: number, limit: number): string {
  return `${current} of ${limit} photos used`;
}

export function getPhotoCountColor(current: number, limit: number): string {
  const percentage = (current / limit) * 100;
  if (percentage >= 100) return '#DC2626'; // red
  if (percentage >= 80) return '#F59E0B'; // yellow
  return '#059669'; // green
}
