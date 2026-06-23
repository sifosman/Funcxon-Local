import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function calculateExpiryDate(startDate: Date, billingPeriod: string): Date {
  const expiry = new Date(startDate);
  switch (billingPeriod) {
    case '6_month':
      expiry.setMonth(expiry.getMonth() + 6);
      break;
    case '12_month':
    case 'yearly':
      expiry.setFullYear(expiry.getFullYear() + 1);
      break;
    default: // 'monthly' and anything else
      expiry.setMonth(expiry.getMonth() + 1);
  }
  return expiry;
}

async function md5Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('MD5', data);
  return toHex(hash);
}

function buildSignaturePayload(params: Record<string, string>, passphrase?: string): string {
  const keys = Object.keys(params)
    .filter((k) => k !== 'signature')
    .sort();

  const parts: string[] = [];
  for (const key of keys) {
    const value = params[key];
    if (value === undefined || value === '') continue;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  }

  let payload = parts.join('&');
  if (passphrase) {
    payload += `&passphrase=${encodeURIComponent(passphrase)}`;
  }
  return payload;
}

function parseFormUrlEncoded(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  const params = new URLSearchParams(body);
  for (const [k, v] of params.entries()) {
    out[k] = v;
  }
  return out;
}

Deno.serve(async (req: Request) => {
  // PayFast ITN will POST x-www-form-urlencoded
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const rawBody = await req.text();
  const params = parseFormUrlEncoded(rawBody);

  // Basic required fields
  const paymentStatus = params.payment_status;
  const mPaymentId = params.m_payment_id;
  const signature = params.signature;

  if (!paymentStatus || !mPaymentId || !signature) {
    return new Response('Bad Request', { status: 400 });
  }

  // Verify signature (PayFast)
  const passphrase = Deno.env.get('PAYFAST_PASSPHRASE') ?? undefined;
  const expectedPayload = buildSignaturePayload(params, passphrase);
  const expectedSig = await md5Hex(expectedPayload);

  if (expectedSig !== signature) {
    console.error('PayFast ITN signature mismatch', { m_payment_id: mPaymentId });
    return new Response('Invalid signature', { status: 400 });
  }

  // Only activate on COMPLETE
  if (paymentStatus !== 'COMPLETE') {
    return new Response('OK', { status: 200 });
  }

  // Service role client for DB updates
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return new Response('Server misconfigured', { status: 500 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const pfPaymentId = params.pf_payment_id ?? null;

  const nowIso = new Date().toISOString();

  // Venue activation: match on pending_payment_id
  const { data: venueRow, error: venueErr } = await supabase
    .from('venues')
    .select('id, subscription_plan_key, features, billing_period')
    .eq('pending_payment_id', mPaymentId)
    .maybeSingle();

  if (venueErr) {
    console.error('Failed to lookup venue by pending_payment_id', venueErr);
  }

  if (venueRow?.id) {
    const isPaidVenuePlan = venueRow.subscription_plan_key !== 'get_started';
    const updatedFeatures = isPaidVenuePlan
      ? { ...(venueRow.features ?? {}), featured: true, featured_listings: true }
      : (venueRow.features ?? {});

    const now = new Date();
    const venueExpiresAt = calculateExpiryDate(now, venueRow.billing_period || 'monthly');

    const { error: updErr } = await supabase
      .from('venues')
      .update({
        subscription_status: 'active',
        subscription_started_at: nowIso,
        subscription_expires_at: venueExpiresAt.toISOString(),
        next_payment_due: venueExpiresAt.toISOString(),
        last_payment_at: nowIso,
        payfast_payment_id: pfPaymentId,
        features: updatedFeatures,
      })
      .eq('id', venueRow.id);

    if (updErr) {
      console.error('Failed to activate venue subscription', updErr);
    } else {
      console.log(`Venue ${venueRow.id} activated. Expires: ${venueExpiresAt.toISOString()}`);
    }
  }

  // Vendor activation: match on pending_payment_id
  const { data: vendorRow, error: vendorErr } = await supabase
    .from('vendors')
    .select('id, subscription_tier, billing_period')
    .eq('pending_payment_id', mPaymentId)
    .maybeSingle();

  if (vendorErr) {
    console.error('Failed to lookup vendor by pending_payment_id', vendorErr);
  }

  if (vendorRow?.id) {
    const isPaidVendorTier = vendorRow.subscription_tier !== 'get_started';

    const now = new Date();
    const vendorExpiresAt = calculateExpiryDate(now, vendorRow.billing_period || 'monthly');

    const { error: updErr } = await supabase
      .from('vendors')
      .update({
        subscription_status: 'active',
        subscription_started_at: nowIso,
        subscription_expires_at: vendorExpiresAt.toISOString(),
        next_payment_due: vendorExpiresAt.toISOString(),
        last_payment_at: nowIso,
        payfast_payment_id: pfPaymentId,
        featured_listing: isPaidVendorTier,
        reminder_5day_sent: false,
        reminder_1day_sent: false,
      })
      .eq('id', vendorRow.id);

    if (updErr) {
      console.error('Failed to activate vendor subscription', updErr);
    } else {
      console.log(`Vendor ${vendorRow.id} activated. Expires: ${vendorExpiresAt.toISOString()}`);
    }
  }

  if (!venueRow?.id && !vendorRow?.id) {
    console.warn('No venue/vendor matched pending_payment_id', { m_payment_id: mPaymentId });
  }

  return new Response('OK', { status: 200 });
});
