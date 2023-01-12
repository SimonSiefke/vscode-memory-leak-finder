export const beforeSetup = async ({ tmpDir, writeFile, join }) => {
  await writeFile(
    join(tmpDir, "index.css"),
    `h1{
    abc
}`
  );
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

  const squiggle = page.locator(".squiggly-error");
  await expect(squiggle).toBeVisible();

  const tokenClosingCurlyBrace = page.locator('[class^="mtk"]', {
    hasText: "}",
  });
  await tokenClosingCurlyBrace.hover();

  const tooltip = page.locator(".monaco-hover");
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText("colon expected");

  const tokenAbc = editor.locator('[class^="mtk"]', { hasText: "abc" }).first();
  await tokenAbc.click();

  for (let i = 0; i < 4; i++) {
    await page.keyboard.press("Delete");
  }
  await expect(squiggle).toBeHidden();
  await page.keyboard.type(" abc");
  await expect(squiggle).toBeVisible();
};
