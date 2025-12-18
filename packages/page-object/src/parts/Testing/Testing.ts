import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export const create = ({ page, expect, VError }) => {
  return {
    async focusOnTestExplorerView() {
      try {
        const quickPick = QuickPick.create({ page, expect, VError })
        await quickPick.executeCommand(WellKnownCommands.FocusOnTestExplorerView)
        await page.waitForIdle()
        const testExplorer = page.locator('.test-explorer')
        await expect(testExplorer).toBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, 'Failed to focus test explorer')
      }
    },
    async runAllTests({ expectedRowCount }) {
      try {
        const quickPick = QuickPick.create({ page, expect, VError })
        await quickPick.executeCommand(WellKnownCommands.RunAllTests)
        await page.waitForIdle()
        const testExplorer = page.locator('.test-explorer')
        await expect(testExplorer).toBeVisible()
        const summary = testExplorer.locator('.result-summary')
        await expect(summary).toBeVisible()
        await page.waitForIdle()
        const tree = page.locator('.test-explorer-tree')
        await expect(tree).toBeVisible()
        const rows = tree.locator('.monaco-list-row')
        await expect(rows).toHaveCount(expectedRowCount)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, 'Failed to run all tests')
      }
    },
    async runTask(taskName: string): Promise<void> {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand('Tasks: Run Task')
        await page.waitForIdle()
        await quickPick.select(taskName)
        await page.waitForIdle()
        const panel = page.locator('.part.panel')
        await expect(panel).toBeVisible()
        await page.waitForIdle()
        const terminal = page.locator('.terminal')
        await expect(terminal).toBeVisible()
        await page.waitForIdle()
        const terminalActions = page.locator('[aria-label="Terminal actions"]')
        await expect(terminalActions).toBeVisible({ timeout: 10000 })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to run task ${taskName}`)
      }
    },
    async shouldHaveTestSuccess(): Promise<void> {
      try {
        await page.waitForIdle()
        const terminal = page.locator('.terminal')
        await expect(terminal).toBeVisible()
        await page.waitForIdle()
        const successDecoration = terminal.locator('.codicon-terminal-decoration-success, .codicon-check')
        await expect(successDecoration.first()).toBeVisible({ timeout: 15000 })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, 'Failed to verify test success')
      }
    },
    async shouldHaveTestFailure(): Promise<void> {
      try {
        await page.waitForIdle()
        const terminal = page.locator('.terminal')
        await expect(terminal).toBeVisible()
        await page.waitForIdle()
        const errorDecoration = terminal.locator('.codicon-terminal-decoration-error, .codicon-error')
        await expect(errorDecoration.first()).toBeVisible({ timeout: 15000 })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, 'Failed to verify test failure')
      }
    },
  }
}
