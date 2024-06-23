/**
 * @jest-environment jsdom
 */
import * as QuerySelectorAllRoot from '../src/parts/QuerySelectorAllRoot/QuerySelectorAllRoot.js'
import { test, expect } from '@jest/globals'

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
  expect(QuerySelectorAllRoot.querySelectorAll(root, selector)).toEqual([element])
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

test('querySelectorAll - alternative text selector', () => {
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
  expect(QuerySelectorAllRoot.querySelectorAll(root, selector)).toEqual([element])
})
