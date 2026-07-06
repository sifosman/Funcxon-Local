import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { getSupabaseCreds } from './helpers';

const TEMP_DIR = path.join(__dirname, '.temp');
const CREDENTIALS_FILE = path.join(TEMP_DIR, 'test-user-credentials.json');

export default async function globalSetup() {
  const { url, serviceRoleKey } = getSupabaseCreds();
  const timestamp = Date.now();
  const fullName = 'E2E Test User';
  const email = process.env.PW_E2E_TEST_EMAIL || `e2e-test-${timestamp}@owdsolutions.co.za`;
  const password = process.env.PW_E2E_TEST_PASSWORD || `TestPass${timestamp}!`;

  if (!serviceRoleKey) {
    console.warn(
      '⚠️  SUPABASE_SERVICE_ROLE_KEY is not set. Skipping admin user creation in globalSetup.'
    );
    console.warn(
      '   Phase 1 will fall back to the existing hardcoded user (PW_E2E_USERNAME) or use the UI sign-up flow.'
    );
    fs.mkdirSync(TEMP_DIR, { recursive: true });
    fs.writeFileSync(
      CREDENTIALS_FILE,
      JSON.stringify({ email, password, fullName, adminCreated: false })
    );
    return;
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Delete any existing test user with the same email first
  const { data: users } = await supabase.auth.admin.listUsers();
  const existing = users?.users?.find((u) => u.email === email);
  if (existing) {
    await supabase.auth.admin.deleteUser(existing.id);
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: fullName, role: 'attendee' },
  });
  if (error) {
    throw new Error(`Global setup failed to create test user: ${error.message}`);
  }
  const userId = data.user!.id;

  // Insert the matching public.users profile row if it does not already exist
  const { error: insertError } = await supabase.from('users').insert({
    auth_user_id: userId,
    email,
    full_name: fullName,
    role: 'user',
  });
  if (insertError && !insertError.message.toLowerCase().includes('duplicate')) {
    console.warn(`[globalSetup] Failed to insert public.users row: ${insertError.message}`);
  }

  fs.mkdirSync(TEMP_DIR, { recursive: true });
  fs.writeFileSync(
    CREDENTIALS_FILE,
    JSON.stringify({ email, password, fullName, userId, adminCreated: true })
  );

  process.env.PW_E2E_TEST_EMAIL = email;
  process.env.PW_E2E_TEST_PASSWORD = password;
  console.log(`✅ Global setup created disposable test user ${email}`);
}

export async function globalTeardown() {
  if (!fs.existsSync(CREDENTIALS_FILE)) return;

  const creds = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf8'));
  const { email, password, userId } = creds;
  const { url, serviceRoleKey } = getSupabaseCreds();

  if (serviceRoleKey) {
    const supabase = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const id = userId;
    if (id) {
      await supabase.auth.admin.deleteUser(id).catch((err) => {
        console.warn(`[globalTeardown] Admin delete failed: ${err.message}`);
      });
    } else {
      const { data: users } = await supabase.auth.admin.listUsers();
      const existing = users?.users?.find((u) => u.email === email);
      if (existing) {
        await supabase.auth.admin.deleteUser(existing.id).catch((err) => {
          console.warn(`[globalTeardown] Admin delete failed: ${err.message}`);
        });
      }
    }
  } else if (creds.adminCreated) {
    // Fallback: sign in as the user and invoke the delete-user-account edge function
    const { anonKey } = getSupabaseCreds();
    const userClient = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await userClient.auth.signInWithPassword({ email, password });
    if (data?.session) {
      await userClient.functions.invoke('delete-user-account').catch((err) => {
        console.warn(`[globalTeardown] delete-user-account failed: ${err.message}`);
      });
    } else {
      console.warn(`[globalTeardown] Could not sign in as test user: ${error?.message}`);
    }
  }

  fs.unlinkSync(CREDENTIALS_FILE);
}
