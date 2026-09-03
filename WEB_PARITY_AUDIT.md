# Web vs Mobile Parity Audit

**Scope note:** This is a single Expo/React Native codebase (`App.tsx`, `src/`) that targets iOS,
Android, and Web from the same source, using `Platform.OS` checks and `.web.tsx` file overrides
for the few places behavior needs to diverge (native APIs have no direct web equivalent).
"Disparity" in this context means a `Platform.OS === 'web'` branch, or a `.web.tsx` override,
that is missing a feature, is stubbed out, or has drifted from the native implementation — not
two independently maintained apps.

This audit covers the platform-conditional code paths found via `Platform.OS`, `Platform.select`,
and `.web.tsx` file search across `src/`. It does **not** yet cover every one of the 65+ screens
line-by-line — see "Not yet audited" at the bottom for what's left to check if you want full
coverage.

---

## Confirmed findings

### 0. CRITICAL: PayFast checkout never completes on web (subscription payments broken) — FIXED
Files: `src/screens/SubscriptionCheckoutScreen.tsx:746`, `src/screens/BillingScreen.tsx:201`,
`supabase/functions/payfast-redirect/index.ts`.

- Both the initial subscription checkout and the billing/renewal payment flow call:
  ```ts
  const result = await WebBrowser.openAuthSessionAsync(checkoutUrl, 'funxon://payment/success');
  ```
  with **no `Platform.OS` branching** — the exact same custom URI scheme (`funxon://payment/success`)
  is used as the expected redirect target on both native and web.
- Per Expo's own docs, `WebBrowser.openAuthSessionAsync` on web is implemented via `window.open()`
  and detects completion by polling the popup's URL for a match against `redirectUrl`.
- The PayFast return/cancel URLs point at the Supabase edge function
  `supabase/functions/payfast-redirect/index.ts`, which **unconditionally** 302-redirects to
  `funxon://payment/success` (or `.../cancel`) regardless of platform:
  ```ts
  const redirectTo = type === 'cancel' ? 'funxon://payment/cancel' : 'funxon://payment/success';
  return new Response(null, { status: 302, headers: { Location: redirectTo } });
  ```
- A browser cannot navigate to an unregistered custom URI scheme like `funxon://`. On web, after a
  user completes payment on PayFast, the popup will fail to follow that redirect, the URL will
  never match `redirectUrl`, and `openAuthSessionAsync` will never resolve as `success` — the user
  is left stuck on a broken redirect page and must manually close the popup, which resolves as
  `dismiss`/`cancel`. **The app then treats a possibly-successful payment as cancelled** and never
  activates the subscription, even though PayFast may have actually charged the customer.
- This affects: new vendor/venue subscription checkout (`SubscriptionCheckoutScreen.tsx`) and
  subscription renewal payments (`BillingScreen.tsx`) — i.e., **web users currently cannot
  reliably pay for or renew a subscription at all.**
- **Root cause:** the redirect target must differ by platform.

**Fix applied** (in `SubscriptionCheckoutScreen.tsx` and `BillingScreen.tsx`):
- On web, `return_url`/`cancel_url` sent to PayFast now point directly at this web app's own
  origin (`window.location.origin + '/payment/success'` / `/payment/cancel`) instead of the
  Supabase `payfast-redirect` edge function. This works because `App.tsx`'s React Navigation
  `linking` config already maps the path `payment/success` (with alias `payment/cancel`) to the
  `Billing` screen — that config was already web-compatible, it just was never used for web
  checkout before.
- `WebBrowser.openAuthSessionAsync` is now called with a platform-aware redirect target: the bare
  web origin on web (so it matches both the success and cancel paths), and the existing
  `funxon://payment/success` scheme on native (unchanged, still goes through the edge function).
- Native behavior is unchanged — still uses `payfast-redirect/index.ts` → `funxon://` deep link.
  The edge function itself did not need to change.

**Known caveat to test:** `WebBrowser.openAuthSessionAsync` on web opens `window.open()`, which
browsers may block if not triggered synchronously by the user's click. Both screens do a couple of
`await supabase...upsert(...)` calls before opening the checkout popup, which could introduce
enough delay for some browsers (notably mobile web / Safari) to block the popup
(`ERR_WEB_BROWSER_BLOCKED`). This was not introduced by this fix — it was a pre-existing risk in
the same code path — but **please manually test the full checkout flow on web (desktop + mobile
browser) end-to-end with a real/sandbox PayFast payment** to confirm the popup opens and the
success/cancel redirect is correctly detected.

### 1. `PlannerScreen.tsx` vs `PlannerScreen.web.tsx` — duplicated logic (maintenance risk)
- `src/screens/PlannerScreen.web.tsx` calls the shared `usePlanner()` hook
  (`src/hooks/usePlanner.ts`) for all state/data logic.
- `src/screens/PlannerScreen.tsx` (native) does **not** use the hook — it re-implements the exact
  same ~400 lines of state, Supabase queries, and handlers inline.
- Current behavior is identical between the two (verified line-by-line for task/budget/calendar
  logic), so there's no active bug today. But because the logic is duplicated rather than shared,
  any future fix or feature added to one will silently NOT apply to the other.
- **Fix:** Refactor `PlannerScreen.tsx` to consume `usePlanner()` like the web version does,
  keeping only the native-specific JSX (native `DateTimePicker`, `WebView` html map, keyboard
  behavior). Complexity: medium (mostly deletion + wiring).

