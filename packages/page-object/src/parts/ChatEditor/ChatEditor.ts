import { readFile } from 'node:fs/promises'
import { createConnection } from 'node:net'
import { join } from 'node:path'
import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as Electron from '../Electron/Electron.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as Root from '../Root/Root.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

const workspacePath = join(Root.root, '.vscode-test-workspace')
const defaultPortWaitHost = '127.0.0.1'
const defaultPortWaitTimeout = 120_000

const sleep = (milliseconds: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

const isPortOpen = async (port: number, host: string): Promise<boolean> => {
  const { promise, resolve } = Promise.withResolvers<boolean>()
  const socket = createConnection({ host, port })
  const finish = (value: boolean) => {
    socket.removeAllListeners()
    socket.destroy()
    resolve(value)
  }
  socket.once('connect', () => finish(true))
  socket.once('error', () => finish(false))
  socket.setTimeout(500, () => finish(false))
  return promise
}

const waitForPorts = async (ports: readonly number[], timeout: number): Promise<void> => {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    const results = await Promise.all(ports.map((port) => isPortOpen(port, defaultPortWaitHost)))
    if (results.every(Boolean)) {
      return
    }
    await sleep(250)
  }
  throw new Error(`Timed out waiting for ports: ${ports.join(', ')}`)
}

const getChatPickerItem = (chatView: any, index: number) => {
  return chatView.locator('.chat-modelPicker-item, .chat-input-picker-item').nth(index)
}

const getChatPickerLabel = (pickerItem: any) => {
  return pickerItem.locator('.chat-model-label, .action-label, [role="button"], button').first()
}

const getAccessButtons = (page: any, buttonText: string) => {
  return page.locator(
    `button:has-text("${buttonText}"), [role="button"]:has-text("${buttonText}"), .action-label:has-text("${buttonText}")`,
  )
}

const clickVisibleAccessButton = async (page: any, buttonText: string) => {
  const accessButton = getAccessButtons(page, buttonText).first()
  if ((await accessButton.count()) === 0) {
    return false
  }
  const isVisible = await accessButton.isVisible().catch(() => false)
  if (!isVisible) {
    return false
  }
  await accessButton.click()
  await page.waitForIdle()
  return true
}

const hasVisibleAccessButton = async (page: any, buttonText: string) => {
  const accessButton = getAccessButtons(page, buttonText).first()
  if ((await accessButton.count().catch(() => 0)) === 0) {
    return false
  }
  return accessButton.isVisible().catch(() => false)
}

const getErrorNotification = (page: any) => {
  return page.locator(
    '.notifications-toasts [aria-label^="Error:"], .notifications-list-container [aria-label^="Error:"], [role="dialog"][aria-label^="Error:"]',
  )
}

const getErrorNotificationMessage = async (notification: any) => {
  const ariaLabel = await notification.getAttribute('aria-label').catch(() => '')
  if (ariaLabel) {
    return ariaLabel.trim()
  }
  const text = (await notification.textContent().catch(() => '')) || ''
  return text.trim() || 'Error notification shown while waiting for chat response'
}

const waitForLocatorVisibleWithToolApproval = async (page: any, expect: any, locator: any, timeout: number) => {
  const startTime = performance.now()
  while (performance.now() - startTime < timeout) {
    const count = await locator.count().catch(() => 0)
    if (count > 0) {
      const isVisible = await locator
        .first()
        .isVisible()
        .catch(() => false)
      if (isVisible) {
        return
      }
    }
    const clicked = await clickVisibleAccessButton(page, 'Allow')
    if (!clicked) {
      await sleep(200)
    }
    await page.waitForIdle()
  }
  await expect(locator.first()).toBeVisible({ timeout: 1000 })
}

