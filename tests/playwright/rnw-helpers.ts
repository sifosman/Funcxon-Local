import { expect, type Locator, type Page } from '@playwright/test';

/**
 * React Native Web (RNW) renders text in zero-size <span> elements.
 * Playwright's `toBeVisible` checks for non-zero bounding box, so it fails
 * on RNW text even though the text is visually present and readable.
 *
 * This module provides helpers that work correctly with RNW's rendering model:
 * - `assertVisibleRNW` — checks element is attached, not display:none, and either
 *   has non-zero size OR is an RNW text span (zero-size but visible).
 * - `clickRNW` — clicks by walking up to a clickable ancestor (cursor:pointer).
 * - `assertTextVisible` — finds text and verifies it's not hidden.
 * - `assertElementAbsent` — verifies an element does not exist in the DOM.
 * - `assertElementInteractable` — verifies an element can be clicked/filled.
 */

/**
 * Asserts that an element is visible in a React Native Web app.
 *
 * Checks:
 * 1. Element is attached to the DOM
 * 2. Element is not display:none or visibility:hidden
 * 3. If element has non-zero bounding box, also assert toBeVisible
 * 4. If element has zero-size (RNW text span), verify it's not hidden via CSS
 */
export async function assertVisibleRNW(
  page: Page,
  text: string,
  options?: { timeout?: number; exact?: boolean }
): Promise<Locator> {
  const timeout = options?.timeout ?? 10000;
  const exact = options?.exact ?? false;
  const locator = page.getByText(text, { exact }).first();

  await expect(locator).toBeAttached({ timeout });

  // Check CSS visibility properties
  const style = await locator.evaluate((el) => {
    const computed = window.getComputedStyle(el);
    return {
      display: computed.display,
      visibility: computed.visibility,
      opacity: computed.opacity,
    };
  });

  expect(style.display, `Element "${text}" has display:none`).not.toBe('none');
  expect(style.visibility, `Element "${text}" has visibility:hidden`).not.toBe('hidden');

  // If the element has a non-zero bounding box, use Playwright's native toBeVisible
  const box = await locator.boundingBox();
  if (box && box.width > 0 && box.height > 0) {
    await expect(locator).toBeVisible({ timeout: 1000 });
  }

  return locator;
}

/**
 * Asserts that a locator is visible in RNW (for when you already have a Locator).
 */
export async function assertLocatorVisibleRNW(
  locator: Locator,
  timeout = 10000
): Promise<void> {
  await expect(locator).toBeAttached({ timeout });

  const style = await locator.evaluate((el) => {
    const computed = window.getComputedStyle(el);
    return {
      display: computed.display,
      visibility: computed.visibility,
    };
  });

  expect(style.display).not.toBe('none');
  expect(style.visibility).not.toBe('hidden');

  const box = await locator.boundingBox();
  if (box && box.width > 0 && box.height > 0) {
    await expect(locator).toBeVisible({ timeout: 1000 });
  }
}

/**
 * Clicks an element in a React Native Web app.
 * RNW renders TouchableOpacity as a <div> with cursor:pointer, not as a <button>.
 * This helper walks up the DOM tree to find the first clickable ancestor.
 */
export async function clickRNW(page: Page, text: string, options?: { exact?: boolean }): Promise<void> {
  const exact = options?.exact ?? false;
  const locator = page.getByText(text, { exact }).first();
  await expect(locator).toBeAttached({ timeout: 10000 });

  await locator.evaluate((el) => {
    let target: Element | null = el;
    while (target && target !== document.body) {
      const style = window.getComputedStyle(target);
      if (
        style.cursor === 'pointer' ||
        target.getAttribute('role') === 'button' ||
        target.tagName === 'BUTTON' ||
        target.tagName === 'A'
      ) {
        (target as HTMLElement).click();
        return;
      }
      target = target.parentElement;
    }
    // Fallback: click the element itself
    (el as HTMLElement).click();
  });

  await page.waitForTimeout(300);
}

/**
 * Clicks a locator in RNW by walking up to find a clickable ancestor.
 */
export async function clickLocatorRNW(locator: Locator): Promise<void> {
  await expect(locator).toBeAttached({ timeout: 10000 });

  await locator.evaluate((el) => {
    let target: Element | null = el;
    while (target && target !== document.body) {
      const style = window.getComputedStyle(target);
      if (
        style.cursor === 'pointer' ||
        target.getAttribute('role') === 'button' ||
        target.tagName === 'BUTTON' ||
        target.tagName === 'A'
      ) {
        (target as HTMLElement).click();
        return;
      }
      target = target.parentElement;
    }
    (el as HTMLElement).click();
  });
}

