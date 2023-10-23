import * as QuickPick from '../QuickPick/QuickPick.js'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.js'

export const create = ({ expect, page, VError }) => {
  return {
    async toggle() {
      await page.waitForIdle()
      const quickPick = QuickPick.create({ expect, page, VError })
      await quickPick.executeCommand(WellKnownCommands.ToggleActivityBarVisibility)
    },
    async show() {
      try {
        const activityBar = page.locator('.part.activitybar')
        await expect(activityBar).toBeHidden()
        await this.toggle()
        await expect(activityBar).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to show activity bar`)
      }
    },
    async showView({ ariaLabel }) {
      try {
        const activityBar = page.locator('.part.activitybar')
        await expect(activityBar).toBeVisible()
        const activityBarItem = activityBar.locator(`.action-label[aria-label^="${ariaLabel}"]`)
        await activityBarItem.click()
        const sideBar = page.locator('.sidebar')
        const title = sideBar.locator('.composite.title')
        await expect(title).toHaveText(`${ariaLabel}`)
      } catch (error) {
        throw new VError(error, `Failed to show ${ariaLabel.toLowerCase()}`)
      }
    },
    async hideCurrentView() {
      try {
        const activityBar = page.locator('.part.activitybar')
        await expect(activityBar).toBeVisible()
        const activityBarItem = activityBar.locator(`.action-label[aria-expanded="true"]`)
        const currentCount = await activityBarItem.count()
        if (currentCount === 0) {
          return
        }
        await activityBarItem.click()
        const sideBar = page.locator('.sidebar')
        await expect(sideBar).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to hide current view`)
      }
    },
    showExplorer() {
      return this.showView({ ariaLabel: 'Explorer' })
    },
    showSearch() {
      return this.showView({
        ariaLabel: 'Search',
      })
    },
    showSourceControl() {
      return this.showView({
        ariaLabel: 'Source Control',
      })
    },
    showRunAndDebug() {
      return this.showView({
        ariaLabel: 'Run and Debug',
      })
    },
    showExtensions() {
      return this.showView({
        ariaLabel: 'Extensions',
      })
    },
    async hide() {
      try {
        const activityBar = page.locator('.part.activitybar')
        await expect(activityBar).toBeVisible()
        await this.toggle()
        await expect(activityBar).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to hide activity bar`)
      }
    },
  }
}
