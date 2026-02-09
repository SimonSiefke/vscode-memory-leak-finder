import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as Electron from '../Electron/Electron.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as RunningExtensions from '../RunningExtensions/RunningExtensions.ts'
import * as Editor from '../Editor/Editor.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

const performSelectionBugWorkaround = async (): Promise<void> => {
  await new Promise((r) => {
    setTimeout(r, 7000)
  })
}

export const create = ({ electronApp, expect, ideVersion, page, platform, VError }: CreateParams) => {
  return {
    isFirst: true,
    async addAllProblemsAsContext() {
      try {
        await this.addContext('Problems...', 'All Problems', 'All Problems')
      } catch (error) {
        throw new VError(error, `Failed to set chat context`)
      }
    },
    async addContext(initialPrompt: string, secondPrompt: string, confirmText: string) {
      try {
        const addContextButton = page.locator('[role="button"][aria-label^="Add Context"]')
        await addContextButton.click()
        await page.waitForIdle()

        const quickPick = QuickPick.create({ electronApp, expect, ideVersion, page, platform, VError })
        await quickPick.select(initialPrompt, true)
        await quickPick.select(secondPrompt)
        await page.waitForIdle()

        const contextLabel = page.locator(`[aria-label="Attached context, ${confirmText}"]`)
        await expect(contextLabel).toBeVisible()
        // TODO navigate to first quickpick
        // TODO navigate to second quickpick
        // TODO verify that context has been applied
      } catch (error) {
        throw new VError(error, `Failed to set chat context`)
      }
    },
    async attachImage(file: string) {
      try {
        const addContextButton = page.locator('[role="button"][aria-label^="Add Context"]')
        await addContextButton.click()
        await page.waitForIdle()
        const quickPick = QuickPick.create({ electronApp, expect, ideVersion, page, platform, VError })
        await quickPick.select('Files & Folders...', true)
        await quickPick.type(file)
        await quickPick.select(file)
        await page.waitForIdle()
        const attachedContext = page.locator('.chat-attached-context')
        const attachedImage = attachedContext.locator(`[aria-label$="${file}"]`)
        await expect(attachedImage).toBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to attach image`)
      }
    },
    async clearAll() {
      try {
        const electron = Electron.create({ electronApp, expect, ideVersion, page, platform, VError })
        await using _mockDialog = await electron.mockDialog({
          response: 1,
        })
        const quickPick = QuickPick.create({ electronApp, expect, ideVersion, page, platform, VError })
        if (ideVersion && typeof ideVersion !== 'string' && ideVersion.minor !== undefined && ideVersion.minor >= 109) {
          await quickPick.executeCommand(WellKnownCommands.DeleteAllWorkspaceChatSessions2)
        } else
          if (ideVersion && typeof ideVersion !== 'string' && ideVersion.minor !== undefined && ideVersion.minor >= 108) {
            await quickPick.executeCommand(WellKnownCommands.DeleteAllWorkspaceChatSessions)
          } else {
            await quickPick.executeCommand(WellKnownCommands.DeleteAllWorkspaceChatSessions)
          }
        await page.waitForIdle()

        const requestOne = page.locator('.monaco-list-row.request').first()
        await expect(requestOne).toBeHidden({ timeout: 15_000 })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to clear chat context`)
      }
    },
    async clearContext(contextName: string) {
      try {
        const contextLabel = page.locator(`[aria-label="Attached context, ${contextName}"]`)
        await expect(contextLabel).toBeVisible()
        const removeButton = contextLabel.locator('[role="button"][aria-label^="Remove from context"]')
        await expect(removeButton).toBeVisible()
        await removeButton.click()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to clear chat context`)
      }
    },
    async closeFinishSetup() {
      try {
        const hover = page.locator('.context-view .monaco-hover[role="tooltip"]')
        await expect(hover).toBeVisible()
        const statusBarItem = page.locator('#chat\\.statusBarEntry')
        await expect(statusBarItem).toBeVisible()
        await page.waitForIdle()
        await page.keyboard.press('Escape')
        await page.waitForIdle()
        await expect(hover).toBeHidden()
      } catch (error) {
        throw new VError(error, `Failed to close finish setup`)
      }
    },
    async moveToEditor() {
      try {
        const quickPick = QuickPick.create({ electronApp, expect, ideVersion, page, platform, VError })
        await quickPick.executeCommand('Chat: Move Chat into Editor Area')
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to move chat`)
      }
    },
    async moveToSideBar() {
      try {
        const quickPick = QuickPick.create({ electronApp, expect, ideVersion, page, platform, VError })
        await quickPick.executeCommand('Chat: Move Chat into Side Bar')
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to move chat`)
      }
    },
    async open() {
      try {
        const r = RunningExtensions.create({
          electronApp,
          expect,
          ideVersion,
          page,
          platform,
          VError,
        })
        await r.showAndWaitFor('GitHub Copilot Chat')
        const editor = Editor.create({ page, electronApp, expect, ideVersion, platform, VError })
        await editor.closeAll()
        const quickPick = QuickPick.create({ electronApp, expect, ideVersion, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.NewChatEditor)
        await page.waitForIdle()
        const chatView = page.locator('.interactive-session')
        await expect(chatView).toBeVisible()
        await page.waitForIdle()
        const editArea = chatView.locator('.monaco-editor[data-uri^="chatSessionInput"]')
        await expect(editArea).toBeVisible()
        await page.waitForIdle()
        const editContext = editArea.locator('.native-edit-context')
        await expect(editContext).toBeVisible()
        await page.waitForIdle()
        await expect(editContext).toBeFocused()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to open chat editor`)
      }
    },
    async openFinishSetup() {
      try {
        const statusBarItem = page.locator('#chat\\.statusBarEntry .statusbar-item-label')
        await expect(statusBarItem).toBeVisible()
        await statusBarItem.click()
        await page.waitForIdle()
        const hover = page.locator('.context-view .monaco-hover[role="tooltip"]')
        await expect(hover).toBeVisible()
        await expect(hover).toBeFocused()
      } catch (error) {
        throw new VError(error, `Failed to open finish setup`)
      }
    },
    async getAvailableModelNames() {
      const modelPickerItem = page.locator('.chat-input-picker-item').nth(2)
      await expect(modelPickerItem).toBeVisible()
      const modelLocator = modelPickerItem.locator('.chat-input-picker-label')
      await expect(modelLocator).toBeVisible()
      await modelLocator.click()
      await page.waitForIdle()
      const contextView = page.locator('.context-view')
      const list = contextView.locator('.monaco-list')
      await expect(list).toBeVisible()
      await page.waitForIdle()

      const { labels } = await this.collectModelListItems(contextView, list)

      // Close the picker
      await page.keyboard.press('Escape')
      await page.waitForIdle()
      return labels
    },
    async collectModelListItems(contextView: any, list: any, targetModelName?: string): Promise<{ labels: string[]; clicked: boolean }> {
      // Collect all items by dragging the scrollbar down through the virtualized list.
      // This is needed because Monaco virtualizes list rows and ArrowDown doesn't
      // reliably scroll items into the DOM.
      const scrollbar = contextView.locator('.scrollbar.vertical').first()
      await scrollbar.hover()
      await page.waitForIdle()

      const scrollbarSlider = scrollbar.locator('.slider')
      await expect(scrollbarSlider).toBeVisible()
      await page.waitForIdle()

      // Get the scrollbar track height and slider dimensions for calculating drag distance
      const scrollbarBox = await scrollbar.boundingBox()
      const sliderBox = await scrollbarSlider.boundingBox()
      if (!scrollbarBox || !sliderBox) {
        throw new Error('Unable to get scrollbar bounding box')
      }

      const trackHeight = scrollbarBox.height
      const sliderHeight = sliderBox.height
      const maxDragDistance = trackHeight - sliderHeight

      const seenLabels: string[] = []

      // Helper to collect visible rows and optionally click the target
      const collectAndMaybeClick = async (): Promise<boolean> => {
        const rows = list.locator('.monaco-list-row')
        const count = await rows.count()
        for (let i = 0; i < count; i++) {
          const row = rows.nth(i)
          const label = await row.getAttribute('aria-label')
          if (label && !seenLabels.includes(label)) {
            seenLabels.push(label)
          }
          if (targetModelName && label && label.startsWith(targetModelName)) {
            await row.click()
            return true
          }
        }
        return false
      }

      // Collect items visible at the top
      const clickedAtTop = await collectAndMaybeClick()
      if (clickedAtTop) {
        return { labels: seenLabels, clicked: true }
      }

      // Drag the scrollbar down in increments to reveal all items
      const steps = 10
      const stepSize = maxDragDistance / steps
      for (let step = 1; step <= steps; step++) {
        const currentSliderBox = await scrollbarSlider.boundingBox()
        if (!currentSliderBox) {
          break
        }
        const sliderCenterX = currentSliderBox.x + currentSliderBox.width / 2
        const sliderCenterY = currentSliderBox.y + currentSliderBox.height / 2
        const targetY = scrollbarBox.y + stepSize * step + sliderHeight / 2

        await page.mouse.move(sliderCenterX, sliderCenterY)
        await page.mouse.down()
        await page.waitForIdle()
        await page.mouse.move(sliderCenterX, targetY)
        await page.waitForIdle()
        await page.mouse.up()
        await page.waitForIdle()

        const clicked = await collectAndMaybeClick()
        if (clicked) {
          return { labels: seenLabels, clicked: true }
        }
      }

      return { labels: seenLabels, clicked: false }
    },
    async selectModel(modelName: string, retry = true) {
      try {
        await page.waitForIdle()
        const modelPickerItem = page.locator('.chat-input-picker-item').nth(2)
        await expect(modelPickerItem).toBeVisible()
        await page.waitForIdle()
        const modelLocator = modelPickerItem.locator('.chat-input-picker-label')
        await expect(modelLocator).toBeVisible()
        await page.waitForIdle()
        if (this.isFirst) {
          this.isFirst = false
          await performSelectionBugWorkaround()
        }
        const modelText = await modelLocator.textContent()
        await page.waitForIdle()
        if (modelText === modelName) {
          return
        }

        // OpenRouter models may load asynchronously after built-in models.
        // Retry the full scan several times with delays to give them time to appear.
        const maxRetries = 5
        let found = false
        let seenLabels: string[] = []
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          await modelLocator.click()
          await page.waitForIdle()
          const contextView = page.locator('.context-view')
          const list = contextView.locator('.monaco-list')
          await expect(list).toBeVisible()
          await page.waitForIdle()

          // Wait progressively longer for external models to load
          if (attempt > 0) {
            await new Promise((r) => setTimeout(r, 3000 * attempt))
            await page.waitForIdle()
          }

          // Scroll through the list by dragging the scrollbar, collect items,
          // and click the target model immediately when found (while still in view)
          const result = await this.collectModelListItems(contextView, list, modelName)
          seenLabels = result.labels
          if (result.clicked) {
            found = true
            break
          }

          // Close the picker before retrying
          await page.keyboard.press('Escape')
          await page.waitForIdle()
        }
        if (!found) {
          const availableModels = seenLabels.length > 0
            ? `Available models: ${seenLabels.join(', ')}`
            : 'No models found in the picker'
          throw new Error(`Could not find model "${modelName}" in the model picker. ${availableModels}`)
        }
        await page.waitForIdle()
        await expect(modelLocator).toHaveText(modelName, { timeout: 5_000 })

        // Verify the selection persists
        // await performSelectionBugWorkaround()
        const modelText2 = await modelLocator.textContent()
        if (modelText2 !== modelName) {
          if (retry) {
            await this.selectModel(modelName, false)
          } else {
            throw new Error(`Model switch did not persist, expected ${modelName} but got ${modelText2}`)
          }
        }
      } catch (error) {
        throw new VError(error, `Failed to select model ${modelName}`)
      }
    },
    async sendMessage({
      expectedResponse,
      image = '',
      message,
      model,
      toolInvocations = [],
      validateRequest = {
        exists: [],
      },
      verify = false,
      viewLinesText = '',
    }: {
      expectedResponse?: string
      message: string
      validateRequest?: { exists: readonly unknown[] }
      verify?: boolean
      viewLinesText?: string
      image?: string
      toolInvocations?: readonly any[]
      model?: string
    }) {
      try {
        await page.waitForIdle()
        const chatView = page.locator('.interactive-session')
        await expect(chatView).toBeVisible()
        await page.waitForIdle()
        if (model) {
          await this.selectModel(model)
        }
        const editArea = chatView.locator('.monaco-editor[data-uri^="chatSessionInput"]')
        await expect(editArea).toBeVisible()
        await page.waitForIdle()
        if (image) {
          await this.attachImage(image)
        }
        const editContext = editArea.locator('.native-edit-context')
        await expect(editContext).toBeVisible()
        await page.waitForIdle()
        await editContext.focus()
        await page.waitForIdle()
        await expect(editContext).toBeFocused()
        await page.waitForIdle()
        await editContext.type(message)
        await page.waitForIdle()
        const lines = editArea.locator('.view-lines')
        await expect(lines).toBeVisible()
        await page.waitForIdle()
        const nonBreakingSpace = String.fromCharCode(160)
        const adjustedMessage = message.replaceAll('\n', '').replaceAll(' ', nonBreakingSpace)
        await expect(lines).toHaveText(viewLinesText || adjustedMessage)
        await page.waitForIdle()
        const interactiveInput = page.locator('.interactive-input-and-side-toolbar')
        await expect(interactiveInput).toBeVisible()
        await page.waitForIdle()
        const sendButton = interactiveInput.locator('.action-item .action-label:not(.disabled)[aria-label^="Send"]')
        await expect(sendButton).toBeVisible()
        await page.waitForIdle()
        await sendButton.focus()
        await page.waitForIdle()
        await expect(sendButton).toBeFocused()
        await page.waitForIdle()
        if (this.isFirst) {
          this.isFirst = false
          // TODO get rid of timeout
          await new Promise((r) => {
            setTimeout(r, 1000)
          })
        }
        const requests = chatView.locator('.monaco-list-row.request')
        const count = await requests.count()
        await page.waitForIdle()
        await sendButton.click()
        await page.waitForIdle()
        await expect(lines).toHaveText('')
        await page.waitForIdle()
        await expect(requests).toHaveCount(count + 1)
        const last = requests.nth(count)
        if (validateRequest && validateRequest.exists && validateRequest.exists.length > 0) {
          const ariaLabel = await last.getAttribute('aria-label')
          if (ariaLabel !== message) {
            throw new Error(`unexpected aria label: ${ariaLabel}`)
          }
        }

        if (validateRequest && validateRequest.exists && validateRequest.exists.length > 0) {
          const requestMessage = last
          await expect(requestMessage).toBeVisible()
          for (const selector of validateRequest.exists) {
            const locator = requestMessage.locator(selector)
            await expect(locator).toBeVisible()
          }
        }

        if (verify) {
          const row = last
          await expect(row).toBeVisible()
          await page.waitForIdle()
          const response = chatView.locator('.monaco-list-row .chat-most-recent-response')
          const confirmation = chatView.locator('.chat-confirmation-widget-container .chat-buttons button')
          const progress = chatView.locator('.rendered-markdown.progress-step')
          // Auto-approve any confirmation dialogs (e.g. fetch web page) while waiting for response
          const deadline = Date.now() + 120_000
          while (Date.now() < deadline) {
            await page.waitForIdle()
            const confirmCount = await confirmation.count()
            if (confirmCount > 0) {
              const btn = confirmation.first()
              const isVisible = await btn.isVisible()
              if (isVisible) {
                await btn.click()
                await page.waitForIdle()
                continue
              }
            }
            const progressVisible = await progress.isVisible()
            const responseVisible = await response.isVisible()
            const hasConfirmation = confirmCount > 0
            if (responseVisible && !progressVisible && !hasConfirmation) {
              break
            }
            await new Promise((r) => setTimeout(r, 500))
          }
          await expect(response).toBeVisible({ timeout: 30_000 })
          await page.waitForIdle()
        }

        if (toolInvocations && toolInvocations.length > 0) {
          const element = chatView.locator('.chat-tool-invocation-part')
          await expect(element).toBeVisible({ timeout: 120_000 })
          await page.waitForIdle()
          for (const toolInvocation of toolInvocations) {
            if (toolInvocation.type === 'website') {
              const link = element.locator(`a:has-text("${toolInvocation.url}")`)
              await expect(link).toBeVisible({
                timeout: 2000,
              })
              await page.waitForIdle()
              const confirmbutton = chatView.locator('.chat-confirmation-widget-buttons [aria-label^="Allow"]')
              const count = await confirmbutton.count()
              if (count > 0) {
                await confirmbutton.first().click()
                await page.waitForIdle()
                const approveToolResult = chatView.locator('[aria-label^="Chat Confirmation Dialog Approve Tool Result "]')
                await expect(approveToolResult).toBeVisible({ timeout: 20_000 })
                await page.waitForIdle()
                const allowButton = chatView.locator('.chat-confirmation-widget-buttons [aria-label="Allow"]')
                await expect(allowButton).toBeVisible()
                await page.waitForIdle()
                await allowButton.click()
                await page.waitForIdle()
                const response = chatView.locator('.monaco-list-row .chat-most-recent-response')
                await expect(response).toBeVisible({ timeout: 20_000 })
                await page.waitForIdle()
                const retryButton = chatView.locator('.chat-footer-toolbar [aria-label="Retry"]')
                await expect(retryButton).toBeVisible({ timeout: 20_000 })
                await page.waitForIdle()
              }
            }
            else {
              const block = element.locator('.chat-terminal-command-block')
              await expect(block).toBeVisible({
                timeout: 2000,
              })
              await expect(block).toHaveText(` ${toolInvocation.content}`)
              await page.waitForIdle()
            }
          }
        }


        if (expectedResponse) {
          const requestMessage = last
          await expect(requestMessage).toBeVisible()
          await page.waitForIdle()
          await expect(lines).toHaveText('')
          const row = chatView.locator(`.monaco-list-row[aria-label="${message}"]`)
          await expect(row).toBeVisible()
          await page.waitForIdle()
          const response = chatView.locator('.monaco-list-row .chat-most-recent-response')
          await expect(response).toBeVisible({ timeout: 60_000 })
          await page.waitForIdle()
          const progress = chatView.locator('.rendered-markdown.progress-step')
          await expect(progress).toBeHidden({ timeout: 45_000 })
          await page.waitForIdle()
          await expect(response).toBeVisible({ timeout: 30_000 })
          await page.waitForIdle()
          const responseMessage = chatView.locator('.monaco-list-row[data-index="1"]')
          await expect(responseMessage).toBeVisible()
          await page.waitForIdle()
          await expect(responseMessage).toHaveAttribute('aria-label', new RegExp(`^${expectedResponse}`), { timeout: 120_000 })
        }
      } catch (error) {
        throw new VError(error, `Failed to send chat message`)
      }
    },
    async setMode(modeLabel: string) {
      try {
        if (ideVersion && typeof ideVersion !== 'string' && ideVersion.minor !== undefined && ideVersion.minor < 107) {
          await this.setModeLegacy(modeLabel)
          return
        }
        const chatView = page.locator('.interactive-session')
        const setModeButton = chatView.locator('.chat-modelPicker-item .action-label')
        await expect(setModeButton).toBeVisible()
        await setModeButton.click()
        await page.waitForIdle()
        const actionWidget = page.locator('.monaco-list[aria-label="Action Widget"]')
        await expect(actionWidget).toBeVisible()
        await page.waitForIdle()
        await expect(actionWidget).toBeFocused()
        await page.waitForIdle()
        const option = actionWidget.locator(`.monaco-list-row.action[aria-label="${modeLabel}"]`)
        await expect(option).toBeVisible()
        await option.click()
        await page.waitForIdle()
        await expect(actionWidget).toBeHidden()
        const modeLabelElement = chatView.locator('.chat-model-label')
        await expect(modeLabelElement).toHaveText(modeLabel)
      } catch (error) {
        throw new VError(error, `Failed to set chat mode to ${modeLabel}`)
      }
    },
    async setModeLegacy(modeLabel: string) {
      try {
        const chatView = page.locator('.interactive-session')
        const setModeButton = chatView.locator('[aria-label^="Set Mode"]')
        await expect(setModeButton).toBeVisible()
        await setModeButton.click()
        await page.waitForIdle()
        const actionWidget = page.locator('.monaco-list[aria-label="Action Widget"]')
        await expect(actionWidget).toBeVisible()
        await expect(actionWidget).toBeFocused()
        const option = actionWidget.locator(`.monaco-list-row.action[aria-label="${modeLabel}"]`)
        await expect(option).toBeVisible()
        await option.click()
        await page.waitForIdle()
        await expect(actionWidget).toBeHidden()
        const modeLabelElement = chatView.locator('.chat-model-label')
        await expect(modeLabelElement).toHaveText(modeLabel)
      } catch (error) {
        throw new VError(error, `Failed to set chat mode to ${modeLabel}`)
      }
    },
    async clickAccessButton(buttonText: string = 'Allow') {
      try {
        const chatView = page.locator('.interactive-session')
        const confirmation = chatView.locator('.chat-confirmation-widget-container')
        await expect(confirmation).toBeVisible({ timeout: 120_000 })
        await page.waitForIdle()
        const accessButton = confirmation.locator(`.chat-buttons button:has-text("${buttonText}")`)
        await expect(accessButton.first()).toBeVisible({ timeout: 10_000 })
        await accessButton.first().click()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to click access button with text "${buttonText}"`)
      }
    },
  }
}
