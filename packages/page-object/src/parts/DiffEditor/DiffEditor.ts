import * as Character from '../Character/Character.ts'
import * as ContextMenu from '../ContextMenu/ContextMenu.ts'
import * as CreateParams from '../CreateParams/CreateParams.ts'
import * as Explorer from '../Explorer/Explorer.ts'
import * as SideBar from '../SideBar/SideBar.ts'

const isNoteBook = (file: string) => {
  return file.endsWith('.ipynb')
}

export const create = ({ electronApp, expect, page, platform, VError }: CreateParams.CreateParams) => {
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
async open({
      cell1Content,
      cell2Content,
      file1,
      file1Content,
      file2,
      file2Content,
    }: {
      file1: string
      file2: string
      file1Content: string
      file2Content: string
      cell2Content: string
      cell1Content: string
    }) {
      try {
        const explorer = Explorer.create(CreateParams.asCreateParams({ electronApp, expect, page, platform, VError } as any))
        const contextMenu = ContextMenu.create(CreateParams.asCreateParams({ expect, page, VError } as any))
        const sideBar = SideBar.create(CreateParams.asCreateParams({ expect, page, platform, VError } as any))
        await explorer.focus()
        await explorer.openContextMenu(file1)
        await contextMenu.select('Select for Compare')
        await explorer.openContextMenu(file2)
        await contextMenu.select('Compare with Selected')
        await sideBar.hide()
        const arrow = '↔'
        const tab = page.locator('.tab', { hasText: `${file1} ${arrow} ${file2}` })
        await expect(tab).toBeVisible()
        await page.waitForIdle()
        if (isNoteBook(file1)) {
          const original = page.locator(`.monaco-diff-editor .monaco-editor[data-uri*="${file1}"]`)
          await expect(original).toBeVisible()
          const modified = page.locator(`.monaco-diff-editor .monaco-editor[data-uri*="${file2}"]`)
          await expect(modified).toBeVisible()
          if (cell1Content) {
            const lines = original.locator('.view-lines')
            await expect(lines).toHaveText(cell1Content)
          }
          if (cell2Content) {
            const lines = modified.locator('.view-lines')
            await expect(lines).toHaveText(cell2Content)
          }
        } else {
          const original = page.locator(`.monaco-diff-editor .monaco-editor[data-uri$="${file1}"]`)
          await expect(original).toBeVisible()
          const modified = page.locator(`.monaco-diff-editor .monaco-editor[data-uri$="${file2}"]`)
          await expect(modified).toBeVisible()
          if (file1Content) {
            const lines = original.locator('.view-lines')
            await expect(lines).toHaveText(file1Content)
          }
          if (file2Content) {
            const lines = modified.locator('.view-lines')
            await expect(lines).toHaveText(file2Content)
          }
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
    async shouldHaveModifiedEditor(text: string) {
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
    async shouldHaveOriginalEditor(text: string) {
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
