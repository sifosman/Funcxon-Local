# MCP Interactive Testing

Playwright MCP (Model Context Protocol) lets you verify UI changes **interactively** through the Cascade chat — no spec files, no test runner. You navigate, click, type, and screenshot in real time to confirm visual/behavioural changes before writing automated regression specs.

## When to Use MCP Interactive vs Automated Specs

| Scenario | Use MCP Interactive | Use Automated Spec |
|----------|--------------------|--------------------|
| Quick visual check after a code change | ✅ | |
| Verifying a single change item (e.g. "is the heart coral?") | ✅ | |
| Debugging why an automated test fails | ✅ | |
| Regression testing across builds | | ✅ |
| CI/CD pipeline | | ✅ |
| Testing complex multi-step flows | | ✅ |

## Prerequisites

1. **Local Expo server** running for mobile checks:
   ```bash
   CI=1 npx expo start --web --port 8081
   ```
   Or use the deployed app: `https://funcxon-local.vercel.app`

2. **Playwright MCP server** configured in your IDE (the `mcp-playwright` server is already available in Cascade).

3. **Test credentials** — use the disposable test user from `ensureTestUser.ts` or the fallback `PW_E2E_USERNAME` / `PW_E2E_PASSWORD` env vars.

## MCP Workflow

### 1. Navigate to the app

Ask Cascade to open the app:
```
Navigate to http://localhost:8081 (mobile) or https://funcxon-local.vercel.app (desktop)
```
Cascade uses `mcp1_browser_navigate` to open the URL.

### 2. Set viewport (optional)

For mobile testing, resize to iPhone 14 dimensions:
```
Resize the browser to 390x844
```
Cascade uses `mcp1_browser_resize`.

### 3. Log in (if needed)

For authenticated pages:
```
Log in using the test user credentials
```
Cascade will fill the email/password fields and click Log in using `mcp1_browser_fill_form` and `mcp1_browser_click`.

### 4. Capture accessibility snapshot

```
Take an accessibility snapshot
```
Cascade uses `mcp1_browser_snapshot` to get the full page tree — this shows all interactive elements, text content, and structure.

### 5. Interact with elements

```
Click on "Vendors" in the top nav
```
```
Type "photographer" into the search field
```
Cascade uses `mcp1_browser_click` and `mcp1_browser_type`.

### 6. Take screenshots

```
Take a screenshot of the current page
```
Cascade uses `mcp1_browser_take_screenshot` to capture the visual state.

### 7. Verify the change

Compare the screenshot/snapshot against the expected behaviour described in the checklist. Mark each item as ✅ (pass) or ❌ (fail).

### 8. Record findings

Note any failures for follow-up. If a change passes interactive verification, consider writing an automated spec for regression coverage.

## Checklist Files

Each checklist file in `checklists/` covers a specific feature area and lists:

- **Change item number** — references the original spec items
- **What to verify** — the expected visual/behavioural state
- **Steps** — exact MCP actions to perform
- **Pass criteria** — what constitutes a pass

### Available Checklists

#### Mobile (test against `http://localhost:8081`, viewport 390×844)

| File | Coverage |
|------|----------|
| `checklists/home-screen.md` | Items 1, 2, 5, 6, 7, 8, 26 — hero removal, featured cards, nav, explore section |
| `checklists/discover-screen.md` | Items 3, 4, 9, 10, 25 — explore cards, province selector, filters, pricing |
| `checklists/profile-screen.md` | Items 12, 13, 14, 17, 18, 20, 23, 24, 25 + 29JULY 7/23/24/25 — tour button, hearts, tabs, ratings, pricing |
| `checklists/catalogue.md` | Items 19, 20, 21, 22 — quantity selector, quote form, button visibility, checkbox styling |
| `checklists/lister-portal.md` | Items 27, 28, 29 + 29JULY 1-8, 12-21 — portfolio management, edit profile, bookings, help desk |
| `checklists/subscription.md` | 29JULY 9, 10, 11, 16, 21 — package cards, pricing display, expiry dates, cancellation |
| `checklists/application-form.md` | Items 11, 22 + 29JULY 22 — custom amenities, video size validation |
| `checklists/account-tab.md` | Items 26, 28 + 29JULY 4, 18, 19 — nav tabs, help desk, delete account |

#### Desktop (test against `https://funcxon-local.vercel.app`, viewport 1280×800)

| File | Coverage |
|------|----------|
| `checklists/desktop-contact-links.md` | WhatsApp link, email contact, back arrow |
| `checklists/desktop-registration.md` | Plan selection, venue/vendor registration, annual plans |
| `checklists/desktop-search.md` | Alphabetical lists, florist search, save changes navigation |
| `checklists/desktop-ui.md` | Tags in application form, desktop-specific layout |

## Tips

- **Start fresh**: Close and reopen the browser between feature areas to avoid state leakage.
- **Use snapshots before screenshots**: The accessibility tree reveals structure that screenshots don't show (e.g. hidden elements, ARIA labels).
- **Test both mobile and desktop**: Some changes are mobile-only; verify on both viewports if the change affects responsive behaviour.
- **Check the database**: For data-dependent checks (e.g. "Book a Tour shows for recent venue listings"), use Supabase MCP tools to query the database directly.
- **RNW zero-size elements**: React Native Web renders text in zero-size spans. If an element isn't visible in the snapshot but should be there, use `mcp1_browser_evaluate` to check `getComputedStyle`.
