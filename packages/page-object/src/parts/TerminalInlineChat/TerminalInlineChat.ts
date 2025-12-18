import * as Panel from '../Panel/Panel.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as WellKnownCommands from '../WellKnownCommands/WellKnownCommands.ts'
import * as Workspace from '../Workspace/Workspace.ts'

const cleanup = async ({ page, row1 }) => {
  for (let i = 0; i < 50; i++) {
    await page.waitForIdle()
    await page.keyboard.press('Backspace')
    await page.waitForIdle()
    const text = await row1.textContent()
    if (text.endsWith('$ ')) {
      return
    }
  }
}

const waitForTerminalReady = async ({ page, row1 }) => {
  for (let i = 0; i < 50; i++) {
    await page.waitForIdle()
    await page.keyboard.press('a')
    await page.waitForIdle()
    const text = await row1.textContent()
    if (text.includes('aaaaa')) {
      await cleanup({ page, row1 })
      return true
    }
  }
  return false
}

export const create = ({ expect, page, VError, ideVersion, electronApp }) => {
  return {
    isFirst: false,
    async show() {
      try {
        const terminal = page.locator('.terminal.xterm')
        await expect(terminal).toBeVisible()
        await page.waitForIdle()
        await page.keyboard.press('Control+i')
        await page.waitForIdle()
        const terminalInlineChat = page.locator('.terminal-split-pane .inline-chat')
        await expect(terminalInlineChat).toBeVisible()
        await page.waitForIdle()
        const editor = terminalInlineChat.locator('.monaco-editor[data-uri^="chatSessionInput"]')
        await expect(editor).toBeVisible()
        const editContext = editor.locator('.native-edit-context')
        await expect(editContext).toBeVisible()
        await page.waitForIdle()
        await expect(editContext).toBeFocused()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to show terminal inline chat`)
      }
    },
    async hide() {
      try {
        await page.waitForIdle()
        const terminal = page.locator('.terminal.xterm')
        await expect(terminal).toBeVisible()
        await page.waitForIdle()
        const terminalInlineChat = page.locator('.terminal-split-pane .inline-chat')
        await expect(terminalInlineChat).toBeVisible()
        const editor = terminalInlineChat.locator('.monaco-editor[data-uri^="chatSessionInput"]')
        await expect(editor).toBeVisible()
        await page.waitForIdle()
        await page.keyboard.press('Escape')
        await page.waitForIdle()
        await expect(terminalInlineChat).toBeHidden()
        await page.waitForIdle()
      } catch (error) {
        throw new VError(error, `Failed to hide terminal inline chat`)
      }
    },
    async sendMessage({ verify = true, message }) {
      const terminal = page.locator('.terminal.xterm')
      await expect(terminal).toBeVisible()
      await page.waitForIdle()
      const terminalInlineChat = page.locator('.terminal-split-pane .inline-chat')
      await expect(terminalInlineChat).toBeVisible()
      await page.waitForIdle()
      const editor = terminalInlineChat.locator('.monaco-editor[data-uri^="chatSessionInput"]')
      await expect(editor).toBeVisible()
      const editContext = editor.locator('.native-edit-context')
      await expect(editContext).toBeVisible()
      await page.waitForIdle()
      await expect(editContext).toBeFocused()
      await page.waitForIdle()
      await editContext.type(message)
      await page.waitForIdle()
      const sendButton = terminalInlineChat.locator('.action-item .action-label:not(.disabled)[aria-label^="Send"]')
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
      const lines = editor.locator('.view-lines')
      await page.waitForIdle()
      await expect(lines).toHaveText('')

      if (verify) {
        const row = terminalInlineChat.locator(`.monaco-list-row[aria-label="${message}"]`)
        await expect(row).toBeVisible()
        await page.waitForIdle()
        const response = terminalInlineChat.locator('.monaco-list-row .chat-most-recent-response')
        await expect(response).toBeVisible({ timeout: 60_000 })
        await page.waitForIdle()
        const progress = terminalInlineChat.locator('.rendered-markdown.progress-step')
        await expect(progress).toBeHidden({ timout: 45_000 })
        await page.waitForIdle()
        await expect(response).toBeVisible({ timeout: 30_000 })
        await page.waitForIdle()
      }
      try {
      } catch (error) {
        throw new VError(error, `Failed to send message`)
      }
    },
  }
}
