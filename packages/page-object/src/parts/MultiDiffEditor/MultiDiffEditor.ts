import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as ContextMenu from '../ContextMenu/ContextMenu.ts'
import * as Explorer from '../Explorer/Explorer.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as SideBar from '../SideBar/SideBar.ts'

export const create = ({ electronApp, expect, ideVersion, page, platform, VError }: CreateParams) => {
  const getEditor = () => page.locator('.monaco-component.multiDiffEditor')

  return {
    async close() {
      try {
        await page.keyboard.press('Control+W')
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to close diff editor`)
      }
    },
    async open(files: string[]) {
      try {
        if (files.length < 2) {
          throw new Error('MultiDiffEditor requires at least 2 files')
        }

        const explorer = Explorer.create({ electronApp, expect, ideVersion, page, platform, VError })
        const contextMenu = ContextMenu.create({
          electronApp,
          expect,
          ideVersion,
          page,
          platform,
          VError,
        })
        const sideBar = SideBar.create({
          electronApp,
          expect,
          ideVersion,
          page,
          platform,
          VError,
        })

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
    async openSourceControlChanges() {
      try {
        const quickPick = QuickPick.create({ electronApp, expect, ideVersion, page, platform, VError })
        await quickPick.executeCommand('Test: Open SCM Changes in Multi Diff')
        await expect(getEditor()).toBeVisible({ timeout: 15_000 })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to open Source Control changes in the multi diff editor`)
      }
    },
    async shouldHaveFileCount(count: number) {
      try {
        const entries = getEditor().locator('.multiDiffEntry')
        await expect(entries).toHaveCount(count)
      } catch (error) {
        throw new VError(error, `Expected multi diff editor to have ${count} files`)
      }
    },
    async shouldBeVisible() {
      try {
        await expect(getEditor()).toBeVisible()
      } catch (error) {
        throw new VError(error, `Expected multi diff editor to be visible`)
      }
    },
  }
}
