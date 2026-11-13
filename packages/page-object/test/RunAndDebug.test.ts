/** @jest-environment jsdom */
import { expect, jest, test } from '@jest/globals'
import * as RunAndDebug from '../src/parts/RunAndDebug/RunAndDebug.ts'

const document = (globalThis as any).document
const stopButtonClick = jest.fn()

const locator = (selector: string): any => ({
  selector,
  locator: (child: string) => locator(`${selector} ${child}`),
  first: () => locator(selector),
  click: stopButtonClick,
})

const createDebugger = (label: string) => {
  document.body.innerHTML = `
    <div class="debug-toolbar"><button aria-label="Stop"></button><button class="codicon-debug-continue"></button></div>
    <div class="debug-top-stack-frame-column"></div>
    <div class="debug-call-stack">
      <div class="monaco-list-row selected" aria-label="Session index.js [8644] « Launch Program Paused on breakpoint">
        <span class="state label">Paused on breakpoint</span>
      </div>
      <div class="monaco-list-row" aria-setsize="2"><div class="stack-frame"></div></div>
      <div class="monaco-list-row" aria-label="Stack Frame caller, line 20, index.js"><div class="stack-frame"></div></div>
    </div>
    <div class="part editor"><div class="monaco-editor">
      <div class="cursor" style="top: 57px"></div>
      <div role="textbox" aria-roledescription="editor" tabindex="0"></div>
    </div></div>`
  document.querySelector('.monaco-list-row[aria-setsize]').setAttribute('aria-label', label)
  document.querySelector('[role="textbox"]').focus()
  return RunAndDebug.create({
    electronApp: {},
    expect: (element: any) => ({
      toBeVisible: async () => expect(document.querySelector(element.selector)).not.toBeNull(),
      toBeHidden: async ({ timeout }: { timeout?: number } = {}) => {
        if (element.selector.includes('[aria-label^="Stop"]')) {
          expect(timeout).toBe(30_000)
        }
      },
      toHaveText: async (pattern: RegExp) => expect(document.querySelector(element.selector).textContent).toMatch(pattern),
      toHaveAttribute: async (name: string, value: string | RegExp) => {
        const actual = document.querySelector(element.selector).getAttribute(name)
        if (value instanceof RegExp) {
          expect(actual).toMatch(value)
        } else {
          expect(actual).toBe(value)
        }
      },
      toHaveCss: async (name: string, value: string) => expect(document.querySelector(element.selector).style[name]).toBe(value),
      toBeFocused: async () => expect(document.querySelector(element.selector)).toBe(document.activeElement),
    }),
    ideVersion: { major: 1, minor: 110, patch: 0 },
    page: { locator, waitForIdle: async () => {} },
    platform: 'win32',
    VError: Error,
  })
}

test.each(['index.js', 'C:\\workspace\\index.js', '/workspace/index.js'])(
  'waitForPaused checks the top stack frame when the session row is selected (%s)',
  async (file) => {
    const debuggerView = createDebugger(`Stack Frame <anonymous>, line 4, ${file}`)
    await debuggerView.waitForPaused({ callStackSize: 2, file: 'index.js', line: 4 })
  },
)

test('waitForPausedOnException checks the stack frame when the session row is selected', async () => {
  const debuggerView = createDebugger('Stack Frame <anonymous>, line 4, index.js')
  await debuggerView.waitForPausedOnException({ file: 'index.js', line: 4 })
})

test.each(['Stack Frame <anonymous>, line 5, index.js', 'Stack Frame <anonymous>, line 4, other.js'])(
  'waitForPaused rejects an unexpected top frame (%s)',
  async (label) => {
    const debuggerView = createDebugger(label)
    // A matching caller must not hide an incorrect top frame.
    document.querySelector('.monaco-list-row:last-child').setAttribute('aria-label', 'Stack Frame <anonymous>, line 4, index.js')
    await expect(debuggerView.waitForPaused({ file: 'index.js', line: 4 })).rejects.toThrow()
  },
)

test('waitForPaused rejects a paused session without any stack frames', async () => {
  const debuggerView = createDebugger('Stack Frame <anonymous>, line 4, index.js')
  for (const frame of document.querySelectorAll('.monaco-list-row:has(.stack-frame)')) {
    frame.remove()
  }
  await expect(debuggerView.waitForPaused({ file: 'index.js', line: 4 })).rejects.toThrow()
})

test('stop clicks the toolbar stop action and waits for the debugger to stop', async () => {
  stopButtonClick.mockClear()
  const debuggerView = createDebugger('Stack Frame <anonymous>, line 4, index.js')
  await debuggerView.stop()
  expect(stopButtonClick).toHaveBeenCalledTimes(1)
})
