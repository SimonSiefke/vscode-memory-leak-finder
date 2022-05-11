import { expect } from "@playwright/test";
import { writeFile } from "fs/promises";
import { join } from "path";

export const beforeSetup = async ({ tmpDir }) => {
  await writeFile(join(tmpDir, "file.txt"), "sample text");
};

export const setup = async ({ page }) => {
  const activityBar = page.locator("#workbench\\.parts\\.activitybar");
  const activityBarItemSearch = activityBar.locator(
    `.action-label[aria-label^="Search"]`
  );
  await activityBarItemSearch.click();

  const searchView = page.locator(".search-view");
  await expect(searchView).toBeVisible();
  const searchInput = searchView.locator('textarea[title="Search"]');
  await expect(searchInput).toBeFocused();
};

/**
 *
 * @param {import('@playwright/test').Page} page
 */
export const run = async (page) => {
  const searchView = page.locator(".search-view");
  const searchInput = searchView.locator('textarea[title="Search"]');
  await expect(searchInput).toBeFocused();
  await searchInput.type("sample");

  const searchResults = searchView.locator(".monaco-list-row");
  await expect(searchResults).toHaveCount(2);
  const searchResultOne = searchResults.nth(0);
  await expect(searchResultOne).toHaveText("file.txt1");
  const searchResultTwo = searchResults.nth(1);
  await expect(searchResultTwo).toHaveText("sample text");

  await searchInput.selectText();
  await searchInput.press("Backspace");
};
