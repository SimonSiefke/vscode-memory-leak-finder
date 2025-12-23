import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'

export const create = ({ expect, ideVersion, page, VError }) => {
  return {
    async addContext(initialPrompt, secondPrompt, confirmText) {
      try {
        const addContextButton = page.locator('[role="button"][aria-label^="Add Context"]')
        await addContextButton.click()
        await page.waitForIdle()

        const quickPick = QuickPick.create({ expect, page, VError })
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
    async clearAll() {
      try {
        const quickPick = QuickPick.create({ expect, page, VError })
        if (ideVersion && ideVersion.minor <= 100) {
          await quickPick.executeCommand(WellKnownCommands.ClearAllWorkspaceChats)
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
    async clearContext(contextName) {
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
    isFirst: false,
    async open() {
      try {
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand(WellKnownCommands.NewChartEditor)
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
    async sendMessage({ message, expectedResponse, verify = false }) {
      try {
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
        await editContext.focus()
        await page.waitForIdle()
        await expect(editContext).toBeFocused()
        await page.waitForIdle()
        await editContext.type(message)
        await page.waitForIdle()
        const lines = editArea.locator('.view-lines')
        await expect(lines).toHaveText(message)
        const interactiveInput = page.locator('.interactive-input-and-side-toolbar')
        await expect(interactiveInput).toBeVisible()
        await page.waitForIdle()
        const sendButton = interactiveInput.locator('.action-item .action-label:not(.disabled)[aria-label^="Send"]')
        await expect(sendButton).toBeVisible()
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
        await sendButton.click()
        await page.waitForIdle()
        await expect(lines).toHaveText('')
        await page.waitForIdle()
        const requestMessage = chatView.locator(`.monaco-list-row.request[aria-label="${message}"]`)
        await expect(requestMessage).toBeVisible()
        await page.waitForIdle()

        if (expectedResponse) {
          const row = chatView.locator(`.monaco-list-row[aria-label="${message}"]`)
          await expect(row).toBeVisible()
          await page.waitForIdle()
          const response = chatView.locator('.monaco-list-row .chat-most-recent-response')
          await expect(response).toBeVisible({ timeout: 60_000 })
          await page.waitForIdle()
          const progress = chatView.locator('.rendered-markdown.progress-step')
          await expect(progress).toBeHidden({ timout: 45_000 })
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
  }
}
