export const setup = async ({ page, expect }) => {
  await page.keyboard.press("Control+Shift+P");
  const quickPick = page.locator(".quick-input-widget");
  await expect(quickPick).toBeVisible();
  const quickPickInput = quickPick.locator('[role="combobox"]');
  await quickPickInput.type("Preferences: Color Theme");
  const firstOption = quickPick.locator(".monaco-list-row").first();
  await firstOption.click();
};

export const run = async ({ page, expect }) => {
  const quickPick = page.locator(".quick-input-widget");
  const quickPickInput = quickPick.locator('[role="combobox"]');
  await expect(quickPickInput).toHaveText("");
  const workbench = page.locator(".monaco-workbench");
  await expect(workbench).toHaveCSS("--vscode-editor-background", " #1e1e1e");

  await page.keyboard.press("ArrowDown");
  await expect(workbench).toHaveCSS("--vscode-editor-background", " #221a0f");

  await page.keyboard.press("ArrowDown");
  await expect(workbench).toHaveCSS("--vscode-editor-background", " #272822");

  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");
  await expect(workbench).toHaveCSS("--vscode-editor-background", " #1e1e1e");
};
