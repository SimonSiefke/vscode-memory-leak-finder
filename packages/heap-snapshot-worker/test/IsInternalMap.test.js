import { test, expect } from '@jest/globals'
import { isInternalMap } from '../src/parts/IsInternalMap/IsInternalMap.js'

test('should return true for valid property edges', () => {
  expect(isInternalMap('property', 'myProperty')).toBe(true)
  expect(isInternalMap('property', 'data')).toBe(true)
  expect(isInternalMap('property', 'value')).toBe(true)
  expect(isInternalMap('property', 'name')).toBe(true)
})

test('should return false for constructor property', () => {
  expect(isInternalMap('property', 'constructor')).toBe(false)
})

test('should return false for __proto__ property', () => {
  expect(isInternalMap('property', '__proto__')).toBe(false)
})

test('should return false for prototype property', () => {
  expect(isInternalMap('property', 'prototype')).toBe(false)
})

test('should return false for symbol properties', () => {
  expect(isInternalMap('property', '<symbol>')).toBe(false)
  expect(isInternalMap('property', '<symbol:Symbol.iterator>')).toBe(false)
  expect(isInternalMap('property', '<symbol:Symbol.toStringTag>')).toBe(false)
})

test('should return false for non-property edge types', () => {
  expect(isInternalMap('element', 'myProperty')).toBe(false)
  expect(isInternalMap('internal', 'myProperty')).toBe(false)
  expect(isInternalMap('weak', 'myProperty')).toBe(false)
  expect(isInternalMap('hidden', 'myProperty')).toBe(false)
})

test('should return false for empty strings', () => {
  expect(isInternalMap('property', '')).toBe(true)
  expect(isInternalMap('', 'myProperty')).toBe(false)
  expect(isInternalMap('', '')).toBe(false)
})
