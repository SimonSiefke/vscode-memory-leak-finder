import * as QuickPick from '../QuickPick/QuickPick.js'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.js'

const initialDiagnosticTimeout = 30_000

export const create = ({ page, expect, VError }) => {
  return {
    async open(fileName) {
      try {
        const quickPick = QuickPick.create({ page, expect, VError })
        await quickPick.openFile(fileName)
        const tab = page.locator('.tab', { hasText: fileName })
        await expect(tab).toBeVisible()
        const editor = page.locator('.editor-instance')
        await expect(editor).toBeVisible()
        const editorInput = editor.locator('.inputarea')
        await expect(editorInput).toBeFocused()
      } catch (error) {
        throw new VError(error, `Failed to open editor ${fileName}`)
      }
    },
    async focus() {
      const editor = page.locator('.editor-instance')
      await expect(editor).toBeVisible()
      const editorInput = editor.locator('.inputarea')
      await editorInput.focus()
      await expect(editorInput).toBeFocused()
    },
    async hover(text) {
      try {
        const editor = page.locator('.editor-instance')
        await expect(editor).toBeVisible()
        const startTag = editor.locator('[class^="mtk"]', { hasText: text }).first()
        await startTag.click()
        await startTag.hover()
        const tooltip = page.locator('.monaco-hover')
        await expect(tooltip).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to hover ${text}`)
      }
    },
    async splitRight() {
      try {
        const editors = page.locator('.editor-instance')
        const currentCount = await editors.count()
        const editorActions = page.locator('.editor-actions').first()
        if (currentCount === 0) {
          throw new Error('no open editor found')
        }
        await expect(editorActions).toBeVisible()
        const editorActionSplitRight = editorActions.locator('[title^="Split Editor Right"]')
        await editorActionSplitRight.click()
        await expect(editors).toHaveCount(currentCount + 1)
      } catch (error) {
        throw new VError(error, `Failed to split editor right`)
      }
    },
    async close() {
      try {
        const main = page.locator('[role="main"]')
        const tabs = main.locator('[role="tab"]')
        const currentCount = await tabs.count()
        if (currentCount === 0) {
          throw new Error('no open editor found')
        }
        await page.keyboard.press('Control+w')
        await expect(tabs).toHaveCount(currentCount - 1, {
          timeout: 3000,
        })
      } catch (error) {
        throw new VError(error, `Failed to close editor`)
      }
    },
    async select(text) {
      try {
        const editor = page.locator('.editor-instance')
        const element = editor.locator('[class^="mtk"]', { hasText: text }).first()
        await expect(element).toHaveText(text)
        await element.dblclick()
        const selection = page.locator('.selected-text')
        await expect(selection).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to select ${text}`)
      }
    },
    async cursorRight() {
      try {
        await page.keyboard.press('ArrowRight')
      } catch (error) {
        throw new VError(error, `Failed to move cursor right`)
      }
    },
    async shouldHaveSelection(left, width) {
      try {
        const selection = page.locator('.selected-text')
        await expect(selection).toBeVisible()
        await expect(selection).toHaveCSS('left', left)
        await expect(selection).toHaveCSS('width', width)
      } catch (error) {
        throw new VError(error, `Failed to verify editor selection`)
      }
    },
    async shouldHaveEmptySelection() {
      try {
        const selection = page.locator('.selected-text')
        await expect(selection).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to verify editor selection`)
      }
    },
    async goToDefinition() {
      try {
        const quickPick = QuickPick.create({ page, expect, VError })
        await quickPick.executeCommand(WellKnownCommands.GoToDefintiion)
      } catch (error) {
        throw new VError(error, `Failed to go to definition`)
      }
    },
    async shouldHaveOverlayMessage(message) {
      try {
        const messageElement = page.locator('.monaco-editor-overlaymessage')
        await expect(messageElement).toBeVisible()
        await expect(messageElement).toHaveText(message)
      } catch (error) {
        throw new VError(error, `Failed to check overlay message with text "${message}"`)
      }
    },
    async click(text) {
      try {
        const editor = page.locator('.editor-instance')
        await expect(editor).toBeVisible()
        const startTag = editor.locator('[class^="mtk"]', { hasText: text, nth: 0 })
        await startTag.click()
      } catch (error) {
        console.log(error)
        await new Promise(() => {})
        // throw new VError(error, `Failed to click ${text}`)
      }
    },
    async shouldHaveSquigglyError() {
      try {
        const squiggle = page.locator('.squiggly-error')
        await expect(squiggle).toBeVisible({
          timeout: initialDiagnosticTimeout,
        })
      } catch (error) {
        throw new VError(error, `Failed to verify squiggly error`)
      }
    },
    async shouldNotHaveSquigglyError() {
      try {
        const squiggle = page.locator('.squiggly-error')
        await expect(squiggle).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to verify that editor has no squiggly error`)
      }
    },
    async deleteCharactersRight({ count }) {
      try {
        for (let i = 0; i < count; i++) {
          await page.keyboard.press('Delete')
        }
      } catch (error) {
        throw new VError(error, `Failed to delete character right`)
      }
    },
    async deleteCharactersLeft({ count }) {
      try {
        for (let i = 0; i < count; i++) {
          await page.keyboard.press('Backspace')
        }
      } catch (error) {
        throw new VError(error, `Failed to delete character left`)
      }
    },
    async type(text) {
      try {
        await page.keyboard.type(text)
      } catch (error) {
        throw new VError(error, `Failed to type ${text}`)
      }
    },
    async shouldHaveText(text) {
      try {
        const editor = page.locator('.editor-instance')
        const editorLines = editor.locator('.view-lines')
        const actualText = text.replaceAll('\n', '')
        await expect(editorLines).toHaveText(actualText)
      } catch (error) {
        throw new VError(error, `Failed to verify editor text ${text}`)
      }
    },
    async rename(newText) {
      try {
        await page.keyboard.press('F2')
        const renameInput = page.locator('.rename-input')
        await expect(renameInput).toBeFocused()
        await renameInput.type(newText)
        await page.keyboard.press('Enter')
      } catch (error) {
        throw new VError(error, `Failed to rename text ${newText}`)
      }
    },
  }
}
