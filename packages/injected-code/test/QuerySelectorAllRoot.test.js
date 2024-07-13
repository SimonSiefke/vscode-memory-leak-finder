/**
 * @jest-environment jsdom
 */
import * as QuerySelectorAllRoot from '../src/parts/QuerySelectorAllRoot/QuerySelectorAllRoot.js'
import { test, expect } from '@jest/globals'

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

test('querySelectorAll - text - match', () => {
  const root = document.createElement('div')
  const element = document.createElement('div')
  element.textContent = 'test'
  root.append(element)
  const selector = ':has-text("test")'
  expect(QuerySelectorAllRoot.querySelectorAll(root, selector)).toEqual([root])
})

test('querySelectorAll - text - no match', () => {
  const root = document.createElement('div')
  const element = document.createElement('div')
  root.append(element)
  const selector = ':has-text("test")'
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
  const selector = ':has-text("Preferences: Open Keyboard Shortcuts")'
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
