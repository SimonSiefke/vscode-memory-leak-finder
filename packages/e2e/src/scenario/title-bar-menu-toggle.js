export const beforeSetup = async ({ userDataDir, writeJson, join }) => {
  await writeJson(join(userDataDir, "User", "settings.json"), {
    "window.titleBarStyle": "custom",
  });
};

export const run = async ({ page, expect }) => {
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
