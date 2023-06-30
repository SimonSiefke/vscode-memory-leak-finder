export const create = ({ page, expect, VError }) => {
  return {
    async shouldHaveEditorBackground(color) {
      try {
        const workbench = page.locator('.monaco-workbench')
        await expect(workbench).toHaveCss('--vscode-editor-background', color)
      } catch (error) {
        throw new VError(error, `editor background has not the expected color`)
      }
    },
    async shouldBeVisible() {
      const workbench = page.locator('.monaco-workbench')
      await expect(workbench).toBeVisible()
    },
  }
}
