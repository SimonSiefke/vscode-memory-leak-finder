const TitleBarMenuItems = {
  Edit: 'Edit',
  File: 'File',
  Go: 'Go',
  Run: 'Run',
  Selection: 'Selection',
  View: 'View',
}
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'
import * as ContextMenu from '../ContextMenu/ContextMenu.ts'

import type { CreateParams } from '../CreateParams/CreateParams.ts'

export const create = ({ expect, platform, page, VError, electronApp, ideVersion }: CreateParams) => {
  const toggleTitleBarItem = async (text: string) => {
    const titleBar = page.locator('.part.titlebar')
    await expect(titleBar).toBeVisible()
    await page.waitForIdle()
    const contextMenu = ContextMenu.create({ electronApp, expect, ideVersion, page, platform, VError })
    await contextMenu.open(titleBar.locator('.titlebar-container'))
    await contextMenu.select(text)
    await page.waitForIdle()
  }

  return {
    async ensureCommandCenterVisible() {
      try {
        const commandCenter = page.locator('.part.titlebar .command-center')
        if (!(await commandCenter.isVisible())) {
          await toggleTitleBarItem('Command Center')
        }
        await expect(commandCenter).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to ensure title bar command center is visible`)
      }
    },
    async ensureLayoutControlsVisible() {
      try {
        const layoutControl = page.locator('.part.titlebar .action-toolbar-container .action-label[aria-label^="Toggle Primary Side Bar"]')
        if (!(await layoutControl.isVisible())) {
          await toggleTitleBarItem('Layout Controls')
        }
        await expect(layoutControl).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to ensure title bar layout controls are visible`)
      }
    },
    async hideCommandCenter() {
      try {
        const commandCenter = page.locator('.part.titlebar .command-center')
        await expect(commandCenter).toBeVisible()
        await toggleTitleBarItem('Command Center')
        await expect(commandCenter).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to hide title bar command center`)
      }
    },
    async hideLayoutControls() {
      try {
        const layoutControl = page.locator('.part.titlebar .action-toolbar-container .action-label[aria-label^="Toggle Primary Side Bar"]')
        await expect(layoutControl).toBeVisible()
        await toggleTitleBarItem('Layout Controls')
        await expect(layoutControl).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to hide title bar layout controls`)
      }
    },
    async toggleMenuBar() {
      try {
        const titleBar = page.locator('.part.titlebar')
        await expect(titleBar).toBeVisible()
        await page.waitForIdle()
        const quickPick = QuickPick.create({ platform, page, expect, VError, electronApp, ideVersion })
        await quickPick.executeCommand(WellKnownCommands.ToggleTitleBarMenu)
      } catch (error) {
        throw new VError(error, `Failed to toggle title bar menu bar`)
      }
    },
    async hideMenuBar() {
      try {
        const titleBar = page.locator('.part.titlebar')
        await expect(titleBar).toBeVisible()
        await page.waitForIdle()
        const menuBar = titleBar.locator('.menubar')
        await expect(menuBar).toBeVisible()
        await page.waitForIdle()
        await this.toggleMenuBar()
        await page.waitForIdle()
        await expect(menuBar).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to hide title bar menu bar`)
      }
    },
    async showMenuBar() {
      try {
        const titleBar = page.locator('.part.titlebar')
        await expect(titleBar).toBeVisible()
        await page.waitForIdle()
        const menuBar = titleBar.locator('.menubar')
        await expect(menuBar).toBeHidden()
        await page.waitForIdle()
        await this.toggleMenuBar()
        await expect(menuBar).toBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to show title bar menu bar`)
      }
    },
    async showCommandCenter() {
      try {
        const commandCenter = page.locator('.part.titlebar .command-center')
        await expect(commandCenter).toBeHidden()
        await toggleTitleBarItem('Command Center')
        await expect(commandCenter).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to show title bar command center`)
      }
    },
    async showLayoutControls() {
      try {
        const layoutControl = page.locator('.part.titlebar .action-toolbar-container .action-label[aria-label^="Toggle Primary Side Bar"]')
        await expect(layoutControl).toBeHidden()
        await toggleTitleBarItem('Layout Controls')
        await expect(layoutControl).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to show title bar layout controls`)
      }
    },
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
    async selectMenuItem(text: string) {
      try {
        const menu = page.locator('.monaco-menu .actions-container')
        await expect(menu).toBeVisible()
        const menuItem = menu.locator('.action-item', {
          hasText: text,
        })
        await expect(menuItem).toBeVisible()
        await menuItem.click()
        await expect(menu).toBeHidden()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to select title bar menu item`)
      }
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
  }
}
