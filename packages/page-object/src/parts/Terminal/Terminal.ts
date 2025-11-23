import * as Panel from '../Panel/Panel.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

const cleanup = async ({ page, row1 }) => {
  for (let i = 0; i < 50; i++) {
    await page.waitForIdle()
    await page.keyboard.press('Backspace')
    await page.waitForIdle()
    const text = await row1.textContent()
    if (text.endsWith('$ ')) {
      return
    }
  }
}

const waitForTerminalReady = async ({ page, row1 }) => {
  for (let i = 0; i < 50; i++) {
    await page.waitForIdle()
    await page.keyboard.press('a')
    await page.waitForIdle()
    const text = await row1.textContent()
    if (text.includes('aaaaa')) {
      await cleanup({ page, row1 })
      return true
    }
  }
  return false
}

export const create = ({ expect, page, VError, ideVersion }) => {
  return {
    async killAll() {
      try {
        await page.waitForIdle()
        const panel = Panel.create({ page, expect, VError })
        await panel.hide()
        await page.waitForIdle()
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.KillAllTerminals)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to kill all terminals`)
      }
    },
    async show() {
      try {
        await page.waitForIdle()
        await page.focus()
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.FocusTerminal)
        const terminalSplitPane = page.locator('.terminal-split-pane')
        await expect(terminalSplitPane).toBeVisible()
        await page.waitForIdle()
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
        await page.waitForIdle()
        const newTerminal = page.locator('[aria-label^="New Terminal"]')
        await newTerminal.click()
        const terminalTabs = page.locator('[aria-label="Terminal tabs"]')
        await expect(terminalTabs).toBeVisible()
        const tabsEntry = page.locator('.tabs-list .terminal-tabs-entry')
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
        const tabsEntry = page.locator('.tabs-list .terminal-tabs-entry')
        await expect(tabsEntry).toHaveCount(2)
        await page.waitForIdle()
        const secondEntry = tabsEntry.nth(1)
        const deleteAction = secondEntry.locator('[aria-label^="Kill"]')
        await deleteAction.click()
        await page.waitForIdle()
        const quickPick = QuickPick.create({ page, expect, VError })
        await page.waitForIdle()
        if (ideVersion && ideVersion.minor <= 105) {
          // do nothing
        } else {
          await quickPick.executeCommand(WellKnownCommands.FocusTerminal)
        }
        const count = await terminalTabs.count()
        if (count > 1) {
          throw new Error(`expected terminal tab count to be zero or one`)
        }
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
    async execute(command, { waitForFile }) {
      try {
        await page.waitForIdle()
        const terminal = page.locator('.terminal')
        const textarea = terminal.locator('.xterm-helper-textarea')
        await expect(textarea).toBeFocused()
        const rows = terminal.locator('.xterm-rows')
        await expect(rows).toBeVisible()
        const cursor = terminal.locator('.xterm-cursor')
        await expect(cursor).toBeVisible()
        const row1 = rows.nth(0)
        await expect(row1).toHaveText(/\$/)
        await page.waitForIdle()
        const isReady = await waitForTerminalReady({ page, row1 })
        if (!isReady) {
          throw new Error(`terminal is not ready`)
        }
        const letters = command.split('')
        for (const letter of letters) {
          await page.keyboard.press(letter)
          await page.waitForIdle()
        }
        // await new Promise((r) => {
        //   setTimeout(r, 15000)
        // })

        await new Promise((r) => {})
      } catch (error) {
        throw new VError(error, `Failed to execute terminal command`)
      }
    },
    async clear() {
      try {
        await page.waitForIdle()
        // TODO
      } catch (error) {
        throw new VError(error, `Failed to clear terminal`)
      }
    },
  }
}
