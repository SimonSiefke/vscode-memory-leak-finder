export const beforeSetup = async ({ tmpDir, writeFile, join }) => {
  await writeFile(join(tmpDir, "index.html"), "");
};

export const setup = async ({ page, expect }) => {
  await page.keyboard.press("Control+P");
  const quickPick = page.locator(".quick-input-widget");
  await expect(quickPick).toBeVisible();
  const quickPickInput = quickPick.locator('[role="combobox"]');
  await quickPickInput.type("index");
  const firstOption = quickPick.locator(".monaco-list-row").first();
  await firstOption.click();
  const tab = page.locator(".tab", { hasText: "index.html" });
  await expect(tab).toBeVisible();
  const editor = page.locator(".editor-instance");
  await expect(editor).toBeVisible();
};

export const run = async ({ page, expect }) => {
  const editor = page.locator(".editor-instance");
  await expect(editor).toBeVisible();
  const editorInput = editor.locator(".inputarea");
  await expect(editorInput).toBeFocused();

  await page.keyboard.press("Control+Space");
  const suggestWidget = page.locator(".suggest-widget");
  await expect(suggestWidget).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(suggestWidget).toBeHidden();
};
