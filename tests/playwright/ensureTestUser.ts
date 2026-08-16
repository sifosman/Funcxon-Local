import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { getSupabaseCreds } from './helpers';

const TEMP_DIR = path.join(__dirname, '.temp');
const CREDENTIALS_FILE = path.join(TEMP_DIR, 'test-user-credentials.json');

export interface TestAccounts {
  attendee: { email: string; password: string; fullName: string; userId: string };
  lister: { email: string; password: string; fullName: string; userId: string; vendorId?: number; venueId?: number };
}

/**
 * Global setup: creates two disposable test users via Supabase Admin API.
 *   1. "attendee" — a plain user with no vendor/venue (for mobile-local specs)
 *   2. "lister"   — a user with a test vendor + venue (for desktop-vercel specs)
 *
 * Both users are email-confirmed and have a public.users profile row.
 * Credentials are written to .temp/test-user-credentials.json for auth-setup.ts.
 */
export default async function globalSetup() {
  const { url, serviceRoleKey } = getSupabaseCreds();
  const timestamp = Date.now();

  const attendeeEmail = `e2e-attendee-${timestamp}@owdsolutions.co.za`;
  const attendeePassword = `TestPass${timestamp}!A`;
  const listerEmail = `e2e-lister-${timestamp}@owdsolutions.co.za`;
  const listerPassword = `TestPass${timestamp}!L`;

  fs.mkdirSync(TEMP_DIR, { recursive: true });

  if (!serviceRoleKey) {
    console.warn(
      '⚠️  SUPABASE_SERVICE_ROLE_KEY is not set. Skipping admin user creation in globalSetup.'
    );
    console.warn(
      '   Tests will fall back to PW_E2E_USERNAME / PW_E2E_PASSWORD credentials.'
    );
    fs.writeFileSync(
      CREDENTIALS_FILE,
      JSON.stringify({
        attendee: {
          email: process.env.PW_E2E_USERNAME || attendeeEmail,
          password: process.env.PW_E2E_PASSWORD || attendeePassword,
          fullName: 'E2E Attendee',
          userId: '',
        },
        lister: {
          email: process.env.PW_E2E_USERNAME || listerEmail,
          password: process.env.PW_E2E_PASSWORD || listerPassword,
          fullName: 'E2E Lister',
          userId: '',
        },
        adminCreated: false,
      })
    );
    return;
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Clean up any leftover test users from a previous crashed run
  await cleanupLeftoverUsers(supabase, ['e2e-attendee-', 'e2e-lister-']);

  // --- Create attendee user ---
  const attendee = await createUser(supabase, {
    email: attendeeEmail,
    password: attendeePassword,
    fullName: 'E2E Attendee',
    role: 'user',
  });

  // --- Create lister user ---
  const lister = await createUser(supabase, {
    email: listerEmail,
    password: listerPassword,
    fullName: 'E2E Lister',
    role: 'vendor',
  });

  // --- Create test vendor for the lister ---
  let vendorId: number | undefined;
  let categoryId = 11;
  try {
    const { data: categories } = await supabase.from('categories').select('id').limit(1);
    if (categories && categories.length > 0) categoryId = categories[0].id;
  } catch { /* use default */ }

  const { data: vendor, error: vendorErr } = await supabase
    .from('vendors')
    .insert({
      name: `E2E Test Vendor ${timestamp}`,
      category_id: categoryId,
      user_id: lister.userId,
      address_line_1: '123 Test Street',
      city: 'Johannesburg',
      province: 'Gauteng',
      email: `e2e-vendor-${timestamp}@example.com`,
      subscription_tier: 'get_started',
      online_quotes: true,
    })
    .select('id')
    .single();

  if (vendorErr) {
    console.warn(`[globalSetup] Failed to create test vendor: ${vendorErr.message}`);
  } else {
    vendorId = vendor.id;
    console.log(`[globalSetup] Created test vendor ${vendorId} for lister ${lister.userId}`);
  }

  // --- Create test venue for the lister ---
  let venueId: number | undefined;
  const { data: venue, error: venueErr } = await supabase
    .from('venues')
    .insert({
      name: `E2E Test Venue ${timestamp}`,
      user_id: lister.userId,
      subscription_plan_key: 'get_started',
      subscription_status: 'active',
      billing_period: 'monthly',
    })
    .select('id')
    .single();

  if (venueErr) {
    console.warn(`[globalSetup] Failed to create test venue: ${venueErr.message}`);
  } else {
    venueId = venue.id;
    console.log(`[globalSetup] Created test venue ${venueId} for lister ${lister.userId}`);
  }

  const accounts: TestAccounts = {
    attendee: { ...attendee },
    lister: { ...lister, vendorId, venueId },
  };

  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify({ ...accounts, adminCreated: true }));
  console.log(`✅ Global setup complete: attendee=${attendeeEmail}, lister=${listerEmail}`);
}

