# Web App Spec — Vendor / Subscriber Portal

**Reference codebase:** `c:\Users\Administrator\Pictures\Funxons-local\Funcxon-Local\src`
**Target codebase:** `c:\Users\Administrator\Pictures\Funxons-local\Funcxon-Local\deploy-web\src`

The entire vendor/subscriber portal is **missing** from the web app. This is the largest gap. Every feature below already exists in the mobile app. Replicate the exact logic; only styling should differ.

---

## 1. Portal Navigation Structure

In mobile, all portal screens are inside `ProfileNavigator` (the Account tab). On web, these are standalone pages accessed from the Account page.

### 1.1 Web Routing

| Screen | Route | Mobile Source |
|--------|-------|---------------|
| ListersPortal | `/listers-portal` | `src/screens/ListersPortalScreen.tsx` |
| SubscriberSuite | `/subscriber-suite` | `src/screens/SubscriberSuiteScreen.tsx` |
| SubscriberLogin | `/subscriber-login` | `src/screens/SubscriberLoginScreen.tsx` |
| SubscriberProfile | `/subscriber-profile` | `src/screens/SubscriberProfileScreen.tsx` |
| PortfolioType | `/portfolio-type` | `src/screens/subscriber/PortfolioTypeScreen.tsx` |
| ApplicationStep1 | `/apply/step-1` | `src/screens/subscriber/ApplicationStep1Screen.tsx` |
| ApplicationStep2 | `/apply/step-2` | `src/screens/subscriber/ApplicationStep2Screen.tsx` |
| ApplicationStep3 | `/apply/step-3` | `src/screens/subscriber/ApplicationStep3Screen.tsx` |
| ApplicationStep4 | `/apply/step-4` | `src/screens/subscriber/ApplicationStep4Screen.tsx` |
| ApplicationStatus | `/apply/status` | `src/screens/subscriber/ApplicationStatusScreen.tsx` |
| VendorSignupSuccess | `/apply/success` | `src/screens/VendorSignupSuccessScreen.tsx` |
| PortfolioAssistance | `/portfolio/assistance` | `src/screens/PortfolioAssistanceScreen.tsx` |
| PortfolioProfile | `/portfolio/profile` | `src/screens/subscriber/PortfolioProfileScreen.tsx` |
| UpdatePortfolio | `/portfolio/update` | `src/screens/subscriber/UpdatePortfolioScreen.tsx` |
| UpdateVendorPortfolio | `/portfolio/vendor` | `src/screens/subscriber/UpdateVendorPortfolioScreen.tsx` |
| UpdateVenuePortfolio | `/portfolio/venue` | `src/screens/subscriber/UpdateVenuePortfolioScreen.tsx` |
| VenueCatalogue | `/catalogue/venue` | `src/screens/subscriber/VenueCatalogueScreen.tsx` |
| VendorCatalogue | `/catalogue/vendor` | `src/screens/subscriber/VendorCatalogueScreen.tsx` |
| VenueQuoteRequests | `/venue/quotes` | `src/screens/subscriber/VenueQuoteRequestsScreen.tsx` |
| VendorQuoteCreate | `/vendor/quotes/create` | `src/screens/subscriber/VendorQuoteCreateScreen.tsx` |
| VendorQuoteHistory | `/vendor/quotes/history` | `src/screens/subscriber/VendorQuoteHistoryScreen.tsx` |
| VenueTourBookings | `/venue/tours` | `src/screens/subscriber/VenueTourBookingsScreen.tsx` |
| VenueAnalytics | `/venue/analytics` | `src/screens/subscriber/VenueAnalyticsScreen.tsx` |
| ActionItems | `/vendor/action-items` | `src/screens/subscriber/ActionItemsScreen.tsx` |
| CalendarUpdates | `/vendor/calendar` | `src/screens/subscriber/CalendarUpdatesScreen.tsx` |
| ListerPortfolio | `/lister-portfolio` | `src/screens/subscriber/ListerPortfolioScreen.tsx` |

---

## 2. Application Form (4-Step Flow)

**CRITICAL: Port `ApplicationFormContext` exactly.** This is the backbone of the application flow.

**Source:** `src/context/ApplicationFormContext.tsx`
**Target:** `deploy-web/src/context/ApplicationFormContext.tsx`

### 2.1 State Shape (Exact)

