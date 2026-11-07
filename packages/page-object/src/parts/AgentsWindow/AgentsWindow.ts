import { basename } from 'node:path'
import type { CreateParams } from '../CreateParams/CreateParams.ts'
import * as QuickPick from '../QuickPick/QuickPick.ts'
import * as InboxCanvasObserver from '../InboxCanvasObserver/InboxCanvasObserver.ts'

const workbench = '.agent-sessions-workbench'
const composer = `${workbench} .sessions-chat-widget .new-chat-widget-container`
const activeSession = `${workbench} .session-view.is-active`
const sessionRows = `${workbench} .sessions-list-control .monaco-list-row:has(.session-item)`

// Resolve and activate the live menu row in one renderer task. Workspace discovery
// can replace the menu between separate locator readiness and click RPCs.
export const openWorkspaceFolder = async (page: any): Promise<void> => {
  await page.evaluateInMainWorld({
    awaitPromise: true,
    expression: `(async () => {
      const selector = ${JSON.stringify(`${composer} .sessions-workspace-picker-trigger a[aria-haspopup="listbox"]`)}
      const deadline = Date.now() + 15_000
      let lastOpen = -Infinity
      while (Date.now() < deadline) {
        const option = Array.from(document.querySelectorAll('.context-view .monaco-list-row')).find(element =>
          (element.querySelector('.label-name')?.textContent === 'Open Folder...' ||
            /^Open Folder\\.\\.\\.(,|$)/.test(element.getAttribute('aria-label') || '')) && element.getClientRects().length)
        if (option) { option.click(); return }
        const trigger = document.querySelector(selector)
        if (!trigger) throw new Error('No new-session workspace picker')
        if (trigger.getAttribute('aria-expanded') !== 'true' && Date.now() - lastOpen >= 250) {
          trigger.click()
          lastOpen = Date.now()
        }
        await new Promise(resolve => requestAnimationFrame(resolve))
      }
      throw new Error('No live Open Folder workspace option')
    })()`,
  })
}

