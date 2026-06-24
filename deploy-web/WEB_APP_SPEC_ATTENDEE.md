# Web App Spec — Attendee-Facing Features

**Reference codebase:** `c:\Users\Administrator\Pictures\Funxons-local\Funcxon-Local\src`
**Target codebase:** `c:\Users\Administrator\Pictures\Funxons-local\Funcxon-Local\deploy-web\src`

Replicate the exact mobile logic. Only styling should differ (CSS/Tailwind instead of React Native `StyleSheet`).

---

## 1. Search & Discovery

### 1.1 PendingSearchContext

**Source:** `src/context/PendingSearchContext.tsx`
**Target:** `deploy-web/src/context/PendingSearchContext.tsx`

**State shape (preserve exactly):**
```ts
export type PendingSearchSnapshot = {
  search: string;
  serviceType: 'Venues' | 'Vendors' | 'Service Providers' | 'All';
  selectedCategoryIds: number[];
  selectedVenueTypes: string[];
  selectedSubcategories: string[];
  selectedVenueAmenities: string[];
  selectedProvinces: string[];
  selectedCities: string[];
  categorySearchQuery: string;
  citySearchQuery: string;
  venueAmenitiesQuery: string;
  distanceKm: string;
  selectedCapacity: {
    id: number;
    type: 'event_type' | 'province' | 'capacity_band';
    code: string;
    label: string;
    sort_order: number | null;
  } | null;
  singleDayEvent: boolean;
  fromDate: string | null;
  toDate: string | null;
  detectedProvinceLabel: string | null;
  locationCity: string | null;
  locationRegion: string | null;
  sortBy: 'name' | 'rating' | 'price' | 'distance';
  sortOrder: 'asc' | 'desc';
  mapCenter: { latitude: number; longitude: number } | null;
  mapRadius: number;
};
```

**API:**
```ts
type PendingSearchContextValue = {
  pendingSearch: PendingSearchSnapshot | null;
  shouldApplyPendingSearch: boolean;
  savePendingSearch: (snapshot: PendingSearchSnapshot) => void;
  clearPendingSearch: () => void;
  markPendingSearchConsumed: () => void;
};
```

**Web adaptation:** Replace `AsyncStorage` with `localStorage`. Keys: `funxon.pendingSearch`, `funxon.pendingSearch.shouldApply`.

---

### 1.2 MapRadiusSelector & AddressAutocompleteInput

**Source:** `src/components/MapRadiusSelector.tsx`, `src/components/AddressAutocompleteInput.tsx`
**Target:** `deploy-web/src/components/MapRadiusSelector.tsx`, `deploy-web/src/components/AddressAutocompleteInput.tsx`

**Current status:** Components exist in mobile but are **NOT wired into web DiscoverPage**.

**AddressAutocompleteInput behavior:**
- Calls Google Places API (`places.googleapis.com`) with API key.
- Returns `description`, `place_id`, `structured_formatting`.
- Geocodes selected place to `latitude`/`longitude`.
- On web, this is a text input with a dropdown list of autocomplete suggestions.

**MapRadiusSelector behavior:**
- Shows a map with a draggable radius circle.
- On mobile: uses `react-native-maps`.
- On web: replace with Leaflet or Google Maps JS API.
- The component takes `center`, `radius`, and `onChange` props.

**Integration:** Wire both components into `DiscoverPage` exactly as they are wired into `AttendeeHomeScreen` and `DiscoverScreen` in mobile.

---

### 1.3 Advanced Filters Missing from Web Discover

**Source:** `src/screens/DiscoverScreen.tsx`, `src/screens/AttendeeHomeScreen.tsx`
**Target:** `deploy-web/src/pages/DiscoverPage.tsx`, `deploy-web/src/pages/HomePage.tsx`

The web `DiscoverPage` is missing these filters (all exist in mobile):

