import * as Panel from '../Panel/Panel.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export const create = ({ expect, page, platform, VError }) => {
  return {
    async clear() {
      try {
        const clearConsoleButton = page.locator('[aria-label="Clear Console"]')
        await clearConsoleButton.click()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to clear debug console`)
      }
    },
    async clearInput() {
      try {
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.SelectAll)
        await quickPick.executeCommand(WellKnownCommands.DeleteAllLeft)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to clear debug console input`)
      }
    },
    async evaluate({ expectedResult, expression }) {
      try {
        await page.waitForIdle()
        const replInputWrapper = page.locator('.repl-input-wrapper')
        await expect(replInputWrapper).toBeVisible()
        await page.waitForIdle()
        const replInput = replInputWrapper.locator('.native-edit-context')
        await replInput.focus()
        await page.waitForIdle()
        const lines = replInputWrapper.locator('.view-lines')
        await expect(lines).toBeVisible()
        await page.waitForIdle()
        await expect(lines).toHaveText('')
        await page.waitForIdle()
        await replInput.type(expression)
        await page.waitForIdle()
        await expect(lines).toHaveText(expression)
        await page.waitForIdle()
        await page.waitForIdle()
        await page.waitForIdle()
        await page.keyboard.press('Enter')
        await page.waitForIdle()
        const firstResult = page.locator('[aria-label="Debug Console"] [role="treeitem"] .evaluation-result')
        await expect(firstResult).toBeVisible()
        if (expectedResult.type) {
          const span = firstResult.locator(`.value.${expectedResult.type}`)
          await expect(span).toBeBisible()
        }
        await page.waitForIdle()
        await expect(firstResult).toHaveText(expectedResult.message)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to evaluate expression in debug console`)
      }
    },
    async hide() {
      try {
        const repl = page.locator('.repl')
        await expect(repl).toBeVisible()
        const panel = Panel.create({ expect, page, platform, VError })
        await panel.hide()
        await expect(repl).toBeHidden()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to hide debug console`)
      }
    },
    async shouldHaveCompletions(items) {
      try {
        const completions = page.locator('.repl-input-wrapper .suggest-widget')
        const count = await completions.count()
        if (count === 0) {
          const quickPick = QuickPick.create({ expect, page, platform, VError })
          await quickPick.executeCommand(WellKnownCommands.TriggerSuggest)
          await page.waitForIdle()
        }
        await expect(completions).toBeVisible()
        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          const completionItem = completions.locator(`[role="option"][aria-posinset="${i + 1}"]`)
          await expect(completionItem).toBeVisible()
          await expect(completionItem).toHaveAttribute('aria-label', item)
        }
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to verify debug console completion items`)
      }
    },
    async shouldHaveLogpointOutput(expectedMessage) {
      try {
        const debugConsole = page.locator('[aria-label="Debug Console"]')
        await expect(debugConsole).toBeVisible()
        const logpointOutput = debugConsole.locator('[role="treeitem"]', {
          hasText: expectedMessage,
        })
        await expect(logpointOutput).toBeVisible({
          timeout: 10_000,
        })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to verify logpoint output: ${expectedMessage}`)
      }
    },
    async show() {
      try {
        const repl = page.locator('.repl')
        await expect(repl).toBeHidden()
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.DebugConsoleFocusOnDebugConsoleView)
        await expect(repl).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to show debug console`)
      }
    },
    async expand({ label }: { label: string }) {
      try {
        const repl = page.locator('.repl')
        await expect(repl).toBeVisible()
        await page.waitForIdle()
        const row = repl.locator(`.monaco-list-row[aria-label^="${label}"]`)
        await expect(row).toBeVisible()
        await page.waitForIdle()
        await expect(row).toHaveAttribute('aria-expanded', 'false')
        await page.waitForIdle()
        const collapsedTwistie = row.locator('.codicon-tree-item-expanded.collapsed')
        await expect(collapsedTwistie).toBeVisible()
        await collapsedTwistie.click()
        await page.waitForIdle()
        const expandedTwistie = row.locator('.codicon-tree-item-expanded')
        await expect(expandedTwistie).toBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to show debug console`)
      }
    },
    async type(value: string) {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.DebugConsoleFocusOnDebugConsoleView)
        await page.waitForIdle()
        const replInputWrapper = page.locator('.repl-input-wrapper')
        await expect(replInputWrapper).toBeVisible()
        const viewLine = replInputWrapper.locator('.view-line')
        await expect(viewLine).toBeVisible()
        await viewLine.click()
        const cursor = replInputWrapper.locator('.cursor')
        await expect(cursor).toBeVisible()
        const replInput = replInputWrapper.locator('.native-edit-context')
        await replInput.focus()
        await replInput.type(value)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to type into debug console`)
      }
    },
  }
}
