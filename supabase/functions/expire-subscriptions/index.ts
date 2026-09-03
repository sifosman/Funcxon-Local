// expire-subscriptions Edge Function
// Finds vendors and venues whose subscription_expires_at has passed and
// downgrades them to the free tier. Resets premium features and clears
// featured_listing flag.
//
// Triggered daily by a pg_cron job (see migration).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const results = {
      vendors_expired: 0,
      venues_expired: 0,
      errors: [] as string[],
    };

    // ── Expire vendors ──────────────────────────────────────────────────────
    const { data: expiredVendors, error: vendorFetchErr } = await supabase
      .from('vendors')
      .select('id, name, subscription_tier, billing_period')
      .eq('subscription_status', 'active')
      .neq('subscription_tier', 'get_started')
      .not('subscription_expires_at', 'is', null)
      .lt('subscription_expires_at', new Date().toISOString());

    if (vendorFetchErr) {
      results.errors.push(`vendor fetch: ${vendorFetchErr.message}`);
    } else if (expiredVendors && expiredVendors.length > 0) {
      for (const vendor of expiredVendors) {
        const { error: updErr } = await supabase
          .from('vendors')
          .update({
            subscription_status: 'expired',
            subscription_tier: 'get_started',
            featured_listing: false,
            reminder_5day_sent: false,
            reminder_1day_sent: false,
          })
          .eq('id', vendor.id);

        if (updErr) {
          results.errors.push(`vendor ${vendor.id}: ${updErr.message}`);
        } else {
          console.log(`Vendor ${vendor.id} (${vendor.name}) downgraded to free tier`);
          results.vendors_expired++;
        }
      }
    }

    // ── Expire venues ───────────────────────────────────────────────────────
    const { data: expiredVenues, error: venueFetchErr } = await supabase
      .from('venues')
      .select('id, name, features')
      .eq('subscription_status', 'active')
      .neq('subscription_plan_key', 'get_started')
      .not('subscription_expires_at', 'is', null)
      .lt('subscription_expires_at', new Date().toISOString());

    if (venueFetchErr) {
      results.errors.push(`venue fetch: ${venueFetchErr.message}`);
    } else if (expiredVenues && expiredVenues.length > 0) {
      for (const venue of expiredVenues) {
        // Strip premium feature flags from the features JSON
        const currentFeatures = (venue.features as Record<string, any>) ?? {};
        const downgradedFeatures = {
          ...currentFeatures,
          featured: false,
          featured_listings: false,
          catalogue_pricelist: false,
          analytics: false,
          quote_requests: false,
          website_social_links: false,
          instant_tour_bookings: false,
          dedicated_portfolio_manager: false,
        };

        const { error: updErr } = await supabase
          .from('venues')
          .update({
            subscription_status: 'expired',
            subscription_plan_key: 'get_started',
            features: downgradedFeatures,
          })
          .eq('id', venue.id);

        if (updErr) {
          results.errors.push(`venue ${venue.id}: ${updErr.message}`);
        } else {
          console.log(`Venue ${venue.id} (${venue.name}) downgraded to get_started`);
          results.venues_expired++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Subscription expiry check complete',
        results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('expire-subscriptions error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to process expired subscriptions',
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
