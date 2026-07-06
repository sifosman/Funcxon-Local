# Playwright E2E Tests

This directory contains the phased Playwright end-to-end test suite for the Funxon web app. Tests run against the local Expo web server at `http://127.0.0.1:4100`.

## Required Environment Variables

The Playwright harness loads the project root `.env` file automatically. Make sure the following variables are set:

| Variable | Required? | Purpose |
|----------|-----------|---------|
| `EXPO_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL. |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key for client-side auth. |
| `SUPABASE_SERVICE_ROLE_KEY` | Strongly recommended | Allows `globalSetup` to create and confirm a disposable test user per run. Without it, Phase 1 falls back to the existing credentials in `PW_E2E_USERNAME`/`PW_E2E_PASSWORD`. |
| `PW_E2E_USERNAME` | Fallback only | Email of an existing confirmed user when the service role key is not available. |
| `PW_E2E_PASSWORD` | Fallback only | Password of the existing confirmed user. |

## Running the Tests

### Start the web server (optional)

Playwright's `webServer` config will start Expo automatically, but you can also start it manually:

```bash
CI=1 npx expo start --web --port 4100
```

### Run Phase 1 (Authentication & Onboarding)

```bash
npx playwright test --grep "Phase 1"
```

### Run Phase 2 (Home, Search & Discovery)

```bash
npx playwright test --grep "Phase 2"
```

### Run Phase 3 (Vendor & Venue Profile Screens)

```bash
npx playwright test --grep "Phase 3"
```

### Run Phase 5 (Venue Tour Booking Flow)

```bash
npx playwright test --grep "Phase 5"
```

Phase 5 requires `SUPABASE_SERVICE_ROLE_KEY` to simulate the listing owner proposing an alternative tour date and to verify the notification deep link. Without it, the phase is skipped.

### Run all Playwright tests

```bash
npx playwright test
```

## Helper Library

`helpers.ts` exports the utilities used by every phase:

- `createTestUser(page)` — creates a disposable user through the public sign-up UI.
- `deleteTestUser(email, password)` — deletes the user and all associated data.
- `acceptPopiaConsent(page)` — accepts the POPIA data-consent modal.
- `clickBottomTab(page, label)` — taps the bottom navigation bar.
- `openListingCard(page, name)` — opens a listing from Discover/Search results.
- `gotoApp(page, path)` — navigates to a route and dismisses any consent modal.
- `loginWithCredentials(page, email, password)` — logs in through the welcome/auth form with explicit credentials.
- `loginAsGlobalTestUser(page)` — logs in using the disposable user created by `globalSetup`.
- `getGlobalTestUser()` — returns the credentials produced by `globalSetup`.
- `getServiceRoleSupabase()` — creates a Supabase client using `SUPABASE_SERVICE_ROLE_KEY`.
- `getNotificationBellCount(page)` — reads the unread count from the notification bell badge.
- `clickNotificationBell(page)` — opens the in-app notification center.

## Global Setup / Teardown

`ensureTestUser.ts` is used as both `globalSetup` and `globalTeardown` in `playwright.config.ts`. When `SUPABASE_SERVICE_ROLE_KEY` is present, it:

1. Creates a fresh, email-confirmed Supabase auth user.
2. Inserts the matching `public.users` profile row.
3. Writes the credentials to `tests/playwright/.temp/test-user-credentials.json`.
4. Deletes the auth user and all related data after the test run.

If the service role key is not set, the harness will warn and fall back to the existing user provided in `PW_E2E_USERNAME`/`PW_E2E_PASSWORD`, and the new-user creation path will be skipped.
