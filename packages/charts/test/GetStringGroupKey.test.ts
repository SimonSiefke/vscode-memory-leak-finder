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
