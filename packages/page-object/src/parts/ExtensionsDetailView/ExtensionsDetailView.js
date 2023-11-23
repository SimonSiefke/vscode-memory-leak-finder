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
  }
}
