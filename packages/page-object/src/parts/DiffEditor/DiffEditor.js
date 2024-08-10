import * as Character from '../Character/Character.js'
import * as ContextMenu from '../ContextMenu/ContextMenu.js'
import * as Explorer from '../Explorer/Explorer.js'
import * as SideBar from '../SideBar/SideBar.js'

export const create = ({ page, expect, VError }) => {
  return {
    async expectOriginal(text) {
      try {
        const original = page.locator('.editor.original .view-lines')
        await expect(original).toHaveText(text)
      } catch (error) {
        throw new VError(error, `Failed to verify original text ${text}`)
      }
    },
    async expectModified(text) {
      try {
        const modified = page.locator('.editor.modified .view-lines')
        await expect(modified).toHaveText(text)
      } catch (error) {
        throw new VError(error, `Failed to verify modified text ${text}`)
      }
    },
    async open(a, b) {
      try {
        const explorer = Explorer.create({ page, expect, VError })
        const contextMenu = ContextMenu.create({ page, expect, VError })
        const sideBar = SideBar.create({ page, expect, VError })
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
  }
}
