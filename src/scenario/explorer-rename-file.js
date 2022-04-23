import { expect } from "@playwright/test";
import { mkdir, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { text } from "stream/consumers";

const writeJson = async (path, value) => {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(value, null, 2) + "\n");
};

export const beforeSetup = async ({ tmpDir, userDataDir }) => {
  await writeFile(join(tmpDir, "file1.txt"), ``);
  await writeFile(join(tmpDir, "file2.txt"), ``);
  await writeFile(join(tmpDir, "file3.txt"), ``);
  await writeJson(join(userDataDir, "User", "settings.json"), {
    "window.titleBarStyle": "custom",
  });
};

/**
 * @param {{page: import('@playwright/test').Page  }} options
 */
export const setup = async ({ page }) => {};

const SHORT_TIMEOUT = 250;
/**
 *
 * @param {import('@playwright/test').Page} page
 */
export const run = async (page) => {
  const explorer = page.locator(".explorer-viewlet");
  const file2 = explorer.locator(".monaco-list-row", { hasText: "file2.txt" });
  await file2.click({
    button: "right",
  });
  const contextMenu = page.locator(
    ".context-view.monaco-menu-container .actions-container"
  );
  await expect(contextMenu).toBeVisible();
  await expect(contextMenu).toBeFocused();
  const contextMenuItemRename = contextMenu.locator(".action-item", {
    hasText: "Rename",
  });
  await page.waitForTimeout(SHORT_TIMEOUT);
  await contextMenuItemRename.click();

  const input = explorer.locator("input");
  await input.type("renamed");
  await input.press("Enter");
  await expect(file2).toBeHidden();
  const fileRenamed = explorer.locator("text=renamed.txt");
  await expect(fileRenamed).toBeVisible();

  await fileRenamed.click({
    button: "right",
  });
  await expect(contextMenu).toBeVisible();
  await expect(contextMenu).toBeFocused();
  await page.waitForTimeout(SHORT_TIMEOUT);
  await contextMenuItemRename.click();
  await input.type("file2");
  await input.press("Enter");
  await expect(fileRenamed).toBeHidden();
  await expect(file2).toBeVisible();
};
