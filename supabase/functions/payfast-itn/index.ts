import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
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
    .select('id')
    .eq('pending_payment_id', mPaymentId)
    .maybeSingle();

  if (venueErr) {
    console.error('Failed to lookup venue by pending_payment_id', venueErr);
  }

  if (venueRow?.id) {
    const { error: updErr } = await supabase
      .from('venues')
      .update({
        subscription_status: 'active',
        subscription_started_at: nowIso,
        last_payment_at: nowIso,
        payfast_payment_id: pfPaymentId,
      })
      .eq('id', venueRow.id);

    if (updErr) {
      console.error('Failed to activate venue subscription', updErr);
    }
  }

  // Vendor activation: match on pending_payment_id
  const { data: vendorRow, error: vendorErr } = await supabase
    .from('vendors')
    .select('id')
    .eq('pending_payment_id', mPaymentId)
    .maybeSingle();

  if (vendorErr) {
    console.error('Failed to lookup vendor by pending_payment_id', vendorErr);
  }

  if (vendorRow?.id) {
    const { error: updErr } = await supabase
      .from('vendors')
      .update({
        subscription_status: 'active',
        subscription_started_at: nowIso,
        last_payment_at: nowIso,
        payfast_payment_id: pfPaymentId,
      })
      .eq('id', vendorRow.id);

    if (updErr) {
      console.error('Failed to activate vendor subscription', updErr);
    }
  }

  if (!venueRow?.id && !vendorRow?.id) {
    console.warn('No venue/vendor matched pending_payment_id', { m_payment_id: mPaymentId });
  }

  return new Response('OK', { status: 200 });
});
