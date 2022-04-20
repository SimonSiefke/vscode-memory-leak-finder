import { expect } from "@playwright/test";

/**
 *
 * @param {import('@playwright/test').Page} page
 */
export const run = async (page) => {
  const activityBar = page.locator(".part.activitybar");
  await expect(activityBar).toBeVisible();

  await page.keyboard.press("Control+Shift+P");
  const quickPick = page.locator(".quick-input-widget");
  await expect(quickPick).toBeVisible();
  const quickPickInput = quickPick.locator('[role="combobox"]');
  await quickPickInput.type("Toggle Activity Bar Visibility");
  const firstOption = quickPick.locator(".monaco-list-row").first();
  await firstOption.click();
  await expect(activityBar).toBeHidden();

  await page.keyboard.press("Control+Shift+P");
  await expect(quickPick).toBeVisible();
  await quickPickInput.type("Toggle Activity Bar Visibility");
  await firstOption.click();
  await expect(activityBar).toBeVisible();
};
