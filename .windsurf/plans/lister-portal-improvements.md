# Lister Portal Improvements Plan

25-item improvement set for the Funxon app (React Native / Expo, Supabase backend).
Confirmed decisions from user:
- Item 12: reuse existing lister screens; only fill gaps (vendor listers have NO reachable quote-requests screen — `VendorDashboardScreen` exists but is not registered in any navigator).
- Item 14: email button must open the mobile app if installed, otherwise fall back to the website (universal link behaviour).
- Item 19: audit ALL delete-account entry points so no user can self-delete; everything becomes an admin request.
- Item 1: SKIP — keep header as-is (user decision).
- Item 11: DEFERRED — user notes the mobile floating button opens the Help section; revisit scope later.
- Item 22: SKIP — "Preview only": no owner buttons on public profiles; management stays inside the Lister Portal.

## Phase 1 — Edit portfolio forms (items 2, 4, 5)
Files: `src/screens/subscriber/UpdateVendorPortfolioScreen.tsx`, `src/screens/subscriber/UpdateVenuePortfolioScreen.tsx`
- Item 2: Add explicit "Add Image" / "Edit image" / "Delete image" labelled buttons in the Portfolio Photos section (main image + additional photos), keeping tier photo/video limits.
- Item 4: Convert free-text fields to dropdown pickers: services (`service_options` / `vendor_tags`), amenities (`amenities`), address fields (province, country), price range (`price_range`). Build a small shared dropdown component (or reuse an existing picker if present). Save values back to the same DB columns used today.
- Item 5: Verify photos can be added/edited/deleted on both forms; surface plan photo limit in the UI (vendor already shows "{n} of {limit}"; align venue).
- Verify DB columns exist on `vendors` and `venue_listings` before wiring (price_range, service_options, vendor_tags, amenities).

## Phase 2 — ListerPortfolioScreen quick actions (items 6, 9, 12, 13)
Files: `src/screens/subscriber/ListerPortfolioScreen.tsx`, `src/screens/ListersPortalScreen.tsx`, `src/screens/BillingScreen.tsx`, `src/screens/FeaturedPackagesScreen.tsx`, `src/navigation/ProfileNavigator.tsx`
- Item 6: Fix quote-request card "Respond" buttons in the desktop preview to open the lister quote screen (`VenueQuoteRequests` for venues; vendor equivalent from Phase 2 item 12).
- Item 9: Add "My Subscription" quick-action tab → navigate to `Billing` (screen exists in ProfileNavigator).
- Item 12: Add "View Bookings" + "View Quotes" quick actions per portfolio type:
  - Venue: `VenueQuoteRequests`, `VenueTourBookings` (both registered).
  - Vendor: register/reuse `VendorDashboardScreen` (already lists incoming quote requests; currently unreachable) OR extract a minimal `VendorQuoteRequestsScreen`. For vendor bookings, investigate reuse of `BookingDetail`/`CalendarUpdates`; create a minimal vendor bookings list only if nothing fits.
- Item 13: In `ListersPortalScreen`, below the login button, add "Upgrade" (→ `SubscriptionPlans`/`VenueListingPlans`) and "Get Featured" (→ `FeaturedPackages`) buttons.

## Phase 3 — Public venue profile (items 7, 8, 23)
Files: `src/screens/VenueProfileScreen.tsx`
- Item 7: Show price range in the About section (check `venue_listings.price_range`; display e.g. "Price range: R5,000 – R20,000" or tier label if symbolic).
- Item 8: Rename/replace the "Calendar" tab with a "Catalogue" tab (reuse `VenueCatalogueView` content in-tab or keep navigation).
- Item 23: Fix Book a Tour visibility for paid venues: `canBookTours` (line ~445) only checks `venue.features['instant_tour_bookings']`; add fallback to plan/entitlement check so paid-plan venues always show the button; verify Calendar tab works on web.

