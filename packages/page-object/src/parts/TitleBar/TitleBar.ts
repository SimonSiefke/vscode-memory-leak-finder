const TitleBarMenuItems = {
  Edit: 'Edit',
  File: 'File',
  Go: 'Go',
  Run: 'Run',
  Selection: 'Selection',
  View: 'View',
}

import type { CreateParams } from '../CreateParams/CreateParams.ts'

export const create = ({ expect, page, VError }: CreateParams) => {
  return {
    async hideMenu(text: string) {
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
    async showMenu(text: string) {
      try {
        const titleBar = page.locator('.part.titlebar')
        await expect(titleBar).toBeVisible()
        const menuItem = page.locator(`.menubar-menu-button[aria-label="${text}"]`)
        await expect(menuItem).toBeVisible()
        const className = await menuItem.getAttribute('class')
        const isOpen = className.includes('open')
        if (!isOpen) {
          await menuItem.click()
        }
        const menu = page.locator('.monaco-menu .actions-container')
        await expect(menu).toBeVisible()
        await expect(menu).toBeFocused()
      } catch (error) {
        throw new VError(error, `Failed to open title bar menu`)
      }
    },
    async showMenuEdit() {
      return this.showMenu(TitleBarMenuItems.Edit)
    },
    async showMenuFile() {
      return this.showMenu(TitleBarMenuItems.File)
    },
    async showMenuView() {
      return this.showMenu(TitleBarMenuItems.View)
    },
    async selectMenuItem(menu: string, labels: readonly string[]) {
      try {
        if (labels.length === 0) {
          throw new Error('menu path must not be empty')
        }
        await this.showMenu(menu)
        let menuContainer = page.locator('.monaco-menu .actions-container').first()
        await expect(menuContainer).toBeVisible()
        await expect(menuContainer).toBeFocused()
        for (const label of labels.slice(0, -1)) {
          const menuItem = menuContainer.locator(`.action-item .action-label[aria-label="${label}"]`)
          await expect(menuItem).toBeVisible()
          await menuItem.click()
          const subMenu = page.locator('.monaco-submenu').first()
          await expect(subMenu).toBeVisible()
          menuContainer = subMenu.locator('.actions-container')
          await expect(menuContainer).toBeVisible()
        }
        const finalItem = menuContainer.locator('.action-item', {
          hasText: labels[labels.length - 1],
        })
        await expect(finalItem).toBeVisible()
        await finalItem.click()
      } catch (error) {
        throw new VError(error, `Failed to select title bar menu item`)
      }
    },
    async selectFileMenuItem(labels: readonly string[]) {
      return this.selectMenuItem(TitleBarMenuItems.File, labels)
    },
    async selectViewMenuItem(labels: readonly string[]) {
      return this.selectMenuItem(TitleBarMenuItems.View, labels)
    },
  }
}
