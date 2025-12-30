import { expect, test } from '@jest/globals'
import * as ExtractItemsFromData from '../src/parts/ExtractItemsFromData/ExtractItemsFromData.ts'

test('extractItemsFromData - extracts items from array', () => {
  const data = [{ name: 'test1' }, { name: 'test2' }]
  const result = ExtractItemsFromData.extractItemsFromData(data)
  expect(result).toEqual(data)
  expect(result).toHaveLength(2)
})

test('extractItemsFromData - extracts items from namedFunctionCount3', () => {
  const items = [{ name: 'test1' }, { name: 'test2' }]
  const data = { namedFunctionCount3: items, other: 'data' }
  const result = ExtractItemsFromData.extractItemsFromData(data)
  expect(result).toEqual(items)
  expect(result).toHaveLength(2)
})

test('extractItemsFromData - extracts items from namedFunctionCount2', () => {
  const items = [{ name: 'test1' }]
  const data = { namedFunctionCount2: items, other: 'data' }
  const result = ExtractItemsFromData.extractItemsFromData(data)
  expect(result).toEqual(items)
  expect(result).toHaveLength(1)
})

test('extractItemsFromData - prefers namedFunctionCount3 over namedFunctionCount2', () => {
  const items3 = [{ name: 'test3' }]
  const items2 = [{ name: 'test2' }]
  const data = { namedFunctionCount3: items3, namedFunctionCount2: items2 }
  const result = ExtractItemsFromData.extractItemsFromData(data)
  expect(result).toEqual(items3)
})

test('extractItemsFromData - returns empty array when no valid items found', () => {
  const data = { other: 'data' }
  const result = ExtractItemsFromData.extractItemsFromData(data)
  expect(result).toEqual([])
})

test('extractItemsFromData - returns empty array when namedFunctionCount2 is not an array', () => {
  const data = { namedFunctionCount2: 'not-an-array' }
  const result = ExtractItemsFromData.extractItemsFromData(data)
  expect(result).toEqual([])
})

test('extractItemsFromData - returns empty array when namedFunctionCount3 is not an array', () => {
  const data = { namedFunctionCount3: 'not-an-array' }
  const result = ExtractItemsFromData.extractItemsFromData(data)
  expect(result).toEqual([])
})

