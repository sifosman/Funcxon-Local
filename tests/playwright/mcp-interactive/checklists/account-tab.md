# Mobile Account Tab — MCP Interactive Checklist

**Target**: `http://localhost:8081` | **Viewport**: 390×844 (iPhone 14)

## Setup

1. `mcp1_browser_navigate` → `http://localhost:8081`
2. `mcp1_browser_resize` → 390×844
3. Log in if not already authenticated
4. Navigate to the Account tab in the bottom nav

---

## Item 26: Bottom nav = Home tab (not Search), top nav = Venues/Vendors/Listers Portal

**Verify**: The bottom navigation bar shows "Home" (not "Search"). The top navigation has 3 options: Venues, Vendors, Listers Portal.

- [ ] `mcp1_browser_snapshot` — capture the full page including nav bars
- [ ] Confirm bottom nav includes a "Home" tab (not "Search")
- [ ] Confirm top nav includes "Venues", "Vendors", and "Listers Portal"
- [ ] `mcp1_browser_evaluate` — verify nav items:
  ```js
  const bottomTabs = Array.from(document.querySelectorAll('[role="tab"]')).map(t => t.textContent?.trim());
  `Bottom tabs: ${bottomTabs.join(', ')}`;
  ```
- [ ] `mcp1_browser_take_screenshot` — capture both nav bars

**Pass**: Bottom nav shows "Home"; top nav shows Venues, Vendors, Listers Portal.

---

## Item 28: Account tab = users only, no lister tabs, no delete button

**Verify**: The Account tab for regular users shows only user-related options. No lister-specific tabs or delete buttons appear.

- [ ] Log in as a regular user (attendee role)
- [ ] `mcp1_browser_click` — tap the Account tab
- [ ] `mcp1_browser_snapshot` — capture the account menu
- [ ] Confirm no lister-specific tabs (e.g. "Portfolio", "My Listings") are visible
- [ ] Confirm no delete button is visible
- [ ] `mcp1_browser_evaluate` — check for delete buttons:
  ```js
  Array.from(document.querySelectorAll('div,span,button'))
    .filter(e => /delete|remove\s*account/i.test(e.textContent || ''))
    .map(e => e.textContent?.trim()).filter(t => t.length < 50);
  ```
- [ ] Confirm the result is empty
- [ ] `mcp1_browser_take_screenshot` — capture the account tab

**Pass**: Account tab for regular users has no lister tabs or delete button.

---

## 29JULY Item 4: No "Change Password" button in profile settings

**Verify**: The profile settings screen does not have a "Change Password" button/option.

- [ ] Navigate to Account tab → Profile Settings (or equivalent)
- [ ] `mcp1_browser_snapshot` — inspect the settings screen
- [ ] `mcp1_browser_evaluate` — search for "Change Password":
  ```js
  Array.from(document.querySelectorAll('div,span,button'))
    .filter(e => /change\s*password|update\s*password/i.test(e.textContent || ''))
    .map(e => e.textContent?.trim()).filter(t => t.length < 50);
  ```
- [ ] Confirm the result is empty (no "Change Password" button)
- [ ] `mcp1_browser_take_screenshot` — capture the settings screen

**Pass**: No "Change Password" button in profile settings.

---

## 29JULY Item 18: "Help Desk" (not "Need help?"), slide-in panel

**Verify**: The help button reads "Help Desk" (not "Need help?"). Tapping it opens a slide-in panel from the side, not a bottom sheet.

- [ ] Navigate to the Account tab
- [ ] `mcp1_browser_snapshot` — locate the help button
- [ ] Confirm the text reads "Help Desk" (not "Need help?")
- [ ] `mcp1_browser_click` — tap "Help Desk"
- [ ] `mcp1_browser_snapshot` — inspect the panel
- [ ] `mcp1_browser_evaluate` — check panel position:
  ```js
  const panel = Array.from(document.querySelectorAll('div'))
    .find(d => {
      const s = getComputedStyle(d);
      const r = d.getBoundingClientRect();
      return s.position === 'fixed' && r.width > 200 && r.height > 300;
    });
  panel ? { left: panel.getBoundingClientRect().left, right: panel.getBoundingClientRect().right } : 'not found';
  ```
- [ ] Confirm the panel slides in from the side (not from the bottom)
- [ ] `mcp1_browser_take_screenshot` — capture the slide-in panel

**Pass**: Button says "Help Desk"; panel slides in from the side.

---

## 29JULY Item 19: Delete account = admin request

**Verify**: The delete account option triggers an admin request, not immediate account deletion.

- [ ] Navigate to Account tab → settings
- [ ] `mcp1_browser_snapshot` — locate the delete account option
- [ ] `mcp1_browser_click` — tap delete account
- [ ] `mcp1_browser_snapshot` — capture the resulting dialog
- [ ] Confirm the message indicates an admin request will be sent (not "Are you sure?" immediate deletion)
- [ ] `mcp1_browser_take_screenshot` — capture the admin request dialog

**Pass**: Delete account triggers an admin request flow.
