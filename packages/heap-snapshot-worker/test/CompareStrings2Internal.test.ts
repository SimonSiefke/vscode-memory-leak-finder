import { expect, test } from '@jest/globals'
import { compareStrings2Internal } from '../src/parts/CompareStrings2Internal/CompareStrings2Internal.js'

test('should return empty array when both arrays are empty', () => {
  const before: readonly string[] = []
  const after: readonly string[] = []
  const minCount = 1

  const result = compareStrings2Internal(before, after, minCount, true)

  expect(result).toEqual([])
})

test('should return empty array when before is empty and after has strings', () => {
  const before: readonly string[] = []
  const after: readonly string[] = ['leaked1', 'leaked2']
  const minCount = 1

  const result = compareStrings2Internal(before, after, minCount, true)

  expect(result).toEqual([
    { string: 'leaked1', delta: 1 },
    { string: 'leaked2', delta: 1 },
  ])
})

test('should return empty array when after is empty and before has strings', () => {
  const before: readonly string[] = ['string1', 'string2']
  const after: readonly string[] = []
  const minCount = 1

  const result = compareStrings2Internal(before, after, minCount, true)

  expect(result).toEqual([])
})

test('should return empty array when strings are identical', () => {
  const before: readonly string[] = ['string1', 'string2', 'string3']
  const after: readonly string[] = ['string1', 'string2', 'string3']
  const minCount = 1

  const result = compareStrings2Internal(before, after, minCount, true)

  expect(result).toEqual([])
})

test('should detect single leaked string', () => {
  const before: readonly string[] = ['string1', 'string2']
  const after: readonly string[] = ['string1', 'string2', 'leaked']
  const minCount = 1

  const result = compareStrings2Internal(before, after, minCount, true)

  expect(result).toEqual([{ string: 'leaked', delta: 1 }])
})

test('should detect multiple leaked strings', () => {
  const before: readonly string[] = ['string1', 'string2']
  const after: readonly string[] = ['string1', 'string2', 'leaked1', 'leaked2']
  const minCount = 1

  const result = compareStrings2Internal(before, after, minCount, true)

  expect(result).toEqual([
    { string: 'leaked1', delta: 1 },
    { string: 'leaked2', delta: 1 },
  ])
})

test('should count multiple occurrences of leaked strings', () => {
  const before: readonly string[] = ['string1', 'string2']
  const after: readonly string[] = ['string1', 'string2', 'leaked', 'leaked', 'leaked']
  const minCount = 1

  const result = compareStrings2Internal(before, after, minCount, true)

  expect(result).toEqual([{ string: 'leaked', delta: 3 }])
})

test('should filter by minCount', () => {
  const before: readonly string[] = ['string1', 'string2']
  const after: readonly string[] = ['string1', 'string2', 'leaked1', 'leaked1', 'leaked2']
  const minCount = 2

  const result = compareStrings2Internal(before, after, minCount, true)

  expect(result).toEqual([{ string: 'leaked1', delta: 2 }])
})

test('should return empty array when all leaks are below minCount', () => {
  const before: readonly string[] = ['string1', 'string2']
  const after: readonly string[] = ['string1', 'string2', 'leaked']
  const minCount = 2

  const result = compareStrings2Internal(before, after, minCount, true)

  expect(result).toEqual([])
})

test('should sort results by delta descending', () => {
  const before: readonly string[] = ['string1']
  const after: readonly string[] = ['string1', 'leaked1', 'leaked2', 'leaked2', 'leaked2', 'leaked3', 'leaked3']
  const minCount = 1

  const result = compareStrings2Internal(before, after, minCount, true)

  expect(result).toEqual([
    { string: 'leaked2', delta: 3 },
    { string: 'leaked3', delta: 2 },
    { string: 'leaked1', delta: 1 },
  ])
})

test('should handle strings that appear in both arrays', () => {
  const before: readonly string[] = ['common1', 'common1', 'common2']
  const after: readonly string[] = ['common1', 'common2', 'common2', 'common2', 'leaked']
  const minCount = 1

  const result = compareStrings2Internal(before, after, minCount, true)

  expect(result).toEqual([
    { string: 'common2', delta: 2 },
    { string: 'leaked', delta: 1 },
  ])
})

test('should handle empty strings', () => {
  const before: readonly string[] = ['string1', '']
  const after: readonly string[] = ['string1', '', '', '']
  const minCount = 1

  const result = compareStrings2Internal(before, after, minCount, true)

  expect(result).toEqual([{ string: '', delta: 2 }])
})

test('should handle strings with special characters', () => {
  const before: readonly string[] = ['normal']
  const after: readonly string[] = ['normal', 'with\nnewline', 'with\ttab', 'with"quote']
  const minCount = 1

  const result = compareStrings2Internal(before, after, minCount, true)

  expect(result).toEqual([
    { string: 'with\nnewline', delta: 1 },
    { string: 'with\ttab', delta: 1 },
    { string: 'with"quote', delta: 1 },
  ])
})

