# Web App Spec — Services, Contexts, Hooks to Port

**Reference codebase:** `c:\Users\Administrator\Pictures\Funxons-local\Funcxon-Local\src`
**Target codebase:** `c:\Users\Administrator\Pictures\Funxons-local\Funcxon-Local\deploy-web\src`

Copy these files from `src/` to `deploy-web/src/` with minimal mechanical changes (replace `AsyncStorage` with `localStorage`, replace React Native imports with DOM equivalents, remove `Platform.OS` checks).

---

## 1. Auth (`src/auth/`)

### 1.1 AuthContext.tsx

**Copy to:** `deploy-web/src/auth/AuthContext.tsx`

**API to preserve exactly:**
```ts
export type AuthContextValue = {
  session: Session | null | undefined;
  user: Session['user'] | null | undefined;
  userRole: 'attendee' | 'vendor' | null | undefined;
  isLoading: boolean;
  signIn: (params: { email: string; password: string }) => Promise<{ error?: Error }>;
  signUp: (params: { email: string; password: string; data?: Record<string, any>; emailRedirectTo?: string }) => Promise<{ error?: Error }>;
  signOut: () => Promise<{ error?: Error }>;
  signInWithProvider: (provider: 'google') => Promise<{ error?: Error }>;
  resendConfirmationEmail: (email: string) => Promise<{ error?: Error }>;
};
```

**Notes:**
- `emailRedirectTo` defaults to `` `${window.location.origin}/email-confirmation` ``.
- `signInWithProvider` redirectTo is `` `${window.location.origin}/` ``.
- `fetchUserRole` checks `users` table (`role` column), then falls back to `vendors` table lookup.
- The timeout race (`setTimeout(..., 8000)`) should be preserved.

---

## 2. Hooks (`src/hooks/`)

### 2.1 useVendorStatus.tsx

**Copy to:** `deploy-web/src/hooks/useVendorStatus.tsx`

**API:**
```ts
export function useVendorStatus(): {
  isVendor: boolean;
  vendorId: any;
  vendorName: string | undefined;
  isLoading: boolean;
  error: any;
}
```

**Logic:** Uses `useQuery` with key `['vendor-status', user?.id, userRole]`. Checks `vendors` table by `user_id`, then `email`, then `whatsapp_number`.

### 2.2 useBreakpoints.ts

**Copy to:** `deploy-web/src/hooks/useBreakpoints.ts`

**API:**
```ts
export function useBreakpoints(): {
  isDesktop: boolean;
  // potentially other breakpoint flags
}
```

**Logic:** Uses `window.matchMedia` to detect desktop breakpoint. Mobile uses `Dimensions` from React Native.

---

## 3. Contexts (`src/context/`)

### 3.1 ApplicationFormContext.tsx

**Copy to:** `deploy-web/src/context/ApplicationFormContext.tsx`

**Full state shape:**
```ts
export type PortfolioType = 'vendors' | 'venues' | null;

export interface ApplicationFormState {
  editingApplicationId: string | null;
  portfolioType: PortfolioType;
  step1: Step1Data;
  step2: Step2Data;
  step3: Step3Data;
  step4: Step4Data;
}
```

**Actions:**
```ts
type ApplicationFormAction =
  | { type: 'SET_EDITING_APPLICATION_ID'; payload: string | null }
  | { type: 'SET_PORTFOLIO_TYPE'; payload: PortfolioType }
  | { type: 'UPDATE_STEP1'; payload: Partial<Step1Data> }
  | { type: 'UPDATE_STEP2'; payload: Partial<Step2Data> }
  | { type: 'UPDATE_STEP3'; payload: Partial<Step3Data> }
  | { type: 'UPDATE_STEP4'; payload: Partial<Step4Data> }
  | { type: 'LOAD_DRAFT'; payload: ApplicationFormState }
  | { type: 'RESET_FORM' };
```

**Context API:**
```ts
interface ApplicationFormContextValue {
  state: ApplicationFormState;
  setEditingApplicationId: (applicationId: string | null) => void;
  setPortfolioType: (type: PortfolioType) => Promise<void>;
  updateStep1: (data: Partial<Step1Data>) => void;
  updateStep2: (data: Partial<Step2Data>) => void;
  updateStep3: (data: Partial<Step3Data>) => void;
  updateStep4: (data: Partial<Step4Data>) => void;
  saveDraft: () => Promise<void>;
  loadDraft: () => Promise<void>;
  resetForm: () => void;
  hydrateForm: (nextState: ApplicationFormState) => void;
}
```

