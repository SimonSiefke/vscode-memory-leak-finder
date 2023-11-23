export const create = ({ expect, page, VError }) => {
  return {
    async open(locator) {
      try {
        await page.waitForIdle()
        const contextMenu = page.locator('.context-view.monaco-menu-container .actions-container')
        await expect(contextMenu).toBeHidden()
        let tries = 0
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
          if (tries++ === 11) {
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
  }
}
