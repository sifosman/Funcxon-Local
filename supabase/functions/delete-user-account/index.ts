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

  try {
    // Delete related data in order to avoid FK violations
    // 1. Delete from users table
    await supabaseAdmin.from('users').delete().eq('auth_user_id', userId);

    // 2. Delete vendor portfolios and related data
    const { data: vendors } = await supabaseAdmin.from('vendors').select('id').eq('user_id', userId);
    if (vendors && vendors.length > 0) {
      const vendorIds = vendors.map((v: any) => v.id);
      await supabaseAdmin.from('vendor_portfolio_items').delete().in('vendor_id', vendorIds);
      await supabaseAdmin.from('vendor_catalogue_items').delete().in('vendor_id', vendorIds);
      await supabaseAdmin.from('vendor_documents').delete().in('vendor_id', vendorIds);
      await supabaseAdmin.from('vendor_capacity_specs').delete().in('vendor_id', vendorIds);
      await supabaseAdmin.from('vendor_geographic_coverage').delete().in('vendor_id', vendorIds);
      await supabaseAdmin.from('vendor_availability_calendar').delete().in('vendor_id', vendorIds);
      await supabaseAdmin.from('reviews').delete().in('vendor_id', vendorIds);
      await supabaseAdmin.from('quote_requests').delete().in('vendor_id', vendorIds);
      await supabaseAdmin.from('vendors').delete().in('id', vendorIds);
    }

    // 3. Delete venue listings and related data
    const { data: venues } = await supabaseAdmin.from('venue_listings').select('id').eq('user_id', userId);
    if (venues && venues.length > 0) {
      const venueIds = venues.map((v: any) => v.id);
      await supabaseAdmin.from('venue_availability_calendar').delete().in('venue_id', venueIds);
      await supabaseAdmin.from('venue_documents').delete().in('venue_id', venueIds);
      await supabaseAdmin.from('venue_reviews').delete().in('venue_id', venueIds);
      await supabaseAdmin.from('venue_listings').delete().in('id', venueIds);
    }

    // 4. Delete auth user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteError) {
      throw deleteError;
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