**Storage keys (replace AsyncStorage → localStorage):**
- `@funxon_application_draft_venue`
- `@funxon_application_draft_vendor`
- (Cleanup removes old `@funxon_application_draft` key on mount.)

### 3.2 PendingSearchContext.tsx

**Copy to:** `deploy-web/src/context/PendingSearchContext.tsx`

**Full state shape and API:** See `WEB_APP_SPEC_ATTENDEE.md` Section 1.1.

**Storage keys (replace AsyncStorage → localStorage):**
- `funxon.pendingSearch`
- `funxon.pendingSearch.shouldApply`

---

## 4. Services (`src/lib/`)

### 4.1 supabaseClient.ts

**Copy to:** `deploy-web/src/lib/supabaseClient.ts`

**Content:** Creates a Supabase client using `createClient` with anon key and URL. On web, uses `window.location.origin` for auth redirects. No changes needed.

### 4.2 favourites.ts

**Copy to:** `deploy-web/src/lib/favourites.ts`

**API to preserve:**
```ts
export async function getFavourites(user?: AuthUserRef): Promise<{ vendorIds: number[], venueIds: number[] }>
export async function getShortlists(user?: AuthUserRef): Promise<{ id: number; vendorId?: number | null; venueId?: number | null; notes: string | null }[]>
export async function toggleFavourite(user: AuthUserRef, id: number, type?: 'vendor' | 'venue'): Promise<{ vendorIds: number[], venueIds: number[] }>
export async function isFavourite(user: AuthUserRef, id: number, type?: 'vendor' | 'venue'): Promise<boolean>
export async function updateShortlistNotes(user: AuthUserRef, shortlistId: number, notes: string | null): Promise<void>
```

**Internal flow:**
1. `resolveUserId(user)` → looks up `users` table by `auth_user_id`, falls back to `email` match.
2. `shortlists` table: `user_id` (internal ID), `vendor_id`, `venue_id`, `notes`.
3. `toggleFavourite` checks existing row, deletes if found, inserts if not.

### 4.3 subscription.ts

**Copy to:** `deploy-web/src/lib/subscription.ts`

**API to preserve:**
```ts
export type SubscriptionTier = {
  id: number; tier_name: string; photo_limit: number;
  price_monthly: number | null; price_yearly: number | null;
  features: Record<string, any> | null; is_active: boolean; created_at: string;
};

export async function getSubscriptionTiers(): Promise<SubscriptionTier[]>
export async function getVendorPhotoLimit(vendorId: number): Promise<number>
export async function getVendorPhotoCount(vendorId: number): Promise<number>
export async function incrementVendorPhotoCount(vendorId: number): Promise<void>
export async function decrementVendorPhotoCount(vendorId: number): Promise<void>
export async function canUploadMorePhotos(vendorId: number): Promise<boolean>
export async function getRemainingPhotoSlots(vendorId: number): Promise<number>
export function formatPhotoCountText(current: number, limit: number): string
export function getPhotoCountColor(current: number, limit: number): string
```

**Notes:**
- `getVendorPhotoLimit` uses RPC `get_vendor_photo_limit`.
- `incrementVendorPhotoCount` / `decrementVendorPhotoCount` use RPC `increment_photo_count` / `decrement_photo_count`.
- Color thresholds: >= 100% → red (`#DC2626`); >= 80% → yellow (`#F59E0B`); else green (`#059669`).

### 4.4 venueSubscription.ts

**Copy to:** `deploy-web/src/lib/venueSubscription.ts`

**API to preserve:**
```ts
export type VenuePlanKey = 'get_started' | 'monthly' | '6_month' | '12_month';

export type VenueSubscriptionEntitlement = {
  planKey: VenuePlanKey;
  status: 'inactive' | 'trial' | 'active' | 'past_due' | 'cancelled';
  photoUploadLimit: number;
  videoUploadLimit: number;
  features: Record<string, any>;
};

export type VenueFeatureKey =
  | 'catalogue_pricelist'
  | 'dedicated_portfolio_manager'
  | 'analytics'
  | 'quote_requests'
  | 'website_social_links'
  | 'instant_tour_bookings';

export async function getMyVenueEntitlement(authUserId: string): Promise<VenueSubscriptionEntitlement>
export function isVenueFeatureEnabled(ent: VenueSubscriptionEntitlement, feature: VenueFeatureKey): boolean
```

