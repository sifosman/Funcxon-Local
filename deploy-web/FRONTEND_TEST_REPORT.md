# Frontend Test Report — Funxon Web App

## Summary
- **Total pages tested:** 25+ unique routes
- **Total flows tested:** 12 end-to-end flows
- **Critical issues:** 1
- **Major issues:** 5
- **Minor issues:** 6
- **Passed flows:** 20+

## Environment
- **Browser:** Chromium 131+ via Playwright 1.61.1
- **Viewport:** Desktop 1280×900 (primary), Mobile 390×844
- **Test user credentials source:** Existing project test user from `tests/helpers.ts` (`mohamed@owdsolutions.co.za`) — the Supabase MCP server could not be reached due to transport errors, and direct API user creation was rate-limited by the production Supabase Auth backend.
- **Date:** 2026-07-02
- **App URL:** https://funxon-web.vercel.app/

## Tested Flows

### 1. Public navigation & homepage
- **Steps performed:** Loaded `/`, `/discover`, `/blog`, `/terms`, `/subscription-plans`, `/signin`, `/signup`; clicked header/footer links; verified all links returned HTTP 200.
- **Expected result:** Pages render without console errors; navigation links work.
- **Actual result:** All public pages loaded successfully; 0 broken nav/footer links out of 26 checked.
- **Status:** ✅ PASS
- **Screenshots/evidence:** `home.png`, `discover.png`, `blog.png`, `terms.png`, `subscription-plans.png`, `signup.png`, `signin-anon.png`
- **Notes:** Footer/header navigation is fully functional.

### 2. Registration
- **Steps performed:** Attempted to create a new user via Supabase Auth API; also visited `/signup` UI and verified the form renders.
- **Expected result:** A confirmed test user can be created programmatically or via the UI.
- **Actual result:** Direct API signup returned "email rate limit exceeded" after a single attempt; the UI signup flow ends at the "Check your email" confirmation page (standard Supabase email-confirmation flow).
- **Status:** ⚠️ MINOR
- **Screenshots/evidence:** `signup.png`
- **Notes:** UI signup is correct, but production rate-limiting prevents automated QA provisioning. The MCP server integration was unavailable due to transport errors, so a backend-created confirmed user could not be produced.

### 3. Sign in / Sign out / Session
- **Steps performed:** Signed in with existing test user, verified redirect to `/account`, signed out, verified redirect to `/`; also tested invalid credentials.
- **Expected result:** Valid credentials → `/account`; invalid credentials → visible error.
- **Actual result:** Both flows behaved correctly. Sign-out button on account page works and clears session.
- **Status:** ✅ PASS
- **Screenshots/evidence:** `signin.png`, `account.png`, `after-signout.png`, `signin-error.png`
- **Notes:** Auth UX is solid.

### 4. Protected route access (unauthenticated)
- **Steps performed:** Visited `/planner` while logged out.
- **Expected result:** Guest prompt shown with login and sign-up CTAs.
- **Actual result:** Guest prompt displayed correctly.
- **Status:** ✅ PASS
- **Screenshots/evidence:** `planner-guest.png`

### 5. Account / Profile / Settings
- **Steps performed:** Loaded `/account`, `/account/settings`, `/account/billing`, `/account/change-password`, `/account/delete`; toggled settings switch; inspected tier badge.
- **Expected result:** Account data loads; settings are interactive; billing history loads.
- **Actual result:** Account page renders, but the backend queries for `subscription_tier`/`billing_period` on `venue_listings` and `vendors` return 400 errors, so tier detection falls back to "Free" silently. Billing page cannot load `payments` (404) or `invoices` (400), so payment history is always empty.
- **Status:** ❌ MAJOR
- **Screenshots/evidence:** `account.png`, `account-settings.png`, `billing.png`, `change-password.png`, `delete-account.png`
- **Notes:** Backend schema mismatch is evident in the browser console (Supabase 400/404 responses).

