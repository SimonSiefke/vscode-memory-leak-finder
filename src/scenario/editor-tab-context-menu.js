import { expect } from "@playwright/test";
import { mkdir, writeFile } from "fs/promises";
import { dirname, join } from "path";

const generateFileContent = () => {
  return Array(200).fill("sample text").join("\n");
};

const writeJson = async (path, value) => {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(value, null, 2) + "\n");
};

export const beforeSetup = async ({ tmpDir, userDataDir }) => {
  await writeJson(join(userDataDir, "User", "settings.json"), {
    "window.titleBarStyle": "custom",
  });
  await writeFile(join(tmpDir, "file.txt"), generateFileContent());
};

/**
 * @param {{page: import('@playwright/test').Page  }} options
 */
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
  const tab = page.locator(".tab");
  await tab.click({ button: "right" });
  const contextMenu = page.locator(".context-view.monaco-menu-container");
  await expect(contextMenu).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(contextMenu).toBeHidden();
};
