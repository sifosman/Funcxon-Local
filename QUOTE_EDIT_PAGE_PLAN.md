# Quote Edit Page Changes Plan

## Overview
This plan outlines the modifications needed for the quote edit page to incorporate catalogue form elements, tour tracking, and notes functionality.

---

## 1. Current State Analysis

### Files Involved:
- **`src/screens/QuoteDetailScreen.tsx`** - Main quote detail view (currently read-only)
- **`src/screens/VenueCatalogueViewScreen.tsx`** - Catalogue form with items, prices, quantities
- **`src/screens/VenueCatalogueScreen.tsx`** - Venue's catalogue management
- **`src/screens/VendorCatalogueScreen.tsx`** - Vendor's catalogue management
- **`src/lib/venueSubscription.ts`** - Tour booking feature flag

### Current Quote Flow:
1. User views quote details in `QuoteDetailScreen`
2. For venues, catalogue items are viewed in `VenueCatalogueViewScreen`
3. User can select items and submit a quotation

---

## 2. Required Changes

### 2.1 Catalogue Form Integration

**File:** `src/screens/QuoteDetailScreen.tsx`

**Changes:**
- Add catalogue items display section (similar to `VenueCatalogueViewScreen`)
- Show item image, title, description, price
- Allow quantity selection for each item
- Display running total calculation
- Add "Save Selection" button

**Catalogue Item Structure:**
```typescript
type CatalogueItem = {
  id: number;
  listing_id: number;
  title: string;
  description: string | null;
  price: number | null;
  currency: string;
  sort_order: number;
  is_active: boolean;
  image_url: string | null;
};
```

**Note:** The `VenueCatalogueViewScreen` already queries `venue_catalogue_items` table. This table may need to be created via migration if it doesn't exist yet.

### 2.2 Tour Count Display

**File:** `src/screens/QuoteDetailScreen.tsx`

**Changes:**
- Add section to display number of tours created for the venue
- Query `instant_tour_bookings` table (referenced in `venueSubscription.ts`)
- Show count with icon (e.g., "3 tours booked")

**Implementation:**
```typescript
// Add to QuoteDetailScreen
const [tourCount, setTourCount] = useState<number>(0);

// Query tour bookings for this venue
const { count } = await supabase
  .from('instant_tour_bookings')
  .select('id', { count: 'exact' })
  .eq('listing_id', venue?.id || targetId);
```

**Note:** The `instant_tour_bookings` feature is controlled by subscription tier (see `venueSubscription.ts` line 102-103). The feature flag checks: `['instant_tour_bookings', 'instant_bookings', 'tour_bookings']`.

### 2.3 Notes Section

**File:** `src/screens/QuoteDetailScreen.tsx`

**Changes:**
- Add notes input field (multiline TextInput)
- Add "Save Notes" button
- Store notes in `quote_requests` table or new `quote_notes` table
- Display existing notes if present

**Database Consideration:**
- Option 1: Add `notes` column to `quote_requests` table
- Option 2: Create new `quote_notes` table with `quote_request_id`, `note`, `created_at`

### 2.4 Remove "Request Quote" Button

**File:** `src/screens/QuoteDetailScreen.tsx`

**Analysis:**
The "Request Quote" button appears in:
- `VenueProfileScreen.tsx` (line 1025) - "Request a Quote" button on venue profile
- `VendorProfileScreen.tsx` (line 1381) - "Request a quote" button on vendor profile

**Action Required:**
- The button in `QuoteDetailScreen` is NOT present - this screen shows existing quotes
- If there's a duplicate "Request Quote" button appearing on the quote detail page, it should be removed
- The button should only appear on profile pages, not on quote detail pages

**Note:** The "Request Quote" button in `VenueProfileScreen.tsx` (line 1025) and `VendorProfileScreen.tsx` (line 1381) is correctly placed on profile pages. No action needed there. The `QuoteDetailScreen` correctly does NOT have this button.

---

## 3. Implementation Steps

### Step 1: Update QuoteDetailScreen Component
```
1. Add state for catalogue items
2. Add state for selected items and quantities
3. Add state for notes
4. Add state for tour count
5. Fetch catalogue items for venue quotes
6. Fetch tour count for venue
7. Add UI sections for:
   - Catalogue items list with selection
   - Tour count display
   - Notes input section
```

### Step 2: Database Schema Updates (if needed)
```
1. Add notes column to quote_requests table (optional)
   ALTER TABLE quote_requests ADD COLUMN notes TEXT;
   
2. Or create quote_notes table:
   CREATE TABLE quote_notes (
     id SERIAL PRIMARY KEY,
     quote_request_id INTEGER REFERENCES quote_requests(id),
     note TEXT,
     created_at TIMESTAMP DEFAULT NOW()
   );
```

### Step 3: Remove Request Quote Button
```
1. Verify QuoteDetailScreen doesn't have "Request Quote" button
2. Ensure button only appears on profile screens (VenueProfileScreen, VendorProfileScreen)
```

---

## 4. UI Mockup

```
┌─────────────────────────────────────┐
│ Quote Details                        │
├─────────────────────────────────────┤
│ [Venue/Vendor Name]                  │
│ Status: pending                      │
│ Requested: 12 Feb 2026               │
├─────────────────────────────────────┤
│ CATALOGUE ITEMS                      │
│ ┌─────────────────────────────────┐ │
│ │ [Image] Item Name               │ │
│ │ Description                     │ │
│ │ R 1,500                         │ │
│ │ [Qty: 1] [-] [+]                │ │
│ └─────────────────────────────────┘ │
│                                      │
│ ┌─────────────────────────────────┐ │
│ │ [Image] Another Item            │ │
│ │ Description                     │ │
│ │ R 2,000                         │ │
│ │ [Qty: 2] [-] [+]                │ │
│ └─────────────────────────────────┘ │
│                                      │
│ ────────────────────────────────     │
│ Total: R 5,500                        │
│                                      │
│ [Save Selection]                     │
├─────────────────────────────────────┤
│ TOURS                                │
│ 🏢 3 tours created                   │
├─────────────────────────────────────┤
│ NOTES                                │
│ [Multiline text input]               │
│ [Save Notes]                         │
└─────────────────────────────────────┘
```

---

## 5. Files to Modify

| File | Changes |
|------|---------|
| `src/screens/QuoteDetailScreen.tsx` | Add catalogue items, tour count, notes section |
| `src/screens/VenueCatalogueViewScreen.tsx` | Reference for catalogue form UI |
| `supabase/migrations/` | New migration for notes column/table |

---

## 6. Testing Checklist

- [ ] Catalogue items display correctly
- [ ] Quantity selection works
- [ ] Total calculation is accurate
- [ ] Tour count displays correctly
- [ ] Notes can be saved and retrieved
- [ ] "Request Quote" button removed from quote detail page
- [ ] No regression in existing quote functionality

---

## 7. Notes

- The `instant_tour_bookings` feature is controlled by subscription tier
- Catalogue items are stored in `venue_catalogue_items` table
- Quote requests for venues use `venue_quote_requests` table