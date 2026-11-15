import { test, expect } from '@jest/globals'
/**
 * @jest-environment jsdom
 */
import * as QuerySelectorAllRoot from '../src/parts/QuerySelectorAllRoot/QuerySelectorAllRoot.ts'

test('querySelector - match', () => {
  const root = document.createElement('div')
  const element = document.createElement('h1')
  root.append(element)
  const selector = 'h1'
  expect(QuerySelectorAllRoot.querySelector(root, selector)).toEqual(element)
})

test('querySelectorAll - html element - match', () => {
  const root = document.createElement('div')
  const element = document.createElement('h1')
  root.append(element)
  const selector = 'h1'
  expect(QuerySelectorAllRoot.querySelectorAll(root, selector)).toEqual([element])
})

test('querySelectorAll - html element - no match', () => {
  const root = document.createElement('div')
  const element = document.createElement('h2')
  root.append(element)
  const selector = 'h1'
  expect(QuerySelectorAllRoot.querySelectorAll(root, selector)).toEqual([])
})

test('querySelectorAll - role - match', () => {
  const root = document.createElement('div')
  const element = document.createElement('div')
  element.setAttribute('role', 'main')
  root.append(element)
  const selector = '[role="main"]'
  expect(QuerySelectorAllRoot.querySelectorAll(root, selector)).toEqual([element])
})

test('querySelectorAll - role - no match', () => {
  const root = document.createElement('div')
  const element = document.createElement('div')
  root.append(element)
  const selector = '[role="main"]'
  expect(QuerySelectorAllRoot.querySelectorAll(root, selector)).toEqual([])
})

test('querySelectorAll - id - match', () => {
  const root = document.createElement('div')
  const element = document.createElement('div')
  element.id = 'Main'
  root.append(element)
  const selector = '#Main'
  expect(QuerySelectorAllRoot.querySelectorAll(root, selector)).toEqual([element])
})

test('querySelectorAll - id - no match', () => {
  const root = document.createElement('div')
  const element = document.createElement('div')
  root.append(element)
  const selector = '#Main'
  expect(QuerySelectorAllRoot.querySelectorAll(root, selector)).toEqual([])
})

test('querySelectorAll - class - match', () => {
  const root = document.createElement('div')
  const element = document.createElement('div')
  element.className = 'Main'
  root.append(element)
  const selector = '.Main'
  expect(QuerySelectorAllRoot.querySelectorAll(root, selector)).toEqual([element])
})

test('querySelectorAll - class - no match', () => {
  const root = document.createElement('div')
  const element = document.createElement('div')
  root.append(element)
  const selector = '.Main'
  expect(QuerySelectorAllRoot.querySelectorAll(root, selector)).toEqual([])
})

test('querySelectorAll - has selector fallback', () => {
  const root = document.createElement('div')
  const first = document.createElement('div')
  first.className = 'action-item'
  const label = document.createElement('span')
  label.className = 'action-label'
  label.setAttribute('aria-label', 'Source Control (3)')
  first.append(label)
  const second = document.createElement('div')
  second.className = 'action-item'
  second.append(document.createElement('span'))
  root.append(first, second)
  const nativeQuerySelectorAll = root.querySelectorAll.bind(root)
  root.querySelectorAll = ((selector: string) => {
    if (selector.includes(':has(')) throw new DOMException('unsupported selector', 'SyntaxError')
    return nativeQuerySelectorAll(selector)
  }) as typeof root.querySelectorAll
  expect(QuerySelectorAllRoot.querySelectorAll(root, '.action-item:has(.action-label[aria-label^="Source Control"])')).toEqual([first])
})

test('querySelectorAll - has selector fallback preserves list order and root boundaries', () => {
  const root = document.createElement('div')
  const first = document.createElement('span')
  first.className = 'first'
  first.append(document.createElement('i'))
  const second = document.createElement('span')
  second.className = 'second'
  second.append(document.createElement('i'))
  root.append(first, second)
  root.querySelectorAll = ((selector: string) => {
    if (selector.includes(':has(')) throw new DOMException('unsupported selector', 'SyntaxError')
    return Element.prototype.querySelectorAll.call(root, selector)
  }) as typeof root.querySelectorAll
  expect(QuerySelectorAllRoot.querySelectorAll(root, '.second:has(i), .first:has(i)')).toEqual([first, second])
  expect(QuerySelectorAllRoot.querySelectorAll(first, ':has(i)')).toEqual([])
})

test('querySelectorAll - text - match', () => {
  const root = document.createElement('div')
  const element = document.createElement('div')
  element.textContent = 'test'
  root.append(element)
  const selector = ':has-exact-text("test")'
  expect(QuerySelectorAllRoot.querySelectorAll(root, selector)).toEqual([root])
})

test('querySelectorAll - text - no match', () => {
  const root = document.createElement('div')
  const element = document.createElement('div')
  root.append(element)
  const selector = ':has-exact-text("test")'
  expect(QuerySelectorAllRoot.querySelectorAll(root, selector)).toEqual([])
})

test('querySelectorAll - element with text', () => {
  const root = document.createElement('div')
  const element1 = document.createElement('h1')
  element1.textContent = '1'
  const element2 = document.createElement('h1')
  element2.textContent = '2'
  root.append(element1, element2)
  const selector = 'h1:has-text("1")'
  expect(QuerySelectorAllRoot.querySelectorAll(root, selector)).toEqual([element1])
})

test.skip('querySelectorAll - alternative text selector', () => {
  const root = document.createElement('div')
  const element1 = document.createElement('h1')
  element1.textContent = '1'
  const element2 = document.createElement('h1')
  element2.textContent = '2'
  root.append(element1, element2)
  const selector = 'text=1'
  expect(QuerySelectorAllRoot.querySelectorAll(root, selector)).toEqual([element1])
})

test('querySelectorAll - text with colon', () => {
  const root = document.createElement('div')
  const element = document.createElement('h1')
  element.textContent = 'Preferences: Open Keyboard Shortcuts'
  root.append(element)
  const selector = ':has-exact-text("Preferences: Open Keyboard Shortcuts")'
  expect(QuerySelectorAllRoot.querySelectorAll(root, selector)).toEqual([root])
})

test('querySelectorAll - element with exact text - no exact match', () => {
  const root = document.createElement('div')
  const element = document.createElement('h1')
  const child1 = document.createElement('span')
  child1.textContent = 'abc'
  const child2 = document.createElement('span')
  child2.textContent = 'def'
  element.append(child1, child2)
  root.append(element)
  const selector = 'h1:has-exact-text("abc")'
  expect(QuerySelectorAllRoot.querySelectorAll(root, selector)).toEqual([])
})

test('querySelectorAll - element with exact text - exact match', () => {
  const root = document.createElement('div')
  const element = document.createElement('h1')
  element.textContent = 'abc'
  root.append(element)
  const selector = 'h1:has-exact-text("abc")'
  expect(QuerySelectorAllRoot.querySelectorAll(root, selector)).toEqual([element])
})

test('querySelectorAll - element with exact text - child element match', () => {
  const root = document.createElement('div')
  const element = document.createElement('h1')
  const child1 = document.createElement('span')
  child1.textContent = 'abc'
  const child2 = document.createElement('span')
  child2.textContent = 'def'
  element.append(child1, child2)
  root.append(element)
  const selector = 'h1 *:has-exact-text("abc")'
  expect(QuerySelectorAllRoot.querySelectorAll(root, selector)).toEqual([child1])
})
