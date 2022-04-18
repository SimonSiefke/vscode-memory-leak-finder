import { expect } from "@playwright/test";

/**
 *
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').CDPSession} session
 */
export const run = async (page, session, measure) => {
  await measure("before");

  await page.keyboard.press("Control+Shift+P");
  const quickPick = page.locator(".quick-input-widget");
  await expect(quickPick).toBeVisible();
  await measure("middle");

  await page.keyboard.press("Escape");
  await expect(quickPick).toBeHidden();
  await measure("after");
};
