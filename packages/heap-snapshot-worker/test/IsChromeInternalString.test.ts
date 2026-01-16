import { test, expect } from '@jest/globals'
import { isChromeInternalString } from '../src/parts/IsChromeInternalString/IsChromeInternalString.ts'

test('should return true for strings with part of key and WeakMap', () => {
  expect(
    isChromeInternalString(
      '167 / part of key (system / ScopeInfo @67611) -> value (system / Tuple2 @200575) pair in WeakMap (table @2317)',
    ),
  ).toBe(true)
  expect(
    isChromeInternalString(
      '1 / part of key (node:internal/readline/utils @71901) -> value (system / ArrayList @273823) pair in WeakMap (table @109977)',
    ),
  ).toBe(true)
  expect(
    isChromeInternalString(
      '1 / part of key (ForkUtilityProcess @111149) -> value (UtilityProcessWrapper @7297) pair in WeakMap (table @195443)',
    ),
  ).toBe(true)
  expect(
    isChromeInternalString('2 / part of key (ForkUtilityProcess @111149) -> value (PassThrough @111023) pair in WeakMap (table @195445)'),
  ).toBe(true)
  expect(
    isChromeInternalString('3 / part of key (ForkUtilityProcess @112983) -> value (PassThrough @115787) pair in WeakMap (table @195447)'),
  ).toBe(true)
})

test('should return true for strings with system /', () => {
  expect(
    isChromeInternalString(
      '1 / part of key (system / ObjectTemplateInfo @154791) -> value (FSEvent @205297) pair in WeakMap (table @109929)',
    ),
  ).toBe(true)
  expect(isChromeInternalString('system / WeakFixedArray')).toBe(true)
  expect(isChromeInternalString('system / ScopeInfo')).toBe(true)
  expect(isChromeInternalString('system / Tuple2')).toBe(true)
  expect(isChromeInternalString('system / ArrayList')).toBe(true)
  expect(isChromeInternalString('system / ObjectTemplateInfo')).toBe(true)
})

test('should return true for strings with node:internal/', () => {
  expect(isChromeInternalString('node:internal/readline/utils')).toBe(true)
  expect(isChromeInternalString('node:internal/fs/promises')).toBe(true)
  expect(isChromeInternalString('node:internal/streams/readable')).toBe(true)
  expect(
    isChromeInternalString(
      '1 / part of key (node:internal/readline/utils @71901) -> value (system / ArrayList @273823) pair in WeakMap (table @109977)',
    ),
  ).toBe(true)
})

test('should return false when part of key is present but WeakMap is not', () => {
  expect(isChromeInternalString('part of key (Object @123) -> value (Array @456)')).toBe(false)
  expect(isChromeInternalString('part of key something')).toBe(false)
  expect(isChromeInternalString('this is part of key description')).toBe(false)
})

test('should return false when WeakMap is present but part of key is not', () => {
  expect(isChromeInternalString('WeakMap (table @123)')).toBe(false)
  expect(isChromeInternalString('something WeakMap something')).toBe(false)
  expect(isChromeInternalString('pair in WeakMap')).toBe(false)
})

test('should return false for system without space and slash', () => {
  expect(isChromeInternalString('system')).toBe(false)
  expect(isChromeInternalString('systematic')).toBe(false)
  expect(isChromeInternalString('System')).toBe(false)
  expect(isChromeInternalString('SYSTEM')).toBe(false)
  expect(isChromeInternalString('system/')).toBe(false)
  expect(isChromeInternalString('system/WeakFixedArray')).toBe(false)
})

test('should return false for node:internal without slash', () => {
  expect(isChromeInternalString('node:internal')).toBe(false)
  expect(isChromeInternalString('node:internals')).toBe(false)
  expect(isChromeInternalString('node:internal')).toBe(false)
})

test('should return false for normal user strings', () => {
  expect(isChromeInternalString('leaked')).toBe(false)
  expect(isChromeInternalString('myString')).toBe(false)
  expect(isChromeInternalString('user defined string')).toBe(false)
  expect(isChromeInternalString('application code')).toBe(false)
  expect(isChromeInternalString('function name')).toBe(false)
})

test('should return false for empty string', () => {
  expect(isChromeInternalString('')).toBe(false)
})

test('should handle strings with multiple patterns correctly', () => {
  expect(
    isChromeInternalString(
      '167 / part of key (system / ScopeInfo @67611) -> value (system / Tuple2 @200575) pair in WeakMap (table @2317)',
    ),
  ).toBe(true)
  expect(
    isChromeInternalString(
      '1 / part of key (node:internal/readline/utils @71901) -> value (system / ArrayList @273823) pair in WeakMap (table @109977)',
    ),
  ).toBe(true)
})

test('should handle case sensitivity correctly', () => {
  expect(isChromeInternalString('Part of key (Object @123) -> value (Array @456) pair in WeakMap')).toBe(false)
  expect(isChromeInternalString('PART OF KEY (Object @123) -> value (Array @456) pair in WEAKMAP')).toBe(false)
  expect(isChromeInternalString('System / WeakFixedArray')).toBe(false)
  expect(isChromeInternalString('SYSTEM / WeakFixedArray')).toBe(false)
  expect(isChromeInternalString('Node:Internal/readline/utils')).toBe(false)
})

