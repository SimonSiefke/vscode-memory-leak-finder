import * as Settings from '../Settings/Settings.js'
import * as QuickPick from '../QuickPick/QuickPick.js'
import * as ContextMenu from '../ContextMenu/ContextMenu.js'

export const create = ({ expect, page, VError }) => {
  return {
    async select({ filterName, filterText }) {
      await page.waitForIdle()
      const settingsFilter = page.locator('[aria-label="Filter Settings"]')
      await settingsFilter.click()
      await page.waitForIdle()
      const dropDown = page.locator('.monaco-dropdown.active')
      await expect(dropDown).toBeVisible()
      const menu = dropDown.locator('ul[role="menu"]')
      await expect(menu).toBeVisible()
      const menuItem = menu.locator(`[aria-label="${filterName}"]`)
      await expect(menuItem).toBeVisible()
      await menuItem.click()
      await page.waitForIdle()
      await expect(menu).toBeHidden()
    },
  }
}
