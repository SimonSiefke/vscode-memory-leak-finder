/** @jest-environment jsdom */
import { expect, test } from '@jest/globals'
import * as Editor from '../src/parts/Editor/Editor.ts'

const document = (globalThis as any).document

// Resolve selectors on every assertion, just as the browser does while polling.
const locator = (selector: string): any => ({
  selector,
  locator: (child: string) => locator(`${selector} ${child}`),
  first: () => locator(selector),
  count: async () => document.querySelectorAll(selector).length,
  focus: async () => document.querySelector(selector).focus(),
})

test.each(['textarea', 'native', 'switch-on-focus'])('editor focus and readiness accept %s input on 1.100', async (mode) => {
  document.body.innerHTML = `<div class="editor-instance" aria-label="file.txt">${
    mode === 'native' ? '<div class="native-edit-context" tabindex="0"></div>' : '<textarea class="inputarea"></textarea>'
  }</div>`
  if (mode === 'switch-on-focus') {
    document.querySelector('textarea').addEventListener('focus', () => {
      document.querySelector('.editor-instance').innerHTML = '<div class="native-edit-context" tabindex="0"></div>'
      document.querySelector('.native-edit-context').focus()
    })
  }
  const api = Editor.create({
    electronApp: {},
    expect: (element: any) => ({
      toBeVisible: async () => expect(document.querySelector(element.selector)).not.toBeNull(),
      toBeFocused: async ({ descendantSelector = '' } = {}) => {
        expect(element.selector).not.toContain(':focus')
        const target = document.querySelector(element.selector)
        if (descendantSelector) {
          expect(target.contains(document.activeElement)).toBe(true)
          expect(document.activeElement.matches(descendantSelector)).toBe(true)
        } else {
          expect(target).toBe(document.activeElement)
        }
      },
    }),
    ideVersion: { major: 1, minor: 100, patch: 0 },
    page: { locator, waitForIdle: async () => {} },
    platform: 'linux',
    VError: Error,
  })

  await api.focus()
  await api.waitforTextFileReady('file.txt')
  expect(document.activeElement.className).toBe(mode === 'textarea' ? 'inputarea' : 'native-edit-context')
})
