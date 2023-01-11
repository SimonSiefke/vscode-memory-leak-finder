export const beforeSetup = async ({ tmpDir, writeFile, join }) => {
  await writeFile(join(tmpDir, "index.html"), "<h1>hello world</h1>");
};

export const setup = async ({ page, expect }) => {
  await page.keyboard.press("Control+P");
  const quickPick = page.locator(".quick-input-widget");
  await expect(quickPick).toBeVisible();
  const quickPickInput = quickPick.locator('[role="combobox"]');
  await quickPickInput.type("index");
  const firstOption = quickPick.locator(".monaco-list-row").first();
  await firstOption.click();
  const editor = page.locator(".editor-instance");
  await expect(editor).toBeVisible();
};

export const run = async ({ page, expect }) => {
  const editor = page.locator(".editor-instance");
  await expect(editor).toBeVisible();

  const startTag = editor.locator('[class^="mtk"]', { hasText: "h1" }).first();
  await startTag.click();
  await startTag.hover();
  const hover = page.locator(".monaco-hover");
  await expect(hover).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(hover).toBeHidden();
};
