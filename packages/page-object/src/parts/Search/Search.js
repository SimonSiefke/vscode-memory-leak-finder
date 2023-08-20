export const create = ({ expect, page, VError }) => {
  return {
    async toHaveResults(results) {
      try {
        const searchView = page.locator('.search-view')
        const searchResults = searchView.locator('.monaco-list-row')
        await expect(searchResults).toHaveCount(results.length, {
          timeout: 3000,
        })
        for (let i = 0; i < results.length; i++) {
          const searchResult = searchResults.nth(i)
          await expect(searchResult).toHaveText(results[i])
        }
      } catch (error) {
        throw new VError(error, `Failed to assert search results`)
      }
    },
    async type(text) {
      try {
        const searchView = page.locator('.search-view')
        const searchInput = searchView.locator('textarea[title="Search"]')
        await searchInput.focus()
        await expect(searchInput).toBeFocused()
        await searchInput.clear()
        await searchInput.type(text)
      } catch (error) {
        throw new VError(error, `Failed to type into search input`)
      }
    },
    async typeReplace(text) {
      try {
        const searchView = page.locator('.search-view')
        const replaceInput = searchView.locator('textarea[title="Replace"]')
        await replaceInput.focus()
        await expect(replaceInput).toBeFocused()
        await replaceInput.clear()
        await replaceInput.type(text)
      } catch (error) {
        throw new VError(error, `Failed to type into replace input`)
      }
    },
    async replace() {
      try {
        const button = page.locator('[aria-label="Replace All (Ctrl+Alt+Enter)"]')
        await button.click()
        const messageLocator = page.locator('.text-search-provider-messages .message')
        await expect(messageLocator).toBeVisible()
        await expect(messageLocator).toHaveText(/Replaced/)
      } catch (error) {
        throw new VError(error, `Failed to replace`)
      }
    },
    async deleteText() {
      try {
        const searchView = page.locator('.search-view')
        const searchInput = searchView.locator('textarea[title="Search"]')
        await expect(searchInput).toBeFocused()
        await searchInput.selectText()
        await searchInput.press('Backspace')
        await expect(searchInput).toHaveText('')
      } catch (error) {
        throw new VError(error, `Failed to delete search input text`)
      }
    },
    async expandFiles() {
      try {
        const include = page.locator('.file-types.includes')
        await expect(include).toBeHidden()
        const toggleDetails = page.locator(`[title="Toggle Search Details"]`)
        await toggleDetails.click()
        await expect(include).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to expand files`)
      }
    },
    async collapseFiles() {
      try {
        const include = page.locator('.file-types.includes')
        await expect(include).toBeVisible()
        const toggleDetails = page.locator(`[title="Toggle Search Details"]`)
        await toggleDetails.click()
        await expect(include).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to collapse files`)
      }
    },
  }
}
