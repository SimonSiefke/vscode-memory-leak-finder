export const create = ({ page, expect, VError }) => {
  return {
    async expectOriginal(text) {
      try {
        const original = page.locator('.editor.original .view-lines')
        await expect(original).toHaveText(text)
      } catch (error) {
        throw new VError(error, `Failed to verify original text ${text}`)
      }
    },
    async expectModified(text) {
      try {
        const modified = page.locator('.editor.modified .view-lines')
        await expect(modified).toHaveText(text)
      } catch (error) {
        throw new VError(error, `Failed to verify modified text ${text}`)
      }
    },
  }
}
