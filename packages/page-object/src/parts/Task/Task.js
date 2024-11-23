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
  }
}