| Filter | Mobile State Key | Notes |
|--------|-----------------|-------|
| Full-text search | `search` | Query input exists on web but may not be fully wired |
| Subcategory filtering | `selectedSubcategories` | Not implemented |
| Venue type filtering | `selectedVenueTypes` | Not implemented |
| Amenities filtering | `selectedVenueAmenities` | Not implemented |
| City filtering | `selectedCities` | Only province dropdown exists on web |
| Capacity / event type | `selectedCapacity` | Not implemented |
| Map-based radius search | `mapCenter`, `mapRadius` | Integrate `MapRadiusSelector` |
| Date range filtering | `fromDate`, `toDate`, `singleDayEvent` | Not implemented |
| Sorting | `sortBy`, `sortOrder` | `sortBy`: name/rating/price/distance; `sortOrder`: asc/desc |

**Action:** Copy the filter state management and Supabase query construction from `DiscoverScreen.tsx`. Render with HTML form controls (checkboxes, dropdowns, date inputs, etc.).

---

## 2. Vendor & Venue Profiles

### 2.1 Review Listing (Read)

**Source:** `VenueProfileScreen.tsx` (lines ~57-65), `VendorProfileScreen.tsx`

**Data shape:**
```ts
type VenueReview = {
  id: number;
  rating: number;
  title: string | null;
  review_text: string | null;
  is_verified: boolean | null;
  created_at: string | null;
  status: string | null;
};
```

**Fetch (exact queries):**
```ts
// Venue reviews — from `venue_reviews` table
const { data: reviews } = await supabase
  .from('venue_reviews')
  .select('id, rating, title, review_text, is_verified, created_at, status')
  .eq('venue_id', venueId)
  .eq('status', 'approved')
  .order('created_at', { ascending: false });

// Vendor reviews — from `reviews` table
const { data: reviews } = await supabase
  .from('reviews')
  .select('id, rating, title, review_text, is_verified, created_at, status')
  .eq('vendor_id', vendorId)
  .eq('status', 'approved')
  .order('created_at', { ascending: false });
```

**Web gap:** Profile pages have a "reviews" tab but no actual fetch/render logic. The reviews should display star rating, title, review text, verified badge, and date.

---

### 2.2 Favourite Toggle from Profile

**Source:** `VenueProfileScreen.tsx`, `VendorProfileScreen.tsx` (both use `getFavourites`, `toggleFavourite`)

**Behavior:**
- On profile load, call `getFavourites(user)` to determine if current item is favourited.
- Show heart icon: filled if favourited, outline if not.
- On press, call `toggleFavourite(user, id, type)` where `type` is `'vendor'` or `'venue'`.
- Update local state with the returned `{ vendorIds, venueIds }`.

**Web gap:** No heart/favourite button on web profile pages (`VenueProfilePage`, `VendorProfilePage`).

---

### 2.3 Portfolio Video Support

**Mobile behavior:** Both `VendorProfileScreen` and `VenueProfileScreen` display video portfolios (from `portfolio_videos` or `additional_videos` fields).

**Web gap:** Web profile pages only handle images. Must add `<video>` element support for portfolio videos.

---

### 2.4 Awards / Nominations Display

**Mobile behavior:** `VenueProfileScreen` shows `awards_and_nominations` field from `venue_listings` table.

**Web gap:** Not displayed on web venue profile.

---

### 2.5 Payment Terms and Conditions

**Mobile behavior:** `VendorProfileScreen` displays `payment_terms_and_conditions` field.

**Web gap:** Not displayed on web vendor profile.

---

### 2.6 Venue Catalogue View (`VenueCatalogueViewScreen`)

**Source:** `src/screens/VenueCatalogueViewScreen.tsx`
**Target:** `deploy-web/src/pages/VenueCatalogueViewPage.tsx`
**Route:** `/venue/:id/catalogue`

**Behavior:** Shows the venue's catalogue / price list items. Data comes from the venue's catalogue table. Check the mobile screen for exact Supabase queries and data rendering.

---

## 3. Quotes & Requests (CRITICAL GAPS)

### 3.1 Quote Detail Screen — BROKEN LINK FIX

