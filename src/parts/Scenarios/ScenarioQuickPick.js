import { expect } from "@playwright/test";

/**
 *
 * @param {import('@playwright/test').Page} page
 */
export const run = async (page) => {
  // TODO
  // 1. count number of dom nodes or objects
  // 2. open quickpick
  // 3. count number of dom nodes or objects
  // 4. close quickpick
  // 5. count number of dom nodes or objects
  // if number of dom nodes has increased, there is a memory leak
  await page.keyboard.press("Control+Shift+P");
  const quickPick = page.locator(".quick-input-widget");
  await expect(quickPick).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(quickPick).toBeHidden();
};