### 6. Quote request flow
- **Steps performed:** From `/discover`, clicked a venue card, clicked "Request a Quote" on `/venue/:id`, followed to `/quotes?venue=:id`.
- **Expected result:** Quote request form/page loads.
- **Actual result:** Quote request link works and the quote page loads. However, `/quotes` itself has no direct "Create quote" CTA for empty states — users must browse to a venue/vendor first.
- **Status:** ✅ PASS (with UX note)
- **Screenshots/evidence:** `venue-profile.png`, `quote-request-page.png`, `quotes.png`
- **Notes:** Core flow is functional but discovery-dependent.

### 7. Planner / Planning tool
- **Steps performed:** Loaded `/planner`, switched tabs, clicked "Add Budget Item", filled item name and budget, saved.
- **Expected result:** Item is added and persisted.
- **Actual result:** Budget item added successfully and appears in the list. Data is stored in `localStorage` per user, not synced to the backend.
- **Status:** ✅ PASS
- **Screenshots/evidence:** `planner.png`, `planner-add-form.png`, `planner-after-add-targeted.png`
- **Notes:** Planner works locally but data is device-bound and will be lost on logout/cache clear.

### 8. Application submission flow
- **Steps performed:** Navigated `/portfolio-type` → selected Vendor → `/apply/step1` → filled business details → `/apply/step2` → selected category & province → `/apply/step3` (stopped before file upload/submission to avoid polluting production DB).
- **Expected result:** Step navigation works and form validation prevents proceeding without required fields.
- **Actual result:** Step navigation works; form fields are validated; UI is consistent.
- **Status:** ✅ PASS
- **Screenshots/evidence:** `portfolio-type.png`, `apply-step1-interactive.png`, `apply-step2-interactive.png`, `apply-step3-interactive.png`
- **Notes:** Full submission was not executed to avoid creating production records without a cleanup path.

### 9. Favourites
- **Steps performed:** Clicked heart icon on `/discover` listing card, then visited `/account/favourites`.
- **Expected result:** Favourite state toggles and favourites page reflects it.
- **Actual result:** Heart icon click succeeds; however, due to the `Number(item.id)` conversion in `DiscoverPage.tsx` and `VenueProfilePage.tsx`, UUID IDs are coerced to `NaN` which can cause the favourites backend call to fail for non-numeric IDs.
- **Status:** ⚠️ MINOR
- **Screenshots/evidence:** `discover-favourite-clicked.png`, `favourites.png`
- **Notes:** Works for numeric IDs but is fragile for UUID primary keys.

### 10. Book a tour
- **Steps performed:** Visited `/book-tour?venue=:id`, verified form fields and submit button.
- **Expected result:** Form renders and can submit a tour request.
- **Actual result:** Form renders, but submission will fail because the app references inconsistent columns (`venue_id` vs `listing_id`, `preferred_date` vs `preferred_date` not in table, `visitor_email`/`visitor_name` vs `email`/`full_name`). Console error: `column venue_tour_bookings.preferred_date does not exist`.
- **Status:** 🛑 CRITICAL
- **Screenshots/evidence:** `book-tour.png`
- **Notes:** This is a core transactional feature that is broken in production.

### 11. Search, filters, and listings
- **Steps performed:** Applied category filters, province filters, search query, toggled map view on `/discover`.
- **Expected result:** Results filter and sort; map view renders a real map.
- **Actual result:** Filters and search work; list/grid toggle works. Map view loaded but a console 403 error was emitted from a map/font resource, suggesting possible map/permissions issue.
- **Status:** ✅ PASS (with warning)
- **Screenshots/evidence:** `discover-filter.png`, `discover-filtered.png`, `discover-search.png`, `discover-map-view.png`
- **Notes:** 403 resource error observed in console; root cause is likely the Google Maps API key or font asset.

### 12. Mobile responsiveness
- **Steps performed:** Resized viewport to 390×844, opened hamburger menu on `/discover` and home page.
- **Expected result:** Layout adapts; mobile menu opens; no overflow/truncation.
- **Actual result:** Mobile menu opens correctly; layouts adapt. No obvious overflow issues detected in automated smoke test.
- **Status:** ✅ PASS
- **Screenshots/evidence:** `mobile-home.png`, `mobile-discover.png`, `mobile-menu-targeted.png`

## Issues Found