**Source:** `src/screens/QuoteDetailScreen.tsx`
**Target:** `deploy-web/src/pages/QuoteDetailPage.tsx`
**Route:** `/quotes/:quoteId`

**Critical bug:** `QuotesPage.tsx:115` links to `/quotes/${quote.id}` but this route does NOT exist in `deploy-web/src/App.tsx`. It 404s.

**Data types (exact):**
```ts
type QuoteRequest = {
  id: number | string;
  original_id?: number;
  is_venue?: boolean;
  vendor_id: number | null;
  target_id?: number | null;
  target_name?: string | null;
  name: string | null;
  email: string | null;
  status: string | null;
  details?: string | null;
  event_type?: string | null;
  event_date?: string | null;
  budget?: string | null;
  quote_amount?: number | null;
  created_at?: string | null;
};
```

**Fetch logic (exact):**
1. Detect venue quote: `typeof quoteId === 'string' && quoteId.startsWith('venue-')`.
2. If venue quote:
   - Query `venue_quote_requests` (`listing_id`, `requester_name`, `requester_email`, `status`, `message`, `event_date`, `created_at`).
   - Join with `venue_listings` for target name/location.
3. If vendor quote:
   - Query `quote_requests` (`vendor_id`, `name`, `email`, `status`, `details`, `event_type`, `event_date`, `budget`, `quote_amount`, `created_at`).
   - Join with `vendors` for target name/location.
4. Display: linked name, status, requested date, email, event type, budget, quoted amount, details.
5. "View Full Profile" button → `/venue/:id` or `/vendor/:id`.

---

### 3.2 Quote Response Screen

**Source:** `src/screens/QuoteResponseScreen.tsx`
**Target:** `deploy-web/src/pages/QuoteResponsePage.tsx`
**Route:** `/quotes/response/:revisionId`

**Params:** `revisionId`, `quoteRequestId`, `vendorName?`, `amount?`, `description?`.

**Behavior:**
- Load `quote_revisions` row by `revisionId`.
- Load vendor from `vendors` table by `rev.vendor_id`.
- Show: quoted amount, description, terms, validity days.
- Expired check: `new Date(created_at + validity_days) < now`.
- If expired → show warning banner, disable response.
- If status === `sent` → show Accept / Reject buttons.
- Reject requires feedback text (non-empty).
- On submit, execute these Supabase operations in order:

```ts
// 1. Update revision status
await supabase.from('quote_revisions').update({
  status: responseType === 'accept' ? 'accepted' : 'rejected',
  client_notes: feedback.trim() || null,
  responded_at: new Date().toISOString(),
}).eq('id', revisionId);

// 2. Update quote request status
await supabase.from('quote_requests').update({
  status: responseType === 'accept' ? 'finalised' : 'rejected',
}).eq('id', quoteRequestId);

// 3. Insert comment if feedback provided
await supabase.from('quote_comments').insert({
  quote_revision_id: revisionId,
  author_id: user.id,
  author_type: 'attendee',
  message: feedback.trim(),
  is_internal: false,
});

// 4. Send notification to vendor
await supabase.functions.invoke('send-quote-notifications', {
  body: {
    type: type === 'accept' ? 'quote-accepted-vendor' : 'quote-rejected-vendor',
    quoteRequestId,
    quoteRevisionId: revisionId,
    vendorBusinessName: vendor?.name || initialVendorName,
    vendorEmail: vendor?.email,
    quoteAmount: revision?.quote_amount || initialAmount,
    clientNotes: feedback.trim() || undefined,
  },
});
```

---

### 3.3 Quote History Screen

**Source:** `src/screens/QuoteHistoryScreen.tsx`
**Target:** `deploy-web/src/pages/QuoteHistoryPage.tsx`
**Route:** `/quotes/:quoteId/history`

**Params:** `quoteRequestId`.

