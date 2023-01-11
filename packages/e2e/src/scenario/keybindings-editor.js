export const beforeSetup = async ({ tmpDir, writeFile, join }) => {
  await writeFile(join(tmpDir, "file.txt"), "sample text");
};

export const setup = async ({ page, expect }) => {
  await page.keyboard.press("Control+P");
  const quickPick = page.locator(".quick-input-widget");
  await expect(quickPick).toBeVisible();
  const quickPickInput = quickPick.locator('[role="combobox"]');
  await quickPickInput.type("> open keyboard shortcuts");
  const firstOption = quickPick.locator(".monaco-list-row").nth(1);
  await firstOption.click();
  const editor = page.locator(".keybindings-editor");
  await expect(editor).toBeVisible();
};

export const run = async ({ page, expect }) => {
  const editor = page.locator(".keybindings-editor");
  await expect(editor).toBeVisible();

  const rowCopy = editor
    .locator('.monaco-list-row[aria-label^="Copy"]')
    .first();
  await rowCopy.dblclick();

  const popup = page.locator(".defineKeybindingWidget");
  await expect(popup).toBeVisible();
  const popupInput = popup.locator("input");
  await expect(popupInput).toBeFocused();

  await page.keyboard.press("Control+L");
  await page.keyboard.press("Enter");

  await rowCopy.dblclick();
  await expect(popupInput).toBeFocused();
  await page.keyboard.press("Control+C");
  await page.keyboard.press("Enter");
};
