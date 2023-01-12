export const setup = async ({ QuickPick }) => {
  await QuickPick.showColorTheme();
};

export const run = async ({ page, expect, QuickPick }) => {
  const workbench = page.locator(".monaco-workbench");
  await expect(workbench).toHaveCSS("--vscode-editor-background", " #1e1e1e");
  await QuickPick.focusNext();
  await expect(workbench).toHaveCSS("--vscode-editor-background", " #221a0f");
  await QuickPick.focusNext();
  await expect(workbench).toHaveCSS("--vscode-editor-background", " #272822");
  await QuickPick.focusPrevious();
  await QuickPick.focusPrevious();
  await expect(workbench).toHaveCSS("--vscode-editor-background", " #1e1e1e");
};
