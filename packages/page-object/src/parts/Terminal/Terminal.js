import * as QuickPick from '../QuickPick/QuickPick.js'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.js'

export const create = ({ expect, page, VError }) => {
  return {
    async killAll() {
      try {
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.KillAllTerminals)
      } catch (error) {
        throw new VError(error, `Failed to kill all terminals`)
      }
    },
    async show() {
      try {
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.FocusTerminal)
        const terminalSplitPane = page.locator('.terminal-split-pane')
        await expect(terminalSplitPane).toBeVisible()
        const terminal = page.locator('.terminal')
        await expect(terminal).toHaveCount(1)
        await expect(terminal).toBeVisible()
        await expect(terminal).toHaveClass('focus')
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to show terminal`)
      }
    },
    async split() {
      try {
        await page.waitForIdle()
        const splitTerminalButton = page.locator('.action-label[aria-label^="Split Terminal"]')
        await expect(splitTerminalButton).toBeVisible()
        await splitTerminalButton.click()
        const terminal = page.locator('.terminal')
        await expect(terminal).toHaveCount(2)
        const secondTerminal = terminal.nth(1)
        await expect(secondTerminal).toBeVisible()
        await expect(secondTerminal).toHaveClass('focus')
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to split terminal`)
      }
    },
    async add() {
      try {
        const newTerminal = page.locator('[aria-label^="New Terminal"]')
        await newTerminal.click()
        const terminalTabs = page.locator('[aria-label="Terminal tabs"]')
        await expect(terminalTabs).toBeVisible()
        const tabsEntry = page.locator('.terminal-tabs-entry')
        await expect(tabsEntry).toHaveCount(2)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to add terminal`)
      }
    },
    async killSecond() {
      try {
        const terminalTabs = page.locator('[aria-label="Terminal tabs"]')
        await expect(terminalTabs).toBeVisible()
        const tabsEntry = page.locator('.terminal-tabs-entry')
        await expect(tabsEntry).toHaveCount(2)
        const secondEntry = tabsEntry.nth(1)
        const deleteAction = secondEntry.locator('[aria-label^="Kill"]')
        await deleteAction.click()
        await expect(terminalTabs).toHaveCount(0)
        await page.waitForIdle()
        const terminal = page.locator('.terminal')
        await expect(terminal).toHaveCount(1)
        await expect(terminal).toHaveClass('focus')
      } catch (error) {
        throw new VError(error, `Failed to kill second terminal`)
      }
    },
    async killFirst() {
      try {
        await page.waitForIdle()
        const killTerminal = page.locator('[aria-label="Kill Terminal"]')
        await killTerminal.click()
        const terminal = page.locator('.terminal')
        await expect(terminal).toHaveCount(0)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to kill terminal`)
      }
    },
  }
}
