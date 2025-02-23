import * as QuickPick from '../QuickPick/QuickPick.js'

export const create = ({ expect, page, VError }) => {
  return {
    async show() {
      try {
        const quickPick = QuickPick.create({ expect, page, VError })
        await quickPick.executeCommand('Cursor: New Chat')
        const chat = page.locator('.composer-bar')
        await expect(chat).toBeVisible()
      } catch (error) {
        throw new VError(error, `Failed to show chat`)
      }
    },
    async sendMessage(question) {
      try {
        const chat = page.locator('.composer-bar')
        await expect(chat).toBeVisible()
        await page.keyboard.contentEditableInsert({ value: question })
        await page.waitForIdle()
        await page.keyboard.press('Enter')
      } catch (error) {
        throw new VError(error, `Failed to send message`)
      }
    },
    async shouldHaveMessageCount(count) {
      try {
        const conversations = page.locator('.conversations')
        await expect(conversations).toBeVisible()
        const messages = page.locator('[id^="bubble"]')
        await expect(messages).toHaveCount(count)
      } catch (error) {
        throw new VError(error, `Failed to verify message count`)
      }
    },
    async shouldHaveResponse(responseText) {
      try {
        const conversations = page.locator('.conversations')
        await expect(conversations).toBeVisible()
        const last = page.locator('[id^="bubble"]').nth(1)
        await expect(last).toBeVisible()
        await expect(last).toHaveText(responseText)
      } catch (error) {
        throw new VError(error, `Failed to verify response text`)
      }
    },
    async resetFocus() {
      try {
        const body = page.locator('body')
        await body.focus()
      } catch (error) {
        throw new VError(error, `Failed to reset focus`)
      }
    },
  }
}
