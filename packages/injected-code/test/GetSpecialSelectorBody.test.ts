import { test, expect } from '@jest/globals'
import * as GetSpecialSelectorBody from '../src/parts/GetSpecialSelectorBody/GetSpecialSelectorBody.ts'

test('getSpecialSelectorBody - text with colon', () => {
  const selector = 'h1:has-text("test: test")'
  const i = 2
  const specialSelector = ':has-text('
  expect(GetSpecialSelectorBody.getSpecialSelectorBody(selector, i, specialSelector)).toBe(':has-text("test: test")')
})
