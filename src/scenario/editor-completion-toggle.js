import { expect } from "@playwright/test";
import { writeFile } from "fs/promises";
import { join } from "path";

export const beforeSetup = async ({ tmpDir }) => {
  await writeFile(join(tmpDir, "index.html"), "");
};

export const setup = async ({ page }) => {
  await page.keyboard.press("Control+P");
  const quickPick = page.locator(".quick-input-widget");
  await expect(quickPick).toBeVisible();
  const quickPickInput = quickPick.locator('[role="combobox"]');
  await quickPickInput.type("index");
  const firstOption = quickPick.locator(".monaco-list-row").first();
  await firstOption.click();
  const editor = page.locator(".editor-instance");
  await expect(editor).toBeVisible();
};
/**
 *
 * @param {import('@playwright/test').Page} page
 */
export const run = async (page) => {
  const editor = page.locator(".editor-instance");
  await expect(editor).toBeVisible();
  const editorInput = editor.locator(".inputarea");
  await expect(editorInput).toBeFocused();

  await page.keyboard.press("Control+Space");
  const suggestWidget = page.locator(".suggest-widget");
  await expect(suggestWidget).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(suggestWidget).toBeHidden();
};