**Logic:**
- `getMyVenueEntitlement` looks up `venues` table (`subscription_plan_key`, `subscription_status`), then `venue_subscription_plans` table for limits/features.
- Fallback: `planKey: 'get_started'`, `status: 'inactive'`, `photoUploadLimit: 10`, `videoUploadLimit: 1`.
- `isVenueFeatureEnabled`: most features default to `planKey !== 'get_started'` unless explicitly disabled in `features` JSON.

### 4.5 applicationService.ts

**Copy to:** `deploy-web/src/lib/applicationService.ts`

**API to preserve:**
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

export type SubscriberApplication = {
  id: string; user_id: string; portfolio_type: 'venue' | 'vendor';
  subscription_tier: string | null; status?: string | null;
  created_at?: string | null; updated_at?: string | null;
  company_details?: ApplicationFormState['step1'] | null;
  service_categories?: ApplicationFormState['step2'] | null;
  coverage_provinces?: string[] | null; coverage_cities?: string[] | null;
  business_description?: string | null;
  portfolio_images?: string[] | null; portfolio_videos?: string[] | null;
  business_documents?: string[] | null;
  terms_accepted?: boolean | null; privacy_accepted?: boolean | null;
  marketing_consent?: boolean | null;
};

export async function submitApplication(data: ApplicationSubmission): Promise<{ success: boolean; data?: any; error?: string }>
export async function uploadFileToStorage(bucket: 'portfolio-images' | 'portfolio-videos' | 'business-documents', file: { uri: string; name: string; type: string }, userId: string): Promise<{ success: boolean; url?: string; path?: string; error?: string }>
export async function deleteFileFromStorage(bucket: 'portfolio-images' | 'portfolio-videos' | 'business-documents', path: string): Promise<{ success: boolean; error?: string }>
export async function getUserApplications(): Promise<{ success: boolean; data: SubscriberApplication[]; error?: string }>
export async function getLatestUserApplication(): Promise<{ success: boolean; data: SubscriberApplication | null; error?: string }>
export async function getLatestUserApplicationByType(portfolioType: 'venue' | 'vendor'): Promise<{ success: boolean; data: SubscriberApplication | null; error?: string }>
export function isBlockingApplicationStatus(status?: string | null): boolean
export async function cancelApplication(applicationId: string): Promise<{ success: boolean; data?: SubscriberApplication | null; error?: string }>
```

**Blocking statuses:** `['pending', 'under_review']`
**Editable statuses:** `['needs_changes']`

**Web file upload adaptation:**
- The `uploadFileToStorage` function handles `data:` URIs, `blob:` URLs, and native file URIs.
- On web, replace `expo-file-system` usage with standard `FileReader` or pass `File`/`Blob` directly from HTML `<input type="file">`.
- The `base64-arraybuffer` `decode()` function is used for native files; on web you can skip this path since `File`/`Blob` works directly with Supabase storage.

### 4.6 hubspotBlog.ts

**Copy to:** `deploy-web/src/lib/hubspotBlog.ts`

**API to preserve:**
```ts
export interface AppBlogPost {
  id: string; title: string; slug: string;
  excerpt: string; content: string;
  cover_image_url: string | null; author_name: string;
  category: string; published_at: string;
  read_time_minutes: number; author_avatar_url?: string | null;
  tags?: string[];
}

export async function fetchHubSpotBlogPosts(limit = 20): Promise<AppBlogPost[]>
export async function fetchHubSpotBlogPostBySlug(slug: string): Promise<AppBlogPost | null>
export async function fetchHubSpotAllSlugs(): Promise<{ id: string; slug: string; title: string }[]>
export async function fetchHubSpotRelatedPosts(currentId: string, limit = 2): Promise<AppBlogPost[]>
```

**Proxy URL:**
- Web: `/api/hubspot-blog-proxy` (same domain)
- Native: `https://funxon-web.vercel.app/api/hubspot-blog-proxy`

**Content processing:**
- `calculateReadTime`: strip HTML tags, count words, divide by 200, min 1.
- `stripHtmlToPlainText`: removes `<script>`, `<style>`, converts `<br>` to `\n`, `</p>` to `\n\n`, strips remaining tags, decodes entities.

### 4.7 pendingSubscriptionCheckout.ts

**Copy to:** `deploy-web/src/lib/pendingSubscriptionCheckout.ts`

