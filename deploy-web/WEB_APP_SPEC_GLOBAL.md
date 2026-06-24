# Web App Spec — Global / App Shell Features

**Reference codebase:** `c:\Users\Administrator\Pictures\Funxons-local\Funcxon-Local\src`
**Target codebase:** `c:\Users\Administrator\Pictures\Funxons-local\Funcxon-Local\deploy-web\src`

The mobile app uses React Navigation. The web app uses `react-router-dom`. Every missing feature below already exists in the mobile source. Replicate the exact logic; only styling should differ (CSS/Tailwind instead of React Native `StyleSheet`).

---

## 1. App-wide Alert System (`AppAlert`)

**Source:** `src/components/AppAlert.tsx`
**Target:** `deploy-web/src/components/AppAlert.tsx`

**Preserve this exact imperative API:**
```ts
export type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

export function showAppAlert(title: string, message?: string, buttons?: AlertButton[])
export function hideAppAlert()
```

**How it works:** `AppAlert` is a component that registers module-level callbacks (`globalSetAlert`, `globalHideAlert`). Any file can call `showAppAlert()` without importing props. The component renders a centered modal overlay with fade + scale animation and up to 2 buttons.

**Web adaptation:**
- Replace React Native `Modal` + `Animated` with a fixed-position `<div>` overlay and CSS `transition` (fade + scale).
- Button styles:
  - `default`: background `colors.primary`, text white.
  - `cancel`: background `colors.primaryMuted`, border `colors.borderSubtle`.
  - `destructive`: background `colors.destructive`, text white.
- Mount `<AppAlert />` once at the app root (inside `App.tsx` or `Layout.tsx`).

---

## 2. Data Consent Modal (`DataConsentModal`)

**Source:** `src/components/DataConsentModal.tsx`
**Target:** `deploy-web/src/components/DataConsentModal.tsx`

**Preserve this exact API:**
```ts
export async function hasAcceptedDataConsent(): Promise<boolean>
export async function setDataConsentAccepted(): Promise<void>

interface DataConsentModalProps {
  visible: boolean;
  onAccept: () => void;
}
```

**Behavior:**
- Uses storage key `@funxon_data_consent_accepted`.
- On web, replace `AsyncStorage` with `localStorage` (same key).
- Shows two toggles: Essential (required) and Analytics (optional).
- `canProceed` is true only when `essentialAccepted` is true.
- Should be shown on first app load. In mobile it is rendered in `App.tsx`; do the same in web `App.tsx`.

---

## 3. Guest Prompt Screen (`GuestPromptScreen`)

**Source:** `src/screens/GuestPromptScreen.tsx`
**Target:** `deploy-web/src/components/GuestPrompt.tsx` (or a page)

**Behavior:**
- Shows the Funxon logo, "Sign in to access {label}", and two buttons:
  - "Log in" → navigates to `/signin`
  - "Get started" → navigates to `/signup`
- "Continue browsing" navigates back.

**Web adaptation:** Use `<Link to="/signin">` and `<Link to="/signup">` from `react-router-dom`.

---

## 4. Guarded Route Wrapper (`GuardedScreen`)

**Source:** `src/components/GuardedScreen.tsx`
**Target:** `deploy-web/src/components/GuardedRoute.tsx`

**Behavior:**
- If `session` is null, render `GuestPrompt` instead of children.
- Some screens are guest-allowed: `SubscriptionPlans`, `VenueListingPlans`.

**Implementation:**
```tsx
function GuardedRoute({ children, label }: { children: ReactNode; label: string }) {
  const { session } = useAuth();
  if (!session) return <GuestPrompt label={label} />;
  return <>{children}</>;
}
```

Apply this wrapper to protected routes in `App.tsx`:
- `/quotes`, `/planner`, `/account`, `/account/favourites`, `/book-tour`, `/create-review`, `/subscription-checkout`, and all vendor portal routes.

---

## 5. Floating Help Button + Help Center Modal

