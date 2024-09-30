import * as Character from '../Character/Character.js'

export const create = ({ expect, page, VError }) => {
  return {
    async select({ filterName, filterText }) {
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
        const settingsHeader = page.locator('.settings-header')
        await expect(settingsHeader).toBeVisible()
        const settingsHeaderInputContainer = settingsHeader.locator('.suggest-input-container')
        await expect(settingsHeaderInputContainer).toBeVisible()
        await expect(settingsHeaderInputContainer).toHaveClass('synthetic-focus')
        const viewLines = settingsHeaderInputContainer.locator('.view-lines')
        await expect(viewLines).toBeVisible()
        const viewLine = viewLines.locator('.view-line')
        await expect(viewLine).toBeVisible()
        await expect(viewLine).toHaveText(`${Character.NonBreakingSpace}${filterText}`)
      } catch (error) {
        throw new VError(error, `Failed to select filter ${filterName}`)
      }
    },
  }
}
