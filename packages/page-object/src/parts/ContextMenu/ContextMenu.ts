import * as CreateParams from '../CreateParams/CreateParams.ts'

export const create = ({ expect, page, VError }: CreateParams.CreateParams) => {
  return {
    async check(name: string) {
      await page.waitForIdle()
      const contextMenu = page.locator('.context-view.monaco-menu-container .actions-container')
      await expect(contextMenu).toBeVisible()
      await page.waitForIdle()
      await expect(contextMenu).toBeFocused()
      await page.waitForIdle()
      const contextMenuItem = contextMenu.locator('.action-item', {
        hasText: name,
      })
      await page.waitForIdle()
      await contextMenuItem.click()
      await page.waitForIdle()
      await expect(contextMenu).toBeHidden()
      await page.waitForIdle()
    },
    async checkSubItem(option: string) {
      try {
        const subMenu = page.locator('.monaco-submenu')
        await expect(subMenu).toBeVisible()
        const contextMenuItem = subMenu.locator('.action-item', {
          hasText: option,
        })
        await expect(contextMenuItem).toBeVisible()
        await page.waitForIdle()
        await contextMenuItem.click()
        const contextMenu = page.locator('.context-view.monaco-menu-container .actions-container')
        await expect(contextMenu).toBeHidden()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to check sub menu item ${option}`)
      }
    },
    async close() {
      try {
        const contextMenu = page.locator('.context-view.monaco-menu-container')
        await expect(contextMenu).toBeVisible()
        await page.keyboard.press('Escape')
        await expect(contextMenu).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to close context menu`)
      }
    },
    async open(locator: any) {
      try {
        await page.waitForIdle()
        const contextMenu = page.locator('.context-view.monaco-menu-container .actions-container')
        await expect(contextMenu).toBeHidden()
        let tries = 0
        const maxTries = 11
        while (true) {
          await page.waitForIdle()
          await locator.click({
            button: 'right',
          })
          const isVisible = await contextMenu.isVisible()
          if (isVisible) {
            break
          }
          await page.waitForIdle()
          if (tries++ === maxTries) {
            throw new Error(`failed to open`)
          }
        }
        await expect(contextMenu).toBeVisible()
        await expect(contextMenu).toBeFocused()
      } catch (error) {
        throw new VError(error, `Failed to open context menu`)
      }
    },
    async openSubMenu(option: string, expands: boolean = true) {
      await page.waitForIdle()
      const contextMenu = page.locator('.context-view.monaco-menu-container .actions-container')
      await expect(contextMenu).toBeVisible()
      await page.waitForIdle()
      await expect(contextMenu).toBeFocused()
      await page.waitForIdle()
      const contextMenuItem = contextMenu.locator(`.action-item .action-label[aria-label="${option}"]`)
      await expect(contextMenuItem).toBeVisible()
      await page.waitForIdle()
      await new Promise((r) => {
        setTimeout(r, 100) // TODO get rid of timeout
      })
      await contextMenuItem.click()
      await page.waitForIdle()
      if (expands) {
        await expect(contextMenuItem).toHaveAttribute('aria-expanded', 'true')
      }

      const subMenu = page.locator('.monaco-submenu')
      await expect(subMenu).toBeVisible()
    },
    async select(option: string, needsFocus: boolean = true) {
      await page.waitForIdle()
      const contextMenu = page.locator('.context-view.monaco-menu-container .actions-container')
      await expect(contextMenu).toBeVisible()
      await page.waitForIdle()
      if (needsFocus) {
        await expect(contextMenu).toBeFocused()
      }
      const contextMenuItem = contextMenu.locator('.action-item', {
        hasText: option,
      })
      await page.waitForIdle()
      await contextMenuItem.clickExponential({
        waitForHidden: contextMenu,
      })
    },
    async shouldHaveItem(option: string) {
      await page.waitForIdle()
      const contextMenu = page.locator('.context-view.monaco-menu-container .actions-container')
      await expect(contextMenu).toBeVisible()
      await expect(contextMenu).toBeFocused()
      await contextMenu.count()
      const contextMenuItem = contextMenu.locator('.action-item', {
        hasText: option,
      })
      await page.waitForIdle()
      await expect(contextMenuItem).toBeVisible()
    },
    async uncheck(name: string) {
      await page.waitForIdle()
      const contextMenu = page.locator('.context-view.monaco-menu-container .actions-container')
      await expect(contextMenu).toBeVisible()
      await page.waitForIdle()
      await expect(contextMenu).toBeFocused()
      await page.waitForIdle()
      const contextMenuItem = contextMenu.locator('.action-item', {
        hasText: name,
      })
      await page.waitForIdle()
      await contextMenuItem.click()
      await page.waitForIdle()
      await expect(contextMenu).toBeHidden()
      await page.waitForIdle()
    },
  }
}
