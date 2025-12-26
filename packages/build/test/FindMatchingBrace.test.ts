import { expect, test } from '@jest/globals'
import { findMatchingBrace } from '../src/generateApiTypes/FindMatchingBrace.ts'

test('findMatchingBrace - simple braces', () => {
  const str = '{ hello }'
  const result = findMatchingBrace(str, 0)
  expect(result).toBe(8)
})

test('findMatchingBrace - nested braces', () => {
  const str = '{ outer { inner } }'
  const result = findMatchingBrace(str, 0)
  expect(result).toBe(18)
})

test('findMatchingBrace - no matching brace', () => {
  const str = '{ unclosed'
  const result = findMatchingBrace(str, 0)
  expect(result).toBe(-1)
})

test('findMatchingBrace - multiple nested levels', () => {
  const str = '{ level1 { level2 { level3 } } }'
  const result = findMatchingBrace(str, 0)
  expect(result).toBe(31)
})

test('findMatchingBrace - starting from middle', () => {
  const str = 'prefix { inner } suffix'
  const result = findMatchingBrace(str, 7)
  expect(result).toBe(15)
})
