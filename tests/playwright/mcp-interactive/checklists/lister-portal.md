# Mobile Lister Portal — MCP Interactive Checklist

**Target**: `http://localhost:8081` | **Viewport**: 390×844 (iPhone 14)

## Setup

1. `mcp1_browser_navigate` → `http://localhost:8081`
2. `mcp1_browser_resize` → 390×844
3. Log in as a user with a vendor/venue listing (lister account)
4. Navigate to the Lister Portal

---

## Item 27: Delete = admin request (not immediate)

**Verify**: The delete option in the portfolio management screen triggers an admin request, not an immediate deletion.

- [ ] Navigate to Lister Portal → Portfolio Management
- [ ] `mcp1_browser_snapshot` — inspect the portfolio management screen
- [ ] Locate a delete option/button
- [ ] `mcp1_browser_click` — tap delete
- [ ] `mcp1_browser_snapshot` — capture the resulting dialog/message
- [ ] Confirm the message indicates an admin request will be sent (not "Are you sure you want to delete?")
- [ ] `mcp1_browser_take_screenshot` — capture the admin request confirmation

**Pass**: Delete triggers an admin request flow, not immediate deletion.

---

## Item 28: Account tab = users only (no lister tabs, no delete button)

**Verify**: The Account tab for regular users shows only user-related options. No lister-specific tabs or delete buttons appear.

- [ ] Log in as a regular user (attendee role, no vendor/venue)
- [ ] `mcp1_browser_click` — tap the Account tab in bottom nav
- [ ] `mcp1_browser_snapshot` — capture the account menu
- [ ] Confirm no lister-specific tabs (e.g. "Portfolio", "My Listings") are visible
- [ ] Confirm no delete button is visible
- [ ] `mcp1_browser_take_screenshot` — capture the account tab

**Pass**: Account tab for regular users has no lister tabs or delete button.

---

## Item 29: Lister portal login button → portfolio management screen

**Verify**: The Lister Portal login button navigates to the portfolio management screen.

- [ ] Navigate to the Lister Portal entry point
- [ ] `mcp1_browser_snapshot` — capture the login screen
- [ ] `mcp1_browser_click` — tap the login button
- [ ] `mcp1_browser_snapshot` — capture the resulting screen
- [ ] Confirm the portfolio management screen is shown
- [ ] `mcp1_browser_take_screenshot` — capture the portfolio management screen

**Pass**: Lister Portal login button navigates to portfolio management.

---

## 29JULY Item 1: No support section in portfolio management

**Verify**: The portfolio management screen does not contain a support/help section.

- [ ] Navigate to portfolio management screen
- [ ] `mcp1_browser_snapshot` — inspect the full screen
- [ ] `mcp1_browser_evaluate` — search for support-related text:
  ```js
  Array.from(document.querySelectorAll('div,span'))
    .filter(e => /support|help\s*center|contact\s*support/i.test(e.textContent || ''))
    .map(e => e.textContent?.trim()).filter(t => t.length < 50);
  ```
- [ ] Confirm no support section is present
- [ ] `mcp1_browser_take_screenshot` — capture the full screen

**Pass**: No support section in the portfolio management screen.

---

## 29JULY Item 2: "Create new application" text (no "your", no "items")

**Verify**: The button/link text reads "Create new application" — not "Create new portfolio application", not "your", not "items".

- [ ] Navigate to portfolio management screen
- [ ] `mcp1_browser_snapshot` — locate the create button
- [ ] `mcp1_browser_evaluate` — check the exact text:
  ```js
  Array.from(document.querySelectorAll('div,span,button'))
    .filter(e => e.textContent?.includes('Create') && e.textContent?.includes('application'))
    .map(e => e.textContent?.trim());
  ```
- [ ] Confirm the text is exactly "Create new application" (no "portfolio", no "your", no "items")
- [ ] `mcp1_browser_take_screenshot` — capture the button

**Pass**: Button text is "Create new application" with no extra words.

---

## 29JULY Item 3: Nav bar shows username (not full name)

**Verify**: The navigation bar in the lister portal shows the username, not the user's full name.

- [ ] Navigate to the Lister Portal
- [ ] `mcp1_browser_snapshot` — inspect the nav bar
- [ ] `mcp1_browser_evaluate` — check what's displayed:
  ```js
  // Compare the nav bar text against the user's full name and username
  const navText = Array.from(document.querySelectorAll('div,span'))
    .filter(e => e.getBoundingClientRect().top < 100 && e.getBoundingClientRect().width > 50)
    .map(e => e.textContent?.trim()).filter(t => t && t.length < 30);
  navText;
  ```
