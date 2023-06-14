export const beforeSetup = async ({ tmpDir, writeFile, join }) => {
  await writeFile(join(tmpDir, "index.html"), "<h1>hello world</h1>");
};

export const setup = async ({ Editor }) => {
  await Editor.open("index.html");
};

export const run = async ({ page, expect, Editor }) => {
  const editor = page.locator(".editor-instance");
  await expect(editor).toBeVisible();

  const startTag = editor.locator('[class^="mtk"]', { hasText: "h1" }).first();
  await startTag.click();

  await Editor.goToDefinition("No definition found for 'h1'");
  await Editor.shouldHaveOverlayMessage();
};
