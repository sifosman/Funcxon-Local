import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { getSupabaseCreds } from './helpers';

const TEMP_DIR = path.join(__dirname, '.temp');
const CREDENTIALS_FILE = path.join(TEMP_DIR, 'test-user-credentials.json');
const STORAGE_STATE_ATTENDEE = path.join(__dirname, 'storage-state-attendee.json');
const STORAGE_STATE_LISTER = path.join(__dirname, 'storage-state-lister.json');

const MOBILE_URL = 'http://localhost:8081';
const DESKTOP_URL = 'https://funcxon-local.vercel.app';

/**
 * Extracts the Supabase project ref from the project URL.
 * e.g. https://fhlocaqndxawkbztncwo.supabase.co -> fhlocaqndxawkbztncwo
 */
function getProjectRef(url: string): string {
  const match = url.match(/https?:\/\/([a-z0-9]+)\.supabase\.co/);
  return match ? match[1] : '';
}

/**
 * Builds a Playwright storageState JSON object with the Supabase auth session
 * injected into localStorage for the given origin.
 *
 * The key format used by Supabase JS v2 is: sb-{project-ref}-auth-token
 */
function buildStorageState(origin: string, session: any, projectRef: string) {
  const storageKey = `sb-${projectRef}-auth-token`;
  const localStorageEntries: Array<{ name: string; value: string }> = [
    { name: storageKey, value: JSON.stringify(session) },
  ];

  // Also set the POPIA consent flag so the consent modal doesn't block tests
  // AsyncStorage on web uses localStorage with the @funcxon_ prefix
  localStorageEntries.push({ name: '@funcxon_data_consent_accepted', value: 'true' });

  return {
    origins: [
      {
        origin,
        localStorage: localStorageEntries,
      },
    ],
  };
}

/**
 * Signs in a user programmatically via the Supabase JS SDK and writes
 * a storageState JSON file that Playwright can load to skip UI login.
 */
async function signInAndWriteStorageState(
  email: string,
  password: string,
  origin: string,
  outputPath: string
): Promise<void> {
  const { url, anonKey } = getSupabaseCreds();
  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    throw new Error(`auth-setup: Failed to sign in as ${email}: ${error?.message}`);
  }

  const projectRef = getProjectRef(url);
  if (!projectRef) {
    throw new Error(`auth-setup: Could not extract project ref from URL ${url}`);
  }

  const storageState = buildStorageState(origin, data.session, projectRef);
  fs.writeFileSync(outputPath, JSON.stringify(storageState, null, 2));
  console.log(`[auth-setup] Wrote storageState for ${email} → ${outputPath}`);
}

/**
 * Global setup entry point for the new two-project Playwright config.
 * Reads credentials from .temp/test-user-credentials.json (written by ensureTestUser.ts)
 * and produces two storageState files:
 *   - storage-state-attendee.json  (for mobile-local project)
 *   - storage-state-lister.json    (for desktop-vercel project)
 */
export default async function authSetup() {
  if (!fs.existsSync(CREDENTIALS_FILE)) {
    throw new Error(
      'auth-setup: test-user-credentials.json not found. Ensure ensureTestUser.ts globalSetup ran first.'
    );
  }

  const creds = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf8'));
  fs.mkdirSync(TEMP_DIR, { recursive: true });

  const tasks: Promise<void>[] = [];

  if (creds.attendee) {
    tasks.push(
      signInAndWriteStorageState(
        creds.attendee.email,
        creds.attendee.password,
        MOBILE_URL,
        STORAGE_STATE_ATTENDEE
      )
    );
  }

  if (creds.lister) {
    tasks.push(
      signInAndWriteStorageState(
        creds.lister.email,
        creds.lister.password,
        DESKTOP_URL,
        STORAGE_STATE_LISTER
      )
    );
  }

  // If adminCreated is false (no service role key), use fallback credentials
  if (!creds.attendee && !creds.lister) {
    const email = process.env.PW_E2E_USERNAME || creds.email;
    const password = process.env.PW_E2E_PASSWORD || creds.password;
    if (email && password) {
      tasks.push(
        signInAndWriteStorageState(email, password, MOBILE_URL, STORAGE_STATE_ATTENDEE)
      );
      tasks.push(
        signInAndWriteStorageState(email, password, DESKTOP_URL, STORAGE_STATE_LISTER)
      );
    }
  }

  await Promise.all(tasks);
  console.log('✅ auth-setup: All storageState files written');
}
