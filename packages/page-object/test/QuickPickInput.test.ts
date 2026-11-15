/** @jest-environment jsdom */
import { expect, test } from '@jest/globals'
import * as QuickPick from '../src/parts/QuickPick/QuickPick.ts'

const document = (globalThis as any).document

const locator = (selector: string): any => ({
  selector,
  locator: (child: string) => locator(`${selector} ${child}`),
  type: async (value: string) => {
    document.querySelector(selector).value = value
  },
})

test.each([
  { major: 1, minor: 50, patch: 0, wrapper: 'wrapper' },
  { major: 1, minor: 50, patch: 1, wrapper: 'wrapper' },
  { major: 1, minor: 52, patch: 1, wrapper: 'wrapper' },
  { major: 1, minor: 53, patch: 0, wrapper: 'ibwrapper' },
  { major: 1, minor: 145, patch: 0, wrapper: 'ibwrapper' },
  { major: 2, minor: 0, patch: 0, wrapper: 'ibwrapper' },
])('quick pick input supports VS Code $major.$minor.$patch', async ({ major, minor, patch, wrapper }) => {
  document.body.innerHTML = `
    <div class="monaco-inputbox"><div class="${wrapper}"><input class="input"></div></div>
    <div class="quick-input-widget">
      <div class="quick-input-box"><div class="monaco-inputbox">
        <div class="${wrapper}"><input class="input"></div>
      </div></div>
    </div>`
  const input = document.querySelector('.quick-input-widget input')
  input.focus()
  const quickPick = QuickPick.create({
    electronApp: {},
    expect: (element: any) => ({
      toBeVisible: async () => expect(document.querySelector(element.selector)).not.toBeNull(),
      toBeFocused: async () => expect(document.querySelector(element.selector)).toBe(document.activeElement),
    }),
    ideVersion: { major, minor, patch },
    page: { locator, waitForIdle: async () => {} },
    platform: 'linux',
    VError: Error,
  })

  await quickPick.type('View: Toggle Activity Bar Visibility')

  expect(input.value).toBe('View: Toggle Activity Bar Visibility')
  expect(document.querySelector('input').value).toBe('')
})
