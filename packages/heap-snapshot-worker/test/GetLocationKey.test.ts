import { test, expect } from '@jest/globals'
import { getLocationKey } from '../src/parts/GetLocationKey/GetLocationKey.ts'

test('should create location key with basic values', () => {
  const result = getLocationKey(1, 10, 5)
  expect(result).toBe('1:10:5')
})

test('should create location key with zero values', () => {
  const result = getLocationKey(0, 0, 0)
  expect(result).toBe('0:0:0')
})

test('should create location key with large values', () => {
  const result = getLocationKey(9999, 1000, 500)
  expect(result).toBe('9999:1000:500')
})

test('should create location key with negative values', () => {
  const result = getLocationKey(-1, -10, -5)
  expect(result).toBe('-1:-10:-5')
})

test('should create location key with mixed positive and negative values', () => {
  const result = getLocationKey(5, -10, 0)
  expect(result).toBe('5:-10:0')
})

test('should handle decimal values by converting to string', () => {
  const result = getLocationKey(1.5, 10.2, 5.7)
  expect(result).toBe('1.5:10.2:5.7')
})

test('should handle undefined values', () => {
  const result = getLocationKey(undefined, undefined, undefined)
  expect(result).toBe('undefined:undefined:undefined')
})

test('should handle null values', () => {
  const result = getLocationKey(null, null, null)
  expect(result).toBe('null:null:null')
})

test('should handle string values', () => {
  const result = getLocationKey('script1', 'line10', 'col5')
  expect(result).toBe('script1:line10:col5')
})

test('should handle mixed types', () => {
  const result = getLocationKey(1, 'line10', null)
  expect(result).toBe('1:line10:null')
})

test('should create unique keys for different combinations', () => {
  const key1 = getLocationKey(1, 10, 5)
  const key2 = getLocationKey(1, 10, 6)
  const key3 = getLocationKey(1, 11, 5)
  const key4 = getLocationKey(2, 10, 5)

  expect(key1).toBe('1:10:5')
  expect(key2).toBe('1:10:6')
  expect(key3).toBe('1:11:5')
  expect(key4).toBe('2:10:5')

  // All keys should be different
  const keys = [key1, key2, key3, key4]
  const uniqueKeys = new Set(keys)
  expect(uniqueKeys.size).toBe(4)
})

test('should create same key for same inputs', () => {
  const key1 = getLocationKey(1, 10, 5)
  const key2 = getLocationKey(1, 10, 5)
  expect(key1).toBe(key2)
})
