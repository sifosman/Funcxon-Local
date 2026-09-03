# Mobile Profile Screen — MCP Interactive Checklist

**Target**: `http://localhost:8081` | **Viewport**: 390×844 (iPhone 14)

## Setup

1. `mcp1_browser_navigate` → `http://localhost:8081`
2. `mcp1_browser_resize` → 390×844
3. Log in if not already authenticated
4. Navigate to Discover → open any vendor or venue listing profile

---

## Item 12: Book a Tour button — visible, contrasting background, clear text

**Verify**: A "Book a Tour" button is visible on venue profiles with a contrasting background colour and clear, readable text.

- [ ] Open a venue profile from Discover
- [ ] `mcp1_browser_snapshot` — inspect the profile page
- [ ] Confirm "Book a Tour" button is present and visible
- [ ] `mcp1_browser_evaluate` — check button styling:
  ```js
  const btn = Array.from(document.querySelectorAll('div,span,button'))
    .find(e => e.textContent?.trim() === 'Book a Tour');
  if (btn) {
    const s = getComputedStyle(btn);
    `bg: ${s.backgroundColor}, color: ${s.color}, font-size: ${s.fontSize}`;
  }
  ```
- [ ] Confirm the button has a contrasting background (not white-on-white)
- [ ] `mcp1_browser_take_screenshot` — capture the button

**Pass**: "Book a Tour" button is clearly visible with contrasting background and readable text.

---

## Item 13: No "Get started" badge on any profile

**Verify**: No "Get started" badge appears on any vendor or venue profile.

- [ ] Open a vendor profile
- [ ] `mcp1_browser_snapshot` — inspect the profile
- [ ] `mcp1_browser_evaluate` — search for "Get started" text:
  ```js
  Array.from(document.querySelectorAll('div,span')).filter(e => e.textContent?.includes('Get started')).length
  ```
- [ ] Confirm the result is 0
- [ ] Open a venue profile and repeat the check
- [ ] `mcp1_browser_take_screenshot` — capture both profiles

**Pass**: No "Get started" badge on any profile.

---

## Item 14: Favourite heart active = reddish/coral colour

**Verify**: When a listing is favourited (heart tapped), the heart icon turns reddish/coral.

- [ ] Open any listing profile
- [ ] Locate the heart/favourite icon
- [ ] `mcp1_browser_take_screenshot` — capture before favouriting
- [ ] `mcp1_browser_click` — tap the heart icon
- [ ] `mcp1_browser_evaluate` — check heart colour:
  ```js
  const heart = Array.from(document.querySelectorAll('div,span,svg,i'))
    .find(e => (e.textContent?.includes('♥') || e.textContent?.includes('favorite') || e.getAttribute('aria-label')?.includes('heart') || e.getAttribute('aria-label')?.includes('favorite')));
  heart ? getComputedStyle(heart).color : 'not found';
  ```
- [ ] Confirm the colour is reddish/coral (e.g. `rgb(220, 38, 38)`, `rgb(239, 68, 68)`, or similar)
- [ ] `mcp1_browser_take_screenshot` — capture after favouriting

**Pass**: Favourited heart displays a reddish/coral colour.

---

## Item 17: No small thumbnails below main image

**Verify**: No small thumbnail images appear below the main image on vendor and venue profiles.

- [ ] Open a vendor profile
- [ ] `mcp1_browser_snapshot` — inspect the image area
- [ ] `mcp1_browser_evaluate` — check for thumbnail rows:
  ```js
  const images = Array.from(document.querySelectorAll('img'));
  const mainImage = images[0];
  const thumbnails = images.filter(img => {
    const r = img.getBoundingClientRect();
    return r.width < 100 && r.height < 100 && r.top > (mainImage?.getBoundingClientRect().bottom || 0);
  });
  thumbnails.length;
  ```
- [ ] Confirm thumbnail count is 0
- [ ] Open a venue profile and repeat
- [ ] `mcp1_browser_take_screenshot` — capture the image area

**Pass**: No small thumbnails below the main image on any profile.

---

## Item 18: About/Amenities tab selected = orange/coral colour

**Verify**: When the "About" or "Amenities" tab is selected, the tab indicator/text is orange/coral coloured.

- [ ] Open any listing profile
- [ ] `mcp1_browser_click` — tap the "About" tab
- [ ] `mcp1_browser_evaluate` — check tab colour:
  ```js
  const tab = Array.from(document.querySelectorAll('div,span'))
    .find(e => e.textContent?.trim() === 'About');
  tab ? getComputedStyle(tab).color : 'not found';
  ```
- [ ] Confirm the colour is orange/coral (e.g. `rgb(255, 107, 107)` or `rgb(234, 88, 12)`)
- [ ] `mcp1_browser_click` — tap the "Amenities" tab (if present)
- [ ] Repeat the colour check
- [ ] `mcp1_browser_take_screenshot` — capture the selected tab

**Pass**: Selected About/Amenities tab shows orange/coral colour.

---

## Item 20: Calendar tab renamed to "Catalogue", reviews at far right

**Verify**: The "Calendar" tab is renamed to "Catalogue". The tab order places "Catalogue" to the left of "Reviews", with "Reviews" at the far right.

