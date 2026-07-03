import { supabase } from './supabaseClient';

const DEFAULT_LIMITS: Record<string, number> = {
  vendor_free: 10,
  vendor_basic: 50,
  vendor_standard: 100,
  vendor_premium: 250,
  venue_get_started: 5,
  venue_essentials: 20,
  venue_professional: 50,
  venue_premium: 100,
};

/**
 * Look up the catalogue item limit for an entity tier from the
 * catalogue_tier_limits table. Falls back to sensible defaults when the
 * table/function is not available.
 */
export async function getCatalogueItemLimit(
  entityType: 'vendor' | 'venue',
  tier: string | null | undefined,
): Promise<number> {
  const normalizedTier = (tier ?? 'free').toLowerCase().replace(/\s+/g, '_');
  const defaultKey = `${entityType}_${normalizedTier}`;
  const defaultLimit = DEFAULT_LIMITS[defaultKey] ?? DEFAULT_LIMITS[`${entityType}_free`] ?? 10;

  try {
    const { data, error } = await supabase.rpc('get_catalogue_item_limit_by_tier', {
      p_entity_type: entityType,
      p_tier: normalizedTier,
    });
    if (error) throw error;
    if (typeof data === 'number') return data;
  } catch (err) {
    console.warn('Failed to load catalogue tier limit, using default:', err);
  }

  return defaultLimit;
}

export function isCatalogueLimitReached(
  itemCount: number,
  limit: number,
): boolean {
  return limit >= 0 && itemCount >= limit;
}
