import * as Character from '../Character/Character.ts'
import * as ContextMenu from '../ContextMenu/ContextMenu.ts'
import * as Explorer from '../Explorer/Explorer.ts'
import * as SideBar from '../SideBar/SideBar.ts'

export const create = ({ electronApp, expect, page, platform, VError }) => {
  return {
    async expectModified(text: string) {
      try {
        const modified = page.locator('.editor.modified .view-lines')
        await expect(modified).toHaveText(text)
      } catch (error) {
        throw new VError(error, `Failed to verify modified text ${text}`)
      }
    },
    async expectOriginal(text: string) {
      try {
        const original = page.locator('.editor.original .view-lines')
        await expect(original).toHaveText(text)
      } catch (error) {
        throw new VError(error, `Failed to verify original text ${text}`)
      }
    },
    async open({ file1, file2, file1Content, file2Content }: { file1: string; file2: string; file1Content: string; file2Content: string }) {
      try {
        const explorer = Explorer.create({ electronApp, expect, page, platform, VError })
        const contextMenu = ContextMenu.create({ expect, page, VError })
        const sideBar = SideBar.create({ expect, page, platform, VError })
        await explorer.focus()
        await explorer.openContextMenu(file1)
        await contextMenu.select('Select for Compare')
        await explorer.openContextMenu(file2)
        await contextMenu.select('Compare with Selected')
        await sideBar.hide()
        const arrow = '↔'
        const tab = page.locator('.tab', { hasText: `${file1} ${arrow} ${file2}` })
        await expect(tab).toBeVisible()
        const original = page.locator(`.monaco-diff-editor .editor.original[data-uri$="${file1}"]`)
        await expect(original).toBeVisible()
        const modified = page.locator(`.monaco-diff-editor .editor.modified[data-uri$="${file2}"]`)
        await expect(modified).toBeVisible()
        if (file1Content) {
          const lines = original.locator('.view-lines')
          await expect(lines).toHaveText(file1Content)
        }
        if (file2Content) {
          const lines = modified.locator('.view-lines')
          await expect(lines).toHaveText(file2Content)
        }
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
