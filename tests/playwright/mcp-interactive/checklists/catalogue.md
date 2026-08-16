# Mobile Catalogue — MCP Interactive Checklist

**Target**: `http://localhost:8081` | **Viewport**: 390×844 (iPhone 14)

## Setup

1. `mcp1_browser_navigate` → `http://localhost:8081`
2. `mcp1_browser_resize` → 390×844
3. Log in if not already authenticated
4. Navigate to a vendor profile that has catalogue items
5. Tap the "Catalogue" tab (formerly "Calendar")

---

## Item 19: Quantity selector in item card

**Verify**: Each catalogue item card has a quantity selector with an input field and up/down buttons.

- [ ] Navigate to a vendor's Catalogue tab
- [ ] `mcp1_browser_snapshot` — inspect catalogue item cards
- [ ] Confirm each item card has:
  - [ ] A numeric input field (quantity)
  - [ ] An "up" button (increment)
  - [ ] A "down" button (decrement)
- [ ] `mcp1_browser_click` — tap the up button on one item
- [ ] `mcp1_browser_evaluate` — verify the quantity changed:
  ```js
  const input = document.querySelector('input[type="number"], input[type="text"][value]');
  input?.value;
  ```
- [ ] `mcp1_browser_click` — tap the down button
- [ ] Confirm the quantity decreased
- [ ] `mcp1_browser_take_screenshot` — capture the quantity selector

**Pass**: Quantity selector with input + up/down buttons is present and functional on each item card.

---

## Item 20: Request a Quote — catalogue items at top, date below, condensed form

**Verify**: The "Request a Quote" form layout shows catalogue items at the top, date selection below, and the form is condensed (not overly long).

- [ ] Navigate to a vendor profile with catalogue items
- [ ] `mcp1_browser_click` — tap "Request a Quote" button
- [ ] `mcp1_browser_snapshot` — inspect the quote form layout
- [ ] Confirm catalogue items section appears at the top of the form
- [ ] Confirm date selection appears below the catalogue items
- [ ] `mcp1_browser_evaluate` — measure form height:
  ```js
  const form = document.querySelector('[role="dialog"], .modal, [class*="quote"]');
  form?.getBoundingClientRect().height;
  ```
- [ ] Confirm the form is condensed (not excessively tall)
- [ ] `mcp1_browser_take_screenshot` — capture the quote form

**Pass**: Quote form has catalogue items at top, date below, and is condensed.

---

## Item 21: "Request a Quote" button visible even with nothing selected

**Verify**: The "Request a Quote" button is visible and enabled even when no catalogue items are selected.

- [ ] Navigate to a vendor's Catalogue tab
- [ ] Ensure no items are selected (quantity = 0 for all)
- [ ] `mcp1_browser_snapshot` — inspect the screen
- [ ] `mcp1_browser_evaluate` — search for the button:
  ```js
  const btn = Array.from(document.querySelectorAll('div,span,button'))
    .find(e => e.textContent?.includes('Request a Quote'));
  btn ? { visible: btn.getBoundingClientRect().width > 0, text: btn.textContent?.trim() } : 'not found';
  ```
- [ ] Confirm the button is visible and present
- [ ] `mcp1_browser_take_screenshot` — capture the screen with nothing selected

**Pass**: "Request a Quote" button is visible even with no items selected.

---

## Item 22: Checkbox outline darker/black when not selected

**Verify**: Unselected checkboxes in the catalogue/quote form have a dark or black outline (not light grey).

- [ ] Navigate to the Request a Quote form
- [ ] `mcp1_browser_snapshot` — locate checkboxes
- [ ] `mcp1_browser_evaluate` — check checkbox border colour:
  ```js
  const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"], [role="checkbox"], [class*="checkbox"]'));
  checkboxes.map(cb => {
    const s = getComputedStyle(cb);
    return { borderColor: s.borderColor, outline: s.outline, checked: cb.getAttribute('aria-checked') || cb.checked };
  });
  ```
- [ ] Confirm unselected checkboxes have a dark/black border (e.g. `rgb(0, 0, 0)`, `rgb(17, 24, 39)`, or similar dark colour)
- [ ] `mcp1_browser_take_screenshot` — capture unselected checkboxes

**Pass**: Unselected checkboxes have a dark/black outline.
