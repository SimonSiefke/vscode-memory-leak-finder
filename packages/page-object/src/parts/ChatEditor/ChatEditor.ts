import * as QuickPick from '../QuickPick/QuickPick.ts'

export const create = ({ expect, page, VError }) => {
  return {
    async open() {
      try {
        const quickPick = QuickPick.create({ page, expect, VError })
        await quickPick.executeCommand('Chat: New Chat Editor')
        const chatView = page.locator('.interactive-session')
        await expect(chatView).toBeVisible()
        await page.waitForIdle()
        const editContext = page.locator('.native-edit-context')
        await expect(editContext).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to open chat editor`)
      }
    },
    async sendMessage(message) {
      try {
        const editContext = page.locator('.native-edit-context')
        await expect(editContext).toBeFocused()
        await editContext.setValue(message)
        await page.waitForIdle()
        const chatView = page.locator('.interactive-session')
        const sendButton = chatView.locator('[aria-label^="Send and Dispatch"]')
        await sendButton.click()
        await page.waitForIdle()
        // TODO check that message is visible and response also
      } catch (error) {
        throw new VError(error, `Failed to send chat message`)
      }
    },
    async setMode(modeLabel) {
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
    async addContext(initialPrompt, secondPrompt, confirmText) {
      try {
        const addContextButton = page.locator('[role="button"][aria-label^="Add Context"]')
        await addContextButton.click()
        await page.waitForIdle()

        const quickPick = QuickPick.create({ page, expect, VError })
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
    async clearContext(contextName) {
      try {
        const contextLabel = page.locator(`[aria-label="Attached context, ${contextName}"]`)
        await expect(contextLabel).toBeVisible()
        const removeButton = contextLabel.locator('[role="button"][aria-label^="Remove from context"]')
        await expect(removeButton).toBeVisible()
        await removeButton.click()
      } catch (error) {
        throw new VError(error, `Failed to clear chat context`)
      }
    },
  }
}
