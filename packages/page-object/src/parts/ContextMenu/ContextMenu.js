export const create = ({ expect, page, VError }) => {
  return {
    async open(locator) {
      try {
        const contextMenu = page.locator('.context-view.monaco-menu-container .actions-container')
        await locator.click({
          button: 'right',
        })
        await expect(contextMenu).toBeVisible({
          timeout: 8_000,
        })
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
        throw new VError(error, `Failed to close tab context menu`)
      }
    },
  }
}
