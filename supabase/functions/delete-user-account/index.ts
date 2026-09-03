import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const userId = user.id;
  const errors: string[] = [];

  const trackError = (label: string, err: any) => {
    console.error(`[delete-user-account] ${label} failed:`, err);
    errors.push(`${label}: ${err?.message || String(err)}`);
  };

  try {
    // 1. Delete user-owned rows that are not tied to vendor/venue FKs.
    await supabaseAdmin.from('subscriber_applications').delete().eq('user_id', userId).then(() => {}, (err) => trackError('subscriber_applications', err));
    await supabaseAdmin.from('shortlists').delete().eq('user_id', userId).then(() => {}, (err) => trackError('shortlists user_id', err));
    await supabaseAdmin.from('venues').delete().eq('user_id', userId).then(() => {}, (err) => trackError('venues', err));

    // 2. Vendor data — children first, then parents.
    const { data: vendors } = await supabaseAdmin.from('vendors').select('id').eq('user_id', userId);
    if (vendors && vendors.length > 0) {
      const vendorIds = vendors.map((v: any) => v.id);
      await supabaseAdmin.from('quote_revisions').delete().in('vendor_id', vendorIds).then(() => {}, (err) => trackError('quote_revisions', err));
      await supabaseAdmin.from('subscription_invoices').delete().in('vendor_id', vendorIds).then(() => {}, (err) => trackError('subscription_invoices', err));
      await supabaseAdmin.from('vendor_tags').delete().in('vendor_id', vendorIds).then(() => {}, (err) => trackError('vendor_tags', err));
      await supabaseAdmin.from('vendor_registrations').delete().in('vendor_id', vendorIds).then(() => {}, (err) => trackError('vendor_registrations', err));
      await supabaseAdmin.from('vendor_portfolio_items').delete().in('vendor_id', vendorIds).then(() => {}, (err) => trackError('vendor_portfolio_items', err));
      await supabaseAdmin.from('vendor_catalog_items').delete().in('vendor_id', vendorIds).then(() => {}, (err) => trackError('vendor_catalog_items', err));
      await supabaseAdmin.from('vendor_catalogue_items').delete().in('vendor_id', vendorIds).then(() => {}, (err) => trackError('vendor_catalogue_items', err));
      await supabaseAdmin.from('vendor_documents').delete().in('vendor_id', vendorIds).then(() => {}, (err) => trackError('vendor_documents', err));
      await supabaseAdmin.from('vendor_capacity_specs').delete().in('vendor_id', vendorIds).then(() => {}, (err) => trackError('vendor_capacity_specs', err));
      await supabaseAdmin.from('vendor_geographic_coverage').delete().in('vendor_id', vendorIds).then(() => {}, (err) => trackError('vendor_geographic_coverage', err));
      await supabaseAdmin.from('vendor_availability_calendar').delete().in('vendor_id', vendorIds).then(() => {}, (err) => trackError('vendor_availability_calendar', err));
      await supabaseAdmin.from('reviews').delete().in('vendor_id', vendorIds).then(() => {}, (err) => trackError('reviews', err));
      await supabaseAdmin.from('quote_requests').delete().in('vendor_id', vendorIds).then(() => {}, (err) => trackError('quote_requests vendor_id', err));
      await supabaseAdmin.from('shortlists').delete().in('vendor_id', vendorIds).then(() => {}, (err) => trackError('shortlists vendor_id', err));
      await supabaseAdmin.from('vendors').delete().in('id', vendorIds).then(() => {}, (err) => trackError('vendors', err));
    }

    // 3. Venue listing data — children first, then parents.
    const { data: venues } = await supabaseAdmin.from('venue_listings').select('id').eq('user_id', userId);
    if (venues && venues.length > 0) {
      const venueIds = venues.map((v: any) => v.id);
      await supabaseAdmin.from('venue_availability_calendar').delete().in('venue_id', venueIds).then(() => {}, (err) => trackError('venue_availability_calendar', err));
      await supabaseAdmin.from('venue_catalogue_items').delete().in('listing_id', venueIds).then(() => {}, (err) => trackError('venue_catalogue_items', err));
      await supabaseAdmin.from('venue_documents').delete().in('venue_id', venueIds).then(() => {}, (err) => trackError('venue_documents', err));
      await supabaseAdmin.from('venue_quote_requests').delete().in('listing_id', venueIds).then(() => {}, (err) => trackError('venue_quote_requests', err));
      await supabaseAdmin.from('venue_tour_bookings').delete().in('listing_id', venueIds).then(() => {}, (err) => trackError('venue_tour_bookings', err));
      await supabaseAdmin.from('venue_reviews').delete().in('venue_id', venueIds).then(() => {}, (err) => trackError('venue_reviews', err));
      await supabaseAdmin.from('shortlists').delete().in('venue_id', venueIds).then(() => {}, (err) => trackError('shortlists venue_id', err));
      await supabaseAdmin.from('venue_listings').delete().in('id', venueIds).then(() => {}, (err) => trackError('venue_listings', err));
    }

    // 4. Delete the public.users row (has FK to auth.users).
    await supabaseAdmin.from('users').delete().eq('auth_user_id', userId).then(() => {}, (err) => trackError('users', err));

    // 5. Delete the auth user.
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteError) {
      throw deleteError;
    }

    return new Response(JSON.stringify({ success: true, warnings: errors.length > 0 ? errors : undefined }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message, details: errors }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
