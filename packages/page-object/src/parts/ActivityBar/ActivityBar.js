import * as QuickPick from '../QuickPick/QuickPick.js'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.js'

export const create = ({ expect, page, VError }) => {
  return {
    async toggle() {
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
    async showExplorer() {
      try {
        const activityBar = page.locator('.part.activitybar')
        await expect(activityBar).toBeVisible()
        const activityBarItem = activityBar.locator(`.action-label[aria-label^="Explorer"]`)
        await activityBarItem.click()
        const sideBar = page.locator('.sidebar')
        const title = sideBar.locator('.composite.title')
        await expect(title).toHaveText('Explorer')
      } catch (error) {
        throw new VError(error, `Failed to show explorer`)
      }
    },
    async showSearch() {
      try {
        const searchItem = page.locator(`.action-item:has([aria-label^="Search"])`)
        const selected = await searchItem.getAttribute('aria-selected')
        if (selected === 'true') {
          return
        }
        const activityBar = page.locator('.part.activitybar')
        await expect(activityBar).toBeVisible()
        const activityBarItem = activityBar.locator(`.action-label[aria-label^="Search"]`)
        await activityBarItem.click()
        const searchView = page.locator('.search-view')
        await expect(searchView).toBeVisible()
        const searchInput = searchView.locator('textarea[title="Search"]')
        await expect(searchInput).toBeFocused()
      } catch (error) {
        throw new VError(error, `Failed to show search`)
      }
    },
    async showSourceControl() {
      try {
        const activityBar = page.locator('.part.activitybar')
        await expect(activityBar).toBeVisible()
        const activityBarItem = activityBar.locator(`.action-label[aria-label^="Source Control"]`)
        await activityBarItem.click()
        const sideBar = page.locator('.sidebar')
        const title = sideBar.locator('.composite.title')
        await expect(title).toHaveText('Source Control')
      } catch (error) {
        throw new VError(error, `Failed to show source control`)
      }
    },
    async showRunAndDebug() {
      try {
        const activityBar = page.locator('.part.activitybar')
        await expect(activityBar).toBeVisible()
        const activityBarItem = activityBar.locator(`.action-label[aria-label^="Run and Debug"]`)
        await activityBarItem.click()
        const sideBar = page.locator('.sidebar')
        const title = sideBar.locator('.composite.title')
        await expect(title).toHaveText(/Run and Debug/)
      } catch (error) {
        throw new VError(error, `Failed to show run and debug`)
      }
    },
    async showExtensions() {
      try {
        const activityBar = page.locator('.part.activitybar')
        await expect(activityBar).toBeVisible()
        const activityBarItem = activityBar.locator(`.action-label[aria-label^="Extensions"]`)
        await activityBarItem.click()
        const sideBar = page.locator('.sidebar')
        const title = sideBar.locator('.composite.title')
        await expect(title).toHaveText(/Extensions/)
      } catch (error) {
        throw new VError(error, `Failed to show extensions`)
      }
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