**Behavior:**
- Load `quote_revisions` for the request: `.eq('quote_request_id', quoteRequestId).order('revision_number', { ascending: false })`.
- Load `quote_comments` for each revision.
- Display each revision with: number, date, status badge, amount, description.
- Expandable details: terms, validity, client feedback, comments.
- Comments are color-coded by author type:
  - Vendor → background `#F0F9FF`, left border `#0284C7`
  - Attendee → background `#FFFFFF`, left border `#D97706`
- If `status === 'sent'` and not expired → "Review & Respond" button → QuoteResponse.

**Status colors (exact):**
| Status   | Text Color | BG Color  |
|----------|-----------|-----------|
| accepted | `#16A34A` | `#DCFCE7` |
| rejected | `#DC2626` | `#FEE2E2` |
| sent     | `#2B9EB3` | `#E0F2FE` |
| draft    | `#6B7280` | `#F3F4F6` |
| expired  | `#92400E` | `#FFEDD5` |

---

### 3.4 Request Quote (`QuoteRequestScreen`)

**Source:** `src/screens/QuoteRequestScreen.tsx`
**Target:** `deploy-web/src/pages/QuoteRequestPage.tsx`
**Route:** `/quote-request?vendorId=X&vendorName=Y&type=vendor|venue`

**Fields:** Name (required), Email (required), Event details (optional, multiline textarea).

**Submit logic (exact):**
- If `type === 'venue'`:
  ```ts
  await supabase.from('venue_quote_requests').insert({
    listing_id: vendorId,
    requester_user_id: user?.id ?? null,
    requester_name: name,
    requester_email: email,
    requester_phone: null,
    event_date: null,
    message: eventDetails || null,
    status: 'pending',
  });
  ```
- If `type === 'vendor'`:
  1. Resolve internal user ID from `users` table (`auth_user_id = user.id`).
  2. If not found, create user: `insert({ auth_user_id: user.id, username, password: 'demo', email, full_name: name || username })`.
  3. Insert into `quote_requests`:
     ```ts
     await supabase.from('quote_requests').insert({
       vendor_id: vendorId, user_id: internalUserId,
       name, email, status: 'pending', details: eventDetails || null,
     });
     ```
- After insert, send admin notification:
  ```ts
  await supabase.functions.invoke('send-admin-notification', {
    body: { type: 'quote-requested', customerName: name, customerEmail: email, vendorId, vendorName, quoteDetails: eventDetails },
  });
  ```
- For vendor quotes, send vendor notification:
  ```ts
  await supabase.functions.invoke('send-quote-notifications', {
    body: { type: 'quote-requested-vendor', quoteRequestId: vendorId, clientName: name, clientEmail: email, vendorBusinessName: vendorName, vendorEmail, eventDetails },
  });
  ```

---

### 3.5 Book Tour (`BookTourScreen`) — STUB FIX REQUIRED

**Source:** `src/screens/BookTourScreen.tsx`
**Target:** `deploy-web/src/pages/BookTourPage.tsx`
**Route:** `/book-tour?venueId=X&venueName=Y`

**Current web status:** `BookTourPage` exists but `handleSubmit` is stubbed (sets `submitted = true` but never writes to DB).

**Fix — implement actual insert:**
```ts
await supabase.from('venue_tour_bookings').insert({
  listing_id: venueId,
  requester_user_id: user?.id ?? null,
  requester_name: name,
  requester_email: email,
  requester_phone: phone,
  requested_date: date.toISOString().slice(0, 10),
  requested_time: null,
  message: message || null,
  status: 'pending',
});
```
- Use HTML `<input type="date">` instead of `@react-native-community/datetimepicker`.
- `minimumDate` behavior: set `min` attribute on the date input.

---

### 3.6 Create Review (`CreateReviewScreen`) — MISSING VENDOR PATH

**Source:** `src/screens/CreateReviewScreen.tsx`
**Target:** `deploy-web/src/pages/CreateReviewPage.tsx`
**Route:** `/create-review?type=vendor|venue&targetId=X&targetName=Y`

**Current web status:** Page exists but only supports `venue_id`; no `vendor_id` path.

**Fix — add vendor review support.**

