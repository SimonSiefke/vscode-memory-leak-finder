import { expect, test } from '@jest/globals'
import * as CompareIpcMessages from '../src/parts/CompareIpcMessages/CompareIpcMessages.ts'

test('CompareIpcMessages should return empty added for empty inputs', () => {
  const result = CompareIpcMessages.compare([], [])
  expect(result.added).toEqual([])
})

test('CompareIpcMessages should detect a single added message', () => {
  const before: any[] = []
  const after: any[] = [{ channel: 'test', timestamp: 1, type: 'on', args: ['a'] }]
  const result = CompareIpcMessages.compare(before, after)
  expect(result.added).toHaveLength(1)
  expect(result.added[0]).toEqual(after[0])
})

test('CompareIpcMessages should handle duplicates by count', () => {
  const msg = { channel: 'x' }
  const before = [msg, msg]
  const after = [msg, msg, msg]
  const result = CompareIpcMessages.compare(before, after)
  expect(result.added).toHaveLength(1)
  expect(result.added[0]).toEqual(msg)
})

test('CompareIpcMessages should parse added messages back from string keys when possible', () => {
  const complex = { a: [1, 2], b: { c: 'd' } }
  const before: any[] = [complex]
  const after: any[] = [complex, complex]
  const result = CompareIpcMessages.compare(before, after)
  expect(result.added).toHaveLength(1)
  expect(result.added[0]).toEqual(complex)
})
