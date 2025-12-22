export const create = ({ expect, page, VError }) => {
  return {
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
    async open(locator) {
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
    async select(option) {
      await page.waitForIdle()
      const contextMenu = page.locator('.context-view.monaco-menu-container .actions-container')
      await expect(contextMenu).toBeVisible()
      await expect(contextMenu).toBeFocused()
      const contextMenuItem = contextMenu.locator('.action-item', {
        hasText: option,
      })
      await page.waitForIdle()
      await contextMenuItem.clickExponential({
        waitForHidden: contextMenu,
      })
    },
    async shouldHaveItem(option) {
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
