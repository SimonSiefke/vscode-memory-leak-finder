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
  }
}
