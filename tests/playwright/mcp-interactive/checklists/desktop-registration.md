# Desktop Registration — MCP Interactive Checklist

**Target**: `https://funcxon-local.vercel.app` | **Viewport**: 1280×800

## Setup

1. `mcp1_browser_navigate` → `https://funcxon-local.vercel.app`
2. `mcp1_browser_resize` → 1280×800
3. Log out if currently authenticated (use incognito or clear session)

---

## Can choose plan + register venue

**Verify**: A user can select a subscription plan and register a new venue through the desktop registration flow.

- [ ] Navigate to the registration/sign-up page
- [ ] `mcp1_browser_snapshot` — inspect the plan selection screen
- [ ] Confirm subscription plans are displayed (e.g. Get Started, Pro, Premium)
- [ ] `mcp1_browser_click` — select a plan (e.g. "Get Started")
- [ ] `mcp1_browser_snapshot` — capture the registration form
- [ ] Confirm the form includes venue registration fields (name, address, etc.)
- [ ] `mcp1_browser_take_screenshot` — capture the plan + registration flow

**Pass**: User can select a plan and proceed to venue registration.

---

## Vendor can choose annual plans

**Verify**: A vendor can select an annual billing plan during registration.

- [ ] Navigate to the vendor registration flow
- [ ] `mcp1_browser_snapshot` — inspect the plan selection
- [ ] Confirm annual plan options are visible (e.g. "Annual" or "Yearly" billing toggle/option)
- [ ] `mcp1_browser_evaluate` — check for annual pricing text:
  ```js
  Array.from(document.querySelectorAll('div,span'))
    .filter(e => /annual|yearly|per year|12 months/i.test(e.textContent || ''))
    .map(e => e.textContent?.trim()).filter(t => t.length < 80);
  ```
- [ ] `mcp1_browser_click` — select an annual plan
- [ ] `mcp1_browser_snapshot` — confirm the annual plan is selected
- [ ] `mcp1_browser_take_screenshot` — capture the annual plan selection

**Pass**: Vendor registration offers annual plan options.

---

## Can register new venue/vendor

**Verify**: A new user can successfully register as a venue or vendor through the desktop registration form.

- [ ] Navigate to the registration page
- [ ] `mcp1_browser_snapshot` — inspect the form
- [ ] Fill in the registration form:
  - [ ] `mcp1_browser_fill_form` — fill name, email, password fields
  - [ ] Select role (Venue or Vendor)
  - [ ] Accept terms/privacy
  - [ ] Fill business details (name, address, category, etc.)
- [ ] `mcp1_browser_click` — submit the form
- [ ] `mcp1_browser_snapshot` — capture the result
- [ ] Confirm either:
  - [ ] Success message / confirmation screen appears, OR
  - [ ] Email confirmation screen appears (if email confirmation required)
- [ ] `mcp1_browser_take_screenshot` — capture the result

**Pass**: Registration form can be filled and submitted successfully for a new venue or vendor.
