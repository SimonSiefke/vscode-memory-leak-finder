import * as CreateParams from '../CreateParams/CreateParams.ts'

export const create = ({ expect, page, VError }: CreateParams.CreateParams) => {
  return {
    async openContextMenu(_label: string) {
      try {
        await page.waitForIdle()
        const tab = page.locator('.tab', { hasText: 'file.txt' })
        await tab.click({ button: 'right' })
        await page.waitForIdle()
        const contextMenu = page.locator('.context-view.monaco-menu-container')
        await expect(contextMenu).toBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to open tab context menu`)
      }
    },
  }
}
