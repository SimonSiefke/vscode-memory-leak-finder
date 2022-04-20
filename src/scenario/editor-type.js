import { expect } from "@playwright/test";
import { writeFile } from "fs/promises";
import { join } from "path";

export const beforeSetup = async ({ tmpDir }) => {
  await writeFile(join(tmpDir, "file.txt"), "sample text");
};

export const setup = async ({ page }) => {
  await page.keyboard.press("Control+P");
  const quickPick = page.locator(".quick-input-widget");
  await expect(quickPick).toBeVisible();
  const quickPickInput = quickPick.locator('[role="combobox"]');
  await quickPickInput.type("file");
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
  await editorInput.type("More ");
  const editorLines = editor.locator(".view-lines");
  await expect(editorLines).toHaveText("More sample text");
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press("Backspace");
  }
  await expect(editorLines).toHaveText("sample text");
};
