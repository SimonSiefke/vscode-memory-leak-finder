import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export const create = ({ expect, page, platform, VError }) => {
  return {
    async accept(item: string) {
      try {
        await page.waitForIdle()
        const suggestWidget = page.locator('.suggest-widget')
        await expect(suggestWidget).toBeVisible()
        await page.waitForIdle()
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.TriggerSuggest, {
          pressKeyOnce: true,
        })
        await expect(suggestWidget).toBeVisible()
        await page.waitForIdle()
        const element = suggestWidget.locator(`.monaco-list-row[aria-label="${item}"]`)
        await expect(element).toBeVisible()
        await page.waitForIdle()
        await element.click()
        await page.waitForIdle()
        // await expect(suggestWidget).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to select completion`)
      }
    },
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
    async open(expectedItem?: string) {
      try {
        await page.waitForIdle()
        const suggestWidget = page.locator('.suggest-widget')
        await expect(suggestWidget).toBeHidden()
        await page.waitForIdle()
        const quickPick = QuickPick.create({ expect, page, platform, VError })
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