**Eligibility check (exact logic):**
- For **vendor**: check `quote_requests` for rows with `vendor_id = targetId`, `user_id = internalUserId`, `status` in `['accepted', 'finalised']`.
- For **venue**: check `venue_quote_requests` for `listing_id = targetId`, `requester_user_id = user.id`, `status` in `['accepted', 'finalised']`; OR check `venue_tour_bookings` with same criteria.

**Form:** Star rating (1-5, required), Title (optional), Review text (optional).

**Insert (exact):**
```ts
// Vendor review
await supabase.from('reviews').insert({
  user_id: internalUserId, vendor_id: targetId, rating,
  title: title.trim() || null, review_text: reviewText.trim() || null,
  is_verified: true, status: 'pending',
});

// Venue review
await supabase.from('venue_reviews').insert({
  user_id: user.id, venue_id: targetId, rating,
  title: title.trim() || null, review_text: reviewText.trim() || null,
  is_verified: true, status: 'pending',
});
```

---

## 4. Favourites Gaps

### 4.1 Shortlist Notes

**Source:** `src/screens/FavouritesScreen.tsx` (lines 107-124)

**Web gap:** Web `FavouritesPage` only has add/remove; no notes editing.

**Behavior:**
- Each shortlist entry can have editable notes.
- `noteDrafts` state tracks in-progress edits per `shortlistId`.
- Save calls `updateShortlistNotes(user, shortlistId, notes)` then refetches shortlists.

**Service to port (exact):**
```ts
export async function updateShortlistNotes(
  user: AuthUserRef, shortlistId: number, notes: string | null
): Promise<void> {
  const internalUserId = await resolveUserId(user);
  if (!internalUserId) return;
  const { error } = await supabase
    .from('shortlists').update({ notes })
    .eq('id', shortlistId).eq('user_id', internalUserId);
  if (error) throw error;
}
```

---

## 5. Event Planner

**Source:** `src/screens/PlannerScreen.tsx` (and `.web.tsx`)
**Target:** `deploy-web/src/pages/PlannerPage.tsx`
**Route:** `/planner`

**Web gap:** Only basic budget items exist; no checklist or timeline view.

**Behavior from mobile:** Personal event planner with checklist/timeline functionality. Check `PlannerScreen.tsx` and `PlannerScreen.web.tsx` for exact data structures and rendering logic.

---

## 6. Blog

**Source:** `src/screens/BlogListScreen.tsx`, `src/screens/BlogDetailScreen.tsx`
**Target:** `deploy-web/src/pages/BlogListPage.tsx`, `deploy-web/src/pages/BlogDetailPage.tsx`

**Web gap:** Related posts suggestion is not implemented.

**Behavior:**
- Blog list: fetch from HubSpot via `fetchHubSpotBlogPosts(limit = 20)`.
- Blog detail: fetch via `fetchHubSpotBlogPostBySlug(slug)`.
- Related posts: `fetchHubSpotRelatedPosts(currentId, limit = 2)` filters out current post and returns up to 2 others.

**Service to port (exact):**
```ts
export async function fetchHubSpotBlogPosts(limit = 20): Promise<AppBlogPost[]>
export async function fetchHubSpotBlogPostBySlug(slug: string): Promise<AppBlogPost | null>
export async function fetchHubSpotRelatedPosts(currentId: string, limit = 2): Promise<AppBlogPost[]>
```

The proxy URL is `/api/hubspot-blog-proxy` on web, `https://funxon-web.vercel.app/api/hubspot-blog-proxy` on native.

---

## 7. Shared Services for Attendee Features

These files from `src/lib/` must be copied to `deploy-web/src/lib/`:

| File | Purpose |
|------|---------|
| `favourites.ts` | `getFavourites`, `getShortlists`, `toggleFavourite`, `isFavourite`, `updateShortlistNotes` |
| `hubspotBlog.ts` | HubSpot blog fetching via proxy |
| `subscription.ts` | Tier fetching, photo limit enforcement |
