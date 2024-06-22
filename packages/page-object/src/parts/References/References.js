export const create = ({ page, expect, VError }) => {
  return {
    async shouldBeVisible() {
      try {
        await page.waitForIdle()
        const sidebarTitleLabel = page.locator('.sidebar .title-label')
        await expect(sidebarTitleLabel).toBeVisible()
        await expect(sidebarTitleLabel).toHaveText('References')
      } catch (error) {
        throw new VError(error, `Expected references to be visible`)
      }
    },
    async shouldHaveMessage(message) {
      try {
        await page.waitForIdle()
        const messageItem = page.locator('.sidebar .tree-explorer-viewlet-tree-view .message')
        await expect(messageItem).toBeVisible()
        await expect(messageItem).toHaveText(message)
      } catch (error) {
        throw new VError(error, `Expected references to have message ${message}`)
      }
    },
    async shouldBeFocused() {
      try {
        await page.waitForIdle()
        const results = page.locator('[aria-label="Reference Search Results"]')
        await expect(results).toBeVisible()
        await expect(results).toBeFocused()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Expected references to be focused`)
      }
    },
    async clear() {
      try {
        await page.waitForIdle()
        const clearButton = page.locator('.sidebar [aria-label="Clear"]')
        await expect(clearButton).toBeVisible()
        await clearButton.click()
        await this.shouldHaveMessage('No results. Try running a previous search again:')
      } catch (error) {
        throw new VError(error, `Failed to clear references`)
      }
    },
  }
}
