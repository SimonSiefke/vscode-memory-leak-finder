import { expect, test } from '@jest/globals'
import * as Json from '../src/parts/Json/Json.ts'

test('stringify should convert object to JSON string', () => {
  const result = Json.stringify({ key: 'value' })
  expect(result).toBe('{"key":"value"}')
})

test('stringify should convert array to JSON string', () => {
  const result = Json.stringify([1, 2, 3])
  expect(result).toBe('[1,2,3]')
})

test('stringify should convert primitive values', () => {
  expect(Json.stringify('hello')).toBe('"hello"')
  expect(Json.stringify(123)).toBe('123')
  expect(Json.stringify(true)).toBe('true')
  expect(Json.stringify(null)).toBe('null')
})
