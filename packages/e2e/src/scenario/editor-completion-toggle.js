export const beforeSetup = async ({ tmpDir, writeFile, join }) => {
  await writeFile(join(tmpDir, "index.html"), "");
};

export const setup = async ({ Editor }) => {
  await Editor.open("index.html");
};

export const run = async ({ page, expect, Suggest }) => {
  const editor = page.locator(".editor-instance");
  await expect(editor).toBeVisible();
  const editorInput = editor.locator(".inputarea");
  await expect(editorInput).toBeFocused();

  await Suggest.open();

  await Suggest.close();
};
