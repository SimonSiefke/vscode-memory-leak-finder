import { test, expect } from '@jest/globals'
/**
 * @jest-environment jsdom
 */
import * as QuerySelectorAllInternalEnterFrame from '../src/parts/QuerySelectorAllInternalEnterFrame/QuerySelectorAllInternalEnterFrame.ts'

test('no elements found', () => {
  const roots: readonly Element[] = []
  expect(QuerySelectorAllInternalEnterFrame.querySelectorAll(roots, '', '')).toEqual([])
})

test('too many elements found', () => {
  const roots = [document.createElement('div'), document.createElement('div')]
  expect(() => QuerySelectorAllInternalEnterFrame.querySelectorAll(roots, '', '')).toThrow(
    new Error('too many matching iframe elements found'),
  )
})

test('element is not of type iframe', () => {
  const roots = [document.createElement('div')]
  expect(() => QuerySelectorAllInternalEnterFrame.querySelectorAll(roots, '', '')).toThrow(new Error('node is not of type iframe'))
})

test('select inside iframe', () => {
  const element = {
    contentDocument: {
      querySelectorAll() {},
    },
    nodeName: 'IFRAME',
  } as unknown as Element
  const roots: readonly Element[] = [element]
  expect(QuerySelectorAllInternalEnterFrame.querySelectorAll(roots, '', '')).toEqual([element.contentDocument])
})