**Source:** `src/components/FloatingHelpButton.tsx`, `src/components/HelpCenterModal.tsx`
**Target:** `deploy-web/src/components/FloatingHelpButton.tsx`, `deploy-web/src/components/HelpCenterModal.tsx`

**Behavior:**
- Only visible when `isVendor` is true (use `useVendorStatus()` hook).
- Fixed-position button (bottom-right of viewport) opens a support modal.
- The help modal contains support contact options and FAQ links.

---

## 6. Welcome Screen

**Source:** `src/screens/WelcomeScreen.tsx` (and `.web.tsx` variant)
**Target:** `deploy-web/src/pages/WelcomePage.tsx`
**Route:** `/welcome`

**Behavior:**
- Branding/logo display.
- "Get Started" button → `/signup`
- "Sign In" button → `/signin`
- Should be the initial route for unauthenticated users (or redirect `/` → `/welcome` when guest).

---

## 7. Role-based Landing Redirect

**Mobile behavior:** In `RootNavigator.tsx`:
```ts
const initialRouteName = session && userRole === 'vendor' ? 'Account' : 'Home';
```

**Web adaptation:** After auth state loads in `App.tsx`, redirect:
- Vendor (`userRole === 'vendor'`) → `/account`
- Attendee / Guest → `/`

---

## 8. Google OAuth Button

**Mobile behavior:** `AuthContext.tsx` exposes `signInWithProvider(provider: 'google')`.

**Web gap:** `SignInPage` and `SignUpPage` have no Google sign-in button.

**Fix:** Add "Continue with Google" button on both `/signin` and `/signup`. On click, call `signInWithProvider('google')`. Supabase handles the OAuth redirect back to `window.location.origin`.

---

## 9. Routing Gaps in `deploy-web/src/App.tsx`

The current web `App.tsx` has 22 routes. Below are the **missing routes** that must be added.

### 9.1 Attendee / Quote Routes (Critical Fixes)

```tsx
// Broken link fix — QuotesPage links to /quotes/:quoteId but route doesn't exist
<Route path="quotes/:quoteId" element={<QuoteDetailPage />} />
<Route path="quotes/:quoteId/response" element={<QuoteResponsePage />} />
<Route path="quotes/:quoteId/history" element={<QuoteHistoryPage />} />

// Quote request from profile
<Route path="quote-request" element={<QuoteRequestPage />} />

// Venue catalogue view
<Route path="venue/:id/catalogue" element={<VenueCatalogueViewPage />} />
```

### 9.2 Account & Settings Routes

```tsx
<Route path="account/settings" element={<AccountSettingsPage />} />
<Route path="account/change-password" element={<ChangePasswordPage />} />
<Route path="account/marketing" element={<MarketingPermissionsPage />} />
<Route path="account/debug" element={<DebugUserPage />} />
<Route path="account/billing" element={<BillingPage />} />
```

### 9.3 Vendor / Subscriber Portal Routes

```tsx
<Route path="listers-portal" element={<ListersPortalPage />} />
<Route path="subscriber-suite" element={<SubscriberSuitePage />} />
<Route path="subscriber-login" element={<SubscriberLoginPage />} />
<Route path="subscriber-profile" element={<SubscriberProfilePage />} />
<Route path="portfolio-type" element={<PortfolioTypePage />} />
<Route path="apply/step-1" element={<ApplicationStep1Page />} />
<Route path="apply/step-2" element={<ApplicationStep2Page />} />
<Route path="apply/step-3" element={<ApplicationStep3Page />} />
<Route path="apply/step-4" element={<ApplicationStep4Page />} />
<Route path="apply/status" element={<ApplicationStatusPage />} />
<Route path="apply/success" element={<VendorSignupSuccessPage />} />
<Route path="portfolio/assistance" element={<PortfolioAssistancePage />} />
<Route path="portfolio/update" element={<UpdatePortfolioPage />} />
<Route path="portfolio/vendor" element={<UpdateVendorPortfolioPage />} />
<Route path="portfolio/venue" element={<UpdateVenuePortfolioPage />} />
<Route path="catalogue/venue" element={<VenueCataloguePage />} />
<Route path="catalogue/vendor" element={<VendorCataloguePage />} />
<Route path="venue/quotes" element={<VenueQuoteRequestsPage />} />
<Route path="vendor/quotes/create" element={<VendorQuoteCreatePage />} />
<Route path="vendor/quotes/history" element={<VendorQuoteHistoryPage />} />
<Route path="venue/tours" element={<VenueTourBookingsPage />} />
<Route path="venue/analytics" element={<VenueAnalyticsPage />} />
<Route path="vendor/action-items" element={<ActionItemsPage />} />
<Route path="vendor/calendar" element={<CalendarUpdatesPage />} />
<Route path="lister-portfolio" element={<ListerPortfolioPage />} />
<Route path="venue-listing-plans" element={<VenueListingPlansPage />} />
```