```ts
export interface Step1Data {
  registeredBusinessName: string;
  tradingName: string;
  funxonUserName: string;
  userWhatsapp: string;
  userEmail: string;
  ownersName: string;
  companyRegNumber: string;
  vatNumber: string;
  businessPhysicalAddress: string;
  billingAddress: string;
  contactPhoneNumber: string;
  alternatePhone1: string;
  alternatePhone2: string;
  email: string;
  alternateEmail: string;
  instagram: string;
  facebook: string;
  tiktok: string;
}

export interface Step2Data {
  venueType: string[];
  venueCapacity?: string;
  amenities: string[];
  eventTypes: string[];
  awardsAndNominations?: string;
  halls: Array<{ name: string; capacity: string; }>;
  paymentTermsAndConditions?: string;
  serviceCategories: string[];
  serviceSubcategories: string[];
  provinces: string[];
  cities: string[];
  specialFeatures: string[];
  description: string;
}

export interface Step3Data {
  documents: Array<{ uri: string; name: string; type: string; size: number; }>;
  images: Array<{ uri: string; name: string; type: string; }>;
  videos: Array<{ uri: string; name: string; type: string; }>;
}

export interface Step4Data {
  subscriptionPlan: string;
  billingPeriod: 'monthly' | 'yearly' | '6_month' | '12_month' | '';
  termsAccepted: boolean;
  privacyAccepted: boolean;
  marketingConsent: boolean;
}
```

### 2.2 Draft Persistence

- Mobile uses `AsyncStorage` with keys:
  - `@funxon_application_draft_venue`
  - `@funxon_application_draft_vendor`
  - (Old generic key `@funxon_application_draft` is cleaned on mount.)
- **Web:** Replace with `localStorage` using the same keys.
- The context auto-saves on every state change after hydration.
- `setPortfolioType` loads the matching draft if it exists and matches the selected type.

### 2.3 Step 1 — Company Details

**Source:** `src/screens/subscriber/ApplicationStep1Screen.tsx`

**Behavior:**
- All fields listed in `Step1Data`.
- Validates via `validateStep1(state.step1)` from `src/utils/formValidation.ts`.
- On mount, checks for pending application: calls `getLatestUserApplicationByType(portfolioType)`. If status is blocking (`pending` or `under_review`), redirect to `ApplicationStatus`.
- Venue social links (`instagram`, `facebook`, `tiktok`) are gated by venue entitlement:
  ```ts
  const ent = await getMyVenueEntitlement(user.id);
  const canEdit = isVenueFeatureEnabled(ent, 'website_social_links');
  ```
  If not allowed, show alert: "Website & social media links are available on paid venue plans."
- Address input uses `AddressAutocompleteInput` component.

### 2.4 Step 2 — Services / Venue Details

**Source:** `src/screens/subscriber/ApplicationStep2Screen.tsx`

**Behavior:**
- Different fields shown for venue vs vendor (controlled by `portfolioType` from context).
- **Venue fields:** `venueType` (multi-select), `venueCapacity`, `amenities` (multi-select), `eventTypes` (multi-select), `awardsAndNominations`, `halls` (array of 5 `{ name, capacity }` slots), `paymentTermsAndConditions`.
- **Vendor fields:** `serviceCategories` (multi-select), `serviceSubcategories` (multi-select), `provinces` (multi-select), `cities` (multi-select), `specialFeatures` (multi-select), `description` (textarea).
- All multi-selects use chip/tag UI with add/remove.

### 2.5 Step 3 — Portfolio Upload

**Source:** `src/screens/subscriber/ApplicationStep3Screen.tsx`

**Behavior:**
- Three upload sections: Images, Videos, Business Documents.
- Mobile uses `expo-image-picker` and `expo-document-picker`.
- **Web adaptation:**
  - Images: `<input type="file" accept="image/*" multiple />`
  - Videos: `<input type="file" accept="video/*" multiple />`
  - Documents: `<input type="file" multiple />`
- Files are uploaded via `uploadFileToStorage(bucket, file, userId)` from `src/lib/applicationService.ts`.
- The uploaded public URLs are stored in the form state (`step3.images`, `step3.videos`, `step3.documents`).

**File upload service (exact):**
```ts
export async function uploadFileToStorage(
  bucket: 'portfolio-images' | 'portfolio-videos' | 'business-documents',
  file: { uri: string; name: string; type: string },
  userId: string
) {
  const fileName = `${userId}/${Date.now()}-${file.name}`;
  // Handles data: URIs, blob: URLs, and native file URIs
  // Uploads to supabase.storage.from(bucket).upload(fileName, fileBody, { contentType: file.type })
  // Returns { success: true, url: publicUrl, path: data.path }
}
```

**Web file handling:**
- Read file as `File`/`Blob` from HTML input.
- Pass directly to `supabase.storage.from(bucket).upload(fileName, file, { contentType: file.type })`.
- Store returned `publicUrl` in form state.

### 2.6 Step 4 — Subscription & Terms

