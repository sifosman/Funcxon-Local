# Desktop UI — MCP Interactive Checklist

**Target**: `https://funcxon-local.vercel.app` | **Viewport**: 1280×800

## Setup

1. `mcp1_browser_navigate` → `https://funcxon-local.vercel.app`
2. `mcp1_browser_resize` → 1280×800
3. Log in if not already authenticated

---

## Tags easier in application (dropdown/autocomplete)

**Verify**: The application form's tags input uses a dropdown or autocomplete component (not a plain text input or checkboxes). This makes it easier to select tags on desktop.

- [ ] Navigate to the vendor/venue application form
- [ ] Scroll to the tags/services section
- [ ] `mcp1_browser_snapshot` — inspect the tags input area
- [ ] Confirm the tags input is a dropdown or autocomplete component:
  - [ ] Has a searchable input that shows suggestions as you type, OR
  - [ ] Has a dropdown/picker UI for selecting tags
- [ ] `mcp1_browser_type` — type a partial tag name (e.g. "wed")
- [ ] `mcp1_browser_snapshot` — check for autocomplete suggestions
- [ ] Confirm suggestions appear (e.g. "Wedding", "Wedding Planning")
- [ ] `mcp1_browser_click` — select a suggestion
- [ ] `mcp1_browser_evaluate` — verify the tag was added:
  ```js
  // Look for tag chips/badges that represent selected tags
  const tags = Array.from(document.querySelectorAll('div,span'))
    .filter(e => {
      const r = e.getBoundingClientRect();
      const s = getComputedStyle(e);
      return r.width > 30 && r.width < 200 && r.height > 20 && r.height < 40 &&
             (s.borderRadius !== '0px' || s.backgroundColor !== 'rgba(0, 0, 0, 0)');
    });
  tags.map(t => t.textContent?.trim()).filter(t => t && t.length < 30);
  ```
- [ ] `mcp1_browser_take_screenshot` — capture the tags autocomplete and selected tags

**Pass**: Tags input uses a dropdown/autocomplete with suggestions, not plain text or checkboxes.

---

## Desktop layout correct

**Verify**: The desktop layout renders correctly — proper use of horizontal space, no mobile-only components appearing on desktop, navigation is desktop-appropriate.

- [ ] Navigate to the home page
- [ ] `mcp1_browser_snapshot` — inspect the full desktop layout
- [ ] Confirm:
  - [ ] Top navigation bar is horizontal (not a hamburger menu)
  - [ ] Content uses the full width (not a narrow mobile column)
  - [ ] Featured cards are in a horizontal row/grid (not a single column)
  - [ ] No mobile bottom tab bar visible at desktop width
  - [ ] No mobile-only floating buttons or mobile-specific UI elements
- [ ] `mcp1_browser_evaluate` — check for mobile UI elements at desktop width:
  ```js
  // Check for bottom tab bar (should not be visible on desktop)
  const bottomNav = Array.from(document.querySelectorAll('div'))
    .find(d => {
      const s = getComputedStyle(d);
      const r = d.getBoundingClientRect();
      return s.position === 'fixed' && r.bottom === 0 && r.width > window.innerWidth * 0.8 && r.height < 100;
    });
  // Check for hamburger menu
  const hamburger = Array.from(document.querySelectorAll('div,span,button'))
    .find(e => /☰|menu|hamburger/i.test(e.textContent || '') || e.getAttribute('aria-label')?.toLowerCase().includes('menu'));
  `Bottom nav: ${bottomNav ? 'present' : 'absent'}, Hamburger: ${hamburger ? 'present' : 'absent'}`;
  ```
- [ ] Confirm bottom nav is absent and hamburger menu is absent at desktop width
- [ ] Navigate to Discover, Profile, and Account screens — verify each renders correctly on desktop
- [ ] `mcp1_browser_take_screenshot` — capture each desktop layout

**Pass**: Desktop layout uses horizontal space properly, no mobile-only UI elements visible.