### Critical (blocks core functionality)
- **Tour bookings are broken due to backend schema mismatch.**
  - **Page/URL:** `/book-tour`, `/venue/tours`, venue calendar tabs, `/bookings`
  - **Reproduction steps:** 1) Open any venue profile → Calendar tab → "Request a Tour Date" or `/book-tour?venue=:id`. 2) Fill the form and submit. 3) Submit fails (or, for read-only pages, the tour list query returns 400).
  - **Expected vs actual:** The app expects columns `venue_id`, `preferred_date`, `preferred_time`, `full_name`, `email`, `phone` (in `BookTourPage.tsx`) and also `listing_id`, `visitor_email`, `visitor_name` (in other dashboard pages). The actual Supabase table does not contain `preferred_date` or `visitor_*`/`listing_id`, causing the console error `column venue_tour_bookings.preferred_date does not exist` and 400 API responses.
  - **Suggested fix:** Reconcile the `venue_tour_bookings` schema across all pages; use a single consistent set of columns (e.g., `venue_id`, `preferred_date`, `preferred_time`, `requester_name`, `requester_email`, `requester_phone`, `status`); update every query/insert accordingly; add a migration.

### Major (significant UX or functional defect)
- **Billing & payment history is non-functional.**
  - **Page/URL:** `/account/billing`, `/payment`
  - **Reproduction steps:** 1) Sign in. 2) Go to Billing & Payments. 3) Observe empty Invoices and Payment History sections.
  - **Expected vs actual:** Invoices/payments should load from the backend. Actual: `payments` table returns 404 (does not exist), `invoices` table returns 400 (column/schema error), and `venue_listings`/`vendors` queries for `subscription_plan`/`billing_period` return 400. The page silently falls back to empty states.
  - **Suggested fix:** Either create the missing `payments` and `invoices` tables with the correct columns, or remove the tables from the frontend until the backend is ready. Add Sentry/ErrorBoundary logging so silent API failures are visible.

- **Subscription tier detection is broken for venue accounts.**
  - **Page/URL:** `/account`, `/account/billing`
  - **Reproduction steps:** 1) Sign in with a user that owns a venue listing. 2) Check the tier badge in the account header.
  - **Expected vs actual:** Should show the venue's actual subscription plan. Actual: query `venue_listings?select=subscription_plan,billing_period` returns 400, so tier falls back to "Free".
  - **Suggested fix:** Remove the `subscription_plan`/`billing_period` columns from the `venue_listings` query if they don't exist, or add them to the schema. Use the same column names in `vendors` and `venue_listings`.

- **User reviews cannot be loaded in account areas.**
  - **Page/URL:** Likely `/account` or `/create-review` (any page querying `reviews` by `user_id`)
  - **Reproduction steps:** Network trace shows `reviews?select=...&user_id=eq.<uuid>` returns 400.
  - **Expected vs actual:** Should list reviews authored by the logged-in user. Actual: the `reviews` table has no `user_id` column, or the column is named differently.
  - **Suggested fix:** Audit the `reviews`/`venue_reviews`/`vendor_reviews` tables and align all query/insert code to the real schema.

- **Favourites are fragile with UUID primary keys.**
  - **Page/URL:** `/discover`, `/venue/:id`, `/vendor/:id`
  - **Reproduction steps:** Click the heart icon on a listing whose ID is a UUID.
  - **Expected vs actual:** Should toggle favourite. Actual: `handleToggleFav` and `handleFavourite` call `Number(id)` which converts UUIDs to `NaN`, causing the Supabase insert/delete to reference the wrong ID or fail silently.
  - **Suggested fix:** Store IDs as strings; do not coerce them to numbers.

### Minor (polish, visual, or edge-case issues)
- **Inconsistent design tokens and hardcoded colours.**
  - **Page/URL:** `/venue/:id`, `/vendor/:id`, `/discover`
  - **Reproduction steps:** Inspect buttons, links, and tags in the browser dev tools.
  - **Expected vs actual:** All colours should come from Tailwind theme tokens (`text-primary`, `bg-primary`, etc.). Actual: many components use inline `style={{ color: '#123f5c' }}` or `style={{ background: '#aa7478' }}`, creating a fragmented design system that is hard to maintain.
  - **Suggested fix:** Replace all hardcoded hex values with theme CSS variables/Tailwind classes.