**Source:** `src/screens/subscriber/ApplicationStep4Screen.tsx`

**Behavior:**
- Select subscription tier from `subscription_tiers` table.
- Select billing period: `monthly`, `yearly`, `6_month`, `12_month`.
- Toggle checkboxes: `termsAccepted` (required), `privacyAccepted` (required), `marketingConsent` (optional).
- On submit, calls `submitApplication(data)` from `applicationService.ts`.

**Submission payload (exact):**
```ts
export type ApplicationSubmission = {
  existing_application_id?: string | null;
  portfolio_type: 'venue' | 'vendor';
  company_details: ApplicationFormState['step1'];
  service_categories: ApplicationFormState['step2'];
  coverage_provinces: string[];
  coverage_cities: string[];
  business_description: string;
  portfolio_images: string[];
  portfolio_videos: string[];
  business_documents: string[];
  subscription_tier: string;
  terms_accepted: boolean;
  privacy_accepted: boolean;
  marketing_consent: boolean;
};
```

**Submit logic:**
1. Get current auth user.
2. Build payload with all form data.
3. If `existing_application_id` is set, update `subscriber_applications` row (reset status to `pending`, clear `admin_notes`, `reviewed_at`, `reviewed_by`).
4. If no existing ID, insert new row.
5. Return `{ success: true, data: result }` or `{ success: false, error: message }`.

---

## 3. Application Status Screen

**Source:** `src/screens/subscriber/ApplicationStatusScreen.tsx`
**Target:** `deploy-web/src/pages/ApplicationStatusPage.tsx`
**Route:** `/apply/status`

**Behavior:**
- Loads latest application via `getLatestUserApplication()` from `applicationService.ts`.
- Status badge colors:
  - `approved` → bg `#DCFCE7`, text `#16A34A`, icon `check-circle`
  - `rejected` → bg `#FEE2E2`, text `#DC2626`, icon `cancel`
  - default (pending/under_review/needs_changes) → bg `#FEF3C7`, text `#92400E`, icon `schedule`
- Shows: trading name, package name (subscription tier), formatted submission date.
- If status is `pending` or `under_review`:
  - Show "Cancel Application" button.
  - Cancel calls `cancelApplication(applicationId)` → updates status to `cancelled`.
- If status is `needs_changes`:
  - Show "Update Application" button.
  - On click: hydrates `ApplicationFormContext` with application data (via `hydrateForm`) and redirects to `/apply/step-1`.
- If no application found, show "Start Application" button → `/listers-portal`.

---

## 4. Post-Approval Vendor Management Screens

All screens below exist in `src/screens/subscriber/`. Copy logic exactly.

### 4.1 Portfolio Profile (`PortfolioProfileScreen`)

**Route:** `/portfolio/profile`
- Public-facing portfolio view for approved vendors.
- Displays company info, services, portfolio images, contact details.

### 4.2 Update Portfolio (`UpdatePortfolioScreen`)

**Route:** `/portfolio/update`
- Edit company/portfolio details post-approval.
- Uses similar forms to the application steps but updates existing vendor/venue records.

### 4.3 Update Vendor Portfolio (`UpdateVendorPortfolioScreen`)

**Route:** `/portfolio/vendor`
- Vendor-specific portfolio editing.
- Edit service categories, subcategories, coverage areas, description, portfolio images.

### 4.4 Update Venue Portfolio (`UpdateVenuePortfolioScreen`)

**Route:** `/portfolio/venue`
- Venue-specific portfolio editing.
- Edit venue type, capacity, amenities, event types, halls, awards, payment terms, portfolio images.

### 4.5 Venue Catalogue (`VenueCatalogueScreen`)

**Route:** `/catalogue/venue`
- Manage venue catalogue items (price lists, packages, menus).
- CRUD operations on catalogue items.

### 4.6 Vendor Catalogue (`VendorCatalogueScreen`)

**Route:** `/catalogue/vendor`
- Manage vendor service catalogue.
- CRUD operations on service offerings.

### 4.7 Venue Quote Requests (`VenueQuoteRequestsScreen`)

**Route:** `/venue/quotes`

**Behavior:**
- Loads venue listing for current user: `venue_listings` where `user_id = user.id`.
- Loads quote requests: `venue_quote_requests` where `listing_id = listing.id`.
- Feature-gated by `getMyVenueEntitlement(user.id)` → `isVenueFeatureEnabled(ent, 'quote_requests')`.
- Status options: `new`, `in_progress`, `resolved`, `closed`.
- Allows updating status of each request.

