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
    async type(value) {
      try {
        const replInputWrapper = page.locator('.repl-input-wrapper')
        await expect(replInputWrapper).toBeVisible()
        const viewLine = replInputWrapper.locator('.view-line')
        await expect(viewLine).toBeVisible()
        await viewLine.click()
        const cursor = replInputWrapper.locator('.cursor')
        await expect(cursor).toBeVisible()
        const replInput = replInputWrapper.locator('.inputarea')
        await replInput.focus()
        await replInput.type(value)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to type into debug console`)
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
    async shouldHaveCompletions(items) {
      try {
        const completions = page.locator('.repl-input-wrapper .suggest-widget')
        await expect(completions).toBeVisible()
        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          const completionItem = completions.locator(`[role="option"][aria-postinset="${i + 1}"]`)
          await expect(completionItem).toBeVisible()
          await expect(completionItem).toHaveAttribute('aria-label', item)
        }
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to verify debug console completion items`)
      }
    },
  }
}