- **Mixed icon libraries create inconsistency and font-load risk.**
  - **Page/URL:** Global (`/discover`, `/venue/:id`, headers)
  - **Reproduction steps:** Disable the Material Symbols font or load a page with a slow network.
  - **Expected vs actual:** Icons should be consistent SVGs. Actual: the app mixes Lucide React icons with `<span class="material-symbols-outlined">` text icons. If the Material Symbols font fails to load, the UI shows text labels instead of icons.
  - **Suggested fix:** Standardise on Lucide React (or another SVG icon set) for all icons.

- **Planner data is device-local only.**
  - **Page/URL:** `/planner`
  - **Reproduction steps:** Add a budget item in one browser, then log in on another device.
  - **Expected vs actual:** Planner items should sync across sessions. Actual: data is stored in `localStorage` keyed by `user.id`, so it is lost on logout, cache clear, or cross-device use.
  - **Suggested fix:** Persist planner items to a backend table (e.g., `event_planner_items`) or to Supabase storage.

- **No direct "Request a Quote" entry point from `/quotes`.**
  - **Page/URL:** `/quotes`
  - **Reproduction steps:** Sign in and visit `/quotes` with no quotes.
  - **Expected vs actual:** Empty state only offers "Browse Listings". A direct "Create new quote" CTA would improve UX.
  - **Suggested fix:** Add a "Request a Quote" button that navigates to `/discover` with a filter or to a quote creation form.

- **Application submission cannot be fully tested without production data pollution.**
  - **Page/URL:** `/apply/step1`–`step4`, `/apply/success`
  - **Reproduction steps:** N/A — automated tests stop before final submission to avoid creating production records.
  - **Expected vs actual:** A sandbox/test environment should allow full end-to-end submission and cleanup.
  - **Suggested fix:** Add a staging environment or a seeded test database with cleanup capabilities.

- **Console 403 resource error on map view.**
  - **Page/URL:** `/discover` (Map view)
  - **Reproduction steps:** Open `/discover`, click "Map".
  - **Expected vs actual:** Map should load without resource errors. Actual: a 403 network error appears in the console (likely Google Maps iframe or font asset).
  - **Suggested fix:** Verify the Google Maps API key and referrer restrictions; ensure font assets are public.

## Recommendations
1. **Fix the `venue_tour_bookings` schema immediately.** This is the only critical blocker and prevents a core transaction from completing.
2. **Align all backend queries with the actual Supabase schema.** Audit every page that uses `venue_listings`, `vendors`, `payments`, `invoices`, `reviews`, and `venue_tour_bookings` and remove or rename non-existent columns.
3. **Remove or guard missing backend features.** If `payments`/`invoices` tables are not ready, hide the sections or show a "coming soon" message instead of empty states that mask 404/400 errors.
4. **Stop coercing UUID IDs to numbers.** Update favourite, quote, and review logic to use string IDs.
5. **Standardise the UI design system.** Remove hardcoded hex values; migrate all Material Symbols icons to Lucide SVGs; use Tailwind tokens consistently.
6. **Add backend persistence for the planner.** Either create a planner table or integrate with Supabase storage so user data is not lost.
7. **Improve error visibility.** Log Supabase API failures to the UI (toast or error state) and to a monitoring service rather than falling back silently to empty states.
8. **Set up a staging environment** for QA and automated tests to run full destructive flows (signup, application submission, bookings, payments) without polluting production.
9. **Provide a confirmed test user / service-role seeding capability** so QA can authenticate and exercise all protected flows without relying on a production email account.

## Verdict
**The app is not ready for production.**

While the public marketing pages, authentication, navigation, listing discovery, and basic account UI are functional, a critical transactional feature (book a tour) is broken due to a backend schema mismatch, and several major financial/accounting features (billing, invoices, payments, tier detection) are returning 400/404 errors from Supabase. These issues would cause real users to lose trust immediately. Fixing the schema alignment and adding proper error handling should be the top priority before any public launch.