- [ ] Confirm the nav bar shows a username (email handle or username), not "E2E Test User" or similar full name
- [ ] `mcp1_browser_take_screenshot` — capture the nav bar

**Pass**: Nav bar displays username, not full name.

---

## 29JULY Item 5: Back from profile popup → portfolio management

**Verify**: Closing/backing out of a profile popup returns to the portfolio management screen, not the listers portal landing.

- [ ] Navigate to portfolio management
- [ ] Open a listing profile popup
- [ ] `mcp1_browser_snapshot` — confirm the popup is open
- [ ] `mcp1_browser_click` — tap the back/close button
- [ ] `mcp1_browser_snapshot` — capture the resulting screen
- [ ] Confirm you're back on the portfolio management screen (not the listers portal landing)
- [ ] `mcp1_browser_take_screenshot` — capture the screen after closing popup

**Pass**: Back from profile popup returns to portfolio management.

---

## 29JULY Item 6: Edit profile images show correctly (all images, not just 1)

**Verify**: The edit profile screen shows all the vendor/venue's images, not just the first one.

- [ ] Navigate to portfolio management
- [ ] `mcp1_browser_click` — tap "Edit Profile" or equivalent
- [ ] `mcp1_browser_snapshot` — inspect the edit profile screen
- [ ] `mcp1_browser_evaluate` — count visible images:
  ```js
  const images = Array.from(document.querySelectorAll('img'))
    .filter(img => {
      const r = img.getBoundingClientRect();
      return r.width > 50 && r.height > 50;
    });
  images.length;
  ```
- [ ] Confirm multiple images are shown (more than 1, if the vendor has multiple)
- [ ] `mcp1_browser_take_screenshot` — capture the edit profile images

**Pass**: All images are displayed in the edit profile screen.

---

## 29JULY Item 8: Edit profile fields use dropdowns/pickers

**Verify**: Edit profile fields for services and address use dropdowns/pickers (not plain text inputs). Address should integrate with Google Maps autocomplete.

- [ ] Navigate to edit profile screen
- [ ] `mcp1_browser_snapshot` — inspect form fields
- [ ] Locate the services field — confirm it's a dropdown/picker (not a plain text input)
- [ ] Locate the address field — confirm it has Google Maps autocomplete (type-ahead suggestions)
- [ ] `mcp1_browser_type` — type a partial address in the address field
- [ ] `mcp1_browser_snapshot` — check for autocomplete suggestions
- [ ] `mcp1_browser_take_screenshot` — capture the dropdowns and autocomplete

**Pass**: Services field uses a dropdown; address field uses Google Maps autocomplete.

---

## 29JULY Item 12: "View Bookings" + "View Quotes" buttons navigate correctly

**Verify**: "View Bookings" and "View Quotes" buttons are present and navigate to their respective screens.

- [ ] Navigate to portfolio management
- [ ] `mcp1_browser_snapshot` — locate "View Bookings" and "View Quotes" buttons
- [ ] `mcp1_browser_click` — tap "View Bookings"
- [ ] `mcp1_browser_snapshot` — confirm the bookings screen is shown
- [ ] `mcp1_browser_take_screenshot` — capture the bookings screen
- [ ] `mcp1_browser_navigate_back` — return
- [ ] `mcp1_browser_click` — tap "View Quotes"
- [ ] `mcp1_browser_snapshot` — confirm the quotes screen is shown
- [ ] `mcp1_browser_take_screenshot` — capture the quotes screen

**Pass**: Both buttons navigate to their respective screens.

---

## 29JULY Item 13: Below login button — "Upgrade" + "Get Featured" buttons

**Verify**: Below the lister portal login button, there are "Upgrade" and "Get Featured" buttons.

- [ ] Navigate to the Lister Portal login screen
- [ ] `mcp1_browser_snapshot` — inspect the area below the login button
- [ ] Confirm "Upgrade" button is visible
- [ ] Confirm "Get Featured" button is visible
- [ ] `mcp1_browser_take_screenshot` — capture the buttons

**Pass**: "Upgrade" and "Get Featured" buttons appear below the login button.

---

## 29JULY Item 14: Email quote button opens mobile app (deep link)

**Verify**: The email quote button triggers a deep link that opens the mobile app (not just a web URL).

- [ ] Navigate to a quote email view (or simulate the quote email button)
- [ ] `mcp1_browser_snapshot` — locate the quote button/link
- [ ] `mcp1_browser_evaluate` — check the link href:
  ```js
  const link = Array.from(document.querySelectorAll('a, button'))
    .find(e => e.textContent?.includes('Quote') && (e.getAttribute('href') || ''));
  link?.getAttribute('href') || 'no href';
  ```
