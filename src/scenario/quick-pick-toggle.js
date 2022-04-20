import { expect } from "@playwright/test";

/**
 *
 * @param {import('@playwright/test').Page} page
 */
export const run = async (page) => {
  await page.keyboard.press("Control+Shift+P");
  const quickPick = page.locator(".quick-input-widget");
  await expect(quickPick).toBeVisible();
  const firstOption = quickPick.locator(".monaco-list-row").first();
  await expect(firstOption).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(quickPick).toBeHidden();
};