const escapeForRegExp = (value: string) => {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const wait = async (delay: number) => {
  await new Promise((resolve) => setTimeout(resolve, delay))
}

const readWorkspaceFileContent = async (absolutePath: string) => {
  return readFile(absolutePath, 'utf8').catch(() => null)
}

const waitForWorkspaceFileChanges = async (
  relativePaths: readonly string[],
  initialContents: readonly (string | null)[],
  maxWaitDelay: number = 10_000,
) => {
  const absolutePaths = relativePaths.map((relativePath) => join(workspacePath, relativePath))
  const startTime = performance.now()
  while (performance.now() - startTime < maxWaitDelay) {
    const currentContents = await Promise.all(absolutePaths.map(readWorkspaceFileContent))
    const allChanged = currentContents.every((content, index) => content !== initialContents[index])
    if (allChanged) {
      return
    }
    await wait(100)
  }
  const currentContents = await Promise.all(absolutePaths.map(readWorkspaceFileContent))
  const pendingPaths = relativePaths.filter((_, index) => currentContents[index] === initialContents[index])
  throw new Error(`Timed out waiting for file changes: ${pendingPaths.join(', ')}`)
}

const getLatestResponseText = async (chatView: any) => {
  const responses = chatView.locator('.monaco-list-row .chat-most-recent-response')
  const count = await responses.count().catch(() => 0)
  if (count === 0) {
    return ''
  }
  const text =
    (await responses
      .nth(count - 1)
      .textContent()
      .catch(() => '')) || ''
  return text.trim()
}

const isChatResponseErrorText = (text: string) => {
  return text.toLowerCase().includes('please try again')
}

export const Models = {
  Auto: 'Auto',
  GPT41: 'GPT-4.1',
  GPT5Mini: 'GPT-5 mini',
  GPT54Mini: 'GPT-5.4 mini',
  ZAiGLM45AirFree: 'zAiGLM4.5 air free',
  DefaultFree: 'zAiGLM4.5 air free',
} as const

export type ChatModel = (typeof Models)[keyof typeof Models]
export type ChatEditorText = string | RegExp

export const create = ({ electronApp, expect, ideVersion, page, platform, VError }: CreateParams) => {
  const chatScrollSelector = '.interactive-session .monaco-list .monaco-scrollable-element'

  const getLastRenderedLocator = async (locator: any, timeout: number, allowToolApproval: boolean = false) => {
    if (allowToolApproval) {
      await waitForLocatorVisibleWithToolApproval(page, expect, locator, timeout)
    } else {
      await expect(locator.first()).toBeVisible({ timeout })
    }
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
    return getLastRenderedLocator(responses, 60_000, true)
  }

  const waitForToolApprovalToFinish = async (chatView: any, response: any) => {
    const progress = chatView.locator('.rendered-markdown.progress-step')
    const loading = chatView.locator('.chat-response-loading')
    const timeout = 90_000
    const settleTime = 1500
    const settleTimeAfterApproval = 4000
    const startTime = performance.now()
    let settledSince = 0
    let lastResponseText = ''
    let waitingForPostApprovalProgress = false
    let sawApproval = false

    while (performance.now() - startTime < timeout) {
      const progressCount = await progress.count().catch(() => 0)
      const isProgressVisible =
        progressCount > 0 &&
        (await progress
          .first()
          .isVisible()
          .catch(() => false))
      const hasAllowButton = await hasVisibleAccessButton(page, 'Allow')
      if (hasAllowButton) {
        await clickVisibleAccessButton(page, 'Allow')
        settledSince = 0
        lastResponseText = ''
        waitingForPostApprovalProgress = true
        sawApproval = true
        continue
      }

      const responseText = ((await response.textContent().catch(() => '')) || '').trim()
      const responseChanged = responseText !== lastResponseText
      lastResponseText = responseText
      const isLoadingVisible =
        (await loading
          .first()
          .isVisible()
          .catch(() => false)) || false
      const canIgnoreStaleProgress = !isLoadingVisible && responseText.length > 0

      if (waitingForPostApprovalProgress && (isProgressVisible || responseChanged)) {
        waitingForPostApprovalProgress = false
      }

      if (!waitingForPostApprovalProgress && !responseChanged && (!isProgressVisible || canIgnoreStaleProgress)) {
        if (settledSince === 0) {
          settledSince = performance.now()
        }
        const requiredSettleTime = sawApproval ? settleTimeAfterApproval : settleTime
        if (performance.now() - settledSince >= requiredSettleTime) {
          return
        }
      } else {
        settledSince = 0
      }

      await new Promise((resolve) => setTimeout(resolve, 200))
      await page.waitForIdle()
    }

    const responseText = ((await response.textContent().catch(() => '')) || '').trim()
    const isLoadingVisible =
      (await loading
        .first()
        .isVisible()
        .catch(() => false)) || false
    if (!isLoadingVisible && responseText.length > 0) {
      return
    }

    await expect(progress).toBeHidden({ timeout: 1000 })
  }

  const WaitResult = {
    ChatDone: 1,
    ChatError: 2,
    ChatResponseError: 9,
    NotificationError: 7,
    NotificationTimeout: 8,
    ToolDone: 3,
    ToolDone2: 5,
    ToolError: 4,
    ToolError2: 6,
  }

  const isLoggedIn = async (page: any) => {
    const loginButton = page.locator('[aria-label="Sign In"]')
    try {
      await expect(loginButton).toBeHidden()
      return true
    } catch (error) {
      return false
    }
  }

  const assertLoggedIn = async (page: any) => {
    if (!(await isLoggedIn(page))) {
      throw new Error('User is not logged in. Please log in to continue.')
    }
  }

  const waitForDoneOrToolApproval = async (chatView: any) => {
    const loading = chatView.locator('.chat-response-loading')
    const toolApprovalSection = chatView.locator('.chat-confirmation-widget2')
    const toolApprovalSection2 = chatView.locator('.chat-tool-confirmation-carousel .chat-confirmation-widget2')
    const errorNotification = getErrorNotification(page)
    const maxWaitTime = 450_000
    const startTime = Date.now()
    while (Date.now() - startTime < maxWaitTime) {
      if (await toolApprovalSection.isVisible().catch(() => false)) {
        return WaitResult.ToolDone
      }
      if (await toolApprovalSection2.isVisible().catch(() => false)) {
        return WaitResult.ToolDone2
      }
      if (
        await errorNotification
          .first()
          .isVisible()
          .catch(() => false)
      ) {
        return WaitResult.NotificationError
      }
      if (
        !(await loading
          .first()
          .isVisible()
          .catch(() => false))
      ) {
        const latestResponseText = await getLatestResponseText(chatView)
        if (isChatResponseErrorText(latestResponseText)) {
          return WaitResult.ChatResponseError
        }
        return WaitResult.ChatDone
      }
      await sleep(250)
    }
    return WaitResult.ChatError
  }

  const waitForLatestExchange = async (chatView: any, message: string) => {
    const requestMessage = await getLatestRequestMessage(chatView)
    await expect(requestMessage).toBeVisible({ timeout: 90_000 })
    await expect(requestMessage).toHaveAttribute('aria-label', new RegExp(`^${escapeForRegExp(message)}$`), { timeout: 90_000 })
    await page.waitForIdle()
    const response = await getLatestResponseContent(chatView)
    await expect(response).toBeVisible({ timeout: 60_000 })
    await page.waitForIdle()
    await waitForToolApprovalToFinish(chatView, response)
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

  const getChatScrollMetrics = async () => {
    return page.evaluate({
      expression: `(() => {
  const elements = Array.from(document.querySelectorAll('${chatScrollSelector}'))
  if (elements.length === 0) {
    return null
  }
  const element = elements.sort((a, b) => b.scrollHeight - a.scrollHeight)[0]
  return {
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
    scrollTop: element.scrollTop,
  }
})()`,
      returnByValue: true,
    })
  }

  const setChatScrollTop = async (scrollTop: number) => {
    await page.evaluate({
      expression: `((nextScrollTop) => {
  const elements = Array.from(document.querySelectorAll('${chatScrollSelector}'))
  if (elements.length === 0) {
    throw new Error('Chat scroll container not found')
  }
  for (const element of elements) {
    element.scrollTo({ top: nextScrollTop })
    element.scrollTop = nextScrollTop
  }
})(${JSON.stringify(scrollTop)})`,
    })
  }

  return {
    Models,
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
    async approveAllAccessRequests({
      buttonTexts = ['Allow', 'Continue'],
      maxClicks = 12,
    }: {
      buttonTexts?: readonly string[]
      maxClicks?: number
    } = {}) {
      try {
        let clickCount = 0
        while (clickCount < maxClicks) {
          let clicked = false
          for (const buttonText of buttonTexts) {
            const accessButton = getAccessButtons(page, buttonText).first()
            if ((await accessButton.count()) === 0) {
              continue
            }
            const isVisible = await accessButton.isVisible().catch(() => false)
            if (!isVisible) {
              continue
            }
            await accessButton.click()
            await page.waitForIdle()
            clickCount++
            clicked = true
            break
          }
          if (!clicked) {
            break
          }
        }
        return clickCount
      } catch (error) {
        throw new VError(error, `Failed to approve access requests`)
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
        const image = page.locator('.label-name', { hasText: file })
        await expect(image).toBeVisible({ timeout: 30_000 })
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
          await this.sendPart1({
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
    async clickAccessButton(buttonText: string = 'Allow') {
      try {
        const accessButton = getAccessButtons(page, buttonText)
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
    async archiveAllActiveItems() {
      try {
        const quickPick = QuickPick.create({ electronApp, expect, ideVersion, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.ArchiveAllWorkspaceAgentSessions)
        await page.waitForIdle()
        await this.shouldHaveNoActiveItems()
      } catch (error) {
        throw new VError(error, `Failed to archive all active chat items`)
      }
    },
    async archiveFirstActiveItem() {
      try {
        await this.focusSessionList()
        const activeItems = page.locator('.agent-session-item:not(.archived)')
        const firstActiveItem = activeItems.first()
        await expect(firstActiveItem).toBeVisible({ timeout: 30_000 })
        await firstActiveItem.hover()
        await page.waitForIdle()

        const archiveButton = firstActiveItem
          .locator(
            '.agent-session-title-toolbar [aria-label^="Archive"], .agent-session-title-toolbar .action-label[aria-label^="Archive"]',
          )
          .first()
        const isArchiveButtonVisible =
          (await archiveButton.count().catch(() => 0)) > 0 && (await archiveButton.isVisible().catch(() => false))
        if (isArchiveButtonVisible) {
          await archiveButton.click()
        } else {
          await firstActiveItem.click()
          await page.waitForIdle()
          await page.keyboard.press('Delete')
        }
        await page.waitForIdle()
        await expect(firstActiveItem).toBeHidden({ timeout: 30_000 })
      } catch (error) {
        throw new VError(error, `Failed to archive first active chat item`)
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
    async getLatestResponseText() {
      try {
        const chatView = page.locator('.interactive-session')
        await expect(chatView).toBeVisible()
        return getLatestResponseText(chatView)
      } catch (error) {
        throw new VError(error, `Failed to get latest chat response text`)
      }
    },
    async focusSessionList() {
      try {
        const quickPick = QuickPick.create({ electronApp, expect, ideVersion, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.FocusAgentSessions)
        await page.waitForIdle()
        const sessionsViewer = page.locator('.agent-sessions-viewer')
        await expect(sessionsViewer).toBeVisible({ timeout: 30_000 })
      } catch (error) {
        throw new VError(error, `Failed to focus chat session list`)
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
        await page.waitForIdle()
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
    async openView() {
      try {
        await page.waitForIdle()
        const quickPick = QuickPick.create({ electronApp, expect, ideVersion, page, platform, VError })
        await quickPick.executeCommand(WellKnownCommands.OpenChat)
        await page.waitForIdle()
        await this.shouldBeVisibleInSecondarySideBar()
      } catch (error) {
        throw new VError(error, `Failed to open chat view`)
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
    async retryLastMessage() {
      try {
        const chatView = page.locator('.interactive-session')
        const lastResponse = chatView.locator('.interactive-response.chat-most-recent-response')
        await expect(lastResponse).toBeVisible()
        await page.waitForIdle()
        const refreshButton = lastResponse.locator('[aria-label="Retry"]')
        await expect(refreshButton).toBeVisible()
        await page.waitForIdle()
        await refreshButton.focus()
        await page.waitForIdle()
        await expect(refreshButton).toBeFocused()
        await page.waitForIdle()
        const loadingResponse = page.locator('.chat-response-loading')
        await expect(loadingResponse).toBeHidden()
        await refreshButton.click()
        await page.waitForIdle()
        await expect(loadingResponse).toBeVisible({ timeout: 30_000 })
        await expect(loadingResponse).toBeHidden({ timeout: 120_000 })
        await page.waitForIdle()
        await expect(lastResponse).toBeVisible()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to retry last chat message`)
      }
    },
    async scrollToBottom() {
      try {
        await page.waitForIdle()
        const chatView = page.locator('.interactive-session')
        await expect(chatView).toBeVisible()
        const scrollContainer = chatView.locator('.monaco-list .monaco-scrollable-element').first()
        await expect(scrollContainer).toBeVisible()
        const metrics = await getChatScrollMetrics()
        if (!metrics) {
          throw new Error('Chat scroll container not found')
        }
        await setChatScrollTop(metrics.scrollHeight)
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
        await setChatScrollTop(0)
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to scroll chat editor to top`)
      }
    },
    async selectModel(modelName: ChatModel, retry = true) {
      try {
        await page.waitForIdle()
        const chatView = page.locator('.interactive-session')
        await expect(chatView).toBeVisible()
        await page.waitForIdle()
        const modelPickerItem = getChatPickerItem(chatView, 1)
        await expect(modelPickerItem).toBeVisible()
        await page.waitForIdle()

        const modelLocator = page.locator(`.action-label[aria-label^="Pick Model"] a`)
        await expect(modelLocator).toBeVisible()
        await page.waitForIdle()
        const modelText = (await modelLocator.textContent()) || ''
        await page.waitForIdle()
        if (modelText.includes(modelName)) {
          return
        }
        await modelLocator.focus()
        await page.waitForIdle()
        await expect(modelLocator).toBeFocused()
        await page.waitForIdle()
        if (ideVersion && ideVersion.minor >= 122) {
          await page.keyboard.press('Enter')
          await page.waitForIdle()
          const search = page.locator('.context-view input[placeholder="Search models"]')
          await expect(search).toBeVisible()
          await page.waitForIdle()
          await expect(search).toBeFocused()
          await page.waitForIdle()
          await search.type(modelName)
          await page.waitForIdle()
          await page.keyboard.press('Enter')
          await page.waitForIdle()
        } else if (ideVersion && ideVersion.minor >= 118) {
          await page.keyboard.press('Enter')
          await page.waitForIdle()
          const search = page.locator('.context-view input[placeholder="Search models"]')
          await expect(search).toBeVisible()
          await page.waitForIdle()
          await expect(search).toBeFocused()
          await page.waitForIdle()
          await search.type(modelName)
          await page.waitForIdle()
          const item = page.locator(`.monaco-list-row[aria-label^="${modelName}"]`)
          await expect(item).toBeVisible()
          await item.click()
        } else {
          await modelLocator.click()
          await page.waitForIdle()
        }

        await page.waitForIdle()
        await page.waitForIdle()
        await expect(modelLocator).toHaveText(modelName)
        if (ideVersion && ideVersion.minor <= 118) {
          // TODO for some reason, it can switch back
          await new Promise((r) => {
            setTimeout(r, 7000)
          })
        }
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
    async send({
      image = '',
      message,
      model,
      viewLinesText = '',
    }: {
      message: string
      viewLinesText?: ChatEditorText
      image?: string
      model?: ChatModel
    }) {
      try {
        await this.sendPart1({
          image,
          message,
          model,
          viewLinesText,
        })
      } catch (error) {
        throw new VError(error, `Failed to send chat message without waiting`)
      }
    },
    async sendMessage({
      approveToolCalls = false,
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
      waitForFileChanges: fileChangesToWaitFor = [],
      waitForPorts: portsToWaitFor = [],
    }: {
      expectedResponse?: string
      message: string
      approveToolCalls?: boolean
      validateRequest?: { exists: readonly unknown[] }
      verify?: boolean
      waitForFileChanges?: readonly string[]
      waitForPorts?: readonly number[]
      viewLinesText?: ChatEditorText
      image?: string
      toolInvocations?: readonly any[]
      model?: ChatModel
    }) {
      try {
        await assertLoggedIn(page)
        const chatView = page.locator('.interactive-session')
        const shouldWaitForFileChanges = fileChangesToWaitFor.length > 0
        const initialFileContents = shouldWaitForFileChanges
          ? await Promise.all(fileChangesToWaitFor.map((relativePath) => readWorkspaceFileContent(join(workspacePath, relativePath))))
          : []
        await this.sendPart1({
          image,
          message,
          model,
          viewLinesText,
        })

        await page.waitForIdle()
        const maxToolCalls = 15
        for (let i = 0; i < maxToolCalls; i++) {
          const result = await waitForDoneOrToolApproval(chatView)
          if (result === WaitResult.ChatDone) {
            break
          }
          if (result === WaitResult.ChatError) {
            throw new Error('Chat response loading did not complete in time')
          }
          if (result === WaitResult.ChatResponseError) {
            const responseText = await getLatestResponseText(chatView)
            throw new Error(responseText || 'Chat returned an error response')
          }
          if (result === WaitResult.ToolDone) {
            if (!approveToolCalls) {
              throw new Error('Unexpected tool approval request')
            }
            const allowButton = page.locator('.monaco-button[aria-label^="Allow"]')
            await expect(allowButton).toBeVisible()
            await allowButton.focus()
            await page.waitForIdle()
            await expect(allowButton).toBeFocused()
            await page.waitForIdle()
            await allowButton.click()
            await page.waitForIdle()
            await clickVisibleAccessButton(page, 'Allow')
            await page.waitForIdle()
          }
          if (result === WaitResult.ToolDone2) {
            if (!approveToolCalls) {
              throw new Error('Unexpected tool approval request')
            }
            const allowButton = page.locator('.chat-tool-confirmation-carousel .monaco-button[aria-label^="Allow"]')
            await expect(allowButton).toBeVisible()
            await allowButton.focus()
            await page.waitForIdle()
            await expect(allowButton).toBeFocused()
            await page.waitForIdle()
            await allowButton.click()
            await page.waitForIdle()
            await clickVisibleAccessButton(page, 'Allow')
            await page.waitForIdle()
          }
          if (result === WaitResult.ToolError || result === WaitResult.ToolError2) {
            throw new Error('Tool approval did not appear in time')
          }
          if (result === WaitResult.NotificationError) {
            const message = await getErrorNotificationMessage(getErrorNotification(page).first())
            throw new Error(message)
          }
        }

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
          await expect(response).toHaveText(new RegExp(escapeForRegExp(expectedResponse)), {
            timeout: 120_000,
          })
        }

        if (shouldWaitForFileChanges) {
          await waitForWorkspaceFileChanges(fileChangesToWaitFor, initialFileContents, 10_000)
        }

        if (portsToWaitFor.length > 0) {
          await waitForPorts(portsToWaitFor, defaultPortWaitTimeout)
        }
      } catch (error) {
        throw new VError(error, `Failed to send chat message`)
      }
    },
    async sendPart1({
      image = '',
      message,
      model,
      viewLinesText = '',
    }: {
      message: string
      viewLinesText?: ChatEditorText | undefined
      image?: string | undefined
      model?: ChatModel | undefined
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
    async setMode(modeLabel: string) {
      try {
        if (ideVersion && typeof ideVersion !== 'string' && ideVersion.minor !== undefined && ideVersion.minor < 107) {
          await this.setModeLegacy(modeLabel)
          return
        }
        const chatView = page.locator('.interactive-session')
        const setModeButton = getChatPickerLabel(getChatPickerItem(chatView, 0))
        await expect(setModeButton).toBeVisible()
        const currentModeLabel = (await setModeButton.textContent()) || ''
        if (currentModeLabel.includes(modeLabel)) {
          return
        }
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
    async shouldBeVisibleInSecondarySideBar() {
      try {
        const chatView = page.locator('.auxiliarybar .interactive-session')
        await expect(chatView).toBeVisible({ timeout: 30_000 })
        const editArea = chatView.locator('.monaco-editor[data-uri^="chatSessionInput"]')
        await expect(editArea).toBeVisible({ timeout: 30_000 })
      } catch (error) {
        throw new VError(error, `Failed to verify chat view is visible in secondary side bar`)
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
          const metrics = await getChatScrollMetrics()
          if (!metrics) {
            throw new Error('Chat scroll container not found')
          }
          const stepSize = Math.max(metrics.clientHeight - 40, 200)
          const positions = new Set<number>([metrics.scrollTop, 0, Math.max(metrics.scrollHeight - metrics.clientHeight, 0)])
          for (let offset = 0; offset <= metrics.scrollHeight; offset += stepSize) {
            positions.add(offset)
          }
          for (const position of positions) {
            await setChatScrollTop(position)
            await page.waitForIdle()
            const count = await codeBlocks.count()
            if (count > 0) {
              const codeBlock = codeBlocks.first()
              await expect(codeBlock).toBeVisible({ timeout: 5000 })
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
    async shouldHaveNoActiveItems() {
      try {
        const activeItems = page.locator('.agent-session-item:not(.archived)')
        await expect(activeItems).toHaveCount(0, { timeout: 30_000 })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to verify that all chat items are archived`)
      }
    },
    async shouldHaveLatestResponseCodeBlockWithLanguage(language: string) {
      try {
        await page.waitForIdle()
        const chatView = page.locator('.interactive-session')
        await expect(chatView).toBeVisible()
        const response = await getLatestResponseContent(chatView)
        await expect(response).toBeVisible({ timeout: 60_000 })
        const codeBlock = response.locator(`.interactive-result-editor[data-mode-id="${language}"]`).first()
        await expect(codeBlock).toBeVisible({ timeout: 60_000 })
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to find latest response code block with language ${language}`)
      }
    },
    async waitForLatestExchange(message: string) {
      try {
        const chatView = page.locator('.interactive-session')
        await waitForLatestExchange(chatView, message)
      } catch (error) {
        throw new VError(error, `Failed to wait for latest chat exchange`)
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
