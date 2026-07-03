# AI Change Guide — Funcxon Mobile & Web

## Project Structure

- **Mobile app:** Root folder (`c:\Users\Administrator\Pictures\Funxon-rebuildapp`)
  - React Native + Expo
  - Screens in `src/screens/` (named `XxxScreen.tsx`)
  - Business logic in `src/lib/`
  - Routing: React Navigation (native-stack, bottom-tabs)
  - Styling: React Native StyleSheet

- **Web app:** `deploy-web/` subfolder (`c:\Users\Administrator\Pictures\Funxon-rebuildapp\deploy-web`)
  - React 19 + Vite + TailwindCSS
  - Pages in `src/pages/` (named `XxxPage.tsx`)
  - Business logic in `src/lib/`
  - Routing: React Router DOM
  - Styling: TailwindCSS + HTML elements + Lucide icons

- **Shared backend:** Supabase (same project, same tables, same RLS policies)
- **Shared data fetching:** React Query (both apps use `@tanstack/react-query`)

## How to Make Changes Across Both Apps

### Workflow: Mobile first, then port to web

1. **Make the change in the mobile app** (root folder). Test it.
2. **Port the change to the web app** (`deploy-web/`):
   - **Business logic** (`src/lib/` files): Copy the logic change into the corresponding file in `deploy-web/src/lib/`. These files are nearly identical between the two apps — the only differences are minor platform-specific bits (env handling, web CORS workarounds).
   - **UI changes**: Find the corresponding page in `deploy-web/src/pages/` and re-implement using TailwindCSS + HTML elements. React Native `<View>`, `<Text>`, `<ScrollView>` become `<div>`, `<p>`, `<div className="overflow-y-auto">` etc.
3. **Test the web app**: `cd deploy-web && npm run dev`

### Screen → Page Mapping

Most mobile screens map 1:1 to web pages by renaming `Screen` → `Page`:

| Mobile (`src/screens/`) | Web (`deploy-web/src/pages/`) |
|---|---|
| `AttendeeHomeScreen.tsx` | `HomePage.tsx` |
| `DiscoverScreen.tsx` | `DiscoverPage.tsx` |
| `SignInScreen.tsx` | `SignInPage.tsx` |
| `SignUpScreen.tsx` | `SignUpPage.tsx` |
| `VendorProfileScreen.tsx` | `VendorProfilePage.tsx` |
| `VenueProfileScreen.tsx` | `VenueProfilePage.tsx` |
| `PlannerScreen.tsx` | `PlannerPage.tsx` |
| `FavouritesScreen.tsx` | `FavouritesPage.tsx` |
| `BillingScreen.tsx` | `BillingPage.tsx` |
| `SubscriptionPlansScreen.tsx` | `SubscriptionPlansPage.tsx` |
| `SubscriptionCheckoutScreen.tsx` | `SubscriptionCheckoutPage.tsx` |
| `BlogListScreen.tsx` | `BlogListPage.tsx` |
| `BlogDetailScreen.tsx` | `BlogDetailPage.tsx` |
| `ListersPortalScreen.tsx` | `ListersPortalPage.tsx` |
| `BookTourScreen.tsx` | `BookTourPage.tsx` |
| `CreateReviewScreen.tsx` | `CreateReviewPage.tsx` |
| `ChangePasswordScreen.tsx` | `ChangePasswordPage.tsx` |
| `VendorSignupSuccessScreen.tsx` | `VendorSignupSuccessPage.tsx` |
| `VenueCatalogueViewScreen.tsx` | `VenueCatalogueViewPage.tsx` |
| `VenueListingPlansScreen.tsx` | `VenueListingPlansPage.tsx` |
| `WelcomeScreen.tsx` | `WelcomePage.tsx` |
| `TermsAndPoliciesScreen.tsx` | `TermsAndPoliciesPage.tsx` |
| `LegalDocumentScreen.tsx` | `LegalDocumentPage.tsx` |
| `MarketingPermissionsScreen.tsx` | `MarketingPermissionsPage.tsx` |
| `EmailConfirmationScreen.tsx` | `EmailConfirmationPage.tsx` |
| `SubscriberLoginScreen.tsx` | `SubscriberLoginPage.tsx` |
| `SubscriberProfileScreen.tsx` | `SubscriberProfilePage.tsx` |
| `SubscriberSuiteScreen.tsx` | `SubscriberSuitePage.tsx` |
| `QuoteDetailScreen.tsx` | `QuoteDetailPage.tsx` |
| `QuoteHistoryScreen.tsx` | `VendorQuoteHistoryPage.tsx` |
| `QuoteRequestScreen.tsx` | `QuoteRequestsPage.tsx` |
| `QuotesScreen.tsx` | `QuotesPage.tsx` |
| `VendorDashboardScreen.tsx` | `VendorDashboardPage.tsx` |
| `PortfolioAssistanceScreen.tsx` | `PortfolioAssistancePage.tsx` |
| `ProfileScreen.tsx` | `PortfolioProfilePage.tsx` |

### Screens that split into multiple web pages

Some mobile screens are large and map to multiple web pages:

| Mobile screen | Web pages |
|---|---|
| `AccountScreen.tsx` | `AccountPage.tsx`, `AccountSettingsPage.tsx`, `DeleteAccountPage.tsx` |
| `AccountScreen.tsx` (subscriber screens) | `src/screens/subscriber/` → various `deploy-web/src/pages/` |
| `ApplicationStep1-4` (in `src/screens/subscriber/`) | `ApplicationStep1Page.tsx` through `ApplicationStep4Page.tsx` |
| `ApplicationStatusScreen` (subscriber) | `ApplicationStatusPage.tsx` |

### Shared `src/lib/` files (copy logic changes to both)

These files exist in BOTH `src/lib/` and `deploy-web/src/lib/` and are nearly identical:

- `supabaseClient.ts`
- `applicationService.ts`
- `favourites.ts`
- `subscription.ts`
- `venueSubscription.ts`
- `hubspotBlog.ts`
- `pendingSubscriptionCheckout.ts`

When a change is purely in these files (e.g., a new Supabase query, a business rule), make the same edit in both locations.

## Rules

1. **Keep the two codebases separate.** Do not merge, symlink, or create a monorepo.
2. **Do not share UI components.** React Native and HTML/Tailwind are fundamentally different.
3. **One change at a time.** Make a change in mobile, port to web, test both, then move on.
4. **Track what's been ported.** Use a todo list or change log to avoid forgetting.
5. **Diff lib folders periodically** to catch drift: `diff src/lib/ deploy-web/src/lib/`