test('should handle strings with special characters', () => {
  expect(
    isChromeInternalString(
      '1 / part of key (ForkUtilityProcess @111149) -> value (UtilityProcessWrapper @7297) pair in WeakMap (table @195443)',
    ),
  ).toBe(true)
  expect(isChromeInternalString('system / @123')).toBe(true)
  expect(isChromeInternalString('node:internal/@123')).toBe(true)
})

test('should handle strings with numbers and IDs', () => {
  expect(
    isChromeInternalString(
      '167 / part of key (system / ScopeInfo @67611) -> value (system / Tuple2 @200575) pair in WeakMap (table @2317)',
    ),
  ).toBe(true)
  expect(
    isChromeInternalString(
      '1 / part of key (ForkUtilityProcess @302531) -> value (UtilityProcessWrapper @7347) pair in WeakMap (table @195443)',
    ),
  ).toBe(true)
})

test('should return false for strings that contain similar but different patterns', () => {
  expect(isChromeInternalString('part-of-key')).toBe(false)
  expect(isChromeInternalString('weakmap')).toBe(false)
  expect(isChromeInternalString('weak map')).toBe(false)
  expect(isChromeInternalString('system/')).toBe(false)
  expect(isChromeInternalString('system/ ')).toBe(false)
  expect(isChromeInternalString('system /')).toBe(true)
})

test('should handle strings with whitespace variations', () => {
  expect(isChromeInternalString('system  /')).toBe(false)
  expect(isChromeInternalString('system/ ')).toBe(false)
  expect(isChromeInternalString(' system /')).toBe(true)
  expect(isChromeInternalString('system / ')).toBe(true)
})

test('should handle very long strings', () => {
  const longString =
    '167 / part of key (system / ScopeInfo @67611) -> value (system / Tuple2 @200575) pair in WeakMap (table @2317) ' + 'a'.repeat(1000)
  expect(isChromeInternalString(longString)).toBe(true)
  const longNonInternal = 'a'.repeat(1000) + 'normal string'
  expect(isChromeInternalString(longNonInternal)).toBe(false)
})

test('should handle unicode strings', () => {
  expect(isChromeInternalString('🚀 part of key (Object @123) -> value (Array @456) pair in WeakMap')).toBe(true)
  expect(isChromeInternalString('system / 🚀')).toBe(true)
  expect(isChromeInternalString('node:internal/🚀')).toBe(true)
  expect(isChromeInternalString('🚀 normal string')).toBe(false)
})

test('should handle JSON-like strings', () => {
  expect(isChromeInternalString('{"key": "part of key (Object @123) -> value (Array @456) pair in WeakMap"}')).toBe(true)
  expect(isChromeInternalString('{"key": "system / WeakFixedArray"}')).toBe(true)
  expect(isChromeInternalString('{"key": "node:internal/readline/utils"}')).toBe(true)
  expect(isChromeInternalString('{"key": "normal string"}')).toBe(false)
})

test('should handle strings with newlines and tabs', () => {
  expect(isChromeInternalString('part of key\n(Object @123) -> value (Array @456) pair in WeakMap')).toBe(true)
  expect(isChromeInternalString('system /\tWeakFixedArray')).toBe(true)
  expect(isChromeInternalString('node:internal/\nreadline/utils')).toBe(true)
  expect(isChromeInternalString('normal\nstring')).toBe(false)
})

test('should handle strings with quotes', () => {
  expect(isChromeInternalString('"part of key (Object @123) -> value (Array @456) pair in WeakMap"')).toBe(true)
  expect(isChromeInternalString("'system / WeakFixedArray'")).toBe(true)
  expect(isChromeInternalString('`node:internal/readline/utils`')).toBe(true)
  expect(isChromeInternalString('"normal string"')).toBe(false)
})

test('should handle edge cases with partial matches', () => {
  expect(isChromeInternalString('part of keyWeakMap')).toBe(true)
  expect(isChromeInternalString('partofkey WeakMap')).toBe(false)
  expect(isChromeInternalString('part of key WeakMap')).toBe(true)
  expect(isChromeInternalString('part of key and WeakMap')).toBe(true)
})

test('should handle strings with URLs and paths', () => {
  expect(isChromeInternalString('https://example.com/system /')).toBe(true)
  expect(isChromeInternalString('file:///path/to/node:internal/')).toBe(true)
  expect(isChromeInternalString('https://example.com/normal')).toBe(false)
})

test('should handle strings with regex-like patterns', () => {
  expect(isChromeInternalString('/part of key (Object @123) -> value (Array @456) pair in WeakMap/')).toBe(true)
  expect(isChromeInternalString('/system / WeakFixedArray/')).toBe(true)
  expect(isChromeInternalString('/node:internal/readline/utils/')).toBe(true)
  expect(isChromeInternalString('/normal string/')).toBe(false)
})

test('should handle strings with multiple occurrences of patterns', () => {
  expect(
    isChromeInternalString(
      'part of key (Object @123) -> value (Array @456) pair in WeakMap and part of key (Object @789) -> value (Array @012) pair in WeakMap',
    ),
  ).toBe(true)
  expect(isChromeInternalString('system / WeakFixedArray and system / Tuple2')).toBe(true)
  expect(isChromeInternalString('node:internal/readline/utils and node:internal/fs/promises')).toBe(true)
})

test('should handle strings with escaped characters', () => {
  expect(isChromeInternalString('part of key \\(Object @123\\) -> value \\(Array @456\\) pair in WeakMap')).toBe(true)
  expect(isChromeInternalString('system \\/ WeakFixedArray')).toBe(false)
  expect(isChromeInternalString('node:internal\\/readline/utils')).toBe(false)
})
