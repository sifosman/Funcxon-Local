# Mobile Discover Screen — MCP Interactive Checklist

**Target**: `http://localhost:8081` | **Viewport**: 390×844 (iPhone 14)

## Setup

1. `mcp1_browser_navigate` → `http://localhost:8081`
2. `mcp1_browser_resize` → 390×844
3. Log in if not already authenticated
4. Navigate to Discover by tapping "Vendors" or "Venues" in the top nav

---

## Item 3: Explore by cards navigate to Discover (not filters popup)

**Verify**: Tapping an "Explore by" card on the home screen navigates to the Discover screen, not a filters popup.

- [ ] Navigate to Home tab
- [ ] Scroll to "Explore by" section
- [ ] `mcp1_browser_click` — tap a venue or vendor explore card
- [ ] `mcp1_browser_snapshot` — capture the resulting screen
- [ ] Confirm the Discover screen is shown (not a filters popup/modal)
- [ ] `mcp1_browser_take_screenshot` — capture for record

**Pass**: Tapping explore cards opens the Discover screen, not a popup.

---

## Item 4: Province selector = stacked options with coral highlight

**Verify**: The province selector shows 3 stacked options (not a dropdown). The selected option has a coral/orange highlight colour.

- [ ] Navigate to Discover screen
- [ ] `mcp1_browser_snapshot` — inspect the province selector area
- [ ] Confirm province options are displayed as stacked rows (not a dropdown)
- [ ] `mcp1_browser_click` — select a province (e.g. "Gauteng")
- [ ] `mcp1_browser_evaluate` — check the selected option's background colour:
  ```js
  const selected = Array.from(document.querySelectorAll('div,span'))
    .find(e => e.textContent?.trim() === 'Gauteng' && getComputedStyle(e).backgroundColor !== 'rgba(0, 0, 0, 0)');
  selected ? getComputedStyle(selected).backgroundColor : 'not found';
  ```
- [ ] Confirm the highlight colour is coral/orange (e.g. `rgb(255, 107, 107)` or similar)
- [ ] `mcp1_browser_take_screenshot` — capture the province selector

**Pass**: Province selector uses stacked options with coral highlight on selection.

---

## Item 9: Filters open as a new screen with back button (booking.com style)

**Verify**: Tapping the filters icon/button opens a full new screen with a back button, not a bottom sheet or popup.

- [ ] Navigate to Discover screen
- [ ] `mcp1_browser_click` — tap the filters icon/button
- [ ] `mcp1_browser_snapshot` — capture the filters view
- [ ] Confirm it's a full screen (not a modal/sheet)
- [ ] Confirm a back button is present at the top
- [ ] `mcp1_browser_take_screenshot` — capture the filters screen
- [ ] `mcp1_browser_click` — tap the back button
- [ ] Confirm you return to the Discover screen

**Pass**: Filters open as a full screen with a back button (booking.com style).

---

## Item 10: Selecting venues shows only venues, vendors shows only vendors

**Verify**: When "Venues" is selected, only venue listings appear. When "Vendors" is selected, only vendor listings appear.

- [ ] Navigate to Discover screen
- [ ] `mcp1_browser_click` — select "Venues" category/tab
- [ ] `mcp1_browser_snapshot` — capture the results
- [ ] Confirm all visible listings are venues (no vendor listings mixed in)
- [ ] `mcp1_browser_take_screenshot` — capture venues-only view
- [ ] `mcp1_browser_click` — select "Vendors" category/tab
- [ ] `mcp1_browser_snapshot` — capture the results
- [ ] Confirm all visible listings are vendors (no venue listings mixed in)
- [ ] `mcp1_browser_take_screenshot` — capture vendors-only view

**Pass**: Category selection correctly filters to show only the selected type.

---

## Item 25: No pricing in listing cards/overviews

**Verify**: Listing cards on the Discover screen and profile overview screens do not display pricing information.

- [ ] Navigate to Discover screen
- [ ] `mcp1_browser_snapshot` — inspect listing cards
- [ ] `mcp1_browser_evaluate` — check for price-related text in cards:
  ```js
  const cards = Array.from(document.querySelectorAll('[class*="card"], [class*="Card"]'));
  const priceTexts = cards.flatMap(c => {
    const text = c.textContent || '';
    return text.match(/R\s*\d+|R\d+|\$\d+|per\s+(person|night|event)|pricing/i) || [];
  });
  priceTexts;
  ```
- [ ] Confirm no price text (e.g. "R500", "R 1,200", "per person") appears on any card
- [ ] `mcp1_browser_take_screenshot` — capture listing cards for visual confirmation

**Pass**: No pricing information visible on any listing card or overview.
