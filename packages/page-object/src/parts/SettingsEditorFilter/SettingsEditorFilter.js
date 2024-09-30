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
      const contextMenu = ContextMenu.create({
        page,
        expect,
        VError,
      })
      await contextMenu.shouldHaveItem(filterName)
      await contextMenu.select(filterName)
      const settings = Settings.create({ expect, page, VError })
      await settings.open()
    },
  }
}
