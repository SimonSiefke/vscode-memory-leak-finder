export const create = ({ expect, page, VError }) => {
  return {
    async hide() {
      try {
        const hover = page.locator('.monaco-hover')
        await expect(hover).toBeVisible()
        await page.waitForIdle()
        let tries = 0
        while (true) {
          await hover.focus()
          await page.keyboard.press('Escape')
          const isVisible = await hover.isVisible()
          if (!isVisible) {
            break
          }
          tries++
          if (tries === 11) {
            throw new Error(`Failed to wait for hover to be hidden`)
          }
        }
        await expect(hover).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to hide hover`)
      }
    },
    async shouldHaveText(text) {
      try {
        const tooltip = page.locator('.monaco-hover')
        await expect(tooltip).toBeVisible()
        await expect(tooltip).toContainText(text)
      } catch (error) {
        throw new VError(error, `Failed to check that hover has text "${text}"`)
      }
    },
  }
}
