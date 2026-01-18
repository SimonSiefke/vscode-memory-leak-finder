import * as CreateParams from '../CreateParams/CreateParams.ts'
import * as ContextMenu from '../ContextMenu/ContextMenu.ts'
import * as IconSelect from '../IconSelect/IconSelect.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export const create = ({ expect, page, platform, VError }: CreateParams.CreateParams) => {
  return {
    async changeIcon(fromIcon, toIcon) {
      try {
        await page.waitForIdle()
        const terminalActions = page.locator('[aria-label="Terminal actions"]')
        await expect(terminalActions).toBeVisible()
        await page.waitForIdle()
        const actionLabel = terminalActions.locator('.action-label')
        await expect(actionLabel).toBeVisible()
        await page.waitForIdle()
        await expect(actionLabel).toHaveText(' echo  -  Task ')
        await page.waitForIdle()
        const currentIcon = actionLabel.locator(`.codicon-${fromIcon}`)
        await expect(currentIcon).toBeVisible()
        await page.waitForIdle()
        await actionLabel.click()
        await page.waitForIdle()
        const contextMenu = ContextMenu.create({ electronApp: undefined, expect, ideVersion: { major: 0, minor: 0, patch: 0 }, page, platform, VError })
        await contextMenu.select('Change Icon...')
        const iconSelect = IconSelect.create({ electronApp: undefined, expect, ideVersion: { major: 0, minor: 0, patch: 0 }, page, platform, VError })
        await iconSelect.select(toIcon)
        await page.waitForIdle()
        const newIcon = actionLabel.locator(`.codicon-${toIcon}`)
        await expect(newIcon).toBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to change task icon`)
      }
    },
    async clear() {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ electronApp: undefined, expect, ideVersion: { major: 0, minor: 0, patch: 0 }, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.ClearTerminal)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to clear task terminal`)
      }
    },
    async clearTerminal() {
      try {
        const quickPick = QuickPick.create({ electronApp: undefined, expect, ideVersion: { major: 0, minor: 0, patch: 0 }, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.ClearTerminal)
      } catch (error) {
        throw new VError(error, `Failed to clear terminal`)
      }
    },
    async hideQuickPick() {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ electronApp: undefined, expect, ideVersion: { major: 0, minor: 0, patch: 0 }, page, platform, VError })
        await quickPick.close()
      } catch (error) {
        throw new VError(error, `Failed to close task quickpick`)
      }
    },
    async open() {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ electronApp: undefined, expect, ideVersion: { major: 0, minor: 0, patch: 0 }, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.ConfigureTask, {
          pressKeyOnce: true,
          stayVisible: true,
        })
        await page.waitForIdle()
        await quickPick.select('Create tasks.json file from template', true)
        await page.waitForIdle()
        const taskInput = page.locator('input[aria-label="Select a Task Template"]')
        await expect(taskInput).toBeVisible()
        await quickPick.select('Others')
        const tabsContainer = page.locator('.tabs-and-actions-container')
        await expect(tabsContainer).toBeVisible()
        const activeTab = tabsContainer.locator('.tab.active')
        const activeTabLabel = activeTab.locator('.tab-label')
        await expect(activeTabLabel).toHaveText(`tasks.json`)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to open task`)
      }
    },
    async openQuickPick({ item }) {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ electronApp: undefined, expect, ideVersion: { major: 0, minor: 0, patch: 0 }, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.RunTask, {
          stayVisible: true,
        })
        const row = page.locator(`.monaco-list-row[aria-label^="${item}"]`)
        await expect(row).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to open task quickpick`)
      }
    },
    async openRun() {
      try {
        const quickPick = QuickPick.create({ electronApp: undefined, expect, ideVersion: { major: 0, minor: 0, patch: 0 }, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.RunTask, { stayVisible: true })
        await page.waitForIdle()
        // await quickPick.select('Create tasks.json file from template', true)
        // await page.waitForIdle()
        // await quickPick.select('Others')
        // const tabsContainer = page.locator('.tabs-and-actions-container')
        // await expect(tabsContainer).toBeVisible()
        // const activeTab = tabsContainer.locator('.tab.active')
        // const activeTabLabel = activeTab.locator('.tab-label')
        // await expect(activeTabLabel).toHaveText(`tasks.json`)
        // await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to open configuration`)
      }
    },
    async pin(name) {
      try {
        const quickPick = page.locator('.quick-input-widget')
        await expect(quickPick).toBeVisible()
        const option = quickPick.locator('.label-name', {
          hasExactText: ` ${name}`,
        })
        await expect(option).toBeVisible()
        const focusedRow = quickPick.locator('.monaco-list-row.focused')
        await expect(focusedRow).toBeVisible()
        const pinAction = focusedRow.locator('[aria-label="Pin command"]')
        await expect(pinAction).toBeVisible()
        await pinAction.click()
        await expect(pinAction).toBeHidden()
        const unpinAction = focusedRow.locator('[aria-label="Pinned command"]')
        await expect(unpinAction).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to pin "${name}"`)
      }
    },
    async reRunLast({ hasError }: { hasError: boolean }) {
      try {
        const errorDecorations = page.locator('.terminal-command-decoration.codicon-terminal-decoration-error')
        await expect(errorDecorations).toHaveCount(0)
        const quickPick = QuickPick.create({ electronApp: undefined, expect, ideVersion: { major: 0, minor: 0, patch: 0 }, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.ReRunLastTask)
        if (hasError) {
          await expect(errorDecorations).toHaveCount(1)
          await page.waitForIdle()
        }
      } catch (error) {
        throw new VError(error, `Failed to rerun last task`)
      }
    },
    async run(taskName: string) {
      try {
        const quickPick = QuickPick.create({ electronApp: undefined, expect, ideVersion: { major: 0, minor: 0, patch: 0 }, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.RunTask, { stayVisible: true })
        await page.waitForIdle()
        await quickPick.select(taskName)
        await page.waitForIdle()
        const panel = page.locator('.part.panel')
        await expect(panel).toBeVisible()
        const terminal = page.locator('.terminal')
        await expect(terminal).toHaveCount(1)
        await page.waitForIdle()
        await expect(terminal).toBeVisible()
        await page.waitForIdle()
        await expect(terminal).toHaveClass('xterm')
        await page.waitForIdle()
        const terminalActions = page.locator('[aria-label="Terminal actions"]')
        await expect(terminalActions).toBeVisible()
        await page.waitForIdle()
        const actionLabel = terminalActions.locator('.action-label')
        await expect(actionLabel).toBeVisible()
        await page.waitForIdle()
        await expect(actionLabel).toHaveText(' echo  -  Task ')
        await page.waitForIdle()
        const check = actionLabel.locator('.codicon-check')
        await expect(check).toBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to run task`)
      }
    },
    async runError({ scanType, taskName }: { taskName: string; scanType: string }) {
      try {
        const quickPick = QuickPick.create({ electronApp: undefined, expect, ideVersion: { major: 0, minor: 0, patch: 0 }, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.RunTask, { stayVisible: true })
        await page.waitForIdle()
        const hasScanType = Boolean(scanType)
        await quickPick.select(taskName, hasScanType)
        await page.waitForIdle()
        if (hasScanType) {
          await quickPick.select(scanType, false)
        }
        const panel = page.locator('.part.panel')
        await expect(panel).toBeVisible({ timeout: 10_000 })
        await page.waitForIdle()
        const terminal = page.locator('.terminal')
        await expect(terminal).toHaveCount(1)
        await page.waitForIdle()
        await expect(terminal).toBeVisible()
        await page.waitForIdle()
        await expect(terminal).toHaveClass('xterm')
        await page.waitForIdle()
        const terminalActions = page.locator('[aria-label="Terminal actions"]')
        await expect(terminalActions).toBeVisible()
        await page.waitForIdle()
        const actionLabel = terminalActions.locator('.action-label[aria-label^="Focus Terminal"]')
        await expect(actionLabel).toBeVisible()
        const errorIcon = actionLabel.locator('.codicon-error')
        await expect(errorIcon).toBeVisible({ timeout: 15_000 })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to run task with error`)
      }
    },
    async selectQuickPickItem({ item }) {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ electronApp: undefined, expect, ideVersion: { major: 0, minor: 0, patch: 0 }, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.RunTask, {
          stayVisible: true,
        })
        const row = page.locator(`.monaco-list-row[aria-label^="${item}"]`)
        await expect(row).toBeVisible()
        await row.click()
        await page.waitForIdle()
        const terminal = page.locator('.terminal.xterm')
        await expect(terminal).toBeVisible()
        const rows = terminal.locator('.xterm-rows > div')
        const row1 = rows.nth(0)
        await expect(row1).toBeVisible()
        await page.waitForIdle()
        const decoration = terminal.locator('.codicon-terminal-decoration-success.terminal-command-decoration')
        await expect(decoration).toBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to select quickpick item`)
      }
    },
    async unpin(name) {
      try {
        const quickPick = page.locator('.quick-input-widget')
        await expect(quickPick).toBeVisible()
        const option = quickPick.locator('.label-name', {
          hasExactText: ` ${name}`,
        })
        await expect(option).toBeVisible()
        const focusedRow = quickPick.locator('.monaco-list-row.focused')
        await expect(focusedRow).toBeVisible()
        const unpinAction = focusedRow.locator('[aria-label="Pinned command"]')
        await expect(unpinAction).toBeVisible()
        await unpinAction.click()
        await expect(unpinAction).toBeHidden()
        const pinAction = focusedRow.locator('[aria-label="Pin command"]')
        await expect(pinAction).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to pin ${name}`)
      }
    },
  }
}
