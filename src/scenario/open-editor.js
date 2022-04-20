import { expect } from "@playwright/test";
import { writeFile } from "fs/promises";
import { join } from "path";

export const beforeSetup = async ({ tmpDir }) => {
  await writeFile(join(tmpDir, "file.txt"), "sample text");
};
/**
 *
 * @param {import('@playwright/test').Page} page
 */
export const run = async (page) => {
  await page.keyboard.press("Control+P");
  const quickPick = page.locator(".quick-input-widget");
  await expect(quickPick).toBeVisible();
  const quickPickInput = quickPick.locator('[role="combobox"]');
  await quickPickInput.type("file");
  const firstOption = quickPick.locator(".monaco-list-row").first();
  await firstOption.click();
  const editor = page.locator(".editor-instance");
  await expect(editor).toBeVisible();

  const closeTabButton = page.locator('[title^="Close ("]');
  await closeTabButton.click();
  await expect(editor).toBeHidden();
};
