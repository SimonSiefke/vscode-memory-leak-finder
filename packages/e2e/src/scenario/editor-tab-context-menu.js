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

export const setup = async ({ page, expect }) => {
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

export const run = async ({ page, expect }) => {
  const tab = page.locator(".tab", { hasText: "file.txt" });
  await tab.click({ button: "right" });
  const contextMenu = page.locator(".context-view.monaco-menu-container");
  await expect(contextMenu).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(contextMenu).toBeHidden();
};