**Purpose:** Stages pending checkout state (tier, billing, etc.) before redirecting to payment. Replace `AsyncStorage` with `localStorage`.

---

## 5. Theme

### 5.1 theme.ts

**Copy to:** `deploy-web/src/theme.ts`

**Content:** Exports `colors`, `typography`, `spacing`, `radii`, and other design tokens. On web, these can be used directly as inline style objects or mapped to CSS custom properties / Tailwind config.

**Color key references used throughout:**
- `colors.primary` — teal brand color
- `colors.background` — app background
- `colors.surface` — card/surface background
- `colors.textPrimary` — main text
- `colors.textSecondary` — secondary text
- `colors.textMuted` — muted/disabled text
- `colors.borderSubtle` — subtle borders
- `colors.destructive` — red for errors
- `colors.primaryForeground` — text on primary buttons
- `colors.destructiveForeground` — text on destructive buttons

---

## 6. UI Components to Port

These `src/components/` files should have web equivalents in `deploy-web/src/components/`:

| Mobile Component | Web Target | Notes |
|-----------------|------------|-------|
| `AppAlert.tsx` | `deploy-web/src/components/AppAlert.tsx` | Imperative global alert API |
| `DataConsentModal.tsx` | `deploy-web/src/components/DataConsentModal.tsx` | First-launch GDPR consent |
| `FloatingHelpButton.tsx` | `deploy-web/src/components/FloatingHelpButton.tsx` | Fixed bottom-right for vendors |
| `HelpCenterModal.tsx` | `deploy-web/src/components/HelpCenterModal.tsx` | Support modal |
| `GuardedScreen.tsx` | `deploy-web/src/components/GuardedRoute.tsx` | Auth gate wrapper |
| `AddressAutocompleteInput.tsx` | `deploy-web/src/components/AddressAutocompleteInput.tsx` | Google Places autocomplete |
| `MapRadiusSelector.tsx` | `deploy-web/src/components/MapRadiusSelector.tsx` | Map with radius circle |
| `ApplicationProgress.tsx` | `deploy-web/src/components/ApplicationProgress.tsx` | Step indicator for application |
| `PhotoUploadCounter.tsx` | `deploy-web/src/components/PhotoUploadCounter.tsx` | Shows photo usage vs limit |
| `ui.tsx` | `deploy-web/src/components/ui.tsx` | Shared UI primitives (PrimaryButton, OutlineButton, ThemedInput, etc.) |

**ui.tsx web adaptation:**
- `PrimaryButton` → `<button>` with primary teal styling.
- `OutlineButton` → `<button>` with border + transparent background.
- `ThemedInput` → `<input>` or `<textarea>` with consistent border, padding, and focus states.
- All buttons and inputs should match the mobile styling using `colors`, `spacing`, `radii`, `typography` from `theme.ts`.

---

## 7. App.tsx Root Setup

The web `deploy-web/src/App.tsx` must wrap routes with the same providers as mobile:

```tsx
<QueryClientProvider client={queryClient}>
  <AuthProvider>
    <ApplicationFormProvider>
      <PendingSearchProvider>
        <AppAlert /> {/* Global alert system */}
        <Routes>
          {/* ... all routes ... */}
        </Routes>
        {/* DataConsentModal should be conditionally rendered at root */}
      </PendingSearchProvider>
    </ApplicationFormProvider>
  </AuthProvider>
</QueryClientProvider>
```

Also add:
- `WebHeader` at the top (already exists).
- `WebFooter` at the bottom (already exists).
- `FloatingHelpButton` + `HelpCenterModal` (visible only when `isVendor`).

---

## 8. Mobile-Specific Capabilities to Replace

| Mobile Capability | Web Replacement |
|------------------|-----------------|
| `expo-image-picker` | `<input type="file" accept="image/*" />` |
| `expo-document-picker` | `<input type="file" />` |
| `expo-file-system` | Standard `FileReader` or direct `Blob` |
| `expo-location` | Browser Geolocation API (`navigator.geolocation`) |
| `react-native-maps` | Leaflet or Google Maps JS API |
| `expo-web-browser` | `window.open()` or `<a target="_blank">` |
| `@react-native-async-storage/async-storage` | `localStorage` |
| `expo-auth-session` | Supabase OAuth (already handled by `signInWithProvider`) |
| `react-native-gesture-handler` | CSS touch events or no replacement needed |
| `react-native-webview` | `<iframe>` or direct rendering |
| `@react-native-community/datetimepicker` | `<input type="date">` |
