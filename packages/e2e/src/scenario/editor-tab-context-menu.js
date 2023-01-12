const generateFileContent = () => {
  return Array(200).fill("sample text").join("\n");
};

export const beforeSetup = async ({
  tmpDir,
  userDataDir,
  writeFile,
  join,
  writeJson,
}) => {
  await writeJson(join(userDataDir, "User", "settings.json"), {
    "window.titleBarStyle": "custom",
  });
  await writeFile(join(tmpDir, "file.txt"), generateFileContent());
};

export const setup = async ({ page, expect, Editor }) => {
  await Editor.open("file.txt");
};

export const run = async ({ page, expect }) => {
  const tab = page.locator(".tab", { hasText: "file.txt" });
  await tab.click({ button: "right" });
  const contextMenu = page.locator(".context-view.monaco-menu-container");
  await expect(contextMenu).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(contextMenu).toBeHidden();
};