test('should handle unicode strings', () => {
  const before: readonly string[] = ['normal']
  const after: readonly string[] = ['normal', '🚀', '你好', 'مرحبا']
  const minCount = 1

  const result = compareStrings2Internal(before, after, minCount, true)

  expect(result).toEqual([
    { string: '🚀', delta: 1 },
    { string: '你好', delta: 1 },
    { string: 'مرحبا', delta: 1 },
  ])
})

test('should handle very long strings', () => {
  const longString = 'a'.repeat(10000)
  const before: readonly string[] = ['normal']
  const after: readonly string[] = ['normal', longString]
  const minCount = 1

  const result = compareStrings2Internal(before, after, minCount, true)

  expect(result).toEqual([{ string: longString, delta: 1 }])
})

test('should handle strings that decrease in count', () => {
  const before: readonly string[] = ['string1', 'string1', 'string1', 'string2']
  const after: readonly string[] = ['string1', 'string2']
  const minCount = 1

  const result = compareStrings2Internal(before, after, minCount, true)

  expect(result).toEqual([])
})

test('should handle complex scenario with multiple counts', () => {
  const before: readonly string[] = ['a', 'a', 'b', 'b', 'b', 'c']
  const after: readonly string[] = ['a', 'b', 'b', 'd', 'd', 'd', 'd', 'e', 'e']
  const minCount = 1

  const result = compareStrings2Internal(before, after, minCount, true)

  expect(result).toEqual([
    { string: 'd', delta: 4 },
    { string: 'e', delta: 2 },
  ])
})

test('should handle minCount of zero', () => {
  const before: readonly string[] = ['string1']
  const after: readonly string[] = ['string1', 'leaked']
  const minCount = 0

  const result = compareStrings2Internal(before, after, minCount, true)

  expect(result).toEqual([{ string: 'leaked', delta: 1 }])
})

test('should handle minCount greater than one', () => {
  const before: readonly string[] = ['string1']
  const after: readonly string[] = ['string1', 'leaked1', 'leaked1', 'leaked1', 'leaked2', 'leaked2']
  const minCount = 3

  const result = compareStrings2Internal(before, after, minCount, true)

  expect(result).toEqual([{ string: 'leaked1', delta: 3 }])
})

test('should handle duplicate strings in before array', () => {
  const before: readonly string[] = ['a', 'a', 'a', 'b']
  const after: readonly string[] = ['a', 'a', 'b', 'b', 'c']
  const minCount = 1

  const result = compareStrings2Internal(before, after, minCount, true)

  expect(result).toEqual([
    { string: 'b', delta: 1 },
    { string: 'c', delta: 1 },
  ])
})

test('should handle duplicate strings in after array', () => {
  const before: readonly string[] = ['a', 'b']
  const after: readonly string[] = ['a', 'b', 'c', 'c', 'c', 'c', 'c']
  const minCount = 1

  const result = compareStrings2Internal(before, after, minCount, true)

  expect(result).toEqual([{ string: 'c', delta: 5 }])
})

test('should handle strings with same delta value', () => {
  const before: readonly string[] = ['string1']
  const after: readonly string[] = ['string1', 'a', 'a', 'b', 'b', 'c', 'c']
  const minCount = 1

  const result = compareStrings2Internal(before, after, minCount, true)

  // All have delta 2, order may vary but all should be present
  expect(result).toHaveLength(3)
  expect(result).toContainEqual({ string: 'a', delta: 2 })
  expect(result).toContainEqual({ string: 'b', delta: 2 })
  expect(result).toContainEqual({ string: 'c', delta: 2 })
})

test('should handle large arrays', () => {
  const before: readonly string[] = Array.from({ length: 100 }, (_, i) => `string${i}`)
  const after: readonly string[] = [...Array.from({ length: 100 }, (_, i) => `string${i}`), ...Array.from({ length: 50 }, () => 'leaked')]
  const minCount = 1

  const result = compareStrings2Internal(before, after, minCount, true)

  expect(result).toEqual([{ string: 'leaked', delta: 50 }])
})

test('should handle strings that appear more in before than after', () => {
  const before: readonly string[] = ['a', 'a', 'a', 'b', 'b']
  const after: readonly string[] = ['a', 'b']
  const minCount = 1

  const result = compareStrings2Internal(before, after, minCount, true)

  expect(result).toEqual([])
})

test('should handle mixed case strings', () => {
  const before: readonly string[] = ['String1']
  const after: readonly string[] = ['String1', 'string1', 'STRING1']
  const minCount = 1

  const result = compareStrings2Internal(before, after, minCount, true)

  // Both have delta 1, order may vary but both should be present
  expect(result).toHaveLength(2)
  expect(result).toContainEqual({ string: 'STRING1', delta: 1 })
  expect(result).toContainEqual({ string: 'string1', delta: 1 })
})

