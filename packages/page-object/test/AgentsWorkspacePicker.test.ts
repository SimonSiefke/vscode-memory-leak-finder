/** @jest-environment jsdom */
import { afterEach, expect, jest, test } from '@jest/globals'
import { openWorkspaceFolder } from '../src/parts/AgentsWindow/AgentsWindow.ts'

// Jest provides a browser realm; the package itself intentionally has Node-only types.
const browser = globalThis as any
const document = browser.document

afterEach(() => {
  jest.useRealTimers()
  jest.restoreAllMocks()
  document.body.replaceChildren()
})

test('reopens a workspace menu replaced during discovery and activates only the live folder option', async () => {
  jest.useFakeTimers()
  jest.spyOn(browser.Element.prototype, 'getClientRects').mockImplementation(function (this: { isConnected: boolean }) {
    return this.isConnected ? [{}] : []
  })
  document.body.innerHTML =
    '<div class="agent-sessions-workbench"><div class="sessions-chat-widget"><div class="new-chat-widget-container"><div class="sessions-workspace-picker-trigger"><a aria-haspopup="listbox" aria-expanded="false"></a></div></div></div></div>'
  const trigger = document.querySelector('a')!
  const staleClick = jest.fn()
  const liveClick = jest.fn()
  let opens = 0
  trigger.addEventListener('click', () => {
    opens++
    trigger.setAttribute('aria-expanded', 'true')
    const menu = document.createElement('div')
    menu.className = 'context-view'
    menu.innerHTML =
      opens === 1
        ? '<div class="monaco-list-row" aria-label="Open Folder..."><span class="label-name">Open Folder...</span></div>'
        : '<div class="monaco-list-row" aria-label="Open Folder..."><span>Open Folder...</span></div>'
    menu.firstElementChild!.addEventListener('click', opens === 1 ? staleClick : liveClick)
    document.body.append(menu)
    if (opens === 1)
      browser.requestAnimationFrame(() => {
        menu.remove()
        trigger.setAttribute('aria-expanded', 'false')
      })
  })
  const pending = openWorkspaceFolder({ evaluateInMainWorld: async ({ expression }: { expression: string }) => browser.eval(expression) })
  await jest.advanceTimersByTimeAsync(500)
  await pending
  expect(opens).toBe(2)
  expect(staleClick).not.toHaveBeenCalled()
  expect(liveClick).toHaveBeenCalledTimes(1)
})