**Data types:**
```ts
type QuoteRequestRow = {
  id: number; listing_id: number;
  requester_name: string | null; requester_email: string | null;
  requester_phone: string | null; event_date: string | null;
  message: string | null; status: string; created_at: string;
};
```

### 4.8 Vendor Quote Create (`VendorQuoteCreateScreen`)

**Route:** `/vendor/quotes/create`

**Params:** `quoteRequestId`, `clientName?`, `clientEmail?`, `eventDetails?`.

**Behavior:**
- Load `quote_requests` by `quoteRequestId` where `vendor_id` matches current user's vendor.
- Load existing `quote_revisions` for this request.
- Form fields: amount, description, terms, validity days, internal notes.
- On submit: insert new `quote_revisions` row with incremented `revision_number`.
- Update `quote_requests` status to `responded`.
- Send notification to client via `send-quote-notifications` Edge Function.

### 4.9 Vendor Quote History (`VendorQuoteHistoryScreen`)

**Route:** `/vendor/quotes/history`

**Params:** `quoteRequestId`.

**Behavior:**
- Show all revisions for a quote request.
- Similar to attendee `QuoteHistoryScreen` but from vendor perspective.

### 4.10 Venue Tour Bookings (`VenueTourBookingsScreen`)

**Route:** `/venue/tours`

**Behavior:**
- Loads venue listing for current user.
- Loads tour bookings: `venue_tour_bookings` where `listing_id = listing.id`.
- Shows requester details, requested date, message, status.
- Allows updating booking status.

### 4.11 Venue Analytics (`VenueAnalyticsScreen`)

**Route:** `/venue/analytics`

**Behavior:**
- Analytics dashboard for venue performance.
- Shows metrics: profile views, quote requests, tour bookings, conversion rates.
- Data fetched from analytics tables or computed from venue-related tables.

### 4.12 Action Items (`ActionItemsScreen`)

**Route:** `/vendor/action-items`

**Behavior:**
- To-do list for vendors.
- Shows pending tasks: respond to quotes, update availability, update portfolio, etc.
- Mark items as complete.

### 4.13 Calendar Updates (`CalendarUpdatesScreen`)

**Route:** `/vendor/calendar`

**Behavior:**
- Availability management.
- Set available/unavailable dates.
- Manage time slots for venue tours or vendor consultations.
- Data stored in `availability` or similar calendar table.

### 4.14 Lister Portfolio (`ListerPortfolioScreen`)

**Route:** `/lister-portfolio`

**Behavior:**
- Public portfolio view for listers (vendors/venues).
- Similar to `PortfolioProfileScreen` but optimized for public sharing.

---

## 5. Other Portal Screens

### 5.1 Listers Portal (`ListersPortalScreen`)

**Route:** `/listers-portal`
- Entry point for vendors/listers.
- Explains the listing process, shows subscription plans, links to application flow.

### 5.2 Subscriber Suite (`SubscriberSuiteScreen`)

**Route:** `/subscriber-suite`
- Dashboard for subscribers.
- Quick links to: portfolio, quotes, tours, analytics, calendar, action items.

### 5.3 Subscriber Login (`SubscriberLoginScreen`)

**Route:** `/subscriber-login`
- Separate login flow for subscribers (may have different auth requirements).

### 5.4 Subscriber Profile (`SubscriberProfileScreen`)

**Route:** `/subscriber-profile`
- Profile management for subscribers.

### 5.5 Portfolio Type Selection (`PortfolioTypeScreen`)

**Route:** `/portfolio-type`
- Choose between "Venue" or "Vendor" portfolio type.
- Sets `portfolioType` in `ApplicationFormContext`.

### 5.6 Portfolio Assistance (`PortfolioAssistanceScreen`)

**Route:** `/portfolio/assistance`
- Help screen for creating a portfolio.
- Tips, examples, contact support.

### 5.7 Vendor Signup Success (`VendorSignupSuccessScreen`)

**Route:** `/apply/success`
- Success page shown after application submission.
- Shows: email, full name, tier name, product type.
- Links to Application Status and Account.

---

## 6. Services to Port

These `src/lib/` files must be copied to `deploy-web/src/lib/`:

| File | Purpose |
|------|---------|
| `applicationService.ts` | `submitApplication`, `uploadFileToStorage`, `deleteFileFromStorage`, `getUserApplications`, `getLatestUserApplication`, `getLatestUserApplicationByType`, `isBlockingApplicationStatus`, `cancelApplication` |
| `venueSubscription.ts` | `getMyVenueEntitlement`, `isVenueFeatureEnabled` |

---

## 7. Contexts to Port

| File | Purpose |
|------|---------|
| `src/context/ApplicationFormContext.tsx` | 4-step form state + localStorage draft persistence |
