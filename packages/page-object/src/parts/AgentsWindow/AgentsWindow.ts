import type { CreateParams } from '../CreateParams/CreateParams.ts'

const workbench = '.agent-sessions-workbench'
const composer = `${workbench} .sessions-chat-widget .new-chat-widget-container`
const activeSession = `${workbench} .session-view.is-active`
const sessionRows = `${workbench} .sessions-list-control .monaco-list-row`

export const create = (params: CreateParams) => {
  const { expect, page, platform } = params
  const rowFor = (title: string) => page.locator(sessionRows, { hasText: title })
  const focusInput = async (input: any) => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await page.waitForIdle()
        await input.focus()
        await page.waitForIdle()
        await expect(input).toBeFocused()
        break
      } catch (error) {
        if (attempt === 2) throw error
      }
    }
  }
  const typeMessage = async (editor: any, message: string) => {
    await expect(editor).toBeVisible({ timeout: 60_000 })
    const input = editor.locator('.native-edit-context')
    await focusInput(input)
    await input.type(message)
    await page.waitForIdle()
    await expect(editor.locator('.view-lines')).toHaveText(message.replaceAll(' ', '\u00a0'))
  }
  return {
    async shouldBeVisible() {
      await expect(page.locator(workbench)).toBeVisible({ timeout: 60_000 })
    },
    async newChat() {
      const button = page.locator(`${workbench} [aria-label^="New Session"]`).first()
      await expect(button).toBeVisible({ timeout: 60_000 })
      await page.waitForIdle()
      await button.click()
      await page.waitForIdle()
      await this.shouldHaveNewChat()
    },
    async selectNoWorkspace() {
      const picker = page
        .locator(
          `${composer} .sessions-chat-workspace-picker > a[role="button"], ${composer} .sessions-workspace-picker-trigger > a[role="button"]`,
        )
        .first()
      await expect(picker).toBeVisible({ timeout: 60_000 })
      if (/^(Chat|No workspace)$/i.test((await picker.textContent()).trim())) {
        await expect(picker).toHaveText(/^(Chat|No workspace)$/i)
        return
      }
      await picker.click()
      const option = page
        .locator(
          '.context-view .monaco-list-row[role="option"][aria-label^="No workspace" i], .context-view .monaco-list-row[role="option"][aria-label="Chat"], .context-view .monaco-list-row[role="option"][aria-label^="Chat,"]',
        )
        .first()
      await expect(option).toBeVisible({ timeout: 15_000 })
      await option.click()
      await expect(page.locator('.context-view .monaco-list-row[role="option"]')).toBeHidden()
      await expect(picker).toHaveText(/^(Chat|No workspace)$/i)
    },
    async shouldHaveNewChat() {
      await expect(page.locator(composer)).toBeVisible({ timeout: 60_000 })
      await expect(page.locator(`${composer} .sessions-chat-editor .view-lines`)).toHaveText('')
    },
    async typeDraft(message: string) {
      await typeMessage(page.locator(`${composer} .sessions-chat-editor .monaco-editor`), message)
    },
    async clearDraft() {
      const input = page.locator(`${composer} .native-edit-context`)
      await focusInput(input)
      await page.keyboard.press(platform === 'darwin' ? 'Meta+A' : 'Control+A')
      await page.waitForIdle()
      await page.keyboard.press('Backspace')
      await page.waitForIdle()
      await expect(page.locator(`${composer} .sessions-chat-editor .view-lines`)).toHaveText('')
    },
    async shouldHaveSendDisabled() {
      await expect(page.locator(`${composer} .sessions-chat-send-button .monaco-button`)).toHaveClass('disabled')
    },
    async sendNewChat(message: string) {
      await this.typeDraft(message)
      const send = page.locator(`${composer} .sessions-chat-send-button .monaco-button:not(.disabled)`)
      await expect(send).toBeVisible({ timeout: 60_000 })
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await page.waitForIdle()
          await send.focus()
          await expect(send).toBeFocused()
          await page.waitForIdle()
          await send.click()
          await expect(page.locator(composer)).toBeHidden({ timeout: 15_000 })
          break
        } catch (error) {
          if (attempt === 2) throw error
        }
      }
      await this.shouldHaveRequest(message)
    },
    async sendMessage(message: string) {
      const editor = page.locator(`${activeSession} .interactive-input-part .monaco-editor[role="code"]`)
      await typeMessage(editor, message)
      const send = page.locator(
        `${activeSession} .chat-execute-toolbar .action-item:not(.disabled) > .action-label.codicon-arrow-up-compact`,
      )
      await expect(send).toBeVisible({ timeout: 60_000 })
      await send.click()
      await this.shouldHaveRequest(message)
      await expect(editor.locator('.view-lines')).toHaveText('')
    },
    async shouldHaveRequest(message: string) {
      await expect(page.locator(`${activeSession} .interactive-request .rendered-markdown`, { hasText: message })).toBeVisible({
        timeout: 60_000,
      })
    },
    async shouldHaveReply(text: string, count = 1) {
      const replies = page.locator(`${activeSession} .interactive-response .rendered-markdown`, { hasText: text })
      await expect(replies).toHaveCount(count, { timeout: 90_000 })
      await expect(replies.nth(count - 1)).toBeVisible()
      await expect(page.locator(`${activeSession} .chat-execute-toolbar .codicon-stop-circle`)).toBeHidden({ timeout: 30_000 })
    },
    async shouldHaveSession(title: string) {
      await expect(rowFor(title)).toBeVisible({ timeout: 30_000 })
    },
    async openChat(title: string) {
      await rowFor(title).click()
      await this.shouldHaveRequest(title)
    },
    async deleteChat(title: string) {
      const row = rowFor(title)
      await expect(row).toBeVisible({ timeout: 30_000 })
      // Chat also keeps a hidden response-selection menu in the document.
      const menu = page.locator('.context-view.monaco-menu-container:not(.chat-response-selection-menu) .actions-container')
      await row.click({ button: 'right' })
      await expect(menu).toBeVisible()
      const deleteAction = menu.locator('.action-menu-item', { hasText: 'Delete...' })
      // Menus ignore mouse moves with zero movement; hover selects the item
      // for keyboard activation without racing the delayed mouse-up handler.
      await deleteAction.hover({ movementX: 1, movementY: 1 })
      await expect(menu.locator('.action-item.focused')).toHaveText(/Delete\.\.\./)
      await page.keyboard.press('Enter')
      await expect(menu).toBeHidden()
      // VS Code's smoke-test driver automatically confirms dialogs.
      const deadline = Date.now() + 30_000
      for (let attempt = 0; ; attempt++) {
        try {
          await expect(row).toHaveCount(0, { timeout: Math.max(1, deadline - Date.now()) })
          break
        } catch (error) {
          // CDP can lose the promise for this read-only assertion during GC.
          // Retry the assertion within its original deadline, never the deletion.
          if (attempt >= 2 || Date.now() >= deadline || !String(error).includes('Promise was collected')) throw error
          console.warn('AgentsWindow.deleteChat: retrying a collected DevTools assertion promise')
        }
      }
    },
  }
}
