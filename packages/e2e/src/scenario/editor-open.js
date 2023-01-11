export const beforeSetup = async ({ tmpDir, writeFile, join }) => {
  await writeFile(join(tmpDir, "file.txt"), "sample text");
};

export const run = async ({ page, expect }) => {
  await page.keyboard.press("Control+P");
  const quickPick = page.locator(".quick-input-widget");
  await expect(quickPick).toBeVisible();
  const quickPickInput = quickPick.locator('[role="combobox"]');
  await quickPickInput.type("file");
  const firstOption = quickPick.locator(".monaco-list-row").first();
  await firstOption.click();
  const editor = page.locator(".editor-instance");
  await expect(editor).toBeVisible();

  const closeTabButton = page.locator('[title^="Close ("]');
  await closeTabButton.click();
  await expect(editor).toBeHidden();
};
