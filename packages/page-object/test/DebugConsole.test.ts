/** @jest-environment jsdom */
import { expect, test } from '@jest/globals'
import * as DebugConsole from '../src/parts/DebugConsole/DebugConsole.ts'

const document = (globalThis as any).document

test.each(
  ['<div class="native-edit-context" tabindex="0"></div>', '<textarea class="inputarea"></textarea>'].flatMap((input) => [
    [input, false],
    [input, true],
  ]),
)('hiding the Debug Console releases editor text focus before hiding its input: %s', async (inputHtml, staleFocus) => {
  document.body.innerHTML = `<div class="part panel"><div class="repl"><div class="repl-input-wrapper">${inputHtml}</div></div><button aria-label="Hide Panel"></button></div><div class="editor-group-container" tabindex="0"></div>`
  const input = document.querySelector('.repl-input-wrapper').firstElementChild
  const panel = document.querySelector('.part.panel')
  let hasTextFocus = false
  input.addEventListener('focus', () => {
    hasTextFocus = true
  })
  input.addEventListener('blur', () => {
    expect(panel.hidden).toBe(false)
    hasTextFocus = false
  })
  if (staleFocus) {
    document.querySelector('.editor-group-container').focus()
    hasTextFocus = true
  } else {
    input.focus()
  }
  const locator = (selector: string): any => ({
    selector,
    locator: (child: string) => locator(`${selector} ${child}`),
    first: () => locator(selector),
    focus: async () => document.querySelector(selector).focus(),
    blur: async () => document.querySelector(selector).blur(),
    isVisible: async () => !panel.hidden,
    click: async () => {
      // Hiding a focused native input can miss its blur notification on macOS.
      panel.hidden = true
      expect(hasTextFocus).toBe(false)
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
    page: { locator, waitForIdle: async () => {} },
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