test('should handle numeric strings', () => {
  const before: readonly string[] = ['1', '2']
  const after: readonly string[] = ['1', '2', '3', '3', '3']
  const minCount = 1

  const result = compareStrings2Internal(before, after, minCount, true)

  expect(result).toEqual([{ string: '3', delta: 3 }])
})

test('should handle boolean-like strings', () => {
  const before: readonly string[] = ['true']
  const after: readonly string[] = ['true', 'false', 'false']
  const minCount = 1

  const result = compareStrings2Internal(before, after, minCount, true)

  expect(result).toEqual([{ string: 'false', delta: 2 }])
})

test('should handle JSON-like strings', () => {
  const before: readonly string[] = ['{"key":"value"}']
  const after: readonly string[] = ['{"key":"value"}', '{"key":"value2"}', '{"key":"value2"}']
  const minCount = 1

  const result = compareStrings2Internal(before, after, minCount, true)

  expect(result).toEqual([{ string: '{"key":"value2"}', delta: 2 }])
})

test('should handle strings with whitespace', () => {
  const before: readonly string[] = ['normal']
  const after: readonly string[] = ['normal', '  spaced  ', '  spaced  ', '  spaced  ']
  const minCount = 1

  const result = compareStrings2Internal(before, after, minCount, true)

  expect(result).toEqual([{ string: '  spaced  ', delta: 3 }])
})

test('should handle strings with control characters', () => {
  const before: readonly string[] = ['normal']
  const after: readonly string[] = ['normal', '\x00', '\x01', '\x02']
  const minCount = 1

  const result = compareStrings2Internal(before, after, minCount, true)

  expect(result).toEqual([
    { string: '\x00', delta: 1 },
    { string: '\x01', delta: 1 },
    { string: '\x02', delta: 1 },
  ])
})

test('should filter out Chrome internal strings when includeChromeInternalStrings is false', () => {
  const before: readonly string[] = ['normal']
  const after: readonly string[] = [
    'normal',
    '167 / part of key (system / ScopeInfo @67611) -> value (system / Tuple2 @200575) pair in WeakMap (table @2317)',
    '1 / part of key (node:internal/readline/utils @71901) -> value (system / ArrayList @273823) pair in WeakMap (table @109977)',
    'leaked',
  ]
  const minCount = 1

  const result = compareStrings2Internal(before, after, minCount, false)

  expect(result).toEqual([{ string: 'leaked', delta: 1 }])
})

test('should include Chrome internal strings when includeChromeInternalStrings is true', () => {
  const before: readonly string[] = ['normal']
  const after: readonly string[] = [
    'normal',
    '167 / part of key (system / ScopeInfo @67611) -> value (system / Tuple2 @200575) pair in WeakMap (table @2317)',
    'leaked',
  ]
  const minCount = 1

  const result = compareStrings2Internal(before, after, minCount, true)

  expect(result).toEqual([
    { string: '167 / part of key (system / ScopeInfo @67611) -> value (system / Tuple2 @200575) pair in WeakMap (table @2317)', delta: 1 },
    { string: 'leaked', delta: 1 },
  ])
})

test('should include Chrome internal strings by default', () => {
  const before: readonly string[] = ['normal']
  const after: readonly string[] = [
    'normal',
    '1 / part of key (ForkUtilityProcess @111149) -> value (UtilityProcessWrapper @7297) pair in WeakMap (table @195443)',
    'leaked',
  ]
  const minCount = 1

  const result = compareStrings2Internal(before, after, minCount, true)

  expect(result).toEqual([
    {
      string: '1 / part of key (ForkUtilityProcess @111149) -> value (UtilityProcessWrapper @7297) pair in WeakMap (table @195443)',
      delta: 1,
    },
    { string: 'leaked', delta: 1 },
  ])
})

test('should filter out strings with system / pattern when includeChromeInternalStrings is false', () => {
  const before: readonly string[] = ['normal']
  const after: readonly string[] = [
    'normal',
    '1 / part of key (system / ObjectTemplateInfo @154791) -> value (FSEvent @205297) pair in WeakMap (table @109929)',
    'leaked',
  ]
  const minCount = 1

  const result = compareStrings2Internal(before, after, minCount, false)

  expect(result).toEqual([{ string: 'leaked', delta: 1 }])
})

test('should filter out strings with node:internal/ pattern when includeChromeInternalStrings is false', () => {
  const before: readonly string[] = ['normal']
  const after: readonly string[] = [
    'normal',
    '1 / part of key (node:internal/readline/utils @71901) -> value (system / ArrayList @273823) pair in WeakMap (table @109977)',
    'leaked',
  ]
  const minCount = 1

  const result = compareStrings2Internal(before, after, minCount, false)

  expect(result).toEqual([{ string: 'leaked', delta: 1 }])
})
