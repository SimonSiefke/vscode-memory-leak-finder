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
  }
}
