import { test, expect } from '@jest/globals'
import { isInternalArray } from '../src/parts/IsInternalArray/IsInternalArray.js'

test('isInternalArray - returns true for Chrome internal array names', () => {
  // Test all known internal array names
  expect(isInternalArray('initial_array_prototype')).toBe(true)
  expect(isInternalArray('(GC roots)')).toBe(true)
  expect(isInternalArray('(Bootstrapper)')).toBe(true)
  expect(isInternalArray('(Builtins)')).toBe(true)
  expect(isInternalArray('(Client heap)')).toBe(true)
  expect(isInternalArray('(Code flusher)')).toBe(true)
  expect(isInternalArray('(Compilation cache)')).toBe(true)
  expect(isInternalArray('(Debugger)')).toBe(true)
  expect(isInternalArray('(Extensions)')).toBe(true)
})

test('isInternalArray - returns false for user array names', () => {
  // Test various user array names
  expect(isInternalArray('htmlElements')).toBe(false)
  expect(isInternalArray('modules')).toBe(false)
  expect(isInternalArray('taka')).toBe(false)
  expect(isInternalArray('tecino')).toBe(false)
  expect(isInternalArray('entries')).toBe(false)
  expect(isInternalArray('params')).toBe(false)
  expect(isInternalArray('listeners')).toBe(false)
  expect(isInternalArray('cache')).toBe(false)
})

test('isInternalArray - handles array of names correctly', () => {
  // Test with array of names (multiple variables referencing same array)
  expect(isInternalArray(['taka', 'tecino'])).toBe(false)
  expect(isInternalArray(['entries', 'processedEventEntries'])).toBe(false)
  expect(isInternalArray(['params'])).toBe(false)

  // Test with internal names in arrays (edge case)
  expect(isInternalArray(['initial_array_prototype'])).toBe(true)
  expect(isInternalArray(['(GC roots)'])).toBe(true)
  expect(isInternalArray(['(Bootstrapper)'])).toBe(true)
  expect(isInternalArray(['(Builtins)'])).toBe(true)
  expect(isInternalArray(['(Client heap)'])).toBe(true)
  expect(isInternalArray(['(Code flusher)'])).toBe(true)
  expect(isInternalArray(['(Compilation cache)'])).toBe(true)
  expect(isInternalArray(['(Debugger)'])).toBe(true)
  expect(isInternalArray(['(Extensions)'])).toBe(true)
})

test('isInternalArray - handles edge cases', () => {
  // Test edge cases
  expect(isInternalArray('')).toBe(false)
  expect(isInternalArray([])).toBe(false)
  expect(isInternalArray([''])).toBe(false)
  // @ts-ignore
  expect(isInternalArray(null)).toBe(false)
  // @ts-ignore
  expect(isInternalArray(undefined)).toBe(false)
})

test('isInternalArray - case sensitive matching', () => {
  // Test that matching is case sensitive
  expect(isInternalArray('Initial_Array_Prototype')).toBe(false)
  expect(isInternalArray('(gc roots)')).toBe(false)
  expect(isInternalArray('(bootstrapper)')).toBe(false)
  expect(isInternalArray('INITIAL_ARRAY_PROTOTYPE')).toBe(false)
})

test('isInternalArray - partial matches are not detected', () => {
  // Test that partial matches don't trigger detection
  expect(isInternalArray('initial_array_prototype_extra')).toBe(false)
  expect(isInternalArray('extra_initial_array_prototype')).toBe(false)
  expect(isInternalArray('(GC roots) extra')).toBe(false)
  expect(isInternalArray('extra (Bootstrapper)')).toBe(false)
})
