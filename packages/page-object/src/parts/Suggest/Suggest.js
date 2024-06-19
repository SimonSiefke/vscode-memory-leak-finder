import * as QuickPick from '../QuickPick/QuickPick.js'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.js'

export const create = ({ page, expect, VError }) => {
  return {
    async open() {
      try {
        const quickPick = QuickPick.create({ page, expect, VError })
        await quickPick.executeCommand(WellKnownCommands.TriggerSuggest)
        const suggestWidget = page.locator('.suggest-widget')
        await expect(suggestWidget).toBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to open suggest widget`)
      }
    },
    async close() {
      try {
        const suggestWidget = page.locator('.suggest-widget')
        await expect(suggestWidget).toBeVisible()
        await page.keyboard.press('Escape')
        await expect(suggestWidget).toBeHidden()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to close suggest widget`)
      }
    },
  }
}
