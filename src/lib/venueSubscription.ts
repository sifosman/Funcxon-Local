import { supabase } from './supabaseClient';

export type VenuePlanKey = 'get_started' | 'monthly' | '6_month' | '12_month';

export type VenueSubscriptionEntitlement = {
  planKey: VenuePlanKey;
  status: 'inactive' | 'trial' | 'active' | 'past_due' | 'cancelled';
  photoUploadLimit: number;
  videoUploadLimit: number;
  features: Record<string, any>;
};

export type VenueFeatureKey =
  | 'catalogue_pricelist'
  | 'dedicated_portfolio_manager'
  | 'analytics'
  | 'quote_requests'
  | 'website_social_links'
  | 'instant_tour_bookings';

const FALLBACK: VenueSubscriptionEntitlement = {
  planKey: 'get_started',
  status: 'inactive',
  photoUploadLimit: 10,
  videoUploadLimit: 1,
  features: {},
};

export async function getMyVenueEntitlement(authUserId: string): Promise<VenueSubscriptionEntitlement> {
  try {
    const { data: venueRow, error: venueErr } = await supabase
      .from('venues')
      .select('subscription_plan_key, subscription_status')
      .eq('user_id', authUserId)
      .maybeSingle();

    if (venueErr) {
      console.warn('getMyVenueEntitlement: venues lookup failed', venueErr);
      return FALLBACK;
    }

    const planKey = (venueRow?.subscription_plan_key || FALLBACK.planKey) as VenuePlanKey;
    const status = (venueRow?.subscription_status || FALLBACK.status) as VenueSubscriptionEntitlement['status'];

    const { data: planRow, error: planErr } = await supabase
      .from('venue_subscription_plans')
      .select('photo_upload_limit, video_upload_limit, features')
      .eq('plan_key', planKey)
      .eq('is_active', true)
      .maybeSingle();

    if (planErr) {
      console.warn('getMyVenueEntitlement: plan lookup failed', planErr);
      return { ...FALLBACK, planKey, status };
    }

    return {
      planKey,
      status,
      photoUploadLimit: Number(planRow?.photo_upload_limit ?? FALLBACK.photoUploadLimit),
      videoUploadLimit: Number(planRow?.video_upload_limit ?? FALLBACK.videoUploadLimit),
      features: (planRow?.features as Record<string, any> | null) ?? {},
    };
  } catch (err) {
    console.warn('getMyVenueEntitlement: unexpected error', err);
    return FALLBACK;
  }
}

function readFeatureFlag(features: Record<string, any>, keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = features?.[key];
    if (typeof value === 'boolean') return value;
  }
  return undefined;
}

export function isVenueFeatureEnabled(ent: VenueSubscriptionEntitlement, feature: VenueFeatureKey): boolean {
  const planBased = ent.planKey !== 'get_started';

  switch (feature) {
    case 'catalogue_pricelist': {
      const flag = readFeatureFlag(ent.features, ['catalogue_pricelist', 'catalogue', 'pricelist']);
      return flag ?? planBased;
    }
    case 'dedicated_portfolio_manager': {
      const flag = readFeatureFlag(ent.features, ['dedicated_portfolio_manager', 'dedicated_manager']);
      return flag ?? planBased;
    }
    case 'analytics': {
      const flag = readFeatureFlag(ent.features, ['analytics', 'analytics_stats']);
      return flag ?? planBased;
    }
    case 'quote_requests': {
      const flag = readFeatureFlag(ent.features, ['quote_requests', 'online_quote_requests']);
      return flag ?? planBased;
    }
    case 'website_social_links': {
      const flag = readFeatureFlag(ent.features, ['website_social_links', 'website_links', 'social_links']);
      return flag ?? planBased;
    }
    case 'instant_tour_bookings': {
      const flag = readFeatureFlag(ent.features, ['instant_tour_bookings', 'instant_bookings', 'tour_bookings']);
      return flag ?? planBased;
    }
    default:
      return false;
  }
}
