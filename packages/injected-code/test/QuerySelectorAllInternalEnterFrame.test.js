/**
 * @jest-environment jsdom
 */
import * as QuerySelectorAllInternalEnterFrame from '../src/parts/QuerySelectorAllInternalEnterFrame/QuerySelectorAllInternalEnterFrame.js'
import { test, expect } from '@jest/globals'

test('no elements found', () => {
  const roots = []
  expect(QuerySelectorAllInternalEnterFrame.querySelectorAll(roots)).toEqual([])
})

test('too many elements found', () => {
  const roots = [document.createElement('div'), document.createElement('div')]
  expect(() => QuerySelectorAllInternalEnterFrame.querySelectorAll(roots)).toThrow(new Error('too many matching iframe elements found'))
})

test('element is not of type iframe', () => {
  const roots = [document.createElement('div')]
  expect(() => QuerySelectorAllInternalEnterFrame.querySelectorAll(roots)).toThrow(new Error('node is not of type iframe'))
})

test('select inside iframe', () => {
  const h1 = document.createElement('h1')
  const element = {
    nodeName: 'IFRAME',
    contentDocument: {
      querySelectorAll(selector) {
        return [h1]
      },
    },
  }
  const roots = [element]
  expect(QuerySelectorAllInternalEnterFrame.querySelectorAll(roots)).toEqual([h1])
})
