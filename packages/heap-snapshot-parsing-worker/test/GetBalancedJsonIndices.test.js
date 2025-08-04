import { test, expect } from '@jest/globals'
import { getBalancedJsonIndices } from '../src/parts/GetBalancedJsonIndices/GetBalancedJsonIndices.js'

test('getBalancedJsonIndices - finds balanced object with simple content', () => {
  const data = '{"key": "value"}'
  const result = getBalancedJsonIndices(data, 0)

  expect(result).toBe(data.length)
})

test('getBalancedJsonIndices - finds balanced object with nested content', () => {
  const data = '{"key": {"nested": "value"}}'
  const result = getBalancedJsonIndices(data, 0)

  expect(result).toBe(data.length)
})

test('getBalancedJsonIndices - finds balanced object with array content', () => {
  const data = '{"key": [1, 2, 3]}'
  const result = getBalancedJsonIndices(data, 0)

  expect(result).toBe(data.length)
})

test('getBalancedJsonIndices - finds balanced object with quoted strings containing brackets', () => {
  const data = '{"key": "value with {brackets} and [arrays]"}'
  const result = getBalancedJsonIndices(data, 0)

  expect(result).toBe(data.length)
})

test('getBalancedJsonIndices - returns -1 for unbalanced object', () => {
  const data = '{"key": "value"'
  const result = getBalancedJsonIndices(data, 0)

  expect(result).toBe(-1)
})

test('getBalancedJsonIndices - returns -1 for missing closing quote', () => {
  const data = '{"key": "value'
  const result = getBalancedJsonIndices(data, 0)

  expect(result).toBe(-1)
})

test('getBalancedJsonIndices - handles nested objects correctly', () => {
  const data = '{"outer": {"inner": "value"}}'
  const result = getBalancedJsonIndices(data, 0)

  expect(result).toBe(data.length)
})

test('getBalancedJsonIndices - handles multiple nested levels', () => {
  const data = '{"level1": {"level2": {"level3": "value"}}}'
  const result = getBalancedJsonIndices(data, 0)

  expect(result).toBe(data.length)
})

test('getBalancedJsonIndices - handles arrays within objects', () => {
  const data = '{"key": [{"item": "value"}]}'
  const result = getBalancedJsonIndices(data, 0)

  expect(result).toBe(data.length)
})

test('getBalancedJsonIndices - handles objects within arrays', () => {
  const data = '{"key": [{"item": "value"}, {"item2": "value2"}]}'
  const result = getBalancedJsonIndices(data, 0)

  expect(result).toBe(data.length)
})

test('getBalancedJsonIndices - handles escaped quotes in strings', () => {
  const data = '{"key": "value with \\"quotes\\""}'
  const result = getBalancedJsonIndices(data, 0)

  expect(result).toBe(data.length)
})

test('getBalancedJsonIndices - starts from specified index', () => {
  const data = 'prefix{"key": "value"}suffix'
  const result = getBalancedJsonIndices(data, 6) // Start after "prefix"

  expect(result).toBe(6 + '{"key": "value"}'.length)
})

test('getBalancedJsonIndices - handles empty object', () => {
  const data = '{}'
  const result = getBalancedJsonIndices(data, 0)

  expect(result).toBe(data.length)
})

test('getBalancedJsonIndices - handles object with only whitespace', () => {
  const data = '{   }'
  const result = getBalancedJsonIndices(data, 0)

  expect(result).toBe(data.length)
})

test('getBalancedJsonIndices - handles square brackets in strings', () => {
  const data = '{"key": "value with [brackets]"}'
  const result = getBalancedJsonIndices(data, 0)

  expect(result).toBe(data.length)
})

test('getBalancedJsonIndices - handles curly braces in strings', () => {
  const data = '{"key": "value with {braces}"}'
  const result = getBalancedJsonIndices(data, 0)

  expect(result).toBe(data.length)
})

test('getBalancedJsonIndices - handles mixed brackets in strings', () => {
  const data = '{"key": "value with {braces} and [brackets]"}'
  const result = getBalancedJsonIndices(data, 0)

  expect(result).toBe(data.length)
})

test('getBalancedJsonIndices - handles object starting with curly brace', () => {
  const data = '{"key": "value"}'
  const result = getBalancedJsonIndices(data, 0)

  expect(result).toBe(data.length)
})

test('getBalancedJsonIndices - handles object with complex nested structure', () => {
  const data = '{"key1": {"key2": [{"key3": "value1"}, {"key4": "value2"}]}, "key5": "value3"}'
  const result = getBalancedJsonIndices(data, 0)

  expect(result).toBe(data.length)
})
