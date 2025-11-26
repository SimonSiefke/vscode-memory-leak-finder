import { test, expect } from '@jest/globals'
import { isChromeInternalArrayName } from '../src/parts/IsChromeInternalArrayName/IsChromeInternalArrayName.ts'

test('isChromeInternalArrayName - returns true for names starting with <dummy>', () => {
  expect(isChromeInternalArrayName('<dummy>')).toBe(true)
  expect(isChromeInternalArrayName('<dummy>/system')).toBe(true)
  expect(isChromeInternalArrayName('<dummy>/system / WeakFixedArray')).toBe(true)
})

test('isChromeInternalArrayName - returns true for names containing <', () => {
  expect(isChromeInternalArrayName('<symbol>')).toBe(true)
  expect(isChromeInternalArrayName('some<thing>')).toBe(true)
  expect(isChromeInternalArrayName('name/<internal>')).toBe(true)
})

test('isChromeInternalArrayName - returns true for WeakMap references', () => {
  expect(isChromeInternalArrayName('part of key (Object @2256075) -> value (Array @1672095) pair in WeakMap (table @1574603)')).toBe(true)
  expect(isChromeInternalArrayName('something WeakMap something')).toBe(true)
  expect(isChromeInternalArrayName('pair in WeakMap')).toBe(true)
  expect(isChromeInternalArrayName('part of key')).toBe(true)
})

test('isChromeInternalArrayName - returns true for names containing system', () => {
  expect(isChromeInternalArrayName('system')).toBe(true)
  expect(isChromeInternalArrayName('system / WeakFixedArray')).toBe(true)
  expect(isChromeInternalArrayName('name/system/other')).toBe(true)
  expect(isChromeInternalArrayName('System')).toBe(false)
  expect(isChromeInternalArrayName('SYSTEM')).toBe(false)
})

test('isChromeInternalArrayName - returns true for numeric-only names', () => {
  expect(isChromeInternalArrayName('102')).toBe(true)
  expect(isChromeInternalArrayName('150')).toBe(true)
  expect(isChromeInternalArrayName('102/188/28')).toBe(true)
  expect(isChromeInternalArrayName('150 / 188 / 28')).toBe(true)
  expect(isChromeInternalArrayName('102/188/28')).toBe(true)
})

test('isChromeInternalArrayName - returns true for Map internal types', () => {
  expect(isChromeInternalArrayName('Map (UncachedExternalInternalizedOneByteString)')).toBe(true)
  expect(isChromeInternalArrayName('Map (Internalized)')).toBe(true)
  expect(isChromeInternalArrayName('system / Map (UncachedExternalInternalizedOneByteString)')).toBe(true)
})

test('isChromeInternalArrayName - returns true for transition_info', () => {
  expect(isChromeInternalArrayName('transition_info')).toBe(true)
  expect(isChromeInternalArrayName('transition_info/other')).toBe(true)
  expect(isChromeInternalArrayName('other/transition_info')).toBe(true)
  expect(isChromeInternalArrayName('name/transition_info/other')).toBe(true)
})

test('isChromeInternalArrayName - returns false for valid user array names', () => {
  expect(isChromeInternalArrayName('problemMatchers')).toBe(false)
  expect(isChromeInternalArrayName('configurationProperties.problemMatchers')).toBe(false)
  expect(isChromeInternalArrayName('configSchema.properties/settings.items')).toBe(false)
  expect(isChromeInternalArrayName('myArray')).toBe(false)
  expect(isChromeInternalArrayName('items')).toBe(false)
  expect(isChromeInternalArrayName('enum')).toBe(false)
  expect(isChromeInternalArrayName('type')).toBe(false)
})

test('isChromeInternalArrayName - returns false for names with numbers but not numeric-only', () => {
  expect(isChromeInternalArrayName('array1')).toBe(false)
  expect(isChromeInternalArrayName('item2')).toBe(false)
  expect(isChromeInternalArrayName('name123')).toBe(false)
  expect(isChromeInternalArrayName('102items')).toBe(false)
  expect(isChromeInternalArrayName('items102')).toBe(false)
  expect(isChromeInternalArrayName('name/102items')).toBe(false)
})

test('isChromeInternalArrayName - returns false for edge cases', () => {
  expect(isChromeInternalArrayName('')).toBe(false)
  expect(isChromeInternalArrayName(null as any)).toBe(false)
  expect(isChromeInternalArrayName(undefined as any)).toBe(false)
  expect(isChromeInternalArrayName(123 as any)).toBe(false)
})

test('isChromeInternalArrayName - returns false for Map without internal types', () => {
  expect(isChromeInternalArrayName('Map')).toBe(false)
  expect(isChromeInternalArrayName('myMap')).toBe(false)
  expect(isChromeInternalArrayName('Map (UserDefined)')).toBe(false)
})