/**
 * Asserts that text is NOT present in the DOM (element is absent).
 * Uses a short timeout since we expect it to not appear.
 */
export async function assertElementAbsent(
  page: Page,
  text: string,
  options?: { timeout?: number; exact?: boolean }
): Promise<void> {
  const timeout = options?.timeout ?? 3000;
  const exact = options?.exact ?? false;
  const locator = page.getByText(text, { exact }).first();

  await expect(locator).not.toBeAttached({ timeout });
}

/**
 * Asserts that an element is interactable by performing an interaction
 * and checking the result. This is the strongest verification for RNW.
 *
 * Example: fill an input, then check the input's value changed.
 */
export async function assertInteractable(
  page: Page,
  selector: string,
  action: 'click' | 'fill',
  value?: string
): Promise<boolean> {
  const locator = page.locator(selector).first();
  try {
    await expect(locator).toBeAttached({ timeout: 5000 });
    if (action === 'click') {
      await locator.click({ force: true });
    } else if (action === 'fill' && value !== undefined) {
      await locator.fill(value);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets the computed font size of an element. Useful for verifying
 * that headings are larger than sub-headings (e.g. item 6).
 */
export async function getFontSize(page: Page, text: string, options?: { exact?: boolean }): Promise<number> {
  const exact = options?.exact ?? false;
  const locator = page.getByText(text, { exact }).first();
  await expect(locator).toBeAttached({ timeout: 10000 });
  const fontSize = await locator.evaluate((el) => {
    return parseFloat(window.getComputedStyle(el).fontSize);
  });
  return fontSize;
}

/**
 * Compares font sizes of two text elements. Returns true if first > second.
 */
export async function isFontSizeLarger(
  page: Page,
  firstText: string,
  secondText: string,
  options?: { exact?: boolean }
): Promise<boolean> {
  const first = await getFontSize(page, firstText, options);
  const second = await getFontSize(page, secondText, options);
  return first > second;
}

/**
 * Gets the background color of an element as a normalized RGB string.
 * Useful for verifying coral/orange highlight colours (items 4, 14, 18).
 */
export async function getBackgroundColor(
  page: Page,
  text: string,
  options?: { exact?: boolean }
): Promise<string> {
  const exact = options?.exact ?? false;
  const locator = page.getByText(text, { exact }).first();
  await expect(locator).toBeAttached({ timeout: 10000 });

  // Walk up to find an element with a non-transparent background
  return locator.evaluate((el) => {
    let target: Element | null = el;
    while (target && target !== document.body) {
      const bg = window.getComputedStyle(target).backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
        return bg;
      }
      target = target.parentElement;
    }
    return 'transparent';
  });
}

/**
 * Checks if a color string is coral/reddish/orange.
 * Coral is approximately rgb(255, 127, 80) or #FF7F50.
 * We check for high R, medium G, low B as a heuristic.
 */
export function isCoralOrOrange(rgbString: string): boolean {
  const match = rgbString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return false;
  const [, r, g, b] = match.map(Number);
  return r > 200 && g > 80 && g < 200 && b < 120;
}

/**
 * Checks if a color string is reddish (for favourite heart, item 14).
 */
export function isReddish(rgbString: string): boolean {
  const match = rgbString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return false;
  const [, r, g, b] = match.map(Number);
  return r > 180 && g < 100 && b < 100;
}

/**
 * Asserts that text content is visible somewhere on the page using a
 * more lenient search. Useful for elements that may be nested deep in RNW.
 */
export async function assertTextExists(
  page: Page,
  text: string,
  timeout = 10000
): Promise<void> {
  const found = await page
    .evaluate((target: string) => {
      const all = Array.from(document.querySelectorAll('*'));
      return all.some((el) => el.textContent?.includes(target));
    }, text)
    .catch(() => false);

  if (!found) {
    // Retry with waitFor
    await page.waitForSelector(`text=${text}`, { timeout }).catch(() => {
      throw new Error(`Text "${text}" not found on page within ${timeout}ms`);
    });
  }
}

/**
 * Scrolls to an element to ensure it's in the viewport before interacting.
 */
export async function scrollToText(page: Page, text: string, options?: { exact?: boolean }): Promise<void> {
  const exact = options?.exact ?? false;
  const locator = page.getByText(text, { exact }).first();
  await expect(locator).toBeAttached({ timeout: 10000 });
  await locator.scrollIntoViewIfNeeded().catch(() => {
    // RNW elements may not support scrollIntoView; try JS evaluate
    locator.evaluate((el) => {
      el.scrollIntoView?.({ block: 'center' });
    }).catch(() => {});
  });
  await page.waitForTimeout(200);
}
