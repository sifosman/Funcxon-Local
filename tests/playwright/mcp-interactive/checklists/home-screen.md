# Mobile Home Screen — MCP Interactive Checklist

**Target**: `http://localhost:8081` | **Viewport**: 390×844 (iPhone 14)

## Setup

1. `mcp1_browser_navigate` → `http://localhost:8081`
2. `mcp1_browser_resize` → 390×844
3. Log in if not already authenticated
4. Ensure you're on the Home tab

---

## Item 1: No hero section, slogan text at top

**Verify**: The large hero section is removed. A small slogan text appears at the top instead.

- [ ] `mcp1_browser_snapshot` — capture the home screen
- [ ] Confirm no large hero banner/image is present at the top
- [ ] Confirm slogan text (e.g. "Curate Your Perfect Event") is visible but small
- [ ] `mcp1_browser_take_screenshot` — capture for record

**Pass**: No hero section visible; slogan text is small and at the top.

---

## Item 2: Featured cards show full business name, 1.5 card width

**Verify**: Featured vendor/venue cards display the full business name (not truncated), are approximately 1.5× the width of a standard card, and a scroll indicator is visible.

- [ ] Scroll to "Featured Vendors & Services" section
- [ ] `mcp1_browser_snapshot` — inspect card elements
- [ ] Confirm at least one card shows the full business name without truncation
- [ ] `mcp1_browser_evaluate` — check card width: `document.querySelector('[card-element]')?.getBoundingClientRect().width`
- [ ] Confirm a horizontal scroll indicator is present
- [ ] `mcp1_browser_take_screenshot` — capture the featured section

**Pass**: Full business names visible, cards are wider than standard, scroll indicator present.

---

## Item 5: No floating button

**Verify**: There is no floating action button (FAB) on the home screen.

- [ ] `mcp1_browser_evaluate` — check for floating elements:
  ```js
  Array.from(document.querySelectorAll('div')).filter(d => {
    const s = getComputedStyle(d);
    const r = d.getBoundingClientRect();
    return s.position === 'fixed' && r.width < 80 && r.height < 80 && parseFloat(s.bottom || s.right) < 100;
  }).length
  ```
- [ ] Confirm the result is 0 (no floating buttons)
- [ ] `mcp1_browser_take_screenshot` — full page screenshot to visually confirm

**Pass**: No floating action button visible anywhere on the home screen.

---

## Item 6: Section headings larger than "View All" button

**Verify**: "Featured Vendors & Services" and "Featured Venues" headings are larger than the "View All" button text, using the primary font.

- [ ] Scroll to the featured sections
- [ ] `mcp1_browser_snapshot` — locate heading and "View All" text
- [ ] `mcp1_browser_evaluate` — compare font sizes:
  ```js
  const heading = Array.from(document.querySelectorAll('div,span')).find(e => e.textContent?.includes('Featured Vendors & Services'));
  const viewAll = Array.from(document.querySelectorAll('div,span')).find(e => e.textContent?.trim() === 'View All');
  const hSize = heading ? parseFloat(getComputedStyle(heading).fontSize) : 0;
  const vSize = viewAll ? parseFloat(getComputedStyle(viewAll).fontSize) : 0;
  `Heading: ${hSize}px, View All: ${vSize}px`;
  ```
- [ ] Confirm heading font size > "View All" font size
- [ ] `mcp1_browser_take_screenshot` — capture for comparison

**Pass**: Both section headings are visibly larger than "View All" text.

---

## Item 7: "View All" navigates to Discover with featured listings only

**Verify**: Tapping "View All" opens the Discover screen showing only featured listings.

- [ ] `mcp1_browser_click` — click "View All" next to "Featured Vendors & Services"
- [ ] `mcp1_browser_snapshot` — capture the Discover screen
- [ ] Confirm the URL/screen changed to Discover
- [ ] Confirm the listings shown are featured (not all listings)
- [ ] `mcp1_browser_take_screenshot` — capture the Discover screen
- [ ] `mcp1_browser_navigate_back` — return to home

**Pass**: "View All" navigates to Discover showing only featured listings.

---

## Item 8: Explore by section has venue + vendor cards

**Verify**: The "Explore by" section contains both venue cards and vendor cards (2 new cards added).

- [ ] Scroll to "Explore by" section
- [ ] `mcp1_browser_snapshot` — inspect the explore section
- [ ] Confirm at least one venue card is present
- [ ] Confirm at least one vendor card is present
- [ ] `mcp1_browser_take_screenshot` — capture the explore section

**Pass**: Both venue and vendor cards are present in the "Explore by" section.

---

## Item 26: Bottom nav has "Home" tab, top nav has 3 options

**Verify**: The bottom navigation bar shows "Home" (not "Search"). The top navigation has 3 options: Venues, Vendors, Listers Portal.

- [ ] `mcp1_browser_snapshot` — capture the full page including nav bars
- [ ] Confirm bottom nav includes a "Home" tab (not "Search")
- [ ] Confirm top nav includes "Venues", "Vendors", and "Listers Portal"
- [ ] `mcp1_browser_evaluate` — verify nav items:
  ```js
  const bottomTabs = Array.from(document.querySelectorAll('[role="tab"]')).map(t => t.textContent?.trim());
  const topNavTexts = Array.from(document.querySelectorAll('div,span'))
    .filter(e => ['Venues','Vendors','Listers Portal'].includes(e.textContent?.trim()))
    .map(e => e.textContent?.trim());
  `Bottom tabs: ${bottomTabs.join(', ')}, Top nav matches: ${topNavTexts.join(', ')}`;
  ```
- [ ] `mcp1_browser_take_screenshot` — capture both nav bars

**Pass**: Bottom nav shows "Home" tab; top nav shows exactly Venues, Vendors, Listers Portal.
