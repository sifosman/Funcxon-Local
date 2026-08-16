# Mobile Subscription — MCP Interactive Checklist

**Target**: `http://localhost:8081` | **Viewport**: 390×844 (iPhone 14)

## Setup

1. `mcp1_browser_navigate` → `http://localhost:8081`
2. `mcp1_browser_resize` → 390×844
3. Log in as a vendor/lister account
4. Navigate to the subscription/upgrade screen

---

## 29JULY Item 9: Vendor package cards work (tap/button → upgrade screen)

**Verify**: Vendor package cards are interactive — tapping a card or its button navigates to the upgrade screen.

- [ ] Navigate to the subscription/packages screen
- [ ] `mcp1_browser_snapshot` — inspect the package cards
- [ ] `mcp1_browser_click` — tap a vendor package card (e.g. "Get Started" or "Pro")
- [ ] `mcp1_browser_snapshot` — capture the resulting screen
- [ ] Confirm the upgrade/payment screen is shown
- [ ] `mcp1_browser_take_screenshot` — capture the upgrade screen
- [ ] `mcp1_browser_navigate_back` — return

**Pass**: Tapping a package card navigates to the upgrade screen.

---

## 29JULY Item 10: Package card width increased (included text visible)

**Verify**: Package cards are wider than before, and all included features/text are fully visible without truncation.

- [ ] Navigate to the subscription/packages screen
- [ ] `mcp1_browser_snapshot` — inspect the package cards
- [ ] `mcp1_browser_evaluate` — measure card width:
  ```js
  const cards = Array.from(document.querySelectorAll('div'))
    .filter(d => {
      const r = d.getBoundingClientRect();
      const text = d.textContent || '';
      return r.width > 150 && r.width < 500 && r.height > 200 && /package|plan|tier|get started|pro|premium/i.test(text);
    });
  cards.map(c => ({ width: c.getBoundingClientRect().width, text: c.textContent?.substring(0, 50) }));
  ```
- [ ] Confirm card widths are adequate (text is not truncated)
- [ ] Confirm all included features/text are fully visible
- [ ] `mcp1_browser_take_screenshot` — capture the package cards

**Pass**: Package cards are wide enough that all included text is visible.

---

## 29JULY Item 11: Yearly price shown below monthly price on package cards

**Verify**: Each package card shows both the monthly price and the yearly price (yearly below monthly).

- [ ] Navigate to the subscription/packages screen
- [ ] `mcp1_browser_snapshot` — inspect pricing on package cards
- [ ] For each card, confirm:
  - [ ] Monthly price is displayed (e.g. "R199/month")
  - [ ] Yearly price is displayed below the monthly price (e.g. "R1,990/year" or "R166/month billed yearly")
- [ ] `mcp1_browser_evaluate` — check for both price texts:
  ```js
  const cards = Array.from(document.querySelectorAll('div'))
    .filter(d => /R\d+|price|month|year/i.test(d.textContent || '') && d.getBoundingClientRect().height > 100);
  cards.map(c => {
    const text = c.textContent || '';
    const monthly = text.match(/R\s*\d+.*month/i)?.[0];
    const yearly = text.match(/R\s*\d+.*year/i)?.[0];
    return { monthly, yearly };
  });
  ```
- [ ] Confirm both monthly and yearly prices are present on each card
- [ ] `mcp1_browser_take_screenshot` — capture the pricing display

**Pass**: Both monthly and yearly prices are shown on each package card, with yearly below monthly.

---

## 29JULY Item 16: Expiry dates shown in My Subscriptions, upgrade button more colourful

**Verify**: The "My Subscriptions" screen shows expiry dates for active subscriptions. The upgrade button has a more colourful/ vibrant appearance.

- [ ] Navigate to "My Subscriptions" or active subscriptions screen
- [ ] `mcp1_browser_snapshot` — inspect the subscriptions list
- [ ] Confirm each active subscription shows an expiry date
- [ ] `mcp1_browser_evaluate` — check for expiry date text:
  ```js
  Array.from(document.querySelectorAll('div,span'))
    .filter(e => /expir|valid until|ends on|renew/i.test(e.textContent || ''))
    .map(e => e.textContent?.trim()).filter(t => t.length < 80);
  ```
- [ ] Locate the upgrade button
- [ ] `mcp1_browser_evaluate` — check button colour:
  ```js
  const upgradeBtn = Array.from(document.querySelectorAll('div,span,button'))
    .find(e => /upgrade/i.test(e.textContent || ''));
  upgradeBtn ? getComputedStyle(upgradeBtn).backgroundColor : 'not found';
  ```
- [ ] Confirm the button has a colourful/vibrant background (not grey or plain)
- [ ] `mcp1_browser_take_screenshot` — capture the subscriptions screen

**Pass**: Expiry dates are shown; upgrade button is colourful.

---

## 29JULY Item 21: Cancel subscription (free tier = immediate, paid = until expiry)

**Verify**: Cancelling a free-tier subscription takes effect immediately. Cancelling a paid subscription remains active until the expiry date.

- [ ] Navigate to "My Subscriptions"
- [ ] `mcp1_browser_snapshot` — inspect the cancel option
- [ ] If a free-tier subscription is active:
  - [ ] `mcp1_browser_click` — tap cancel
  - [ ] `mcp1_browser_snapshot` — capture the confirmation message
  - [ ] Confirm the message indicates immediate cancellation
  - [ ] `mcp1_browser_take_screenshot` — capture the result
- [ ] If a paid subscription is active:
  - [ ] `mcp1_browser_click` — tap cancel
  - [ ] `mcp1_browser_snapshot` — capture the confirmation message
  - [ ] Confirm the message indicates the subscription remains active until expiry
  - [ ] `mcp1_browser_take_screenshot` — capture the result

**Pass**: Free tier cancels immediately; paid tier remains active until expiry date.
