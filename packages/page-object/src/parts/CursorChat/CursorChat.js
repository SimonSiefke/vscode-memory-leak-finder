import * as QuickPick from '../QuickPick/QuickPick.js'

export const create = ({ expect, page, VError }) => {
  return {
    async show() {
      try {
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand('New Chat')
        const chat = page.locator('.aichat-container')
        await expect(chat).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to show chat`)
      }
    },
    async sendMessage(question) {
      try {
        const chat = page.locator('.aichat-container')
        await expect(chat).toBeVisible()
        await page.keyboard.type(question)
        await page.keyboard.press('Enter')
      } catch (error) {
        throw new VError(error, `Failed to send message`)
      }
    },
  }
}