async function createUser(
  supabase: any,
  opts: { email: string; password: string; fullName: string; role: string }
): Promise<{ email: string; password: string; fullName: string; userId: string }> {
  const { data, error } = await supabase.auth.admin.createUser({
    email: opts.email,
    password: opts.password,
    email_confirm: true,
    user_metadata: { name: opts.fullName, role: opts.role },
  });
  if (error) {
    throw new Error(`Global setup failed to create user ${opts.email}: ${error.message}`);
  }
  const userId = data.user!.id;

  const { error: insertError } = await (supabase.from('users') as any).insert({
    auth_user_id: userId,
    email: opts.email,
    full_name: opts.fullName,
    role: opts.role,
  });
  if (insertError && !insertError.message.toLowerCase().includes('duplicate')) {
    console.warn(`[globalSetup] Failed to insert public.users row for ${opts.email}: ${insertError.message}`);
  }

  return { email: opts.email, password: opts.password, fullName: opts.fullName, userId };
}

async function cleanupLeftoverUsers(
  supabase: any,
  emailPrefixes: string[]
): Promise<void> {
  const { data: users } = await supabase.auth.admin.listUsers();
  if (!users?.users) return;
  for (const user of users.users) {
    if (emailPrefixes.some((p) => user.email?.startsWith(p))) {
      // Clean up vendor/venue records first
      await (supabase.from('quote_requests') as any).delete().in(
        'vendor_id',
        (await (supabase.from('vendors') as any).select('id').eq('user_id', user.id)).data?.map((v: any) => v.id) || []
      );
      await (supabase.from('vendors') as any).delete().eq('user_id', user.id);
      await (supabase.from('venues') as any).delete().eq('user_id', user.id);
      await (supabase.from('users') as any).delete().eq('auth_user_id', user.id);
      await supabase.auth.admin.deleteUser(user.id).catch(() => {});
      console.log(`[globalSetup] Cleaned up leftover test user ${user.email}`);
    }
  }
}

export async function globalTeardown() {
  if (!fs.existsSync(CREDENTIALS_FILE)) return;

  const creds = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf8'));
  const { url, serviceRoleKey } = getSupabaseCreds();

  if (serviceRoleKey) {
    const supabase = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    for (const account of [creds.attendee, creds.lister]) {
      if (!account?.userId) continue;
      // Clean up vendor/venue records
      await (supabase.from('vendors') as any).delete().eq('user_id', account.userId).then(() => {});
      await (supabase.from('venues') as any).delete().eq('user_id', account.userId).then(() => {});
      await (supabase.from('users') as any).delete().eq('auth_user_id', account.userId).then(() => {});
      await supabase.auth.admin.deleteUser(account.userId).catch((err: any) => {
        console.warn(`[globalTeardown] Admin delete failed for ${account.email}: ${err.message}`);
      });
      console.log(`[globalTeardown] Deleted test user ${account.email}`);
    }
  }

  fs.unlinkSync(CREDENTIALS_FILE);
  console.log('✅ Global teardown complete');
}
