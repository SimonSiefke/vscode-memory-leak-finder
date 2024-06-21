import * as Settings from '../Settings/Settings.js'

export const create = ({ expect, page, VError }) => {
  return {
    async open() {
      const settings = Settings.create({ expect, page, VError })
      await settings.open()
    },
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
    async search({ value, resultCount }) {
      try {
        await page.waitForIdle()
        const searchInput = page.locator('.search-container [role="textbox"]')
        await expect(searchInput).toBeFocused()
        await searchInput.type(value)
        await page.waitForIdle()
        const searchCount = page.locator('.settings-count-widget')
        await expect(searchCount).toHaveText(`${resultCount} Setting Found`)
      } catch (error) {
        throw new VError(error, `Failed to search for ${value}`)
      }
    },
    async clear() {
      try {
        await page.waitForIdle()
        const searchInput = page.locator('.search-container [role="textbox"]')
        await expect(searchInput).toBeFocused()
        const clearButton = page.locator('[aria-label="Clear Settings Search Input"]')
        await clearButton.click()
        await page.waitForIdle()
        await expect(searchInput).toHaveValue('')
        const searchCount = page.locator('.settings-count-widget')
        await expect(searchCount).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to clear search input`)
      }
    },
  }
}
