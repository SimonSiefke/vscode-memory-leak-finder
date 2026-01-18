import * as CreateParams from '../CreateParams/CreateParams.ts'
import * as SettingsEditorInput from '../SettingsEditorInput/SettingsEditorInput.ts'

export const create = ({ expect, page, VError }: CreateParams.CreateParams) => {
  return {
    async select({ filterName, filterText }: { filterName: string; filterText: string }) {
      try {
        await page.waitForIdle()
        const settingsFilter = page.locator('[aria-label="Filter Settings"]')
        await settingsFilter.click()
        await page.waitForIdle()
        const dropDown = page.locator('.monaco-dropdown.active')
        await expect(dropDown).toBeVisible()
        const menu = dropDown.locator('.shadow-root-host:enter-shadow() ul[role="menu"]')
        await expect(menu).toBeVisible()
        await page.waitForIdle()
        const menuItem = menu.locator(`.action-label[aria-label="${filterName}"]`)
        await expect(menuItem).toBeVisible()
        await page.waitForIdle()
        await menuItem.clickExponential({
          waitForHidden: menu,
        })
        await page.waitForIdle()
        await expect(menu).toBeHidden()
        const settingsEditorInput = SettingsEditorInput.create({ electronApp: undefined, expect, ideVersion: { major: 0, minor: 0, patch: 0 }, page, platform: '', VError })
        await settingsEditorInput.shouldHaveText(filterText)
      } catch (error) {
        throw new VError(error, `Failed to select filter ${filterName}`)
      }
    },
  }
}
