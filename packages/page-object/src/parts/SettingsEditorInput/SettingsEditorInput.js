import * as Character from '../Character/Character.js'

export const create = ({ expect, page, VError }) => {
  return {
    async shouldHaveText(text) {
      try {
        await page.waitForIdle()
        const settingsHeader = page.locator('.settings-header')
        await expect(settingsHeader).toBeVisible()
        const settingsHeaderInputContainer = settingsHeader.locator('.suggest-input-container')
        await expect(settingsHeaderInputContainer).toBeVisible()
        await expect(settingsHeaderInputContainer).toHaveClass('synthetic-focus')
        const viewLines = settingsHeaderInputContainer.locator('.view-lines')
        await expect(viewLines).toBeVisible()
        const viewLine = viewLines.locator('.view-line')
        await expect(viewLine).toBeVisible()
        await expect(viewLine).toHaveText(`${Character.NonBreakingSpace}${text}`)
      } catch (error) {
        throw new VError(error, `Failed to verify input text: ${text}`)
      }
    },
  }
}
