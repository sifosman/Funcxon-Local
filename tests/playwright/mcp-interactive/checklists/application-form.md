# Mobile Application Form — MCP Interactive Checklist

**Target**: `http://localhost:8081` | **Viewport**: 390×844 (iPhone 14)

## Setup

1. `mcp1_browser_navigate` → `http://localhost:8081`
2. `mcp1_browser_resize` → 390×844
3. Log in if not already authenticated
4. Navigate to the vendor/venue application form (via "Create new application" in Lister Portal)

---

## Item 11: Custom amenities/features input in application form

**Verify**: The application form allows entering custom amenities and features (not just selecting from a predefined list).

- [ ] Navigate to the application form
- [ ] Scroll to the amenities/features section
- [ ] `mcp1_browser_snapshot` — inspect the amenities input area
- [ ] Confirm there is a free-text input field for custom amenities/features (in addition to any predefined checkboxes)
- [ ] `mcp1_browser_type` — type a custom amenity (e.g. "Helipad")
- [ ] `mcp1_browser_snapshot` — confirm the custom text is entered
- [ ] `mcp1_browser_take_screenshot` — capture the custom amenities input

**Pass**: Application form has a free-text input for custom amenities/features.

---

## Item 22 / 29JULY Item 22: Video size validation — immediate feedback, size limit shown

**Verify**: When uploading a video that exceeds the size limit, the form shows immediate feedback (not after submission). The size limit is displayed to the user.

- [ ] Navigate to the application form
- [ ] Scroll to the video upload section
- [ ] `mcp1_browser_snapshot` — inspect the video upload area
- [ ] Confirm the size limit is displayed (e.g. "Max 50MB" or similar text)
- [ ] `mcp1_browser_evaluate` — check for size limit text:
  ```js
  Array.from(document.querySelectorAll('div,span'))
    .filter(e => /max.*size|size.*limit|MB|file size|video.*size/i.test(e.textContent || ''))
    .map(e => e.textContent?.trim()).filter(t => t.length < 100);
  ```
- [ ] If possible, attempt to upload an oversized video file:
  - [ ] `mcp1_browser_click` — tap the upload button
  - [ ] Observe the error message that appears immediately
  - [ ] `mcp1_browser_snapshot` — capture the error message
  - [ ] Confirm the error appears immediately (before form submission)
- [ ] `mcp1_browser_take_screenshot` — capture the size limit display and/or error

**Pass**: Video size limit is shown; oversized uploads trigger immediate feedback before submission.
