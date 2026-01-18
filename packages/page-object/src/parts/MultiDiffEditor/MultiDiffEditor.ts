import * as CreateParams from '../CreateParams/CreateParams.ts'
import * as ContextMenu from '../ContextMenu/ContextMenu.ts'
import * as Explorer from '../Explorer/Explorer.ts'
import * as SideBar from '../SideBar/SideBar.ts'

export const create = ({ electronApp, expect, page, platform, VError }: CreateParams.CreateParams) => {
  return {
    async close() {
      try {
        await page.keyboard.press('Control+W')
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to close diff editor`)
      }
    },
    async open(files) {
      try {
        if (files.length < 2) {
          throw new Error('MultiDiffEditor requires at least 2 files')
        }

        const explorer = Explorer.create({ electronApp, expect, ideVersion: { major: 0, minor: 0, patch: 0 }, page, platform, VError })
        const contextMenu = ContextMenu.create({ electronApp, expect, ideVersion: { major: 0, minor: 0, patch: 0 }, page, platform, VError })
        const sideBar = SideBar.create({ electronApp: undefined, expect, ideVersion: { major: 0, minor: 0, patch: 0 }, page, platform, VError })

        await explorer.focus()

        // Select first file for compare
        await explorer.openContextMenu(files[0])
        await contextMenu.select('Select for Compare')

        // Compare with each subsequent file
        for (let i = 1; i < files.length; i++) {
          await explorer.openContextMenu(files[i])
          await contextMenu.select('Compare with Selected')
          await page.waitForIdle()
        }

        await sideBar.hide()
      } catch (error) {
        throw new VError(error, `Failed to open multi-diff editor`)
      }
    },
    async shouldBeVisible() {
      try {
        const diffEditor = page.locator('.diff-editor')
        await expect(diffEditor).toBeVisible()
      } catch (error) {
        throw new VError(error, `Expected diff editor to be visible`)
      }
    },
  }
}
