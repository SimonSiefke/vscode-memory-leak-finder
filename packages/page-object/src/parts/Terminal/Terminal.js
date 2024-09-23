import * as QuickPick from '../QuickPick/QuickPick.js'
import * as Panel from '../Panel/Panel.js'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.js'

export const create = ({ expect, page, VError }) => {
  return {
    async killAll() {
      try {
        const panel = Panel.create({ page, expect, VError })
        await panel.hide()
        await page.waitForIdle()
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.KillAllTerminals)
      } catch (error) {
        throw new VError(error, `Failed to kill all terminals`)
      }
    },
    async show() {
      try {
        await page.focus()
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.FocusTerminal)
        const terminalSplitPane = page.locator('.terminal-split-pane')
        await expect(terminalSplitPane).toBeVisible()
        const terminal = page.locator('.terminal')
        await expect(terminal).toHaveCount(1)
        await expect(terminal).toBeVisible()
        const maxTries = 25
        for (let i = 0; i < maxTries; i++) {
          const className = await terminal.getAttribute('class')
          if (className.includes('focus')) {
            break
          }
          await page.waitForIdle()
          const screen = terminal.locator('.xterm-screen')
          await new Promise((r) => {
            setTimeout(r, 1000)
          })
          await screen.click()
          console.log({ className })
        }
        await expect(terminal).toHaveClass('focus')
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to show terminal`)
      }
    },
    async focus() {
      try {
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.FocusTerminal)
        // const terminalSplitPane = page.locator('.terminal-split-pane')
        // await expect(terminalSplitPane).toBeVisible()
        // const terminal = page.locator('.terminal')
        // await expect(terminal).toHaveCount(1)
        // await expect(terminal).toBeVisible()
        // await expect(terminal).toHaveClass('focus')
        // await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to focus terminal`)
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
