export const create = ({ page, expect, VError }) => {
  const workbench = page.locator(".monaco-workbench");
  return {
    async shouldHaveEditorBackground(color) {
      try {
        await expect(workbench).toHaveCSS("--vscode-editor-background", color);
      } catch (error) {
        throw new VError(error, `editor background has not the expected color`);
      }
    },
  };
};
