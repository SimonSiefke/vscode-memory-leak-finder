export const create = ({ expect, page, VError }) => {
  return {
    async addMarkdownCell() {
      try {
        const cell = page.locator('.markdown-cell-row')
        const count = await cell.count()
        const button = page.locator('[aria-label="Add Markdown Cell"]')
        await button.click()
        await expect(cell).toHaveCount(count + 1)
      } catch (error) {
        throw new VError(error, `Failed to add markdown cell`)
      }
    },
    async removeMarkdownCell() {
      try {
        const cell = page.locator('.markdown-cell-row')
        const count = await cell.count()
        if (count === 0) {
          throw new Error(`there are no markdown cells to remove`)
        }
        const button = page.locator('[aria-label^="Delete Cell"]')
        await button.click()
        await page.waitForIdle()
        await expect(cell).toHaveCount(1)
      } catch (error) {
        throw new VError(error, `Failed to remove markdown cell`)
      }
    },
  }
}
