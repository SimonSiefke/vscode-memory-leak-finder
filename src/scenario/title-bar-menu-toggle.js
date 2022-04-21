import { expect } from "@playwright/test";
import { mkdir, writeFile } from "fs/promises";
import { dirname, join } from "path";

const writeJson = async (path, value) => {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(value, null, 2) + "\n");
};

export const beforeSetup = async ({ userDataDir }) => {
  await writeJson(join(userDataDir, "User", "settings.json"), {
    "window.titleBarStyle": "custom",
  });
};

/**
 *
 * @param {import('@playwright/test').Page} page
 */
export const run = async (page) => {
  const titleBar = page.locator(".part.titlebar");
  await expect(titleBar).toBeVisible();

  const menuItemFile = titleBar
    .locator(".menubar-menu-button", {
      hasText: "File",
    })
    .first();
  await menuItemFile.click();
  const menu = page.locator(".monaco-menu .actions-container");
  expect(menu).toBeVisible();
  await expect(menu).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(menuItemFile).toBeFocused();
};
