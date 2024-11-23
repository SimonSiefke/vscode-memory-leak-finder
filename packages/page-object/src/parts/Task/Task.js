import * as QuickPick from '../QuickPick/QuickPick.js'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.js'

export const create = ({ page, expect, VError }) => {
  return {
    async open() {
      try {
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.ConfigureTask)
        await page.waitForIdle()
        await quickPick.select('Create tasks.json file from template', true)
        await page.waitForIdle()
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
    async run(taskName) {
      try {
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.RunTask, { stayVisible: true })
        await page.waitForIdle()
        await quickPick.select(taskName)
        await page.waitForIdle()
        const panel = page.locator('.part.panel')
        await expect(panel).toBeVisible()
        const terminal = page.locator('.terminal')
        await expect(terminal).toHaveCount(1)
        await expect(terminal).toBeVisible()
        await expect(terminal).toHaveClass('terminal xterm')
        const terminalActions = page.locator('[aria-label="Terminal actions"]')
        await expect(terminalActions).toBeVisible()
        const actionLabel = terminalActions.locator('.action-label')
        await expect(actionLabel).toBeVisible()
        await expect(actionLabel).toHaveText(' echo  -  Task ')
        const check = actionLabel.locator('.codicon-check')
        await expect(check).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to run task`)
      }
    },
  }
}
