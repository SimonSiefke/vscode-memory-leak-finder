import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as Character from '../Character/Character.ts'
import * as ContextMenu from '../ContextMenu/ContextMenu.ts'
import * as DiffWorkerProbe from '../DiffWorkerProbe/DiffWorkerProbe.ts'
import * as Explorer from '../Explorer/Explorer.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as SideBar from '../SideBar/SideBar.ts'

const toRenderedText = (text: string) => {
  return text.replaceAll(Character.NewLine, Character.EmptyString).replaceAll(Character.Space, Character.NonBreakingSpace)
}

const sleep = async (milliseconds: number): Promise<void> => {
  const { promise, resolve } = Promise.withResolvers<void>()
  setTimeout(resolve, milliseconds)
  await promise
}

export const create = ({ browserRpc, electronApp, expect, ideVersion, page, platform, VError }: CreateParams) => {
  const getEditor = () => page.locator('.monaco-component.multiDiffEditor')
  const getEntry = (index: number) => getEditor().locator('.multiDiffEntry').nth(index)

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
    async shouldBeClosed() {
      try {
        await expect(page.locator('.multiDiffEditor')).toHaveCount(0)
        await expect(page.locator('.monaco-diff-editor')).toHaveCount(0)
      } catch (error) {
        throw new VError(error, `Expected no multi diff editor or diff editor to remain open`)
      }
    },
    async shouldHaveEntry(
      index: number,
      { fileName, modifiedText, originalText }: { fileName: string; modifiedText: string; originalText: string },
    ) {
      try {
        const entry = getEntry(index)
        await expect(entry.locator('.header .title.modified .label-name')).toHaveText(fileName)
        // Direct children only: in the inline layout, deleted lines render as a nested `.view-lines` view zone.
        await expect(entry.locator('.editor.original .lines-content > .view-lines')).toHaveText(toRenderedText(originalText))
        await expect(entry.locator('.editor.modified .lines-content > .view-lines')).toHaveText(toRenderedText(modifiedText))
        // The deleted side lives in the original editor (side by side) or in a view zone of the modified editor (inline).
        await expect(entry.locator('.line-delete').first()).toBeVisible()
        await expect(entry.locator('.editor.modified .line-insert').first()).toBeVisible()
        await expect(entry.locator('.editor.modified .char-insert').first()).toBeVisible()
      } catch (error) {
        throw new VError(error, `Expected multi diff entry ${index} to show the changes of ${fileName}`)
      }
    },
    async shouldUseWebAssemblyDiff({ timeout = 10_000 }: { timeout?: number } = {}) {
      try {
        const deadline = Date.now() + timeout
        let states: DiffWorkerProbe.DiffWorkerState[] = []
        while (true) {
          states = await DiffWorkerProbe.getDiffWorkerStates(browserRpc)
          if (DiffWorkerProbe.isWasmDiffLoaded(states)) {
            return
          }
          if (Date.now() >= deadline) {
            break
          }
          await sleep(250)
        }
        throw new Error(`No renderer worker instantiated the WebAssembly diff module. Workers: ${JSON.stringify(states)}`)
      } catch (error) {
        throw new VError(error, `Expected the diff editor to compute diffs with the WebAssembly algorithm`)
      }
    },
  }
}
