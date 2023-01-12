export const beforeSetup = async ({ tmpDir, writeFile, join }) => {
  await writeFile(
    join(tmpDir, "index.css"),
    `h1{
    abc
}`
  );
};

const initialDiagnosticTimeout = 30_000;

export const setup = async ({ page, expect, Editor }) => {
  await Editor.open("index.css");
  const squiggle = page.locator(".squiggly-error");
  await expect(squiggle).toBeVisible({ timeout: initialDiagnosticTimeout });
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