export const selectLocalEnvironment = async (page: any, expect: any): Promise<void> => {
  const environment = page.locator(
    `${composer} [data-session-picker-id="sessions.focusNewSessionEnvironmentPicker"] a[aria-haspopup="listbox"]`,
  )
  const local = page.locator('.context-view .monaco-list-row', { hasText: 'This Computer' })
  const deadline = Date.now() + 60_000
  await expect(environment).toBeVisible({ timeout: 60_000 })
  while (Date.now() < deadline) {
    try {
      await environment.click()
      await expect(page.locator('.context-view [aria-label="Environment"]')).toBeVisible()
      if (await local.count()) {
        await local.click()
        await expect(environment).toHaveText('This Computer')
        return
      }
    } catch (error) {
      // Discovery may remove this row after count() but before native click().
      // Retry only this setup race; unexpected errors still fail the scenario.
      if (!String(error).includes('element not found') || !String(error).includes('This Computer')) throw error
    }
    await page.keyboard.press('Escape')
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error('Local Agents environment did not become available')
}

export const create = (params: CreateParams) => {
  const { expect, page, platform } = params
  const canvasObserver = InboxCanvasObserver.create(page)
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
    async selectWorkspace(path: string, readinessDirectory: string) {
      await selectLocalEnvironment(page, expect)
      const picker = page.locator(`${composer} .sessions-workspace-picker-trigger a[aria-haspopup="listbox"]`).first()
      for (let attempt = 0; ; attempt++) {
        await openWorkspaceFolder(page)
        const input = page.locator('.quick-input-widget input[placeholder="Folder path"]')
        await expect(input).toBeVisible()
        await expect(page.locator('.quick-input-widget .quick-input-list .monaco-list-row').first()).toBeVisible()
        await input.focus()
        const entry = page.locator('.quick-input-widget .quick-input-list .label-name', { hasExactText: readinessDirectory })
        const folderDeadline = Date.now() + 20_000
        while (true) {
          await input.fill(`${path}/`)
          try {
            await expect(entry).toBeVisible({ timeout: 1000 })
            await expect(input).toHaveValue(`${path}/`)
            break
          } catch (error) {
            if (Date.now() >= folderDeadline) throw error
          }
        }
        const confirm = page.locator('.quick-input-widget .quick-input-action .monaco-button', { hasExactText: 'OK' })
        await confirm.click()
        await expect(input).toBeHidden()
        try {
          await expect(picker).toHaveText(basename(path), { timeout: 5_000 })
          return
        } catch (error) {
          // The previous session's asynchronous removal can reset a new draft's workspace.
          // Retry only workspace selection, before creating any session or terminal.
          if (attempt >= 2) throw error
        }
      }
    },
    async selectNoWorkspace() {
      const picker = page
        .locator(
          `${composer} .sessions-chat-workspace-picker > a[role="button"], ${composer} .sessions-workspace-picker-trigger a[role="button"]`,
        )
        .first()
      await expect(picker).toBeVisible({ timeout: 60_000 })
      if (/^(Chat|No workspace)$/i.test((await picker.textContent()).trim())) {
        await expect(picker).toHaveText(/^(Chat|No workspace)$/i)
        return
      }
      // Workspace discovery can rerender the trigger and dismiss its menu.
      // Reopen only a closed menu until the actual option becomes ready.
      await page.evaluateInMainWorld({
        awaitPromise: true,
        expression: `(async () => {
          const selector = ${JSON.stringify(`${composer} .sessions-workspace-picker-trigger a[aria-haspopup="listbox"], ${composer} .sessions-chat-workspace-picker > a[role="button"]`)}
          const deadline = Date.now() + 15_000
          let lastOpen = 0
          while (Date.now() < deadline) {
            const option = Array.from(document.querySelectorAll('.context-view [role="option"]')).find(element =>
              /^(No workspace|Chat)(,|$)/i.test(element.getAttribute('aria-label') || '') && element.getClientRects().length)
            if (option) { option.click(); return }
            const trigger = document.querySelector(selector)
            if (trigger?.getAttribute('aria-expanded') !== 'true' && Date.now() - lastOpen > 250) {
              if (!trigger) throw new Error('No new-session workspace picker')
              trigger.click()
              lastOpen = Date.now()
            }
            await new Promise(resolve => requestAnimationFrame(resolve))
          }
          throw new Error('No visible Chat / No workspace option')
        })()`,
      })
      await expect(picker).toHaveText(/^(Chat|No workspace)$/i)
    },
    async shouldHaveNewChat() {
      await expect(page.locator(composer)).toBeVisible({ timeout: 60_000 })
      await expect(page.locator(`${composer} .monaco-editor[role="code"] .view-lines`)).toHaveText('')
    },
    async typeDraft(message: string) {
      await typeMessage(page.locator(`${composer} .monaco-editor[role="code"]`), message)
    },
    async clearDraft() {
      const input = page.locator(`${composer} .native-edit-context`)
      await focusInput(input)
      await page.keyboard.press(platform === 'darwin' ? 'Meta+A' : 'Control+A')
      await page.waitForIdle()
      await page.keyboard.press('Backspace')
      await page.waitForIdle()
      await expect(page.locator(`${composer} .monaco-editor[role="code"] .view-lines`)).toHaveText('')
    },
    async shouldHaveSendDisabled() {
      await expect(page.locator(`${composer} .sessions-chat-send-button .monaco-button`)).toHaveClass('disabled')
    },
    async sendNewChat(message: string) {
      await this.typeDraft(message)
      const send = page.locator(
        `${composer} .sessions-chat-send-button .monaco-button:not(.disabled), ${composer} .chat-execute-toolbar .action-item:not(.disabled) > .action-label.codicon-arrow-up-compact`,
      )
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
          // A completed send can replace the composer before its final idle check.
          // Never retry the action once the actual request has appeared.
          if (await page.locator(`${activeSession} .interactive-request .rendered-markdown`, { hasText: message }).count()) break
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
    armCanvasObserver: () => canvasObserver.arm(),
    keepCanvasObserver: (title: string) => canvasObserver.keep(title),
    disposeCanvasObservers: () => canvasObserver.dispose(),
    async showInboxEvidence(title: string) {
      await QuickPick.create(params).executeCommand('Agents: Show Inbox', { pressKeyOnce: true })
      const done = page.locator('[role="tab"][id$="-done"]')
      await expect(done).toBeVisible({ timeout: 30_000 })
      await done.click()
      const item = page.locator('.inbox-notifications-item', { hasText: title })
      await expect(item).toBeVisible()
      await item.click()
      await expect(page.locator('.inbox-evidence-canvas-controls [role="button"]', { hasText: 'Inbox contract canvas' })).toBeVisible()
    },
    async presentInboxCanvas() {
      const button = page.locator('.inbox-evidence-canvas-controls [role="button"]', { hasText: 'Inbox contract canvas' })
      await expect(button).toBeVisible()
      await expect(button).toHaveAttribute('aria-disabled', 'false')
      await button.click()
      await expect(page.locator('.inbox-evidence-native-canvas')).toBeVisible()
    },
    async hideInboxCanvas() {
      const hide = page.locator('.inbox-evidence-canvas-controls [role="button"]', { hasText: 'Hide canvas' })
      await expect(hide).toBeVisible()
      await hide.click()
      await expect(page.locator('.inbox-evidence-native-canvas')).toHaveCount(0)
    },
    async closeInboxEvidence() {
      const close = page.locator('[role="button"][aria-label="Close Evidence"]')
      await expect(close).toBeVisible()
      await close.click()
      await expect(page.locator('.inbox-evidence-canvases')).toHaveCount(0)
    },
    async archiveChat(title: string) {
      const row = rowFor(title)
      const menu = page.locator('.context-view.monaco-menu-container:not(.chat-response-selection-menu) .actions-container')
      await row.click({ button: 'right' })
      await expect(menu).toBeVisible()
      const action = menu.locator('.action-menu-item', { hasText: 'Archive' })
      await action.hover({ movementX: 1, movementY: 1 })
      await expect(menu.locator('.action-item.focused .action-label')).toHaveText('Archive')
      await page.keyboard.press('Enter')
      await expect(menu).toBeHidden()
      // Archiving moves the row into a collapsed Archived section.
      if (!(await row.count())) {
        const archived = page.locator(`${workbench} .sessions-list-control .session-section-label`, { hasExactText: 'Archived' })
        await expect(archived).toBeVisible()
        await archived.click()
      }
      await expect(row).toBeVisible()
      await row.click({ button: 'right' })
      await expect(menu.locator('.action-menu-item', { hasText: 'Unarchive' })).toBeVisible()
      await page.keyboard.press('Escape')
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
      await page.waitForIdle()
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
