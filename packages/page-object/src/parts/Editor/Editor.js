import * as Character from '../Character/Character.js'
import * as QuickPick from '../QuickPick/QuickPick.js'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.js'

const initialDiagnosticTimeout = 30_000

const isNotebook = (file) => {
  return file.endsWith('.ipynb')
}

export const create = ({ page, expect, VError }) => {
  return {
    async open(fileName) {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ page, expect, VError })
        await quickPick.openFile(fileName)
        const tab = page.locator('.tab', { hasText: fileName })
        await expect(tab).toBeVisible()
        if (isNotebook(fileName)) {
          const editor = page.locator('.notebook-editor')
          const list = editor.locator('.monaco-list.element-focused')
          await expect(list).toBeFocused()
        } else {
          const editor = page.locator('.editor-instance')
          await expect(editor).toBeVisible()
          const editorInput = editor.locator('.inputarea')
          await expect(editorInput).toBeFocused()
        }
        await page.waitForIdle()
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
    async hover(text, hoverText) {
      try {
        const editor = page.locator('.editor-instance')
        await expect(editor).toBeVisible()
        const startTag = editor.locator('[class^="mtk"]', { hasText: text }).first()
        await startTag.click()
        let tries = 0
        const quickPick = QuickPick.create({ expect, page, VError })
        const tooltip = editor.locator('.monaco-hover')
        while (true) {
          for (let i = 0; i < tries; i++) {
            await page.waitForIdle()
          }
          await quickPick.executeCommand(WellKnownCommands.ShowOrFocusHover)
          const isVisible = await tooltip.isVisible()
          if (isVisible) {
            break
          }
          for (let i = 0; i < tries; i++) {
            await page.waitForIdle()
          }
          tries++
          if (tries === 30) {
            throw new Error(`Failed to wait for hover`)
          }
        }
        await expect(tooltip).toHaveText(hoverText)
      } catch (error) {
        throw new VError(error, `Failed to hover ${text}`)
      }
    },
    async splitRight() {
      return this.split(WellKnownCommands.ViewSplitEditorRight)
    },
    async split(command) {
      try {
        const editors = page.locator('.editor-instance')
        const currentCount = await editors.count()
        if (currentCount === 0) {
          throw new Error('no open editor found')
        }
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(command)
        await expect(editors).toHaveCount(currentCount + 1)
      } catch (error) {
        throw new VError(error, `Failed to split editor`)
      }
    },
    async splitDown() {
      return this.split(WellKnownCommands.ViewSplitEditorDown)
    },
    async splitUp() {
      return this.split(WellKnownCommands.ViewSplitEditorUp)
    },
    async splitLeft() {
      return this.split(WellKnownCommands.ViewSplitEditorLeft)
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
    async closeAll() {
      try {
        await page.waitForIdle()
        const main = page.locator('[role="main"]')
        const tabs = main.locator('[role="tab"]')
        const currentCount = await tabs.count()
        if (currentCount === 0) {
          return
        }
        const quickPick = QuickPick.create({ page, expect, VError })
        await quickPick.executeCommand(WellKnownCommands.ViewCloseAllEditors)
        await expect(tabs).toHaveCount(0, {
          timeout: 4000,
        })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to close all editors`)
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
    async newTextFile() {
      try {
        const quickPick = QuickPick.create({ page, expect, VError })
        await quickPick.executeCommand(WellKnownCommands.NewUntitledTextFile)
        const tab = page.locator('[role="tab"][data-resource-name="Untitled-1"]')
        await expect(tab).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to create new untitled text file`)
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
        const actualText = text.replaceAll(Character.NewLine, Character.EmptyString).replaceAll(Character.Space, Character.NonBreakingSpace)
        await expect(editorLines).toHaveText(actualText, {
          timeout: 3000,
        })
      } catch (error) {
        throw new VError(error, `Failed to verify editor text ${text}`)
      }
    },
    async rename(newText) {
      try {
        const quickPick = QuickPick.create({ page, expect, VError })
        await quickPick.executeCommand(WellKnownCommands.RenameSymbol)
        const renameInput = page.locator('.rename-input')
        await expect(renameInput).toBeVisible()
        await expect(renameInput).toBeFocused()
        await renameInput.type(newText)
        await page.keyboard.press('Enter')
      } catch (error) {
        throw new VError(error, `Failed to rename text ${newText}`)
      }
    },
    async renameCancel(newText) {
      try {
        const quickPick = QuickPick.create({ page, expect, VError })
        await quickPick.executeCommand(WellKnownCommands.RenameSymbol)
        const renameInput = page.locator('.rename-input')
        await expect(renameInput).toBeVisible()
        await expect(renameInput).toBeFocused()
        await renameInput.type(newText)
        await page.keyboard.press('Escape')
      } catch (error) {
        throw new VError(error, `Failed to rename cancel ${newText}`)
      }
    },
    async shouldHaveToken(text, color) {
      const token = page.locator(`[class^="mtk"]`, {
        hasText: text,
      })
      await expect(token).toHaveCss('color', color)
    },
    async save() {
      try {
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.FileSave)
      } catch (error) {
        throw new VError(error, `Failed to save file`)
      }
    },
    async switchToTab(name) {
      try {
        const tab = page.locator(`[role="tab"][data-resource-name="${name}"]`)
        await expect(tab).toBeVisible()
        await tab.click()
      } catch (error) {
        throw new VError(error, `Failed to switch to tab ${name}`)
      }
    },
    async showColorPicker() {
      try {
        await page.waitForIdle()
        const colorPicker = page.locator('.standalone-colorpicker-body')
        await expect(colorPicker).toBeHidden()
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.ShowOrFocusStandaloneColorPicker)
        await expect(colorPicker).toBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to show color picker`)
      }
    },
    async hideColorPicker() {
      try {
        await page.waitForIdle()
        const colorPicker = page.locator('.standalone-colorpicker-body')
        await expect(colorPicker).toBeVisible()
        await page.waitForIdle()
        await colorPicker.focus()
        await page.waitForIdle()
        await expect(colorPicker).toBeFocused()
        await page.waitForIdle()
        await page.keyboard.press('Escape')
        await page.keyboard.press('Escape')
        await page.keyboard.press('Escape')
        await expect(colorPicker).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to hide color picker`)
      }
    },
    async showBreadCrumbs() {
      try {
        await page.waitForIdle()
        const breadcrumbs = page.locator('.monaco-breadcrumbs')
        const count = await breadcrumbs.count()
        if (count > 0) {
          return
        }
        await expect(breadcrumbs).toBeHidden()
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.ViewToggleBreadCrumbs)
        await expect(breadcrumbs).toBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to show breadcrumbs`)
      }
    },
    async hideBreadCrumbs() {
      try {
        await page.waitForIdle()
        const breadcrumbs = page.locator('.monaco-breadcrumbs')
        const count = await breadcrumbs.count()
        if (count === 0) {
          return
        }
        await expect(breadcrumbs).toBeVisible()
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.ViewToggleBreadCrumbs)
        await expect(breadcrumbs).toBeHidden()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to hide breadcrumbs`)
      }
    },
    async openFind() {
      try {
        const findWidget = page.locator('.find-widget')
        const count = await findWidget.count()
        if (count > 0) {
          await expect(findWidget).toHaveAttribute('aria-hidden', 'true')
        }
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.Find)
        await expect(findWidget).toBeVisible()
        await expect(findWidget).toHaveClass('visible')
      } catch (error) {
        throw new VError(error, `Failed to show find widget`)
      }
    },
    async closeFind() {
      try {
        const findWidget = page.locator('.find-widget')
        await expect(findWidget).toBeVisible()
        await expect(findWidget).toHaveClass('visible')
        const closeButton = findWidget.locator('[aria-label="Close (Escape)"]')
        await closeButton.click()
        await expect(findWidget).toHaveAttribute('aria-hidden', 'true')
      } catch (error) {
        throw new VError(error, `Failed to hide find widget`)
      }
    },
    async showMinimap() {
      try {
        const minimap = page.locator('.minimap')
        await expect(minimap).toBeHidden()
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.ViewToggleMinimap)
        await expect(minimap).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to show minimap`)
      }
    },
    async hideMinimap() {
      try {
        const minimap = page.locator('.minimap')
        await expect(minimap).toBeVisible()
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.ViewToggleMinimap)
        await expect(minimap).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to hide minimap`)
      }
    },
    async showSourceActionEmpty() {
      try {
        const overlayMessage = page.locator('.monaco-editor-overlaymessage')
        await expect(overlayMessage).toBeHidden()
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.SourceAction)
        await expect(overlayMessage).toBeVisible()
        await expect(overlayMessage).toHaveText('No source actions available')
      } catch (error) {
        throw new VError(error, `Failed to show empty source action`)
      }
    },
    async hideSourceActionEmpty() {
      try {
        const overlayMessage = page.locator('.monaco-editor-overlaymessage')
        await expect(overlayMessage).toBeVisible()
        await page.waitForIdle()
        await page.keyboard.press('Escape')
        await expect(overlayMessage).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to hide empty source action`)
      }
    },
    async showSourceAction() {
      try {
        const sourceAction = page.locator('[aria-label="Action Widget"]')
        await expect(sourceAction).toBeHidden()
        await page.waitForIdle()
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.SourceAction)
        await page.waitForIdle()
        await expect(sourceAction).toBeVisible()
        await expect(sourceAction).toHaveText(/Source Action/)
      } catch (error) {
        throw new VError(error, `Failed to show source action`)
      }
    },
    async hideSourceAction() {
      try {
        const sourceAction = page.locator('[aria-label="Action Widget"]')
        await expect(sourceAction).toBeVisible()
        await page.waitForIdle()
        await page.keyboard.press('Escape')
        await expect(sourceAction).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to hide source action`)
      }
    },
    async shouldHaveCursor(estimate) {
      try {
        const cursor = page.locator('.cursor')
        await expect(cursor).toBeVisible()
        await expect(cursor).toHaveCss('left', estimate)
      } catch (error) {
        throw new VError(error, `Failed cursor assertion`)
      }
    },
  }
}
