export const setup = async ({ QuickPick }) => {
  await QuickPick.showColorTheme();
};

const Colors = {
  DarkModern: " #1f1f1f",
  DarkPlus: " #1e1e1e",
  KimbieDark: " #221a0f",
};

export const run = async ({ page, expect, QuickPick }) => {
  const workbench = page.locator(".monaco-workbench");
  await expect(workbench).toHaveCSS(
    "--vscode-editor-background",
    Colors.DarkModern
  );
  await QuickPick.focusNext();
  await expect(workbench).toHaveCSS(
    "--vscode-editor-background",
    Colors.DarkPlus
  );
  await QuickPick.focusNext();
  await expect(workbench).toHaveCSS(
    "--vscode-editor-background",
    Colors.KimbieDark
  );
  await QuickPick.focusPrevious();
  await QuickPick.focusPrevious();
  await expect(workbench).toHaveCSS(
    "--vscode-editor-background",
    Colors.DarkModern
  );
};
