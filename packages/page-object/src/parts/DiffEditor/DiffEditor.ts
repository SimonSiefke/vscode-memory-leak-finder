import * as Character from '../Character/Character.ts'
import * as ContextMenu from '../ContextMenu/ContextMenu.ts'
import * as Explorer from '../Explorer/Explorer.ts'
import * as SideBar from '../SideBar/SideBar.ts'

<<<<<<< HEAD
export const create = ({ expect, page, VError }) => {
=======
export const create = ({ electronApp, expect, page, VError }) => {
>>>>>>> origin/main
  return {
    async expectModified(text) {
      try {
        const modified = page.locator('.editor.modified .view-lines')
        await expect(modified).toHaveText(text)
      } catch (error) {
        throw new VError(error, `Failed to verify modified text ${text}`)
      }
    },
    async expectOriginal(text) {
      try {
        const original = page.locator('.editor.original .view-lines')
        await expect(original).toHaveText(text)
      } catch (error) {
        throw new VError(error, `Failed to verify original text ${text}`)
      }
    },
    async open(a, b) {
      try {
<<<<<<< HEAD
        const explorer = Explorer.create({ expect, page, VError })
=======
        const explorer = Explorer.create({ electronApp, expect, page, VError })
>>>>>>> origin/main
        const contextMenu = ContextMenu.create({ expect, page, VError })
        const sideBar = SideBar.create({ expect, page, VError })
        await explorer.focus()
        await explorer.openContextMenu(a)
        await contextMenu.select('Select for Compare')
        await explorer.openContextMenu(b)
        await contextMenu.select('Compare with Selected')
        await sideBar.hide()
      } catch (error) {
        throw new VError(error, `Failed to open diff editor`)
      }
    },
    async scrollDown() {
      try {
        await page.waitForIdle()
        const scrollContainer = page.locator('.notebook-text-diff-editor .monaco-scrollable-element')
        await expect(scrollContainer).toBeVisible()
        await scrollContainer.scrollDown()
      } catch (error) {
        throw new VError(error, `Failed to scroll down in diff editor`)
      }
    },
    async scrollUp() {
      try {
        await page.waitForIdle()
        const scrollContainer = page.locator('.notebook-text-diff-editor .monaco-scrollable-element')
        await expect(scrollContainer).toBeVisible()
        await scrollContainer.scrollUp()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to scroll up in diff editor`)
      }
    },
    async shouldHaveModifiedEditor(text) {
      try {
        const editor = page.locator('.editor.modified')
        const editorLines = editor.locator('.view-lines')
        const actualText = text.replaceAll(Character.NewLine, Character.EmptyString).replaceAll(Character.Space, Character.NonBreakingSpace)
        await expect(editorLines).toHaveText(actualText, {
          timeout: 3000,
        })
      } catch (error) {
        throw new VError(error, `Failed to assert modified editor contents`)
      }
    },
    async shouldHaveOriginalEditor(text) {
      try {
        const editor = page.locator('.editor.original')
        const editorLines = editor.locator('.view-lines')
        const actualText = text.replaceAll(Character.NewLine, Character.EmptyString).replaceAll(Character.Space, Character.NonBreakingSpace)
        await expect(editorLines).toHaveText(actualText, {
          timeout: 3000,
        })
      } catch (error) {
        throw new VError(error, `Failed to assert original editor contents`)
      }
    },
  }
}