- [ ] Open a vendor profile
- [ ] `mcp1_browser_snapshot` — inspect the tab bar
- [ ] Confirm "Catalogue" tab is present (not "Calendar")
- [ ] Confirm "Reviews" tab is at the far right
- [ ] Confirm "Catalogue" tab is to the left of "Reviews"
- [ ] `mcp1_browser_evaluate` — verify tab order:
  ```js
  const tabs = Array.from(document.querySelectorAll('[role="tab"], div'))
    .filter(e => ['About','Amenities','Catalogue','Reviews','Calendar'].includes(e.textContent?.trim()))
    .map(e => ({ text: e.textContent?.trim(), rect: e.getBoundingClientRect() }));
  tabs.sort((a,b) => a.rect.left - b.rect.left).map(t => t.text);
  ```
- [ ] `mcp1_browser_take_screenshot` — capture the tab bar

**Pass**: "Calendar" renamed to "Catalogue"; "Reviews" is rightmost; "Catalogue" is left of "Reviews".

---

## Item 23: Rating breakdown available for selection

**Verify**: A rating breakdown (e.g. 5-star, 4-star, etc.) is available for users to select when viewing ratings on vendor and venue profiles.

- [ ] Open a vendor profile
- [ ] Navigate to the Reviews/ratings section
- [ ] `mcp1_browser_snapshot` — inspect the rating area
- [ ] Confirm rating breakdown bars/segments are visible (e.g. 5★, 4★, 3★, 2★, 1★)
- [ ] `mcp1_browser_click` — try selecting a rating breakdown item
- [ ] `mcp1_browser_take_screenshot` — capture the rating breakdown
- [ ] Repeat for a venue profile

**Pass**: Rating breakdown is visible and interactive on both vendor and venue profiles.

---

## Item 24: Overall rating section compact (reduced space)

**Verify**: The overall rating section takes up less vertical space than before (compact layout).

- [ ] Open any listing profile with ratings
- [ ] `mcp1_browser_evaluate` — measure the rating section height:
  ```js
  const ratingSection = Array.from(document.querySelectorAll('div'))
    .find(d => d.textContent?.includes('Overall Rating') || d.textContent?.includes('overall rating'));
  ratingSection ? ratingSection.getBoundingClientRect().height : 'not found';
  ```
- [ ] Confirm the height is compact (not excessively tall)
- [ ] `mcp1_browser_take_screenshot` — capture the rating section

**Pass**: Overall rating section has a compact, reduced-height layout.

---

## Item 25: No pricing in profile overview

**Verify**: No pricing information appears in the profile overview section.

- [ ] Open any listing profile
- [ ] `mcp1_browser_evaluate` — check for price text in the overview:
  ```js
  const overview = Array.from(document.querySelectorAll('div'))
    .find(d => d.textContent?.includes('About') && d.getBoundingClientRect().height > 100);
  const priceMatches = overview?.textContent?.match(/R\s*\d+|R\d+|\$\d+|per\s+(person|night|event)|pricing/i) || [];
  priceMatches;
  ```
- [ ] Confirm no pricing text is found
- [ ] `mcp1_browser_take_screenshot` — capture the overview

**Pass**: No pricing information in the profile overview.

---

## 29JULY Item 7: Price range in About section (not on cards)

**Verify**: Price range information (if any) appears only in the About section of the profile, not on listing cards.

- [ ] Open a listing profile
- [ ] Navigate to the "About" tab/section
- [ ] `mcp1_browser_snapshot` — inspect the About section
- [ ] Confirm price range text (e.g. "R500 - R2000") appears in the About section
- [ ] Navigate back to Discover
- [ ] `mcp1_browser_snapshot` — inspect listing cards
- [ ] Confirm no price range text appears on the cards
- [ ] `mcp1_browser_take_screenshot` — capture both views

**Pass**: Price range is in the About section only, not on cards.

---

## 29JULY Item 23: Book a Tour button shows for recent venue listings

**Verify**: The "Book a Tour" button appears on venue profiles for recently listed venues. This requires a database check.

- [ ] Use Supabase MCP to query recent venues:
  ```sql
  SELECT id, name, created_at FROM venue_listings ORDER BY created_at DESC LIMIT 5;
  ```
- [ ] Open one of the recent venue profiles in the browser
- [ ] `mcp1_browser_snapshot` — inspect the profile
- [ ] Confirm "Book a Tour" button is visible
- [ ] `mcp1_browser_take_screenshot` — capture the button

**Pass**: "Book a Tour" button appears on recent venue listings.

---

## 29JULY Item 24: "Contact for availability" button visible in profile

**Verify**: A "Contact for availability" button is visible somewhere in the profile.

- [ ] Open any venue profile
- [ ] `mcp1_browser_snapshot` — inspect the full profile
- [ ] `mcp1_browser_evaluate` — search for the button:
  ```js
  Array.from(document.querySelectorAll('div,span,button'))
    .filter(e => e.textContent?.includes('Contact for availability')).length
  ```
- [ ] Confirm at least 1 match
- [ ] `mcp1_browser_take_screenshot` — capture the button location

**Pass**: "Contact for availability" button is visible in the profile.

---

## 29JULY Item 25: "View Catalogue" button removed from profile

**Verify**: The "View Catalogue" button no longer appears on the profile page.

- [ ] Open any vendor profile
- [ ] `mcp1_browser_snapshot` — inspect the full profile
- [ ] `mcp1_browser_evaluate` — search for the button:
  ```js
  Array.from(document.querySelectorAll('div,span,button'))
    .filter(e => e.textContent?.trim() === 'View Catalogue').length
  ```
- [ ] Confirm the result is 0
- [ ] `mcp1_browser_take_screenshot` — capture the profile for visual confirmation

**Pass**: No "View Catalogue" button on the profile page.
