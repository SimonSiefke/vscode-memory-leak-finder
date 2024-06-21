export const create = ({ expect, page, VError }) => {
  return {
    async scrollDown() {
      try {
        await page.waitForIdle()
        const scrollContainer = page.locator('.settings-editor-tree .monaco-scrollable-element')
        await expect(scrollContainer).toBeVisible()
        await scrollContainer.scrollDown()
      } catch (error) {
        throw new VError(error, `Failed to scroll down in settings editor`)
      }
    },
    async scrollUp() {
      try {
        await page.waitForIdle()
        const scrollContainer = page.locator('.settings-editor-tree .monaco-scrollable-element')
        await expect(scrollContainer).toBeVisible()
        await scrollContainer.scrollUp()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to scroll up in settings editor`)
      }
    },
  }
}
