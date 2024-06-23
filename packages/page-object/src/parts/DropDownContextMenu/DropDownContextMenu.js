export const create = ({ expect, page, VError }) => {
  return {
    async shouldHaveItem(option) {
      await page.waitForIdle()
      const contextMenu = page.locator(
        '.monaco-dropdown.active .shadow-root-host:enter-shadow() .context-view.monaco-menu-container .actions-container',
      )
      await expect(contextMenu).toBeVisible()
      await expect(contextMenu).toBeFocused()
      const contextMenuItem = contextMenu.locator('.action-item', {
        hasText: option,
      })
      await page.waitForIdle()
      await expect(contextMenuItem).toBeVisible()
    },
    async close() {
      try {
        // TODO
      } catch (error) {
        throw new VError(error, `Failed to close context menu`)
      }
    },
  }
}
