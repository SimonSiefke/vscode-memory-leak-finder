import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export const create = ({ expect, page, VError }) => {
  return {
    async close() {
      try {
        await page.waitForIdle()
        const suggestWidget = page.locator('.suggest-widget')
        await expect(suggestWidget).toBeVisible()
        await page.keyboard.press('Escape')
        await expect(suggestWidget).toBeHidden()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to close suggest widget`)
      }
    },
    async open(expectedItem: string) {
      try {
        await page.waitForIdle()
        const suggestWidget = page.locator('.suggest-widget')
        await expect(suggestWidget).toBeHidden()
        await page.waitForIdle()
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.TriggerSuggest, {
          pressKeyOnce: true,
        })
        await expect(suggestWidget).toBeVisible()
        await page.waitForIdle()
        if (expectedItem) {
          const element = suggestWidget.locator(`.monaco-list-row[aria-label="${expectedItem}"]`)
          await expect(element).toBeVisible()
        }
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to open suggest widget`)
      }
    },
  }
}
