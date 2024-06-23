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
    async openTab(text) {
      try {
        const tab = page.locator('.extension-editor .action-label', {
          hasText: text,
        })
        await expect(tab).toBeVisible()
        await tab.click()
        await expect(tab).toHaveAttribute('aria-checked', 'true')
      } catch (error) {
        throw new VError(error, `Failed to open extension detail tab ${text}`)
      }
    },
  }
}
