# Desktop Search — MCP Interactive Checklist

**Target**: `https://funcxon-local.vercel.app` | **Viewport**: 1280×800

## Setup

1. `mcp1_browser_navigate` → `https://funcxon-local.vercel.app`
2. `mcp1_browser_resize` → 1280×800
3. Log in if not already authenticated
4. Navigate to the Discover/Search screen

---

## Lists are alphabetical

**Verify**: Search results and listing lists are sorted alphabetically (A-Z) by default on desktop.

- [ ] Navigate to Discover screen (Vendors or Venues)
- [ ] `mcp1_browser_snapshot` — inspect the listing results
- [ ] `mcp1_browser_evaluate` — extract listing names in order:
  ```js
  // Get visible listing card names in DOM order
  const cards = Array.from(document.querySelectorAll('div'))
    .filter(d => {
      const r = d.getBoundingClientRect();
      return r.width > 200 && r.height > 100 && r.top > 100;
    });
  // This is a heuristic — extract text content from each card's first heading-like element
  const names = cards.map(c => {
    const heading = c.querySelector('h1, h2, h3, h4, div, span');
    return heading?.textContent?.trim();
  }).filter(Boolean).slice(0, 10);
  names;
  ```
- [ ] Confirm the names are in alphabetical order (or close to it, accounting for featured listings that may be pinned)
- [ ] `mcp1_browser_take_screenshot` — capture the alphabetical list

**Pass**: Listing results are sorted alphabetically by default.

---

## Florist search shows correct profile

**Verify**: Searching for "florist" returns relevant florist vendor profiles, and clicking a result opens the correct profile.

- [ ] Navigate to the Discover/Search screen
- [ ] `mcp1_browser_type` — type "florist" in the search input
- [ ] `mcp1_browser_snapshot` — capture the search results
- [ ] Confirm the results contain florist-related vendors (names or categories mention flowers/florist)
- [ ] `mcp1_browser_click` — click on a florist result
- [ ] `mcp1_browser_snapshot` — capture the profile page
- [ ] Confirm the profile matches the clicked result (name, category)
- [ ] `mcp1_browser_take_screenshot` — capture the florist profile

**Pass**: "Florist" search returns relevant results and clicking opens the correct profile.

---

## Save changes → back to main page

**Verify**: After saving changes (e.g. in profile edit or filters), the user is navigated back to the main page.

- [ ] Navigate to a screen with a "Save Changes" button (e.g. edit profile, filter settings)
- [ ] `mcp1_browser_snapshot` — locate the "Save Changes" button
- [ ] `mcp1_browser_click` — tap "Save Changes"
- [ ] `mcp1_browser_snapshot` — capture the resulting screen
- [ ] Confirm the user is returned to the main page (not stuck on the edit/settings screen)
- [ ] `mcp1_browser_evaluate` — check current URL/state:
  ```js
  window.location.href;
  ```
- [ ] `mcp1_browser_take_screenshot` — capture the main page after saving

**Pass**: "Save Changes" navigates back to the main page.
