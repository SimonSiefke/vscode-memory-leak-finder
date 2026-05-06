import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as Electron from '../Electron/Electron.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

const getChatPickerItem = (chatView: any, index: number) => {
  return chatView.locator('.chat-modelPicker-item, .chat-input-picker-item').nth(index)
}

const getChatPickerLabel = (pickerItem: any) => {
  return pickerItem.locator('.chat-model-label, .action-label, [role="button"], button').first()
}

const escapeForRegExp = (value: string) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export const create = ({ electronApp, expect, ideVersion, page, platform, VError }: CreateParams) => {
  const getLastRenderedLocator = async (locator: any, timeout: number) => {
    await expect(locator.first()).toBeVisible({ timeout })
    const count = await locator.count()
    if (count < 1) {
      throw new Error('Expected at least one rendered chat row')
    }
    return locator.nth(count - 1)
  }

  const getLatestRequestMessage = async (chatView: any) => {
    const requests = chatView.locator('.monaco-list-row.request')
    return getLastRenderedLocator(requests, 90_000)
  }

  const getLatestResponseContent = async (chatView: any) => {
    const responses = chatView.locator('.monaco-list-row .chat-most-recent-response')
    return getLastRenderedLocator(responses, 60_000)
  }

  const waitForLatestExchange = async (chatView: any, message: string) => {
    const requestMessage = await getLatestRequestMessage(chatView)
    await expect(requestMessage).toBeVisible({ timeout: 90_000 })
    await expect(requestMessage).toHaveAttribute('aria-label', new RegExp(`^${escapeForRegExp(message)}$`), { timeout: 90_000 })
    await page.waitForIdle()
    const response = await getLatestResponseContent(chatView)
    await expect(response).toBeVisible({ timeout: 60_000 })
    await page.waitForIdle()
    const progress = chatView.locator('.rendered-markdown.progress-step')
    await expect(progress).toBeHidden({ timeout: 45_000 })
    await page.waitForIdle()
    await expect(response).toBeVisible({ timeout: 30_000 })
    await page.waitForIdle()
    const requestBox = await requestMessage.boundingBox()
    const responseBox = await response.boundingBox()
    if (!requestBox || !responseBox) {
      throw new Error('Failed to determine latest chat exchange positions')
    }
    if (responseBox.y < requestBox.y) {
      throw new Error(`Expected latest response to be displayed below the request "${message}"`)
    }
    return {
      requestMessage,
      response,
    }
  }

  return {
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
        if (ideVersion && typeof ideVersion !== 'string' && ideVersion.minor !== undefined && ideVersion.minor >= 118) {
          await this.sendMessage({
            message: '/clear',
          })
        } else if (ideVersion && typeof ideVersion !== 'string' && ideVersion.minor !== undefined && ideVersion.minor >= 108) {
          await quickPick.executeCommand(WellKnownCommands.DeleteAllWorkspaceChatSessions)
        } else {
          await quickPick.executeCommand(WellKnownCommands.DeleteAllWorkspaceChatSessions)
        }
        await page.waitForIdle()
        const requestOne = page.locator('.monaco-list-row.request').first()
        await expect(requestOne).toBeHidden({ timeout: 10_000 })
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
    async shouldHaveAttachedContextHoverText(text: string) {
      try {
        const contextLabel = page.locator('.chat-attached-context [aria-label^="Attached context,"]').first()
        await expect(contextLabel).toBeVisible()
        await contextLabel.hover()
        await page.waitForIdle()
        const hover = page.locator('.context-view .monaco-hover[role="tooltip"]')
        await expect(hover).toBeVisible()
        await expect(hover).toContainText(text)
      } catch (error) {
        throw new VError(error, `Failed to verify attached chat context hover text ${text}`)
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
    async scrollToBottom() {
      try {
        await page.waitForIdle()
        const chatView = page.locator('.interactive-session')
        await expect(chatView).toBeVisible()
        const scrollContainer = chatView.locator('.monaco-list .monaco-scrollable-element').first()
        await expect(scrollContainer).toBeVisible()
        await scrollContainer.evaluate((element: any) => {
          element.scrollTop = element.scrollHeight
        })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to scroll chat editor to bottom`)
      }
    },
    async scrollToTop() {
      try {
        await page.waitForIdle()
        const chatView = page.locator('.interactive-session')
        await expect(chatView).toBeVisible()
        const scrollContainer = chatView.locator('.monaco-list .monaco-scrollable-element').first()
        await expect(scrollContainer).toBeVisible()
        await scrollContainer.evaluate((element: any) => {
          element.scrollTop = 0
        })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to scroll chat editor to top`)
      }
    },
    async shouldHaveCodeBlockWithLanguage(language: string) {
      try {
        await page.waitForIdle()
        const chatView = page.locator('.interactive-session')
        await expect(chatView).toBeVisible()
        const scrollContainer = chatView.locator('.monaco-list .monaco-scrollable-element').first()
        await expect(scrollContainer).toBeVisible()
        const codeBlocks = chatView.locator(`.interactive-result-editor[data-mode-id="${language}"]`)
        const timeout = 60_000
        const startTime = Date.now()
        while (Date.now() - startTime < timeout) {
          const metrics = await scrollContainer.evaluate((element: any) => {
            return {
              clientHeight: element.clientHeight,
              scrollHeight: element.scrollHeight,
              scrollTop: element.scrollTop,
            }
          })
          const stepSize = Math.max(metrics.clientHeight - 40, 200)
          const positions = new Set<number>([metrics.scrollTop, 0, Math.max(metrics.scrollHeight - metrics.clientHeight, 0)])
          for (let offset = 0; offset <= metrics.scrollHeight; offset += stepSize) {
            positions.add(offset)
          }
          for (const position of positions) {
            await scrollContainer.evaluate(
              (element: any, nextScrollTop: number) => {
                element.scrollTop = nextScrollTop
              },
              position,
            )
            await page.waitForIdle()
            const count = await codeBlocks.count()
            if (count > 0) {
              const codeBlock = codeBlocks.first()
              await expect(codeBlock).toBeVisible({ timeout: 5_000 })
              await page.waitForIdle()
              return
            }
          }
        }
        throw new Error(`Timed out waiting for chat code block with language ${language}`)
      } catch (error) {
        throw new VError(error, `Failed to find chat code block with language ${language}`)
      }
    },
    isFirst: false,
    async moveToEditor() {
      try {
        const quickPick = QuickPick.create({ electronApp, expect, ideVersion, page, platform, VError })
        await quickPick.executeCommand('Chat: Move Chat into Editor Area')
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to move chat`)
      }
    },
    async moveToNewWindow() {
      try {
        const electron = Electron.create({ electronApp, expect, ideVersion, page, platform, VError })
        const windowCountBefore = await electron.getWindowCount()
        const windowIdsBeforeRaw = await electron.getWindowIds()
        const windowIdsBefore = Array.isArray(windowIdsBeforeRaw) ? windowIdsBeforeRaw : []
        const waitForWindowCount = this.waitForWindowCount.bind(this)

        await page.waitForIdle()
        const quickPick = QuickPick.create({ electronApp, expect, ideVersion, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.MoveEditorToNewWindow)

        await waitForWindowCount(electron, windowCountBefore + 1)
        const newWindowId = await this.waitForNewWindow(windowIdsBefore, electron)

        await page.waitForIdle()

        return {
          async close() {
            try {
              const windowCountBeforeClose = await electron.getWindowCount()
              await electron.closeWindow(newWindowId)
              await waitForWindowCount(electron, windowCountBeforeClose - 1)
            } catch (error) {
              throw new VError(error, `Failed to close new window`)
            }
          },
        }
      } catch (error) {
        throw new VError(error, `Failed to move chat to new window`)
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
    async openAgentDebugLogs() {
      try {
        const quickPick = QuickPick.create({ electronApp, expect, ideVersion, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.OpenAgentDebugLogs)
        await page.waitForIdle()
        const tab = page.locator('[role="tab"][data-resource-name="Agent Debug Logs"], [role="tab"][aria-label^="Agent Debug Logs"]')
        await expect(tab.first()).toBeVisible({ timeout: 10_000 })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to open agent debug logs`)
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
    async selectModel(modelName: string, retry = true) {
      try {
        const chatView = page.locator('.interactive-session')
        await expect(chatView).toBeVisible()
        const modelPickerItem = getChatPickerItem(chatView, 1)
        await expect(modelPickerItem).toBeVisible()
        await page.waitForIdle()
        const modelLocator = getChatPickerLabel(modelPickerItem)
        await expect(modelLocator).toBeVisible()
        await page.waitForIdle()
        const modelText = (await modelLocator.textContent()) || ''
        await page.waitForIdle()
        if (modelText.includes(modelName)) {
          return
        }
        await modelLocator.click()
        await page.waitForIdle()
        const item = page.locator(`.monaco-list-row[aria-label^="${modelName}"]`)
        await expect(item).toBeVisible()
        await item.click()
        await page.waitForIdle()
        await expect(modelLocator).toContainText(modelName)
        // TODO for some reason, it can switch back
        await new Promise((r) => {
          setTimeout(r, 7000)
        })
        const modelText2 = (await modelLocator.textContent()) || ''
        if (!modelText2.includes(modelName)) {
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
    async sendPart1({
      image = '',
      message,
      model,
      viewLinesText = '',
    }: {
      message: string
      viewLinesText?: string | undefined
      image?: string | undefined
      model?: string | undefined
    }) {
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
      const sendButtonAny = interactiveInput.locator('.action-item .action-label[aria-label^="Send"]').first()
      await expect(sendButtonAny).toBeVisible({ timeout: 30_000 })
      await page.waitForIdle()
      const sendButton = interactiveInput.locator('.action-item .action-label:not(.disabled)[aria-label^="Send"]').first()
      await expect(sendButton).toBeVisible({ timeout: 30_000 })
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
      await page.waitForIdle()
      await sendButton.click()
      await page.waitForIdle()
      await expect(lines).toHaveText('')
      await page.waitForIdle()
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
        const chatView = page.locator('.interactive-session')
        await this.sendPart1({
          message,
          image,
          model,
          viewLinesText,
        })
        const { requestMessage, response } = await waitForLatestExchange(chatView, message)
        if (validateRequest && validateRequest.exists && validateRequest.exists.length > 0) {
          const ariaLabel = await requestMessage.getAttribute('aria-label')
          if (ariaLabel !== message) {
            throw new Error(`unexpected aria label: ${ariaLabel}`)
          }
        }

        if (validateRequest && validateRequest.exists && validateRequest.exists.length > 0) {
          await expect(requestMessage).toBeVisible()
          for (const selector of validateRequest.exists) {
            const locator = requestMessage.locator(selector)
            await expect(locator).toBeVisible()
          }
        }

        if (verify) {
          await expect(requestMessage).toBeVisible()
          await expect(response).toBeVisible()
        }

        if (toolInvocations.length > 0) {
          const element = chatView.locator('.chat-tool-invocation-part')
          await expect(element).toBeVisible({ timeout: 20_000 })
          await page.waitForIdle()
          for (const toolInvocation of toolInvocations) {
            const block = element.locator('.chat-terminal-command-block')
            await expect(block).toBeVisible({
              timeout: 2000,
            })
            await expect(block).toHaveText(` ${toolInvocation.content}`)
            await page.waitForIdle()
          }
        }

        const editArea = chatView.locator('.monaco-editor[data-uri^="chatSessionInput"]')
        const lines = editArea.locator('.view-lines')

        if (expectedResponse) {
          await expect(requestMessage).toBeVisible()
          await page.waitForIdle()
          await expect(lines).toHaveText('')
          await expect(response).toBeVisible()
          await page.waitForIdle()
          await expect(response).toContainText(expectedResponse, {
            timeout: 120_000,
          })
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
        const setModeButton = getChatPickerLabel(getChatPickerItem(chatView, 0))
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
        const modeLabelElement = getChatPickerLabel(getChatPickerItem(chatView, 0))
        await expect(modeLabelElement).toContainText(modeLabel)
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
        const modeLabelElement = getChatPickerLabel(getChatPickerItem(chatView, 0))
        await expect(modeLabelElement).toContainText(modeLabel)
      } catch (error) {
        throw new VError(error, `Failed to set chat mode to ${modeLabel}`)
      }
    },
    async clickAccessButton(buttonText: string = 'Allow') {
      try {
        const accessButton = page.locator(`button:has-text("${buttonText}")`)
        const buttonCount = await accessButton.count()

        if (buttonCount > 0) {
          await expect(accessButton.first()).toBeVisible()
          await accessButton.first().click()
          await page.waitForIdle()
        }
      } catch (error) {
        throw new VError(error, `Failed to click access button with text "${buttonText}"`)
      }
    },
    async waitForNewWindow(windowIdsBefore: readonly number[], electron: ReturnType<typeof Electron.create>) {
      let windowIdsAfter = windowIdsBefore
      const maxDelay = 5000
      const startTime = performance.now()
      while (windowIdsAfter.length <= windowIdsBefore.length) {
        if (performance.now() - startTime > maxDelay) {
          throw new Error(`New window did not appear within ${maxDelay}ms`)
        }
        await new Promise((resolve) => setTimeout(resolve, 200))
        const ids = await electron.getWindowIds()
        windowIdsAfter = Array.isArray(ids) ? ids : []
      }

      const newWindowId = windowIdsAfter.find((id) => !windowIdsBefore.includes(id))
      if (!newWindowId) {
        throw new Error(`Could not identify the new window ID`)
      }
      return newWindowId
    },
    async waitForWindowCount(electron: ReturnType<typeof Electron.create>, expectedCount: number) {
      const maxDelay = 5000
      const startTime = performance.now()
      while (true) {
        const actualCount = await electron.getWindowCount()
        if (actualCount === expectedCount) {
          return
        }
        if (performance.now() - startTime > maxDelay) {
          throw new Error(`Expected ${expectedCount} windows but got ${actualCount}`)
        }
        await new Promise((resolve) => setTimeout(resolve, 200))
      }
    },
  }
}
