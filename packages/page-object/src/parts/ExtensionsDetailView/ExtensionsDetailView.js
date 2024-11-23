export const create = ({ expect, page, VError }) => {
  return {
    async shouldHaveHeading(text) {
      try {
        const extensionEditor = page.locator('.extension-editor')
        await expect(extensionEditor).toBeVisible()
        const name = extensionEditor.locator('.name')
        await expect(name).toBeVisible()
        await expect(name).toHaveText(text)
      } catch (error) {
        throw new VError(error, `Failed to verify extension detail heading ${text}`)
      }
    },
    async selectCategory(text) {
      try {
        const category = page.locator('.extension-editor .category', {
          hasText: text,
        })
        await expect(category).toBeVisible()
        await category.click()
      } catch (error) {
        throw new VError(error, `Failed to select extension detail category ${text}`)
      }
    },
    async shouldHaveTab(text) {
      try {
        const tab = page.locator('.extension-editor .action-label', {
          hasText: text,
        })
        await expect(tab).toBeVisible()
        await expect(tab).toHaveAttribute('aria-checked', 'true')
      } catch (error) {
        throw new VError(error, `Failed to verify extension detail tab ${text}`)
      }
    },
    async openTab(text, options) {
      try {
        const tab = page.locator('.extension-editor .action-label', {
          hasText: text,
        })
        await expect(tab).toBeVisible()
        await tab.click()
        await expect(tab).toHaveAttribute('aria-checked', 'true')
        await page.waitForIdle()
        if (options && options.webView) {
          const webView = page.locator('.webview')
          await expect(webView).toBeVisible()
          await expect(webView).toHaveClass('ready')
        } else if (options) {
          const webView = page.locator('.webview')
          await expect(webView).toBeHidden()
        }
      } catch (error) {
        throw new VError(error, `Failed to open extension detail tab ${text}`)
      }
    },
  }
}
