import * as Panel from '../Panel/Panel.js'
import * as QuickPick from '../QuickPick/QuickPick.js'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.js'

export const create = ({ expect, page, VError }) => {
  return {
    async show() {
      try {
        const repl = page.locator('.repl')
        await expect(repl).toBeHidden()
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.DebugConsoleFocusOnDebugConsoleView)
        await expect(repl).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to show debug console`)
      }
    },
    async hide() {
      try {
        const repl = page.locator('.repl')
        await expect(repl).toBeVisible()
        const panel = Panel.create({ expect, page, VError })
        await panel.hide()
        await expect(repl).toBeHidden()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to hide debug console`)
      }
    },
    async evaluate({ expression, expectedResult }) {
      try {
        const replInputWrapper = page.locator('.repl-input-wrapper')
        await expect(replInputWrapper).toBeVisible()
        const replInput = replInputWrapper.locator('.inputarea')
        await replInput.focus()
        await replInput.type(expression)
        await page.keyboard.press('Enter')
        const firstResult = page.locator('[aria-label="Debug Console"] [role="treeitem"] .evaluation-result')
        await expect(firstResult).toBeVisible()
        await expect(firstResult).toHaveText(expectedResult.message)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to evaluate expression in debug console`)
      }
    },
    async clear() {
      try {
        const clearConsoleButton = page.locator('[aria-label="Clear Console"]')
        await clearConsoleButton.click()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to clear debug console`)
      }
    },
  }
}
