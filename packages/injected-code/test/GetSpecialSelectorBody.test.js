import * as GetSpecialSelectorBody from '../src/parts/GetSpecialSelectorBody/GetSpecialSelectorBody.js'
import { test, expect } from '@jest/globals'

test('getSpecialSelectorBody - text with colon', () => {
  const selector = 'h1:has-text("test: test")'
  const i = 2
  const specialSelector = ':has-text('
  expect(GetSpecialSelectorBody.getSpecialSelectorBody(selector, i, specialSelector)).toBe(':has-text("test: test")')
})
