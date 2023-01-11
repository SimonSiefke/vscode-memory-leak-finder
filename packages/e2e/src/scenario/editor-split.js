export const beforeSetup = async ({ tmpDir, writeFile, join }) => {
  await writeFile(join(tmpDir, "file.txt"), "sample text");
};

export const setup = async ({ Editor }) => {
  await Editor.open("file.txt");
};

export const run = async ({ page, expect }) => {
  const editorActions = page.locator(".editor-actions").first();
  await expect(editorActions).toBeVisible();
  const editorActionSplitRight = editorActions.locator(
    '[title^="Split Editor Right"]'
  );
  await editorActionSplitRight.click();
  const editors = page.locator(".editor-instance");
  await expect(editors).toHaveCount(2);

  await page.keyboard.press("Control+w");
  await expect(editors).toHaveCount(1);
};
