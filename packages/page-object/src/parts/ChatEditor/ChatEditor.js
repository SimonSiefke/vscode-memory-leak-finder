import { QuickPick } from '../Parts/Parts.js'

export const create = ({ expect, page, VError }) => {
  return {
    async open() {
      try {
        const quickPick = QuickPick.create({ page, expect, VError })
        await quickPick.executeCommand('Chat: New Chat Editor')
        const chatView = page.locator('.interactive-session')
        await expect(chatView).toBeVisible()
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
  }
}
