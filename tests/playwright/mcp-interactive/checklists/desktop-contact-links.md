# Desktop Contact Links — MCP Interactive Checklist

**Target**: `https://funcxon-local.vercel.app` | **Viewport**: 1280×800

## Setup

1. `mcp1_browser_navigate` → `https://funcxon-local.vercel.app`
2. `mcp1_browser_resize` → 1280×800
3. No login required for contact/about page checks

---

## WhatsApp link works

**Verify**: The WhatsApp contact link opens a WhatsApp chat (wa.me link) in a new tab.

- [ ] Navigate to the Contact or About page
- [ ] `mcp1_browser_snapshot` — locate the WhatsApp link/button
- [ ] `mcp1_browser_evaluate` — check the link href:
  ```js
  const waLink = Array.from(document.querySelectorAll('a'))
    .find(a => /wa\.me|whatsapp/i.test(a.href) || /whatsapp/i.test(a.textContent || ''));
  waLink ? { href: waLink.href, target: waLink.target } : 'not found';
  ```
- [ ] Confirm the href uses `https://wa.me/` or `https://api.whatsapp.com/` format
- [ ] Confirm it opens in a new tab (`target="_blank"`)
- [ ] `mcp1_browser_click` — click the WhatsApp link
- [ ] `mcp1_browser_tabs` — list tabs to confirm a new tab opened
- [ ] `mcp1_browser_take_screenshot` — capture the WhatsApp link

**Pass**: WhatsApp link uses wa.me format and opens in a new tab.

---

## Email contact on about page works

**Verify**: The About page has a clickable email contact link that opens an email client.

- [ ] Navigate to the About page
- [ ] `mcp1_browser_snapshot` — locate the email link
- [ ] `mcp1_browser_evaluate` — check the link:
  ```js
  const emailLink = Array.from(document.querySelectorAll('a'))
    .find(a => a.href.startsWith('mailto:') || /@.*\./.test(a.textContent || ''));
  emailLink ? { href: emailLink.href, text: emailLink.textContent?.trim() } : 'not found';
  ```
- [ ] Confirm the href uses `mailto:` protocol with a valid email address
- [ ] `mcp1_browser_take_screenshot` — capture the email link

**Pass**: Email contact link uses mailto: protocol with a valid email address.

---

## Back arrow present

**Verify**: A back arrow/navigation element is present on the desktop layout for returning to the previous page.

- [ ] Navigate to a sub-page (e.g. About, Contact, or a profile page)
- [ ] `mcp1_browser_snapshot` — inspect the page header
- [ ] `mcp1_browser_evaluate` — search for back arrow elements:
  ```js
  const backElements = Array.from(document.querySelectorAll('div,span,button,a,svg,i'))
    .filter(e => {
      const text = e.textContent?.trim().toLowerCase() || '';
      const aria = e.getAttribute('aria-label')?.toLowerCase() || '';
      const cls = e.className?.toString()?.toLowerCase() || '';
      return text === 'back' || text === '←' || aria.includes('back') || cls.includes('back') || cls.includes('arrow-back');
    });
  backElements.map(e => ({ tag: e.tagName, text: e.textContent?.trim(), aria: e.getAttribute('aria-label') }));
  ```
- [ ] Confirm at least one back arrow element is present
- [ ] `mcp1_browser_click` — click the back arrow
- [ ] `mcp1_browser_snapshot` — confirm navigation occurred
- [ ] `mcp1_browser_take_screenshot` — capture the back arrow

**Pass**: Back arrow is present and functional on desktop sub-pages.