### 2. Native `DateTimePicker` modal only — web uses plain `<input type="date">`
Files: `PlannerScreen.tsx`/`PlannerScreen.web.tsx`, `QuoteRequestScreen.tsx`,
`subscriber/CalendarUpdatesScreen.tsx`.
- This divergence is intentional and looks correctly implemented (native modal picker vs. HTML
  date input). No action needed, but worth a manual UX pass to confirm the web date input styling
  matches the design system (native TextMuted color logic is manually re-implemented in
  `WebDateInput`, `PlannerScreen.web.tsx:12-38` — double-check it stays in sync with theme changes).

### 3. Maps — three different rendering paths depending on platform/screen
- `MapRadiusSelector.tsx`: web → `<iframe>` Google Maps embed; native → `WebView`. Consistent.
- `VenueProfileScreen.tsx` / `VendorProfileScreen.tsx`: web → `<iframe>` via `webMapEmbedUrl`;
  native → static `Image` (Google Static Maps) with `WebView` HTML fallback if the image fails.
  This means native has a **fallback** path that web does not (if `webMapEmbedUrl` is null on web,
  user sees "Map unavailable" with no equivalent fallback). Low priority, but worth adding a
  fallback (e.g. plain address text + "Open in Google Maps" link) for parity when coordinates are
  missing.

### 4. `expo-location` reverse geocoding (`DiscoverScreen.tsx:1862`)
- Uses `expo-location`'s `reverseGeocodeAsync`, lazy-imported. This works on web via browser
  Geolocation API + expo-location's web shim, but the **permission prompt UX differs** (browser
  native prompt vs. OS permission dialog) and can silently fail on non-HTTPS origins. **Needs
  manual testing** on an actual web deployment (HTTPS) to confirm the flow completes and the
  province auto-detect logic (`DiscoverScreen.tsx:1859-1865`) actually fires on web.

### 5. Social sign-in (`AuthContext.tsx`)
- Google: native uses `@react-native-google-signin`; web uses Supabase's `signInWithOAuth`
  redirect flow. Implementations are separate but parallel — no missing functionality found.
- Facebook/Apple: use `signInWithOAuth` on web, and `WebBrowser.openAuthSessionAsync` +
  `AuthSession` redirect on native. Both paths are implemented.
- **However:** no UI in `SignInScreen.tsx` or `SignUpScreen.tsx` currently exposes Apple/Facebook
  buttons at all (only the `signInWithProvider` plumbing exists) — this is a product decision, not
  a platform disparity, but flagging in case it's meant to be there and got dropped from one
  screen.

### 6. WhatsApp / Share links (`VendorProfileScreen.tsx`, `VenueProfileScreen.tsx`)
- Checked `handleShare` and contact `whatsappUrl` construction — both correctly use
  `https://wa.me/...` universal links (with `Share.share` fallback only in the "share profile"
  action, not the primary contact button). Verified this works on web. No disparity.

### 7. Cosmetic-only web branches (no functional gap)
- `AppHeader.tsx`: sticky positioning + box-shadow only applied on web — intentional, cosmetic.
- `FloatingHelpButton.tsx`: iOS-only shadow opacity tweak — intentional, cosmetic.

### 8. Media upload (`mediaUpload.ts`, `applicationService.ts`)
- Correctly branches on `data:`/`blob:` URIs (web) vs native file `uri` + `expo-file-system`.
  Verified logic handles both paths. No disparity.

### 9. Image/video pickers
- All usages found are `ImagePicker.launchImageLibraryAsync` (library only) — no
  `launchCameraAsync` calls, so no camera-only feature would break on web. No disparity found.

---

### 10. `DiscoverScreen.tsx` and `AttendeeHomeScreen.tsx` — no disparity found
- Both import `Platform` but have no meaningful `Platform.OS` branches (aside from the
  `expo-location` reverse-geocode call noted in #4 for `DiscoverScreen.tsx`). Core
  browse/search/filter logic is identical across platforms. No action needed.

### 11. `VendorProfileScreen.tsx` / `VenueProfileScreen.tsx` — no additional disparity found
- Beyond the map fallback (fixed in #3 above), both screens have no other `Platform.OS`
  branches. Galleries (`Carousel` from `react-native-reanimated-carousel`), image zoom modal
  (`ImageZoomModal`), booking/quote CTAs (View Catalogue, Request Quote, Book Tour, View
  Reviews), reviews tab, and contact section all render identically on web and native.
  `Linking.openURL()` and `Share.share()` both work on web. No action needed.

### 12. `src/navigation/*` — no disparity found
- All 6 navigation files (`AppNavigator`, `RootNavigator`, `AttendeeNavigator`,
  `AuthNavigator`, `ProfileNavigator`, `QuotesNavigator`) have **zero** `Platform.OS` checks.
  All screens, tabs, and stacks are registered identically for web and native.
- The only platform-specific behavior is the `.web.tsx` file override for `PlannerScreen`,
  which Expo's bundler handles automatically (web gets `PlannerScreen.web.tsx`, native gets
  `PlannerScreen.tsx`). Both now consume the same `usePlanner()` hook, so logic is shared.
- No action needed.

## Not yet audited (recommend next passes)

Given the size of the codebase (65+ screens), the following haven't been checked in detail yet:

- **Push notifications** — `src/lib/notifications.ts` is DB-only (in-app notification records),
  no `expo-notifications`/device push token registration was found anywhere in `src/`. If push
  notifications are expected to work on mobile but not web, confirm this is intentional and that
  there's no half-finished native push code elsewhere (not found in this pass, but wasn't a
  targeted search).

## Suggested next step

Finding #0 (PayFast web checkout) is now fixed — `tsc --noEmit` passes clean on both edited files.
**Please manually test the full web checkout + renewal payment flow** (see caveat above) since this
touches real money and couldn't be end-to-end tested in this environment. After that, the remaining
"not yet audited" items above are lower-risk cosmetic/UX areas rather than broken-functionality
candidates, based on the patterns seen so far.
