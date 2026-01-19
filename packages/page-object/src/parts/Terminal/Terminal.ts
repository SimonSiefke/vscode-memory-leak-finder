import * as Panel from '../Panel/Panel.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'
import * as Workspace from '../Workspace/Workspace.ts'

const cleanup = async ({ page, row1 }: { page: any; row1: any }) => {
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

const waitForTerminalReady = async ({ page, row1 }: { page: any; row1: any }): Promise<boolean> => {
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

import type { CreateParams } from '../CreateParams/CreateParams.ts'

export const create = ({ electronApp, expect, ideVersion, page, platform, VError }: CreateParams) => {
  return {
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
    async clear() {
      try {
        await page.waitForIdle()
        await this.execute('clear')
        // TODO maybe verify terminal is clear
      } catch (error) {
        throw new VError(error, `Failed to clear terminal`)
      }
    },
    async clearFindInput() {
      try {
        await page.waitForIdle()
        const find = page.locator('.simple-find-part.visible')
        await expect(find).toBeVisible()
        await page.waitForIdle()
        const findInput = find.locator('.input[aria-label="Find"]')
        await expect(findInput).toBeVisible()
        await findInput.clear()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to clear terminal find input`)
      }
    },
    async closeFind() {
      try {
        await page.waitForIdle()
        const find = page.locator('.simple-find-part.visible')
        await expect(find).toBeVisible()
        await page.keyboard.press('Escape')
        await page.waitForIdle()
        await expect(find).toBeHidden()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to close terminal find`)
      }
    },
    async execute(command: string, { waitForFile = '' } = {}) {
      try {
        await page.waitForIdle()
        await this.type(command)
        await page.keyboard.press('Enter')
        await page.waitForIdle()
        if (waitForFile) {
          const workspace = Workspace.create({ electronApp, expect, ideVersion, page, platform, VError })
          const exists = await workspace.waitForFile(waitForFile)
          if (!exists) {
            throw new Error(`expected file to be created`)
          }
        }
      } catch (error) {
        throw new VError(error, `Failed to execute terminal command`)
      }
    },
    async focusHover() {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ electronApp: undefined, expect, ideVersion, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.TerminalFocusHover)
        await page.waitForIdle()
        const hover = page.locator('.monaco-hover.workbench-hover')
        await expect(hover).toBeVisible()
        await expect(hover).toBeFocused()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to focus hover`)
      }
    },
    async ignoreHover() {
      try {
        await page.waitForIdle()
        const hover = page.locator('.monaco-hover.workbench-hover')
        await expect(hover).toBeVisible()
        await expect(hover).toBeFocused()
        await page.waitForIdle()
        await page.keyboard.press('Escape')
        await page.waitForIdle()
        await expect(hover).toBeHidden()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to dismiss hover`)
      }
    },
    async killAll() {
      try {
        await page.waitForIdle()
        const panel = Panel.create({ electronApp: undefined, expect, ideVersion, page, platform, VError })
        await panel.hide()
        await page.waitForIdle()
        const quickPick = QuickPick.create({ electronApp: undefined, expect, ideVersion, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.KillAllTerminals)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to kill all terminals`)
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
    async killSecond() {
      try {
        await page.waitForIdle()
        const terminalTabs = page.locator('[aria-label="Terminal tabs"]')
        await expect(terminalTabs).toBeVisible()
        const tabsEntry = page.locator('.tabs-list .terminal-tabs-entry')
        await expect(tabsEntry).toHaveCount(2)
        await page.waitForIdle()
        const secondEntry = tabsEntry.nth(1)
        const deleteAction = secondEntry.locator('[aria-label^="Kill"]')
        await deleteAction.click()
        await page.waitForIdle()
        const quickPick = QuickPick.create({ electronApp: undefined, expect, ideVersion, page, platform, VError })
        await page.waitForIdle()
        if (ideVersion && ideVersion.minor <= 106) {
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
        await page.waitForIdle()
        if (ideVersion && ideVersion.minor <= 106) {
          // do nothing
        } else {
          await expect(terminal).toHaveClass('focus')
        }
      } catch (error) {
        throw new VError(error, `Failed to kill second terminal`)
      }
    },
    async moveToEditorArea() {
      try {
        await page.waitForIdle()
        // const body = page.locator('body')
        // await body.focus()
        await page.waitForIdle()
        const quickPick = QuickPick.create({ electronApp: undefined, expect, ideVersion, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.MoveTerminalToEditorArea, {
          pressKeyOnce: true,
        })
        await page.waitForIdle()
        // TODO verify terminal tab is visible
      } catch (error) {
        throw new VError(error, `Failed to move panel to editor area`)
      }
    },
    async moveToPanelArea() {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ electronApp: undefined, expect, ideVersion, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.MoveTerminalToPanelArea)
        await page.waitForIdle()
        // TODO verify terminal tab is hidden
      } catch (error) {
        throw new VError(error, `Failed to move panel to panel area`)
      }
    },
    async openFind() {
      try {
        await page.waitForIdle()
        await page.keyboard.press('Control+f')
        await page.waitForIdle()
        const find = page.locator('.simple-find-part.visible')
        await expect(find).toBeVisible()
        await page.waitForIdle()
        const inputBox = find.locator('.monaco-inputbox')
        await expect(inputBox).toHaveClass('idle')
        await expect(inputBox).toHaveClass('synthetic-focus')
        await page.waitForIdle()
        const input = find.locator('input[placeholder="Find"]')
        await expect(input).toBeVisible()
        await page.waitForIdle()
        await expect(input).toBeFocused()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to open terminal find`)
      }
    },
    async restartPtyHost() {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ electronApp: undefined, expect, ideVersion, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.RestartPtyHost)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to restart pty host`)
      }
    },
    async scrollToBottom() {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ electronApp: undefined, expect, ideVersion, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.TerminalScrollToBottom)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to scroll to bottom`)
      }
    },
    async scrollToTop() {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ electronApp: undefined, expect, ideVersion, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.TerminalScrollToTop)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to scroll to top`)
      }
    },
    async setFindInput(value: string) {
      try {
        await page.waitForIdle()
        const find = page.locator('.simple-find-part.visible')
        await expect(find).toBeVisible()
        await page.waitForIdle()
        const findInput = find.locator('.input[aria-label="Find"]')
        await expect(findInput).toBeVisible()
        await findInput.type(value)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to set terminal find input`)
      }
    },
    async shouldHaveIncompleteDecoration(enabled: boolean) {
      const terminal = page.locator('.terminal.xterm')
      await page.waitForIdle()

      const decoration = terminal.locator('.codicon-terminal-decoration-incomplete')
      if (enabled) {
        await expect(decoration).toBeVisible()
      } else {
        await expect(decoration).toBeHidden()
      }
      await page.waitForIdle()
    },
    async shouldHaveSuccessDecoration() {
      try {
        await page.waitForIdle()
        const terminal = page.locator('.terminal.xterm')
        await expect(terminal).toBeVisible()
        const decoration = terminal.locator('.codicon-terminal-decoration-success.terminal-command-decoration')
        await expect(decoration).toBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to verify terminal success decoration`)
      }
    },
    async show({ waitForReady = false } = {}) {
      try {
        await page.waitForIdle()
        await page.focus()
        const quickPick = QuickPick.create({ electronApp: undefined, expect, ideVersion, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.FocusTerminal)
        const terminalSplitPane = page.locator('.terminal-split-pane')
        await expect(terminalSplitPane).toBeVisible()
        await page.waitForIdle()
        const terminal = page.locator('.terminal')
        await expect(terminal).toHaveCount(1)
        await expect(terminal).toBeVisible()
        await expect(terminal).toHaveClass('focus')
        await page.waitForIdle()
        if (waitForReady) {
          await this.waitForReady()
        }
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
    async type(command: string) {
      try {
        await page.waitForIdle()
        const terminal = page.locator('.terminal')
        const textarea = terminal.locator('.xterm-helper-textarea')
        await expect(textarea).toBeFocused()
        const rows = terminal.locator('.xterm-rows')
        await expect(rows).toBeVisible()
        const cursor = terminal.locator('.xterm-cursor')
        await expect(cursor).toBeVisible()
        await page.waitForIdle()
        const letters = command.split('')
        for (const letter of letters) {
          await page.waitForIdle()
          await page.keyboard.press(letter)
          await page.waitForIdle()
        }
      } catch (error) {
        throw new VError(error, `Failed to type`)
      }
    },
    async waitForReady() {
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
      await page.waitForIdle()
    },
  }
}