---

## 10. Web-First Adaptation Rules

When porting any mobile screen to web, apply these mechanical transformations:

| Mobile (React Native) | Web (React DOM) |
|------------------------|-----------------|
| `View` | `<div>` |
| `ScrollView` | `<div style={{ overflowY: 'auto' }}>` |
| `Text` | `<span>`, `<p>`, `<h1>`–`<h6>` |
| `TouchableOpacity` | `<button>` or `<div onClick={...}>` |
| `TextInput` | `<input>` or `<textarea>` |
| `Modal` | `<dialog>` or portal-based modal overlay |
| `ActivityIndicator` | CSS spinner / `animate-spin` |
| `KeyboardAvoidingView` | Remove (not needed on web) |
| `SafeAreaView` | Remove (not needed on web) |
| `StatusBar` | Remove (not needed on web) |
| `@expo/vector-icons` | `lucide-react` icons |
| `AsyncStorage` | `localStorage` (same keys) |
| `Platform.OS === 'web'` | Simplify (always true) or remove branch |
| `useNavigation()` | `useNavigate()` from `react-router-dom` |
| `useRoute()` | `useParams()` / `useSearchParams()` / `useLocation()` |
| `navigation.navigate('X')` | `navigate('/x')` |
| `navigation.goBack()` | `navigate(-1)` |
| `useFocusEffect` | `useEffect` (or custom hook that runs on mount) |
| `DateTimePicker` | `<input type="date">` or `<input type="datetime-local">` |
| `expo-image-picker` | `<input type="file" accept="image/*" />` |
| `expo-document-picker` | `<input type="file" />` |
| `react-native-maps` | Leaflet or Google Maps JS API |
| `StyleSheet.create({...})` | Tailwind classes or inline CSS objects |

---

## 11. Files That Must Be Ported Verbatim (Logic Only)

Copy these files from `src/` to `deploy-web/src/` with minimal changes (replace RN imports with DOM equivalents, replace AsyncStorage with localStorage):

- `src/auth/AuthContext.tsx` → `deploy-web/src/auth/AuthContext.tsx`
- `src/hooks/useVendorStatus.tsx` → `deploy-web/src/hooks/useVendorStatus.tsx`
- `src/hooks/useBreakpoints.ts` → `deploy-web/src/hooks/useBreakpoints.ts`
- `src/lib/supabaseClient.ts` → `deploy-web/src/lib/supabaseClient.ts`
- `src/lib/favourites.ts` → `deploy-web/src/lib/favourites.ts`
- `src/lib/subscription.ts` → `deploy-web/src/lib/subscription.ts`
- `src/lib/venueSubscription.ts` → `deploy-web/src/lib/venueSubscription.ts`
- `src/lib/hubspotBlog.ts` → `deploy-web/src/lib/hubspotBlog.ts`
- `src/lib/applicationService.ts` → `deploy-web/src/lib/applicationService.ts`
- `src/context/ApplicationFormContext.tsx` → `deploy-web/src/context/ApplicationFormContext.tsx`
- `src/context/PendingSearchContext.tsx` → `deploy-web/src/context/PendingSearchContext.tsx`
- `src/theme.ts` → `deploy-web/src/theme.ts` (re-export as CSS variables if desired)
