export const beforeSetup = async ({ userDataDir, join, writeJson }) => {
  await writeJson(join(userDataDir, "User", "settings.json"), {
    "window.titleBarStyle": "custom",
  });
};

export const setup = async ({ Extensions, page, expect }) => {
  await Extensions.show();
  const firstExtension = page.locator(".extension-list-item").first();
  await expect(firstExtension).toBeVisible();
};

export const run = async ({ page, ContextMenu }) => {
  const firstExtension = page.locator(".extension-list-item").first();
  await ContextMenu.open(firstExtension);
  await ContextMenu.close();
};
