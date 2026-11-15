/** @jest-environment jsdom */
import { expect, test } from '@jest/globals'
import * as DebugConsole from '../src/parts/DebugConsole/DebugConsole.ts'

const document = (globalThis as any).document

test.each([false, true])('hiding the console clears native text focus even when DOM focus moved away: %s', async (staleFocus) => {
  document.body.innerHTML =
    '<div class="part panel"><div class="repl"><div class="repl-input-wrapper"><div class="native-edit-context" tabindex="0"></div></div></div><button aria-label="Hide Panel"></button></div><div class="editor-group-container" tabindex="0"></div>'
  const input = document.querySelector('.native-edit-context')
  const panel = document.querySelector('.part.panel')
  let hasTextFocus = true
  input.addEventListener('blur', () => {
    hasTextFocus = false
  })
  if (staleFocus) document.querySelector('.editor-group-container').focus()
  else input.focus()

  const locator = (selector: string): any => ({
    selector,
    isVisible: async () => !panel.hidden,
    click: async () => {
      // A native input can miss blur when it is detached on macOS. Its cached
      // focus would then win over the document when VS Code routes typing.
      expect(hasTextFocus).toBe(false)
      panel.hidden = true
      document.querySelector('.editor-group-container').focus()
    },
  })
  const api = DebugConsole.create({
    electronApp: {},
    expect: (element: any) => ({
      toBeVisible: async () => expect(document.querySelector(element.selector)).not.toBeNull(),
      toBeHidden: async () => expect(panel.hidden).toBe(true),
    }),
    ideVersion: { major: 1, minor: 143, patch: 1 },
    page: {
      locator,
      waitForIdle: async () => {},
      evaluateInMainWorld: async ({ expression }: { expression: string }) => {
        return new Function('document', 'FocusEvent', `return ${expression}`)(document, (globalThis as any).FocusEvent)
      },
    },
    platform: 'darwin',
    VError: class extends Error {
      constructor(error: Error, message: string) {
        super(`${message}: ${error.message}`)
      }
    },
  })
  await api.hide()
  expect(hasTextFocus).toBe(false)
})
