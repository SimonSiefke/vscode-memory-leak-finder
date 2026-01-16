import { basename } from 'node:path'
import * as Character from '../Character/Character.ts'
import * as ContextMenu from '../ContextMenu/ContextMenu.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WebView from '../WebView/WebView.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

const initialDiagnosticTimeout = 60_000

const isNotebook = (file: string) => {
  return file.endsWith('.ipynb')
}

const isImage = (file: string) => {
  return file.endsWith('.svg')
}

const isVideo = (file: string) => {
  return file.endsWith('.mp4') || file.endsWith('.webm') || file.endsWith('.avi')
}

const isBinary = (file: string) => {
  return file.endsWith('.bin') || file.endsWith('.exe') || file.endsWith('.dll') || file.endsWith('.so')
}

<<<<<<< HEAD
export const create = ({
  expect,
  ideVersion,
  page,
  VError,
}: {
  expect: any
  ideVersion: any
  page: any
  VError: any
}) => {
=======
export const create = ({ expect, ideVersion, page, platform, VError }) => {
>>>>>>> origin/main
  return {
    async acceptInlineCompletion() {
      try {
        await page.waitForIdle()
        const editor = page.locator('.editor-instance')
        const inlineCompletion = editor.locator('.ghost-text, .inline-suggestion-text, [class*="ghost-text"], [class*="inline-suggestion"]')
        await expect(inlineCompletion).toBeVisible()
        await page.waitForIdle()
        await page.keyboard.press('Tab')
        await page.waitForIdle()
        await expect(inlineCompletion).toBeHidden()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to accept inline completion`)
      }
    },
    async acceptRename() {
      try {
        await page.waitForIdle()
        const renameInput = page.locator('.rename-input')
        await expect(renameInput).toBeVisible()
        await page.waitForIdle()
        await expect(renameInput).toBeFocused()
        await page.waitForIdle()
        await page.keyboard.press('Enter')
        await page.waitForIdle()
        await expect(renameInput).toBeHidden()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to accept rename`)
      }
    },
    async addCursorBelow() {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.AddCursorBelow)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to add cursor below`)
      }
    },
    async autoFix({ hasFixes }) {
      try {
        const quickPick = QuickPick.create({
          expect,
          page,
          platform,
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
    async click(text) {
      try {
        await page.waitForIdle()
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
          await page.waitForIdle()
          return
        }
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.ViewCloseAllEditors)
        await expect(tabs).toHaveCount(0, {
          timeout: 4000,
        })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to close all editors`)
      }
    },
    async closeAllEditorGroups() {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.CloseAllEditorGroups)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to close all editor groups`)
      }
    },
    async closeAutoFix() {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.show()
        await quickPick.hide()
        const overlayMessage = page.locator('.monaco-editor-overlaymessage')
        await expect(overlayMessage).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to hide auto fix`)
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
    async cursorRight() {
      try {
        await page.keyboard.press('ArrowRight')
      } catch (error) {
        throw new VError(error, `Failed to move cursor right`)
      }
    },
    async deleteAll() {
      try {
        await page.waitForIdle()
        await this.selectAll({ viaKeyBoard: true })
        await page.waitForIdle()
        await page.keyboard.press('Delete')
        await page.waitForIdle()
        await page.waitForIdle()
        await this.shouldHaveText('')
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to delete all`)
      }
    },
    async deleteCharactersLeft({ count }) {
      try {
        for (let i = 0; i < count; i++) {
          await page.waitForIdle()
          await page.keyboard.press('Backspace')
          await page.waitForIdle()
        }
      } catch (error) {
        throw new VError(error, `Failed to delete character left`)
      }
    },
    async deleteCharactersRight({ count }) {
      try {
        await page.waitForIdle()
        for (let i = 0; i < count; i++) {
          await page.keyboard.press('Delete')
          await page.waitForIdle()
        }
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to delete character right`)
      }
    },
    async disableReadonly() {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.DisableReadonly)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to disable readonly mode`)
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
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.ViewToggleEditorStickyScroll)
        await expect(stickyWidget).toBeHidden()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to disable sticky scroll`)
      }
    },
    async disableVersionLens() {
      try {
        await page.waitForIdle()
        const button = page.locator('.action-label[aria-label="Hide dependency versions"]')
        await expect(button).toBeVisible()
        await button.click()
        await page.waitForIdle()
        const codeLens = page.locator('[widgetid^="codelens.widget"]').first()
        await expect(codeLens).toBeHidden()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to disable version lens`)
      }
    },
    async duplicateSelection() {
      try {
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.DuplicateSelection)
      } catch (error) {
        throw new VError(error, `Failed to duplicate selection`)
      }
    },
    async enable2x2GridView() {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.EditorGridLayout)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to enable editor grid layout`)
      }
    },
    async enableReadonly() {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.EnableReadonly)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to enable readonly mode`)
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
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.ViewToggleEditorStickyScroll)
        await expect(stickyWidget).toHaveCount(count + 1)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to enable sticky scroll`)
      }
    },
    async enableVersionLens() {
      try {
        await page.waitForIdle()
        const button = page.locator('.action-label[aria-label="Show dependency versions"]')
        await expect(button).toBeVisible()
        await button.click()
        await page.waitForIdle()
        const codeLens = page.locator('[widgetid^="codelens.widget"]').first()
        await expect(codeLens).toBeVisible({
          timeout: 10_000,
        })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to enable version lens`)
      }
    },
    async expandSelection() {
      try {
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.ExpandSelection)
        await page.waitForIdle()
        await page.keyboard.press('Control+L')
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to select line`)
      }
    },
    async findAllReferences() {
      try {
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.FindAllReferences)
      } catch (error) {
        throw new VError(error, `Failed to find all references`)
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
    async focusBottomEditorGroup() {
      try {
        const quickpick = QuickPick.create({ expect, page, platform, VError })
        await quickpick.executeCommand(WellKnownCommands.FocusBelowEditorGroup)
      } catch (error) {
        throw new VError(error, `Failed to focus bottom editor group`)
      }
    },
    async focusLeftEditorGroup() {
      try {
        const quickpick = QuickPick.create({ expect, page, platform, VError })
        await quickpick.executeCommand(WellKnownCommands.FocusLeftEditorGroup)
      } catch (error) {
        throw new VError(error, `Failed to focus left editor group`)
      }
    },
    async focusRightEditorGroup() {
      try {
        const quickpick = QuickPick.create({ expect, page, platform, VError })
        await quickpick.executeCommand(WellKnownCommands.FocusRightEditorGroup)
      } catch (error) {
        throw new VError(error, `Failed to focus right editor group`)
      }
    },
    async focusTopEditorGroup() {
      try {
        const quickpick = QuickPick.create({ expect, page, platform, VError })
        await quickpick.executeCommand(WellKnownCommands.FocusAboveEditorGroup)
      } catch (error) {
        throw new VError(error, `Failed to focus top editor group`)
      }
    },
    async fold() {
      try {
        await page.waitForIdle()
        const inlineFolded = page.locator('.inline-folded')
        await expect(inlineFolded).toBeHidden()
        await page.waitForIdle()
        const collapsedIcon = page.locator('.codicon-folding-collapsed').first()
        await expect(collapsedIcon).toBeHidden()
        await page.waitForIdle()
        const foldingIcon = page.locator('.codicon-folding-expanded').first()
        await expect(foldingIcon).toBeVisible()
        await page.waitForIdle()
        const firstIcon = foldingIcon.first()
        await firstIcon.click()
        await page.waitForIdle()
        await expect(inlineFolded).toBeVisible()
        await page.waitForIdle()
        await expect(collapsedIcon).toBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to fold editor`)
      }
    },
    async foldAll() {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.executeCommand('Fold All')
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to fold all`)
      }
    },
    async format() {
      try {
        const quickpick = QuickPick.create({ expect, page, platform, VError })
        await quickpick.executeCommand(WellKnownCommands.FormatDocument)
      } catch (error) {
        throw new VError(error, `Failed to format file`)
      }
    },
    async goToDefinition() {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.GoToDefintiion)
      } catch (error) {
        throw new VError(error, `Failed to go to definition`)
      }
    },
    async goToEndOfLine() {
      try {
        await page.waitForIdle()
        await page.keyboard.press('End')
        await page.waitForIdle()
        // TODO verify that cursor is actually at that position
      } catch (error) {
        throw new VError(error, `Failed to set cursor to end of line`)
      }
    },
    async goToFile({ column, file, line }) {
      try {
        const quickPick = QuickPick.create({ expect, page, platform, VError })
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
    async peekDefinition({ itemCount }: { itemCount: number }) {
      try {
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.PeekDefinition)
        const widget = page.locator('.peekview-widget')
        await expect(widget).toBeVisible()
        const refs = widget.locator('.ref-tree .monaco-list-row')
        await expect(refs).toHaveCount(itemCount)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to open peek definition`)
      }
    },
    async closePeekDefinition() {
      try {
        await page.waitForIdle()
        const widget = page.locator('.peekview-widget')
        await expect(widget).toBeVisible()
        await page.waitForIdle()
        await page.keyboard.press('Escape')
        await page.waitForIdle()
        await expect(widget).toBeHidden()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to hide peek definition`)
      }
    },
    async goToSourceDefinition({ hasDefinition }) {
      try {
        const quickPick = QuickPick.create({ expect, page, platform, VError })
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
    async hideBreadCrumbs() {
      try {
        await page.waitForIdle()
        const breadcrumbs = page.locator('.monaco-breadcrumbs')
        const count = await breadcrumbs.count()
        if (count === 0) {
          return
        }
        await expect(breadcrumbs).toBeVisible()
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.ViewToggleBreadCrumbs)
        await expect(breadcrumbs).toBeHidden()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to hide breadcrumbs`)
      }
    },
    async hideColorPicker() {
      try {
        await page.waitForIdle()
        const colorPicker = page.locator('.standalone-colorpicker-body')
        await expect(colorPicker).toBeVisible()
        await page.waitForIdle()
        const closeButton = colorPicker.locator('.button.close-icon')
        await expect(closeButton).toBeVisible()
        await page.waitForIdle()
        await closeButton.click()
        await expect(colorPicker).toBeHidden()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to hide color picker`)
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
    async hideMinimap() {
      try {
        const minimap = page.locator('.minimap')
        await expect(minimap).toBeVisible()
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.ViewToggleMinimap)
        await expect(minimap).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to hide minimap`)
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
    async hideSourceActionEmpty() {
      try {
        await page.waitForIdle()
        const overlayMessage = page.locator('.monaco-editor-overlaymessage')
        await expect(overlayMessage).toBeVisible()
        for (let i = 0; i < 5; i++) {
          await page.waitForIdle()
          const count = await overlayMessage.count()
          if (count === 0) {
            break
          }
          await page.keyboard.press('Escape')
        }
        await expect(overlayMessage).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to hide empty source action`)
      }
    },
    async hover(text: string, hoverText: string) {
      try {
        await page.waitForIdle()
        const editor = page.locator('.editor-instance')
        await expect(editor).toBeVisible()
        await page.waitForIdle()
        const startTag = editor.locator('[class^="mtk"]', { hasText: text }).first()
        await expect(startTag).toBeVisible()
        await page.waitForIdle()
        await startTag.click()
        await page.waitForIdle()
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        const tooltip = editor.locator('.monaco-hover')
        await expect(tooltip).toBeHidden()
        await page.waitForIdle()
        await quickPick.executeCommand(WellKnownCommands.ShowOrFocusHover, {
          pressKeyOnce: true,
        })
        await expect(tooltip).toBeVisible()
        await page.waitForIdle()
        await expect(tooltip).toHaveText(hoverText)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to hover ${text}`)
      }
    },
    async inspectTokens() {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.DeveloperInspectTokensAndScopes)
        const inspectWidget = page.locator('.token-inspect-widget')
        await expect(inspectWidget).toBeVisible()
        await this.focus()
      } catch (error) {
        throw new VError(error, `Failed inspect tokens`)
      }
    },
    async moveScrollBar(y: number, expectedScrollBarY: number) {
      try {
        await page.mouse.mockPointerEvents()
        const editor = page.locator('.editor-instance')
        await expect(editor).toBeVisible()
        const scrollbar = editor.locator('.scrollbar.vertical').first()
        await scrollbar.hover()
        await page.waitForIdle()
        const scrollBarVisible = editor.locator('.scrollbar.visible.scrollbar.vertical')
        await expect(scrollBarVisible).toBeVisible()
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
    async newEditorGroupBottom() {
      const quickPick = QuickPick.create({ expect, page, platform, VError })
      await quickPick.executeCommand(WellKnownCommands.NewEditorGroupBottom)
    },
    async newEditorGroupLeft() {
      const quickPick = QuickPick.create({ expect, page, platform, VError })
      await quickPick.executeCommand(WellKnownCommands.NewEditorGroupLeft)
    },
    async newEditorGroupRight() {
      const quickPick = QuickPick.create({ expect, page, platform, VError })
      await quickPick.executeCommand(WellKnownCommands.NewEditorGroupRight)
    },
    async newEditorGroupTop() {
      const quickPick = QuickPick.create({ expect, page, platform, VError })
      await quickPick.executeCommand(WellKnownCommands.NewEditorGroupTop)
    },
    async newTextFile() {
      try {
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.NewUntitledTextFile)
        const tab = page.locator('[role="tab"][data-resource-name="Untitled-1"]')
        await expect(tab).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to create new untitled text file`)
      }
    },
    async open(fileName: string, options?: any) {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.openFile(fileName)
        const tab = page.locator('.tab', { hasText: fileName })
        await expect(tab).toBeVisible()
        await page.waitForIdle()
        if (isNotebook(fileName)) {
          await this.waitForNoteBookReady()
        } else if (isImage(fileName)) {
          await this.waitForImageReady()
        } else if (options?.hasWarning) {
          await this.waitForWarning()
        } else if (isVideo(fileName)) {
          await this.waitForVideoReady(options?.hasError)
        } else if (isBinary(fileName)) {
          await this.waitForBinaryReady()
        } else if (options?.hasError) {
          // TODO
          throw new Error(`not implemented`)
        } else {
          await this.waitforTextFileReady(fileName)
        }
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to open editor ${fileName}`)
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
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.Find)
        await page.waitForIdle()
        await expect(findWidget).toBeVisible()
        await expect(findWidget).toHaveClass('visible')
      } catch (error) {
        throw new VError(error, `Failed to show find widget`)
      }
    },
    async openSettingsJson() {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.executeCommand('Preferences: Open User Settings (JSON)')
        await this.switchToTab('settings.json')
      } catch (error) {
        throw new VError(error, `Failed to open settings JSON`)
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
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.PinEditor)
        await page.waitForIdle()
        await expect(activeTab).toHaveClass('sticky-normal')
      } catch (error) {
        throw new VError(error, `Failed to pin editor`)
      }
    },
    async press(key: string) {
      try {
        await page.waitForIdle()
        await page.keyboard.press(key)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to press key ${key}`)
      }
    },
    async reloadWebViews({ expectViews }: { expectViews: readonly string[] }) {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.ReloadWebViews)
        await page.waitForIdle()
        // TODO need to wait for subframe to be
        // destroyed and recreated. currently it thinks
        // the previous iframe is visible, which it is
        // but then it gets destroyed and doesn't check
        // for the new iframe
        await new Promise((resolve) => {
          setTimeout(resolve, 2000)
        })
        for (const view of expectViews) {
          // TODO check view matching tab
          if (view.endsWith('.svg')) {
            const webView = WebView.create({ expect, page, VError })
            const subFrame = await webView.shouldBeVisible2({
              extensionId: `vscode.media-preview`,
              hasLineOfCodeCounter: false,
            })
            await subFrame.waitForIdle()
            const img = subFrame.locator('img')
            await expect(img).toBeVisible()
            await subFrame.waitForIdle()
          }
        }
      } catch (error) {
        throw new VError(error, `Failed to reload webviews`)
      }
    },
    async removeAllBreakpoints() {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.RemoveAllBreakpoints)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to remove all breakpoints`)
      }
    },
    async removeBreakPoint(lineNumber: number) {
      try {
        await page.waitForIdle()
        const editor = page.locator('.part.editor .editor-instance')
        const lineNumberElement = editor.locator(`.margin-view-overlays > div:nth(${lineNumber - 1})`)
        await expect(lineNumberElement).toBeVisible()
        await page.waitForIdle()
        const contextMenu = ContextMenu.create({ expect, page, VError })
        await contextMenu.open(lineNumberElement)
        await page.waitForIdle()
        await contextMenu.select('Remove Breakpoint')
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed remove breakpoint`)
      }
    },
    async rename(newText: string) {
      try {
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.RenameSymbol)
        const renameInput = page.locator('.rename-input')
        await expect(renameInput).toBeVisible()
        await expect(renameInput).toBeFocused()
        await renameInput.type(newText)
        await page.waitForIdle()
        await page.keyboard.press('Enter')
      } catch (error) {
        throw new VError(error, `Failed to rename text ${newText}`)
      }
    },
    async renameCancel(newText) {
      try {
        const quickPick = QuickPick.create({ expect, page, platform, VError })
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
    async renameWithPreview(newText: string) {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.RenameSymbol)
        const renameInput = page.locator('.rename-input')
        await page.waitForIdle()
        await expect(renameInput).toBeVisible()
        await expect(renameInput).toBeFocused()
        await page.waitForIdle()
        await renameInput.type(newText)
        await page.waitForIdle()
        await page.keyboard.press('Control+Enter')
        await page.waitForIdle()
        const refactorPreview = page.locator('.panel#refactorPreview')
        await expect(refactorPreview).toBeVisible()
        const applyButton = refactorPreview.locator('.monaco-button', { hasText: 'Apply' })
        await expect(applyButton).toBeVisible()
        await page.waitForIdle()
        await applyButton.click()
        await page.waitForIdle()
        await expect(refactorPreview).toBeHidden()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to rename with preview ${newText}`)
      }
    },
    async save(options?: { viaKeyBoard: boolean }) {
      try {
        if (options?.viaKeyBoard) {
          await page.waitForIdle()
          await page.keyboard.press('Control+S')
          await page.waitForIdle()
          const dirtyTabs = page.locator('.tab.dirty')
          await expect(dirtyTabs).toHaveCount(0)
          await page.waitForIdle()
        } else {
          const quickPick = QuickPick.create({ expect, page, platform, VError })
          await quickPick.executeCommand(WellKnownCommands.FileSave)
          await page.waitForIdle()
        }
      } catch (error) {
        throw new VError(error, `Failed to save file`)
      }
    },
    async saveAll() {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.FileSaveAll)
        await page.waitForIdle()
        const dirtyTabs = page.locator('.tab.dirty')
        await expect(dirtyTabs).toHaveCount(0)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to save all files`)
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
    async select(text) {
      try {
        await page.waitForIdle()
        const editor = page.locator('.editor-instance')
        const element = editor.locator('[class^="mtk"]', { hasText: text }).first()
        await expect(element).toBeVisible()
        await page.waitForIdle()
        await expect(element).toHaveText(text)
        await page.waitForIdle()
        await element.dblclick()
        await page.waitForIdle()
        const selection = page.locator('.selected-text')
        await expect(selection).toBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to select ${text}`)
      }
    },
    async selectAll({ viaKeyBoard = false } = {}) {
      try {
        if (viaKeyBoard) {
          await page.waitForIdle()
          await page.keyboard.press('Control+A')
          await page.waitForIdle()
          return
        }
        await page.waitForIdle()
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.SelectAll)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to select all`)
      }
    },
    async selectLine() {
      try {
        await page.waitForIdle()
        await page.keyboard.press('Control+L')
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to select line`)
      }
    },
    async selectRefactor(actionText: string) {
      try {
        await page.waitForIdle()
        const widget = page.locator('.action-widget')
        await expect(widget).toBeVisible()
        await page.waitForIdle()
        const list = widget.locator('.monaco-list')
        await expect(list).toBeVisible()
        await page.waitForIdle()
        await expect(list).toBeFocused()
        await page.waitForIdle()
        const actionItem = widget.locator(`.monaco-list-row[aria-label="${actionText}"]`)
        await expect(actionItem).toBeVisible({ timeout: 10_000 })
        await actionItem.click()
        await page.waitForIdle()
        await expect(widget).toBeHidden()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to select refactor action "${actionText}"`)
      }
    },
    async selectSourceAction(actionText: string) {
      try {
        await page.waitForIdle()
        const sourceAction = page.locator('[aria-label="Action Widget"]')
        await expect(sourceAction).toBeVisible()
        await page.waitForIdle()
        const actionItem = sourceAction
          .locator('.action-item', {
            hasText: actionText,
          })
          .first()
        await expect(actionItem).toBeVisible({ timeout: 10_000 })
        await actionItem.click()
        await page.waitForIdle()
        await expect(sourceAction).toBeHidden()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to select source action "${actionText}"`)
      }
    },
    async setBreakpoint(lineNumber: number) {
      try {
        const editor = page.locator('.part.editor .editor-instance')
        const lineNumberElement = editor.locator(`.margin-view-overlays > div:nth(${lineNumber - 1})`)
        await expect(lineNumberElement).toBeVisible()
        const contextMenu = ContextMenu.create({ expect, page, VError })
        await contextMenu.open(lineNumberElement)
        await contextMenu.select('Add Breakpoint')
      } catch (error) {
        throw new VError(error, `Failed set breakpoint`)
      }
    },
    async setCursor(line: number, column: number) {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.show({
          pressKeyOnce: true,
        })
        await page.waitForIdle()
        await quickPick.type(`:${line}:${column}`)
        await page.waitForIdle()
        if (ideVersion.minor >= 105) {
          await quickPick.select(`Press 'Enter' to go to line ${line} at column ${column}.`)
        } else {
          await quickPick.select(`Go to line ${line} and character ${column}.`)
        }
        await page.waitForIdle()
        // TODO verify that cursor is actually at that position
      } catch (error) {
        throw new VError(error, `Failed to set cursor`)
      }
    },
    async setLanguageMode(languageId) {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.ChangeLanguageMode, {
          pressKeyOnce: true,
          stayVisible: true,
        })
        await page.waitForIdle()
        await quickPick.type(languageId)
        await page.waitForIdle()
        await quickPick.select(languageId)
        await page.waitForIdle()
        // TODO verify that language mode has actually changed
      } catch (error) {
        throw new VError(error, `Failed to change language mode`)
      }
    },
    async setLogpoint(lineNumber, logMessage) {
      try {
        await page.waitForIdle()
        const editor = page.locator('.part.editor .editor-instance')
        const lineNumberElement = editor.locator(`.margin-view-overlays > div:nth(${lineNumber - 1})`)
        await expect(lineNumberElement).toBeVisible()
        const contextMenu = ContextMenu.create({ expect, page, VError })
        await contextMenu.open(lineNumberElement)
        await page.waitForIdle()
        await contextMenu.select('Add Logpoint...')
        await page.waitForIdle()
        const logpointInput = page.locator('.breakpoint-widget .inputContainer .native-edit-context')
        await expect(logpointInput).toBeVisible()
        await page.waitForIdle()
        await expect(logpointInput).toBeVisible()
        await page.waitForIdle()
        await expect(logpointInput).toBeFocused()
        await logpointInput.type(logMessage)
        await page.waitForIdle()
        await page.keyboard.press('Enter')
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to set logpoint`)
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
    async shouldHaveBreadCrumb(text) {
      await page.waitForIdle()
      const breadCrumb = page.locator(`.monaco-breadcrumb-item`, {
        hasText: text,
      })
      await expect(breadCrumb).toBeVisible({ timeout: 10_000 })
      await page.waitForIdle()
    },
    async shouldHaveCodeLens(options?: { timeout?: number }) {
      try {
        await page.waitForIdle()
        const editor = page.locator('.editor-instance')
        await expect(editor).toBeVisible()
        const timeout = options?.timeout || 15_000
        await page.waitForIdle({ timeout: 10_000 })
        const codeLens = page.locator('.codelens-decoration')
        await expect(codeLens).toBeVisible({ timeout })
      } catch (error) {
        throw new VError(error, `Failed to verify code lens is visible`)
      }
    },
    async shouldHaveCodeLensWithVersion(options?: { timeout?: number }) {
      try {
        await page.waitForIdle()
        const editor = page.locator('.editor-instance')
        await expect(editor).toBeVisible()
        const timeout = options?.timeout || 15_000
        await page.waitForIdle({ timeout: 10_000 })
        const codeLens = page.locator('.codelens-decoration')
        await expect(codeLens).toBeVisible({ timeout })
        const codeLensText = await codeLens.textContent()
        const hasVersionInfo =
          codeLensText && (codeLensText.includes('latest') || codeLensText.includes('update') || codeLensText.match(/\d+\.\d+\.\d+/))
        if (!hasVersionInfo) {
          throw new Error(`Expected code lens to show version information, but got: ${codeLensText || 'null'}`)
        }
      } catch (error) {
        throw new VError(error, `Failed to verify code lens shows version information`)
      }
    },
    async shouldHaveCursor(estimate) {
      try {
        await page.waitForIdle()
        const cursor = page.locator('.cursor')
        await expect(cursor).toBeVisible()
        await expect(cursor).toHaveCss('left', estimate)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed cursor assertion`)
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
    async shouldHaveError(fileName) {
      try {
        await page.waitForIdle()
        const tab = page.locator(`[role="tab"][aria-label="${fileName}"]`)
        await expect(tab).toBeVisible()
        const tabLabel = tab.locator('.monaco-icon-label')
        await expect(tabLabel).toBeVisible()
        await expect(tabLabel).toHaveAttribute('aria-label', /1 problem in this file/, {
          timeout: 60_000,
        })
      } catch (error) {
        throw new VError(error, `Failed to wait for editor error`)
      }
    },
    async shouldHaveExceptionWidget() {
      try {
        await page.waitForIdle()
        const exceptionWidget = page.locator('.exception-widget')
        await expect(exceptionWidget).toBeVisible({ timeout: 20_000 })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to find exception widget`)
      }
    },
    async shouldHaveFoldingGutter(enabled: boolean) {
      try {
        await page.waitForIdle()
        const editor = page.locator('.editor-instance')
        await expect(editor).toBeVisible()
        await page.waitForIdle()
        if (enabled) {
          const foldingIcon = page.locator('.codicon-folding-expanded').first()
          await expect(foldingIcon).toBeVisible()
        } else {
          const foldingIcon = page.locator('.codicon-folding-expanded').first()
          await expect(foldingIcon).toBeHidden()
        }
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to verify folding gutter`)
      }
    },
    async shouldHaveFontFamily(fontFamily: string) {
      try {
        await page.waitForIdle()
        const editor = page.locator('.monaco-editor[data-uri$="file.txt"]')
        await expect(editor).toBeVisible()
        await page.waitForIdle()
        const token = page.locator('.mtk1')
        await expect(token).toBeVisible()
        await page.waitForIdle()
        await expect(token).toHaveCss(`font-family`, new RegExp(`^${fontFamily}`))
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to verify font family`)
      }
    },
    async shouldHaveInlineCompletion(expectedText: string) {
      try {
        await page.waitForIdle()
        const editor = page.locator('.editor-instance')
        await expect(editor).toBeVisible()
        await page.waitForIdle()
        const inlineCompletion = editor.locator('.ghost-text, .inline-suggestion-text, [class*="ghost-text"], [class*="inline-suggestion"]')
        await expect(inlineCompletion).toBeVisible({
          timeout: 10_000,
        })
        await page.waitForIdle()
        await expect(inlineCompletion).toHaveText(expectedText, {
          timeout: 1000,
        })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to verify inline completion with text "${expectedText}"`)
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
    async shouldHaveLightBulb() {
      try {
        await page.waitForIdle()
        const spark = page.locator('.codicon.codicon-gutter-lightbulb-aifix-auto-fix')
        await expect(spark).toBeVisible({
          timeout: 20_000,
        })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to verify lightbulb`)
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
    async shouldHaveSelectedCharacters(count: number) {
      try {
        await page.waitForIdle()
        const statusBarItem = page.locator('#status\\.editor\\.selection')
        await expect(statusBarItem).toBeVisible()
        await page.waitForIdle()
        await expect(statusBarItem).toHaveText(new RegExp(`\\(${count} selected\\)`))
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to verify selected character count`)
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
    async shouldHaveSemanticToken(type: string) {
      try {
        await page.waitForIdle()
        const inspectWidget = page.locator('.token-inspect-widget')
        await expect(inspectWidget).toBeVisible()
        await page.waitForIdle()
        const semanticSection = inspectWidget.locator('.tiw-semantic-token-info, [class*="semantic-token"], [class*="semantic"]')
        const count = await semanticSection.count()
        if (count > 0) {
          await expect(semanticSection.first()).toBeVisible({ timeout: 5000 })
          return
        }
        let widgetText = await inspectWidget.textContent()
        if (!widgetText) {
          throw new Error(`Token inspector widget has no text content`)
        }
        const hasSemanticTokenType = widgetText.toLowerCase().includes('semantic token type')
        const hasSemanticInfo = widgetText.toLowerCase().includes('semantic')
        if (!hasSemanticTokenType && !hasSemanticInfo) {
          for (let i = 0; i < 10; i++) {
            await page.waitForIdle()
            widgetText = await inspectWidget.textContent()
            const hasSemantic =
              widgetText && (widgetText.toLowerCase().includes('semantic token type') || widgetText.toLowerCase().includes('semantic'))
            if (hasSemantic) {
              return
            }
          }
          throw new Error(`Semantic token information not found in token inspector. Widget text: ${widgetText}`)
        }
      } catch (error) {
        throw new VError(error, `Failed to verify semantic token ${type}`)
      }
    },
    async shouldHaveSpark() {
      try {
        await page.waitForIdle()
        const spark = page.locator('.codicon.codicon-gutter-lightbulb-sparkle-filled')
        await expect(spark).toBeVisible({
          timeout: 20_000,
        })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to verify spark`)
      }
    },
    async shouldHaveSquigglyError() {
      try {
        await page.waitForIdle()
        const squiggle = page.locator('.squiggly-error')
        await expect(squiggle).toBeVisible({
          timeout: initialDiagnosticTimeout,
        })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to verify squiggly error`)
      }
    },
    async shouldHaveText(text: string, fileName?: string, groupId?: number) {
      try {
        await page.waitForIdle()
        let editor
        if (fileName) {
          const baseName = basename(fileName)
          if (groupId) {
            editor = page.locator(`.editor-instance[aria-label="${baseName}, Editor Group ${groupId}"]`)
          } else {
            editor = page.locator(`.editor-instance[aria-label^="${baseName}"]`)
          }
        } else {
          editor = page.locator(`.editor-instance`)
        }
        await expect(editor).toBeVisible()
        await page.waitForIdle()
        const editorLines = editor.locator('.view-lines')
        await expect(editorLines).toBeVisible()
        await page.waitForIdle()
        const actualText = text.replaceAll(Character.NewLine, Character.EmptyString).replaceAll(Character.Space, Character.NonBreakingSpace)
        await expect(editorLines).toHaveText(actualText, {
          timeout: 3000,
        })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to verify editor text ${text}`)
      }
    },
    async shouldHaveFile(fileName: string) {
      try {
        await page.waitForIdle()
        const baseName = basename(fileName)
        const editor = page.locator(`.editor-instance[aria-label^="${baseName}"]`)
        await expect(editor).toBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to verify editor`)
      }
    },
    async shouldHaveToken(text, color) {
      await page.waitForIdle()
      const token = page.locator(`[class^="mtk"]`, {
        hasText: text,
      })
      await expect(token).toHaveCss('color', color)
      await page.waitForIdle()
    },
    async shouldNotHaveSemanticToken(type: string) {
      try {
        await page.waitForIdle()
        const inspectWidget = page.locator('.token-inspect-widget')
        await expect(inspectWidget).toBeVisible()
        await page.waitForIdle()
        const widgetText = await inspectWidget.textContent()
        if (widgetText) {
          const hasSemanticTokenType = widgetText.toLowerCase().includes('semantic token type')
          if (hasSemanticTokenType) {
            throw new Error(`Semantic token information found but should not be present. Widget text: ${widgetText}`)
          }
        }
      } catch (error) {
        throw new VError(error, `Failed to verify semantic token ${type} is not present`)
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
    async showBreadCrumbs() {
      try {
        await page.waitForIdle()
        const breadcrumbs = page.locator('.monaco-breadcrumbs')
        const count = await breadcrumbs.count()
        if (count > 0) {
          return
        }
        await expect(breadcrumbs).toBeHidden()
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.ViewToggleBreadCrumbs)
        await expect(breadcrumbs).toBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to show breadcrumbs`)
      }
    },
    async showColorPicker() {
      try {
        await page.waitForIdle()
        const colorPicker = page.locator('.standalone-colorpicker-body')
        await expect(colorPicker).toBeHidden()
        await page.waitForIdle()
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.ShowOrFocusStandaloneColorPicker, { pressKeyOnce: true })
        await page.waitForIdle()
        await expect(colorPicker).toBeVisible()
        await page.waitForIdle()
        const insertButton = colorPicker.locator('.insert-button')
        await expect(insertButton).toBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to show color picker`)
      }
    },
    async showDebugHover({ expectedTitle }) {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.DebugShowHover)
        const debugHover = page.locator('.debug-hover-widget')
        await expect(debugHover).toBeVisible()
        const debugHoverTitle = debugHover.locator('.title')
        await expect(debugHoverTitle).toHaveText(expectedTitle)
      } catch (error) {
        throw new VError(error, `Failed to open debug hover`)
      }
    },
    async showMinimap() {
      try {
        const minimap = page.locator('.minimap')
        await expect(minimap).toBeHidden()
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.ViewToggleMinimap)
        await expect(minimap).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to show minimap`)
      }
    },
    async showRefactor() {
      try {
        await page.waitForIdle()
        const refactorWidget = page.locator('[aria-label="Action Widget"]')
        await expect(refactorWidget).toBeHidden()
        await page.waitForIdle()
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.Refactor)
        await page.waitForIdle()
        await expect(refactorWidget).toBeVisible({
          timeout: 30_000,
        })
        await page.waitForIdle()
        await expect(refactorWidget).toHaveText(/Modify/)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to show refactor action`)
      }
    },
    async showSourceAction() {
      try {
        await page.waitForIdle()
        const sourceAction = page.locator('.context-view [aria-label="Action Widget"]')
        await expect(sourceAction).toBeHidden()
        await page.waitForIdle()
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.SourceAction)
        await page.waitForIdle()
        await expect(sourceAction).toBeVisible()
        await page.waitForIdle()
        await expect(sourceAction).toHaveText(/Source Action/)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to show source action`)
      }
    },
    async showSourceActionEmpty() {
      try {
        await page.waitForIdle()
        const overlayMessage = page.locator('.monaco-editor-overlaymessage')
        await expect(overlayMessage).toBeHidden()
        await page.waitForIdle()
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.SourceAction)
        await page.waitForIdle()
        await expect(overlayMessage).toBeVisible()
        await expect(overlayMessage).toHaveText('No source actions available')
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to show empty source action`)
      }
    },
    async split(command: string, { groupCount = undefined } = {}) {
      try {
        // TODO count editor groups
        const editors = page.locator('.editor-instance')
        const currentCount = await editors.count()
        if (currentCount === 0 && groupCount !== 0) {
          throw new Error('no open editor found')
        }
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.executeCommand(command)
        if (groupCount === 0) {
          // TODO maybe check that new group was created
          // ignore
        } else {
          await expect(editors).toHaveCount(currentCount + 1)
        }
      } catch (error) {
        throw new VError(error, `Failed to split editor`)
      }
    },
    async splitDown() {
      return this.split(WellKnownCommands.ViewSplitEditorDown)
    },
    async splitLeft() {
      return this.split(WellKnownCommands.ViewSplitEditorLeft)
    },
    async splitRight({ groupCount = undefined } = {}) {
      return this.split(WellKnownCommands.ViewSplitEditorRight, { groupCount })
    },
    async splitUp() {
      return this.split(WellKnownCommands.ViewSplitEditorUp)
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
    async threeColumnsLayout() {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.ThreeColumnLayout)
        await page.waitForIdle()
        const main = page.locator('[role="main"]')
        const groups = main.locator('.editor-group-container')
        await expect(groups).toHaveCount(3)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to create three columns layout`)
      }
    },
    async toggleBreakpoint() {
      try {
        const glyphMarginWidgets = page.locator('.glyph-margin-widgets')
        await expect(glyphMarginWidgets).toBeVisible()
        const breakpoints = glyphMarginWidgets.locator('.codicon-debug-breakpoint')
        const breakpointCount = await breakpoints.count()
        const newBreakpointCount = breakpointCount === 0 ? 1 : 0
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.ToggleBreakpoint)
        await page.waitForIdle()
        await expect(breakpoints).toHaveCount(newBreakpointCount)
      } catch (error) {
        throw new VError(error, `Failed to toggle breakpoint`)
      }
    },
    async toggleScreenReaderAccessibilityMode() {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.ToggleScreenReaderAccessibilityMode)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to toggle screen reader accessibility mode`)
      }
    },
    async type(text: string) {
      try {
        await page.waitForIdle()
        await page.keyboard.type(text)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to type ${text}`)
      }
    },
    async undo({ viaKeyBoard = false } = {}) {
      try {
        if (viaKeyBoard) {
          await page.waitForIdle()
          await page.keyboard.press('Ctrl+Z')
          await page.waitForIdle()
          return
        }
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.Undo)
      } catch (error) {
        throw new VError(error, `Failed to undo`)
      }
    },
    async unfold() {
      try {
        await page.waitForIdle()
        const inlineFolded = page.locator('.inline-folded')
        await expect(inlineFolded).toBeVisible()
        await page.waitForIdle()
        const collapsedIcon = page.locator('.codicon-folding-collapsed').first()
        await expect(collapsedIcon).toBeVisible()
        await page.waitForIdle()
        await page.waitForIdle()
        await collapsedIcon.click()
        await page.waitForIdle()
        await expect(inlineFolded).toBeHidden()
        await page.waitForIdle()
        await expect(collapsedIcon).toBeHidden()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to unfold editor`)
      }
    },
    async unfoldAll() {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.executeCommand('Unfold All')
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to unfold all`)
      }
    },
    async unpin() {
      try {
        const tabsContainer = page.locator('.tabs-and-actions-container')
        await expect(tabsContainer).toBeVisible()
        const activeTab = tabsContainer.locator('.tab.active')
        await expect(activeTab).toHaveClass('sticky-normal')
        const quickPick = QuickPick.create({ expect, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.UnPinEditor)
        await page.waitForIdle()
        await expect(activeTab).notToHaveClass('sticky-normal')
      } catch (error) {
        throw new VError(error, `Failed to unpin editor`)
      }
    },
    async waitForBinaryReady() {
      // const placeholder = page.locator('.monaco-editor-pane-placeholder')
      // await expect(placeholder).toBeVisible()
      await page.waitForIdle()
      const quickPick = QuickPick.create({ expect, page, platform, VError })
      await quickPick.executeCommand(WellKnownCommands.ReopenEditorWith, {
        pressKeyOnce: true,
        stayVisible: true,
      })
      await page.waitForIdle()
      await quickPick.type('hex')
      await page.waitForIdle()
      await quickPick.select('Hex Editor') // TODO make this configurable
      await page.waitForIdle()
      const webView = WebView.create({ expect, page, VError })
      await webView.shouldBeVisible2({
        extensionId: `ms-vscode.hexeditor`,
        hasLineOfCodeCounter: false,
      })
    },
    async waitForImageReady() {
      const webView = WebView.create({ expect, page, VError })
      const subFrame = await webView.shouldBeVisible2({
        extensionId: `vscode.media-preview`,
        hasLineOfCodeCounter: false,
      })
      await subFrame.waitForIdle()
      const img = subFrame.locator('img')
      await expect(img).toBeVisible()
      await subFrame.waitForIdle()
    },
    async waitForNoteBookReady() {
      const notebookEditor = page.locator('.notebook-editor')
      const list = notebookEditor.locator('.monaco-list')
      await page.waitForIdle()
      await expect(list).toBeFocused()
    },
    async waitforTextFileReady(fileName: string) {
      await page.waitForIdle()
      const baseName = basename(fileName)
      const editor = page.locator(`.editor-instance[aria-label^="${baseName}"]`)
      await expect(editor).toBeVisible()
      await page.waitForIdle()

      if (ideVersion && ideVersion.minor <= 100) {
        const editorInput = editor.locator('.inputarea')
        await expect(editorInput).toBeFocused()
        await page.waitForIdle()
      } else {
        const editContext = editor.locator('.native-edit-context')
        await expect(editContext).toBeFocused()
        await page.waitForIdle()
      }
      await page.waitForIdle()
    },
    async waitForVideoReady(hasError: boolean) {
      const webView = WebView.create({ expect, page, VError })
      const subFrame = await webView.shouldBeVisible2({
        extensionId: `vscode.media-preview`,
        hasLineOfCodeCounter: false,
      })
      await subFrame.waitForIdle()
      if (hasError) {
        const error = subFrame.locator('.loading-error')
        await expect(error).toBeVisible()
      } else {
        const video = subFrame.locator('video')
        await expect(video).toBeVisible()
      }
      await subFrame.waitForIdle()
    },
    async waitForWarning() {
      const pane = page.locator('.monaco-editor-pane-placeholder')
      await expect(pane).toBeVisible()
      const warningIcon = pane.locator('.codicon.codicon-warning')
      await expect(warningIcon).toBeVisible()
    },
  }
}
