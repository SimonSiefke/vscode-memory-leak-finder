import type { CreateParams } from '../CreateParams/CreateParams.ts'

export const create = ({ expect, page, VError }: CreateParams) => {
  const getContextMenu = () => {
    return page.locator('.monaco-dropdown.active .shadow-root-host:enter-shadow() .context-view.monaco-menu-container .actions-container')
  }

  return {
    async close() {
      try {
        await page.waitForIdle()
        const contextMenu = getContextMenu()
        await expect(contextMenu).toBeVisible()
        await page.keyboard.press('Escape')
        await expect(contextMenu).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to close context menu`)
      }
    },
    async select(option: string) {
      try {
        await page.waitForIdle()
        const contextMenu = getContextMenu()
        await expect(contextMenu).toBeVisible()
        await expect(contextMenu).toBeFocused()
        const contextMenuItem = contextMenu.locator('.action-item', {
          hasText: option,
        })
        await page.waitForIdle()
        await expect(contextMenuItem).toBeVisible()
        await contextMenuItem.clickExponential({
          waitForHidden: contextMenu,
        })
      } catch (error) {
        throw new VError(error, `Failed to select context menu item ${option}`)
      }
    },
    async shouldHaveItem(option: string) {
      await page.waitForIdle()
      const contextMenu = getContextMenu()
      await expect(contextMenu).toBeVisible()
      await expect(contextMenu).toBeFocused()
      const contextMenuItem = contextMenu.locator('.action-item', {
        hasText: option,
      })
      await page.waitForIdle()
      await expect(contextMenuItem).toBeVisible()
    },
  }
}