## Phase 4 — Public vendor profile (item 24)
Files: `src/screens/VendorProfileScreen.tsx`
- Add "Contact for availability" button below existing action buttons; wire to WhatsApp if `whatsapp_number` exists else email; verify responsive on mobile + desktop.

## Phase 5 — Help centre (items 16, 17, 18)
Files: `src/screens/PortfolioAssistanceScreen.tsx`, `src/components/HelpCenterModal.tsx`, and wherever the "Need help?" button is rendered (locate via grep at implementation time).
- Item 16: When FAQs open (including via `openFaqs` param), auto-scroll the ScrollView to the top of the FAQ section.
- Item 17: Add support phone number next to email/website in HelpCenterModal contact options.
- Item 18: Rename "Need help?" → "Help Desk" and change the popup to a right-side slide-in panel (desktop + web); keep a bottom sheet on native mobile if simpler — confirm preference at implementation.

## Phase 6 — Emails & deep links (items 3, 10, 14)
Files: `supabase/functions/send-attendee-welcome-email/index.ts`, `supabase/functions/send-admin-notification/index.ts`, `supabase/functions/send-quote-notifications/index.ts`, `src/auth/AuthContext.tsx`, `app.json`, `src/navigation/linking.ts` (create if missing), root navigator
- Item 3: Welcome email — resolve full name from the `users` table (`full_name`) instead of auth metadata fallback (both email/password and OAuth paths).
- Item 10: Admin new-signup email — include business name + business email, plus a link to that vendor/venue portfolio in the admin portal.
- Item 14: Quote-request email CTA — replace `funxon://` deep link with `https://funxon.co.za/quotes/...` universal link; register linking config (scheme + prefixes + route mapping to Quotes tab / lister quote screens). Fallback = website opens on desktop/no-app devices. Requires `assetlinks.json` / apple-app-site-association on the web host — flag as follow-up infra task if not already in place.

## Phase 7 — Attendee-side fixes (items 15, 21, 25)
Files: `src/screens/QuotesScreen.tsx`, `src/components/AppHeader.tsx`, `src/screens/MarketingPermissionsScreen.tsx`
- Item 15: Quotes screen "Make changes" on a quoted item → navigate to `QuoteResponse`/`QuoteDetail` (align with `handleSecondaryAction` quoted branch).
- Item 21: AppHeader "Hi {name}" button → navigate into the Account tab's actual profile screen (`AccountMain`) so the profile page opens (currently navigates to `Account` root, which may not resolve).
- Item 25: Marketing permissions — default email marketing toggle ON when the user has no saved preference (`marketing_opt_in` null → true); keep saved false honoured.

## Phase 8 — Account deletion audit (item 19)
Files: `src/screens/subscriber/ListerPortfolioScreen.tsx`, `src/components/HelpCenterModal.tsx`, attendee account/settings screens (locate via grep for delete-account handlers)
- Verify lister flow only inserts into `account_deletion_requests` (already done in ListerPortfolioScreen); align wording to "Request account deletion".
- Convert every other self-delete entry point to the same admin-request pattern.

## Phase 9 — Media upload validation (item 20)
Files: `src/screens/subscriber/ApplicationStep3Screen.tsx`, `UpdateVendorPortfolioScreen.tsx`, `UpdateVenuePortfolioScreen.tsx`, `VendorCatalogueScreen.tsx`
- Add video file-size validation before upload (default limit: 50 MB unless bucket config says otherwise — confirm) with a ThemedAlert message; keep existing tier count limits.

## Deferred / skipped items
- Item 1: skipped (keep header as-is).
- Item 11: deferred pending clarification of which floating button is meant (the existing one opens Help).
- Item 22: skipped (public profiles stay identical for owners and attendees).

## Verification
- `npx tsc --noEmit` after each phase; fix lint warnings on touched files.
- Manual test matrix per phase: vendor + venue accounts, mobile + desktop layouts, quote lifecycle (request → quote → respond) including email CTA deep link.
- Edge-function changes (items 3, 10, 14) require redeploying the functions and re-testing real emails.
