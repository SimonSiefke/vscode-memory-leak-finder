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
        await page.waitForIdle()
        const searchView = page.locator('.search-view')
        await expect(searchView).toBeVisible()
        await page.waitForIdle()
        const searchInput = searchView.locator('textarea[placeholder="Search"]')
        await expect(searchInput).toBeVisible()
        await page.waitForIdle()
        await searchInput.focus()
        await page.waitForIdle()
        await expect(searchInput).toBeFocused()
        await searchInput.clear()
        await page.waitForIdle()
        await searchInput.type(text)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to type into search input`)
      }
    },
    async clear() {
      try {
        await page.waitForIdle()
        const searchView = page.locator('.search-view')
        const searchInput = searchView.locator('textarea[placeholder="Search"]')
        await searchInput.focus()
        await expect(searchInput).toBeFocused()
        await searchInput.clear()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to clear search input`)
      }
    },
    async typeReplace(text) {
      try {
        await page.waitForIdle()
        const searchView = page.locator('.search-view')
        const replaceInput = searchView.locator('textarea[placeholder="Replace"]')
        await expect(replaceInput).toBeVisible()
        await page.waitForIdle()
        await replaceInput.focus()
        await expect(replaceInput).toBeFocused()
        await replaceInput.clear()
        await replaceInput.type(text)
        await page.waitForIdle()
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
        const searchInput = searchView.locator('textarea[placeholder="Search"]')
        await expect(searchInput).toBeFocused()
        await searchInput.selectText()
        await searchInput.press('Backspace')
        await expect(searchInput).toHaveText('')
      } catch (error) {
        throw new VError(error, `Failed to delete search input text`)
      }
    },
    async shouldHaveNoResults() {
      try {
        await page.waitForIdle()
        const searchView = page.locator('.search-view')
        const searchInput = searchView.locator('textarea[placeholder="Search"]')
        await expect(searchInput).toBeFocused()
        await page.waitForIdle()
        const messages = page.locator('.text-search-provider-messages')
        await expect(messages).toBeVisible()
        await page.waitForIdle()
        await expect(messages).toHaveText(/No results found/)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to that search results are empty`)
      }
    },
    async expandFiles() {
      try {
        await page.waitForIdle()
        const toggleDetails = page.locator(`[role="button"].codicon-search-details`)
        const expanded = await toggleDetails.getAttribute('aria-expanded')
        if (expanded === 'true') {
          return
        }
        const include = page.locator('.file-types.includes')
        await expect(include).toBeHidden()
        await toggleDetails.click()
        await expect(toggleDetails).toHaveAttribute('aria-expanded', 'true', { timeout: 3000 })
        await expect(include).toBeVisible()
        const includeInput = include.locator('.input')
        await expect(includeInput).toBeFocused()
      } catch (error) {
        throw new VError(error, `Failed to expand files`)
      }
    },
    async collapseFiles() {
      try {
        await page.waitForIdle()
        const toggleDetails = page.locator(`[role="button"].codicon-search-details`)
        const expanded = await toggleDetails.getAttribute('aria-expanded')
        if (!expanded || expanded === 'false') {
          return
        }
        const include = page.locator('.file-types.includes')
        await expect(include).toBeVisible()
        await expect(toggleDetails).toBeVisible()
        await toggleDetails.click()
        await expect(toggleDetails).toHaveAttribute('aria-expanded', 'false', { timeout: 2000 })
        await expect(include).toBeHidden({ timeout: 3000 })
      } catch (error) {
        throw new VError(error, `Failed to collapse files`)
      }
    },
    async openEditor() {
      try {
        await page.waitForIdle()
        const link = page.locator('a', {
          hasText: 'Open in editor',
        })
        await expect(link).toBeVisible()
        await link.click()
        const tabLabel = page.locator('.tab-label')
        await expect(tabLabel).toBeVisible()
        await expect(tabLabel).toHaveText(`Search: sample`)
        const searchEditor = page.locator('.search-editor')
        await expect(searchEditor).toBeVisible()
        await page.waitForIdle()
        const line = searchEditor.locator('.view-line').first()
        await expect(line).toBeVisible()
        await expect(line).toHaveText(/result/)
      } catch (error) {
        throw new VError(error, `Failed to open search editor`)
      }
    },
    async enableRegex() {
      try {
        await page.waitForIdle()
        const searchView = page.locator('.search-view')
        const regexCheckbox = searchView.locator('[aria-label^="Use Regular Expression"]')
        await expect(regexCheckbox).toBeVisible()
        await page.waitForIdle()
        const checked = await regexCheckbox.getAttribute('aria-checked')
        if (checked === 'true') {
          return
        }
        await regexCheckbox.click()
        await page.waitForIdle()
        await expect(regexCheckbox).toHaveAttribute('aria-checked', 'true')
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to enable regex`)
      }
    },
    async setFilesToInclude(pattern: string) {
      try {
        await page.waitForIdle()
        await this.expandFiles()
        const include = page.locator('.file-types.includes')
        const includeInput = include.locator('.input')
        await expect(includeInput).toBeVisible()
        await includeInput.focus()
        await page.waitForIdle()
        await includeInput.clear()
        await page.waitForIdle()
        await includeInput.type(pattern)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to set files to include`)
      }
    },
  }
}
