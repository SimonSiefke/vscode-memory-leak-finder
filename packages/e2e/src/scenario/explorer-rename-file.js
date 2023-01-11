export const beforeSetup = async ({
  tmpDir,
  userDataDir,
  writeFile,
  join,
  writeJson,
}) => {
  await writeFile(join(tmpDir, "file1.txt"), ``);
  await writeFile(join(tmpDir, "file2.txt"), ``);
  await writeFile(join(tmpDir, "file3.txt"), ``);
  await writeJson(join(userDataDir, "User", "settings.json"), {
    "window.titleBarStyle": "custom",
  });
};

export const setup = async ({ page }) => {};

const SHORT_TIMEOUT = 250;

export const run = async ({ page, expect }) => {
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