- [ ] Confirm the link uses a deep link scheme (e.g. `funcxon://` or `exp://` or app-specific scheme)
- [ ] `mcp1_browser_take_screenshot` — capture the button

**Pass**: Email quote button uses a deep link to open the mobile app.

---

## 29JULY Item 15: Marketing permissions defaulted to enabled

**Verify**: Marketing permissions are enabled by default in the profile/application settings.

- [ ] Navigate to edit profile or application settings
- [ ] `mcp1_browser_snapshot` — locate marketing permissions toggle/checkbox
- [ ] `mcp1_browser_evaluate` — check the default state:
  ```js
  const marketing = Array.from(document.querySelectorAll('input[type="checkbox"], [role="checkbox"], [role="switch"]'))
    .find(e => {
      const label = e.closest('div')?.textContent || '';
      return /marketing|promotional|permissions/i.test(label);
    });
  marketing ? { checked: marketing.checked, ariaChecked: marketing.getAttribute('aria-checked') } : 'not found';
  ```
- [ ] Confirm the default state is enabled/checked
- [ ] `mcp1_browser_take_screenshot` — capture the default state

**Pass**: Marketing permissions are enabled by default.

---

## 29JULY Item 17: FAQ button auto-scrolls to FAQ section

**Verify**: Tapping the FAQ button auto-scrolls to the FAQ section rather than navigating to a new screen.

- [ ] Navigate to a screen with an FAQ button
- [ ] `mcp1_browser_snapshot` — locate the FAQ button
- [ ] `mcp1_browser_click` — tap the FAQ button
- [ ] `mcp1_browser_evaluate` — check scroll position:
  ```js
  const faqSection = Array.from(document.querySelectorAll('div'))
    .find(d => /FAQ|Frequently Asked/i.test(d.textContent || ''));
  faqSection ? faqSection.getBoundingClientRect().top : 'not found';
  ```
- [ ] Confirm the FAQ section is scrolled into view (top value near 0 or visible in viewport)
- [ ] `mcp1_browser_take_screenshot` — capture the scrolled FAQ section

**Pass**: FAQ button auto-scrolls to the FAQ section on the same page.

---

## 29JULY Item 18: "Help Desk" button (not "Need help?"), slide-in panel

**Verify**: The help button reads "Help Desk" (not "Need help?"). Tapping it opens a slide-in panel from the side, not a bottom sheet.

- [ ] Navigate to the relevant screen (account or portfolio)
- [ ] `mcp1_browser_snapshot` — locate the help button
- [ ] Confirm the text reads "Help Desk" (not "Need help?")
- [ ] `mcp1_browser_click` — tap "Help Desk"
- [ ] `mcp1_browser_snapshot` — inspect the panel that appears
- [ ] `mcp1_browser_evaluate` — check panel position:
  ```js
  const panel = Array.from(document.querySelectorAll('div'))
    .find(d => {
      const s = getComputedStyle(d);
      const r = d.getBoundingClientRect();
      return s.position === 'fixed' && r.width > 200 && r.height > 300;
    });
  panel ? { left: panel.getBoundingClientRect().left, right: panel.getBoundingClientRect().right, width: panel.getBoundingClientRect().width } : 'not found';
  ```
- [ ] Confirm the panel slides in from the side (left or right), not from the bottom
- [ ] `mcp1_browser_take_screenshot` — capture the slide-in panel

**Pass**: Button says "Help Desk"; panel is a slide-in from the side, not a bottom sheet.

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

---

## 29JULY Item 20: Calendar tab → Catalogue tab, tab order correct

**Verify**: In the lister portal profile, the "Calendar" tab is renamed to "Catalogue". Tab order is: ... Catalogue, Reviews (with Reviews at far right).

- [ ] Navigate to a listing profile from the lister portal
- [ ] `mcp1_browser_snapshot` — inspect the tab bar
- [ ] Confirm "Catalogue" tab is present (not "Calendar")
- [ ] `mcp1_browser_evaluate` — verify tab order:
  ```js
  const tabs = Array.from(document.querySelectorAll('[role="tab"], div'))
    .filter(e => ['About','Amenities','Catalogue','Reviews','Calendar'].includes(e.textContent?.trim()))
    .map(e => ({ text: e.textContent?.trim(), left: e.getBoundingClientRect().left }))
    .sort((a, b) => a.left - b.left);
  tabs.map(t => t.text);
  ```
- [ ] Confirm "Reviews" is rightmost and "Catalogue" is to its left
- [ ] `mcp1_browser_take_screenshot` — capture the tab bar

**Pass**: "Calendar" renamed to "Catalogue"; tab order has Catalogue before Reviews (Reviews rightmost).
