export const create = ({ page, VError, expect }) => {
  return {
    async click(label) {
      try {
        const item = page.locator(`[aria-label="${label}"]`).first()
        await item.click()
      } catch (error) {
        throw new VError(error, `Failed to click status bar item ${label}`)
      }
    },
    getSelector(id) {
      const selector = `#${id.replaceAll('.', '\\.')}`
      return selector
    },
    async hideItem(id) {
      try {
        await page.waitForIdle()
        const selector = this.getSelector(id)
        const item = page.locator(selector).first()
        await expect(item).toBeVisible()
        await item.click({
          button: 'right',
        })
        await page.waitForIdle()
        const contextMenu = page.locator('.context-view.monaco-menu-container .actions-container')
        await expect(contextMenu).toBeVisible()
        await page.waitForIdle()
        await expect(contextMenu).toBeFocused()
        await page.waitForIdle()
        const contextMenuItem = contextMenu
          .locator('.action-item', {
            hasText: "Hide 'Problems'",
          })
          .first()
        await expect(contextMenuItem).toBeVisible()
        await page.waitForIdle()
        await contextMenuItem.click({ force: true })
        await page.waitForIdle()
        await expect(contextMenu).toBeHidden({ timeout: 10_000 })
        await expect(item).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to hide status bar item "${id}"`)
      }
    },
    async showItem(id) {
      try {
        await page.waitForIdle()
        const selector = this.getSelector(id)
        const item = page.locator(selector).first()
        await expect(item).toBeHidden()
        const statusBar = page.locator('.part.statusbar')
        await statusBar.click({
          button: 'right',
        })
        const contextMenu = page.locator('.context-view.monaco-menu-container .actions-container')
        await expect(contextMenu).toBeVisible()
        await page.waitForIdle()
        await expect(contextMenu).toBeFocused()
        const contextMenuItem = contextMenu
          .locator('.action-item', {
            hasText: 'Problems',
          })
          .first()
        await page.waitForIdle()
        await contextMenuItem.click({ force: true })
        await expect(contextMenu).toBeHidden()
        await expect(item).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to show status bar item`)
      }
    },
    async selectItem(id) {
      try {
        const selector = this.getSelector(id)
        const item = page.locator(selector).first()
        await expect(item).toBeVisible()
        await item.click()
      } catch (error) {
        throw new VError(error, `Failed to select status bar item`)
      }
    },
  }
}
