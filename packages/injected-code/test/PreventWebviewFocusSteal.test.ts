import { test, expect, beforeEach, afterEach } from '@jest/globals'
import { install, uninstall } from '../src/parts/PreventWebviewFocusSteal/PreventWebviewFocusSteal.ts'

// Mock DOM environment
const mockElement = {
  className: 'normal-element',
  classList: { contains: (cls: string) => cls === 'normal-element' },
  parentElement: null,
  tagName: 'DIV',
  hasAttribute: () => false
}

const mockWebviewElement = {
  className: 'webview',
  classList: { contains: (cls: string) => cls === 'webview' },
  parentElement: null,
  tagName: 'DIV',
  hasAttribute: () => false
}

test('install should override HTMLElement.prototype.focus', () => {
  const originalFocus = HTMLElement.prototype.focus
  install()
  expect(HTMLElement.prototype.focus).not.toBe(originalFocus)
  uninstall()
  expect(HTMLElement.prototype.focus).toBe(originalFocus)
})

test('uninstall should restore original focus behavior', () => {
  const originalFocus = HTMLElement.prototype.focus
  install()
  uninstall()
  expect(HTMLElement.prototype.focus).toBe(originalFocus)
})

test('should not allow double installation', () => {
  const originalFocus = HTMLElement.prototype.focus
  install()
  const firstOverride = HTMLElement.prototype.focus
  install() // Second install should be ignored
  expect(HTMLElement.prototype.focus).toBe(firstOverride)
  uninstall()
  expect(HTMLElement.prototype.focus).toBe(originalFocus)
})