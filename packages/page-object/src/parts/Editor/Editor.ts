import * as Character from '../Character/Character.ts'
import * as ContextMenu from '../ContextMenu/ContextMenu.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

const initialDiagnosticTimeout = 30_000

const isNotebook = (file) => {
  return file.endsWith('.ipynb')
}

export const create = ({ page, expect, VError, ideVersion }) => {
  return {
    async open(fileName) {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ page, expect, VError })
        await quickPick.openFile(fileName)
        const tab = page.locator('.tab', { hasText: fileName })
        await expect(tab).toBeVisible()
        if (isNotebook(fileName)) {
          const notebookEditor = page.locator('.notebook-editor')
          const list = notebookEditor.locator('.monaco-list')
          await page.waitForIdle()
          await expect(list).toBeFocused()
        } else {
          const editor = page.locator('.editor-instance')
          await expect(editor).toBeVisible()
          if (ideVersion && ideVersion.minor <= 100) {
            const editorInput = editor.locator('.inputarea')
            await expect(editorInput).toBeFocused()
          } else {
            const editContext = editor.locator('.native-edit-context')
            await expect(editContext).toBeFocused()
          }
        }
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to open editor ${fileName}`)
      }
    },
    async focus() {
      const editor = page.locator('.editor-instance')
      await expect(editor).toBeVisible()
      if (ideVersion && ideVersion.minor <= 100) {
        const editorInput = editor.locator('.inputarea')
        await editorInput.focus()
        await expect(editorInput).toBeFocused()
      } else {
        const editContext = editor.locator('.native-edit-context')
        await editContext.focus()
        await expect(editContext).toBeFocused()
      }
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
    async goToSourceDefinition({ hasDefinition }) {
      try {
        const quickPick = QuickPick.create({ page, expect, VError })
        await quickPick.executeCommand(WellKnownCommands.TypeScriptGoToSourceDefinition)
        if (hasDefinition) {
          // TODO
        } else {
          const notification = page.locator('[role="dialog"][aria-label^="Error: No source definitions found."]')
          await expect(notification).toBeVisible()
        }
      } catch (error) {
        throw new VError(error, `Failed to go to source definition`)
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
    async selectAll() {
      try {
        const quickPick = QuickPick.create({ page, expect, VError })
        await quickPick.executeCommand(WellKnownCommands.SelectAll)
      } catch (error) {
        throw new VError(error, `Failed to select all`)
      }
    },
    async deleteAll() {
      try {
        await this.selectAll()
        await page.waitForIdle()
        await page.keyboard.press('Delete')
        await page.waitForIdle()
        await page.waitForIdle()
        await this.shouldHaveText('')
      } catch (error) {
        throw new VError(error, `Failed to delete all`)
      }
    },
    async duplicateSelection() {
      try {
        const quickPick = QuickPick.create({ page, expect, VError })
        await quickPick.executeCommand(WellKnownCommands.DuplicateSelection)
      } catch (error) {
        throw new VError(error, `Failed to duplicate selection`)
      }
    },
    async undo() {
      try {
        const quickPick = QuickPick.create({ page, expect, VError })
        await quickPick.executeCommand(WellKnownCommands.Undo)
      } catch (error) {
        throw new VError(error, `Failed to undo`)
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
    async findAllReferences() {
      try {
        const quickPick = QuickPick.create({ page, expect, VError })
        await quickPick.executeCommand(WellKnownCommands.FindAllReferences)
      } catch (error) {
        throw new VError(error, `Failed to find all references`)
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
        const { promise } = Promise.withResolvers<void>()
        await promise
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
    async shouldHaveBreadCrumb(text) {
      const breadCrumb = page.locator(`.monaco-breadcrumb-item`, {
        hasText: text,
      })
      await expect(breadCrumb).toBeVisible()
    },
    async save(options) {
      try {
        if (options?.viaKeyBoard) {
          await page.keyboard.press('Control+S')
          await page.waitForIdle()
          const dirtyTabs = page.locator('.tab.dirty')
          await expect(dirtyTabs).toHaveCount(0)
        } else {
          const quickPick = QuickPick.create({ expect, page, VError })
          await quickPick.executeCommand(WellKnownCommands.FileSave)
          await page.waitForIdle()
        }
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
    async enableStickyScroll() {
      try {
        await page.waitForIdle()
        const stickyWidget = page.locator('.sticky-widget')
        const count = await stickyWidget.count()
        if (count > 0) {
          return
        }
        await expect(stickyWidget).toBeHidden()
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.ViewToggleEditorStickyScroll)
        await expect(stickyWidget).toHaveCount(count + 1)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to enable sticky scroll`)
      }
    },
    async disableStickyScroll() {
      try {
        await page.waitForIdle()
        const stickyWidget = page.locator('.sticky-widget')
        const count = await stickyWidget.count()
        if (count === 0) {
          return
        }
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.ViewToggleEditorStickyScroll)
        await expect(stickyWidget).toBeHidden()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to disable sticky scroll`)
      }
    },
    async openFind() {
      try {
        await page.waitForIdle()
        const findWidget = page.locator('.find-widget')
        const count = await findWidget.count()
        if (count > 0) {
          await expect(findWidget).toHaveAttribute('aria-hidden', 'true')
        }
        await page.waitForIdle()
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.Find)
        await page.waitForIdle()
        await expect(findWidget).toBeVisible()
        await expect(findWidget).toHaveClass('visible')
      } catch (error) {
        throw new VError(error, `Failed to show find widget`)
      }
    },
    async closeFind() {
      try {
        const findWidget = page.locator('.find-widget')
        const count = await findWidget.count()
        if (count === 0) {
          return
        }
        const className = await findWidget.getAttribute('class')
        const isVisible = className.includes('visible')
        if (!isVisible) {
          return
        }
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
    async removeAllBreakpoints() {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.RemoveAllBreakpoints)
      } catch (error) {
        throw new VError(error, `Failed to remove all breakpoints`)
      }
    },
    async toggleBreakpoint() {
      try {
        const glyphMarginWidgets = page.locator('.glyph-margin-widgets')
        await expect(glyphMarginWidgets).toBeVisible()
        const breakpoints = glyphMarginWidgets.locator('.codicon-debug-breakpoint')
        const breakpointCount = await breakpoints.count()
        const newBreakpointCount = breakpointCount === 0 ? 1 : 0
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.ToggleBreakpoint)
        await page.waitForIdle()
        await expect(breakpoints).toHaveCount(newBreakpointCount)
      } catch (error) {
        throw new VError(error, `Failed to toggle breakpoint`)
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
        await page.waitForIdle()
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
        await page.waitForIdle()
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
    async inspectTokens() {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ page, expect, VError })
        await quickPick.executeCommand(WellKnownCommands.DeveloperInspectTokensAndScopes)
        const inspectWidget = page.locator('.token-inspect-widget')
        await expect(inspectWidget).toBeVisible()
        await this.focus()
      } catch (error) {
        throw new VError(error, `Failed inspect tokens`)
      }
    },
    async shouldHaveInspectedToken(name) {
      try {
        const inspectedToken = page.locator('h2.tiw-token')
        await expect(inspectedToken).toHaveText(name)
      } catch (error) {
        throw new VError(error, `Failed verify inspected token`)
      }
    },
    async closeInspectedTokens() {
      try {
        const inspectWidget = page.locator('.token-inspect-widget')
        await expect(inspectWidget).toBeVisible()
        await page.keyboard.press('Escape')
        await expect(inspectWidget).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed close inspect widget`)
      }
    },
    async setBreakpoint(lineNumber) {
      try {
        const editor = page.locator('.part.editor .editor-instance')
        const lineNumberElement = editor.locator(`.margin-view-overlays > div:nth(${lineNumber - 1})`)
        await expect(lineNumberElement).toBeVisible()
        const contextMenu = ContextMenu.create({ page, expect, VError })
        await contextMenu.open(lineNumberElement)
        await contextMenu.select('Add Breakpoint')
      } catch (error) {
        throw new VError(error, `Failed set breakpoint`)
      }
    },
    async goToFile({ file, line, column }) {
      try {
        const quickPick = QuickPick.create({ page, expect, VError })
        await quickPick.executeCommand(WellKnownCommands.GoToFile, {
          stayVisible: true,
        })
        const input = `${file}:${line}:${column}`
        await quickPick.type(input)
        await quickPick.select(file)
      } catch (error) {
        throw new VError(error, `Failed to go to file ${file}`)
      }
    },
    async showDebugHover({ expectedTitle }) {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ page, expect, VError })
        await quickPick.executeCommand(WellKnownCommands.DebugShowHover)
        const debugHover = page.locator('.debug-hover-widget')
        await expect(debugHover).toBeVisible()
        const debugHoverTitle = debugHover.locator('.title')
        await expect(debugHoverTitle).toHaveText(expectedTitle)
      } catch (error) {
        throw new VError(error, `Failed to open debug hover`)
      }
    },
    async hideDebugHover() {
      try {
        const debugHover = page.locator('.debug-hover-widget')
        await expect(debugHover).toBeVisible()
        await page.waitForIdle()
        await page.keyboard.press('Escape')
        await expect(debugHover).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to hide debug hover`)
      }
    },
    async autoFix({ hasFixes }) {
      try {
        const quickPick = QuickPick.create({
          page,
          expect,
          VError,
        })
        await quickPick.executeCommand(WellKnownCommands.AutoFix)
        if (hasFixes) {
          // TODO
        } else {
          const overlayMessage = page.locator('.monaco-editor-overlaymessage')
          await expect(overlayMessage).toBeVisible()
          await expect(overlayMessage).toHaveText('No auto fixes available')
        }
      } catch (error) {
        throw new VError(error, `Failed to execute auto fix`)
      }
    },
    async closeAutoFix() {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ page, expect, VError })
        await quickPick.show()
        await quickPick.hide()
        const overlayMessage = page.locator('.monaco-editor-overlaymessage')
        await expect(overlayMessage).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to hide auto fix`)
      }
    },
    async shouldHaveError(fileName) {
      try {
        await page.waitForIdle()
        const tab = page.locator(`[role="tab"][aria-label="${fileName}"]`)
        await expect(tab).toBeVisible()
        const tabLabel = tab.locator('.monaco-icon-label')
        await expect(tabLabel).toBeVisible()
        await expect(tabLabel).toHaveAttribute('aria-label', /1 problem in this file/, {
          timeout: 15_000,
        })
      } catch (error) {
        throw new VError(error, `Failed to wait for editor error`)
      }
    },
    // tab tab-actions-right sizing-fit has-icon active selected tab-border-bottom tab-border-top sticky sticky-normal
    // tab tab-actions-right sizing-fit has-icon active selected tab-border-bottom tab-border-top
    async pin() {
      try {
        const tabsContainer = page.locator('.tabs-and-actions-container')
        await expect(tabsContainer).toBeVisible()
        const activeTab = tabsContainer.locator('.tab.active')
        await expect(activeTab).notToHaveClass('sticky-normal')
        const quickPick = QuickPick.create({ page, expect, VError })
        await quickPick.executeCommand(WellKnownCommands.PinEditor)
        await page.waitForIdle()
        await expect(activeTab).toHaveClass('sticky-normal')
      } catch (error) {
        throw new VError(error, `Failed to pin editor`)
      }
    },
    async unpin() {
      try {
        const tabsContainer = page.locator('.tabs-and-actions-container')
        await expect(tabsContainer).toBeVisible()
        const activeTab = tabsContainer.locator('.tab.active')
        await expect(activeTab).toHaveClass('sticky-normal')
        const quickPick = QuickPick.create({ page, expect, VError })
        await quickPick.executeCommand(WellKnownCommands.UnPinEditor)
        await page.waitForIdle()
        await expect(activeTab).notToHaveClass('sticky-normal')
      } catch (error) {
        throw new VError(error, `Failed to unpin editor`)
      }
    },
    async scrollDown() {
      try {
        await page.waitForIdle()
        await this.selectAll()
        await page.waitForIdle()
        await page.keyboard.press('ArrowRight')
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to scroll down in editor`)
      }
    },
    async scrollUp() {
      try {
        await page.waitForIdle()
        await this.selectAll()
        await page.waitForIdle()
        await page.keyboard.press('ArrowLeft')
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to scroll up in editor`)
      }
    },
    async shouldHaveActiveLineNumber(value) {
      try {
        const stringValue = `${value}`
        await page.waitForIdle()
        const editor = page.locator('.editor-instance')
        await expect(editor).toBeVisible()
        const lineNumber = editor.locator('.active-line-number')
        await expect(lineNumber).toHaveText(stringValue)
      } catch (error) {
        throw new VError(error, `Failed to verify active line number ${value}`)
      }
    },
    async moveScrollBar(y, expectedScrollBarY) {
      try {
        await page.mouse.mockPointerEvents()
        const editor = page.locator('.editor-instance')
        await expect(editor).toBeVisible()
        const scrollbar = editor.locator('.scrollbar.vertical').first()
        await scrollbar.hover()
        await page.waitForIdle()
        const scrollbarSlider = scrollbar.locator('.slider')
        const elementBox1 = await scrollbarSlider.boundingBox()
        if (!elementBox1) {
          throw new Error('Unable to find bounding box on element')
        }

        const elementCenterX = elementBox1.x + elementBox1.width / 2
        const elementCenterY = elementBox1.y + elementBox1.height / 2

        const xOffset = 0
        const yOffset = y

        await scrollbarSlider.hover()
        await page.mouse.move(elementCenterX, elementCenterY)
        await page.mouse.down()
        await expect(scrollbarSlider).toHaveClass('slider active')
        await page.waitForIdle()
        await page.mouse.move(elementCenterX + xOffset, elementCenterY + yOffset)
        await page.waitForIdle()
        await page.mouse.up()

        await expect(scrollbarSlider).toHaveCss('top', `${expectedScrollBarY}px`)
      } catch (error) {
        throw new VError(error, `Failed to scroll in editor`)
      }
    },
  }
}
