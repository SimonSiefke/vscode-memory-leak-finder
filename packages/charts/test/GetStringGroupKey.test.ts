import { expect, test } from '@jest/globals'
import { getGroupKey, getStringPattern } from '../src/parts/GetStringGroupKey/GetStringGroupKey.ts'

test.each([
  ['/window/25', '/window/\\d+'],
  ['/123/25?x=1', '/\\d+/\\d+?x=1'],
  ['/window/25/child/26#hash', '/window/\\d+/child/\\d+#hash'],
  ['Error\n    at f (file:///owner.js:25:3)', 'Error\n    at f (file:///owner.js:25:3)'],
  ['/v2/file25.ts', '/v2/file25.ts'],
  ['version 1.25', 'version 1.25'],
])('normalizes instance path segments without erasing code identities: %s', (value, expected) => {
  expect(getStringPattern(value)).toBe(expected)
})

test('preserves source positions, unknown object identities, and literal pattern text', () => {
  const row = { string: '/window/25', location: 'uri.ts:455:1', count: 1 }
  expect(getGroupKey(row)).toBe(getGroupKey({ ...row, string: '/window/26' }))
  expect(getGroupKey(row)).not.toBe(getGroupKey({ ...row, location: 'uri.ts:456:1' }))
  expect(getGroupKey(row)).not.toBe(getGroupKey({ ...row, string: '/window/\\d+' }))
  expect(getGroupKey({ ...row, string: null, heapObjectId: '11' })).not.toBe(getGroupKey({ ...row, string: null, heapObjectId: '13' }))
})

test.each([
  ['a2df', '<short hash>'],
  ['Ab12Z9', '<short hash>'],
  ['event', '<short hash>'],
  ['1A23', '<short hash>'],
  ['a2f', 'a2f'],
  ['a2e1234', 'a2e1234'],
  ['1234', '1234'],
  ['123456', '123456'],
  ['a_2e', 'a_2e'],
  ['a-2e', 'a-2e'],
  ['é123', 'é123'],
  ['a2df\n', 'a2df\n'],
])('groups only 4–6 character ASCII alphanumeric hashes containing a letter: %s', (value, expected) => {
  expect(getStringPattern(value, 'src/vs/base/common/event.ts:1208:14')).toBe(expected)
})

test('groups short hashes only within the same known location and provenance', () => {
  const row = { string: 'a2df', location: 'event.ts:1208:14', count: 1 }
  expect(getGroupKey(row)).toBe(getGroupKey({ ...row, string: 'a2e0' }))
  expect(getGroupKey(row)).not.toBe(getGroupKey({ ...row, location: 'event.ts:1209:14' }))
  expect(getGroupKey(row)).not.toBe(getGroupKey({ ...row, locationKind: 'stack-frame' }))
  expect(getGroupKey(row)).not.toBe(getGroupKey({ ...row, string: '<short hash>' }))
  expect(getGroupKey({ ...row, location: null })).not.toBe(getGroupKey({ ...row, location: null, string: 'a2e0' }))
  expect(getStringPattern('a2df', '')).toBe('a2df')
  expect(getGroupKey({ ...row, stack: 'first stack' })).not.toBe(getGroupKey({ ...row, stack: 'second stack' }))
})
