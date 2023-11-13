const TitleBarMenuItems = {
  File: 'File',
  Edit: 'Edit',
  Selection: 'Selection',
  View: 'View',
  Go: 'Go',
  Run: 'Run',
}

export const create = ({ expect, page, VError }) => {
  return {
    async showMenu(text) {
      try {
        const titleBar = page.locator('.part.titlebar')
        await expect(titleBar).toBeVisible()
        const menuItem = page.locator(`.menubar-menu-button[aria-label="${text}"]`)
        await expect(menuItem).toBeVisible()
        await menuItem.click()
        const menu = page.locator('.monaco-menu .actions-container')
        await expect(menu).toBeVisible()
        await expect(menu).toBeFocused()
      } catch (error) {
        throw new VError(error, `Failed to open title bar menu`)
      }
    },
    async showMenuFile() {
      return this.showMenu(TitleBarMenuItems.File)
    },
    async showMenuEdit() {
      return this.showMenu(TitleBarMenuItems.Edit)
    },
    async hideMenu(text) {
      try {
        const titleBar = page.locator('.part.titlebar')
        await expect(titleBar).toBeVisible()
        const menuItem = titleBar.locator(`.menubar-menu-button[aria-label="${text}"]`)
        const menu = page.locator('.monaco-menu .actions-container')
        await expect(menu).toBeVisible()
        await expect(menu).toBeFocused()
        await page.keyboard.press('Escape')
        await expect(menu).toBeHidden()
        await expect(menuItem).toBeFocused()
      } catch (error) {
        throw new VError(error, `Failed to hide title bar menu`)
      }
    },
    async hideMenuFile() {
      return this.hideMenu(TitleBarMenuItems.File)
    },
  }
}
