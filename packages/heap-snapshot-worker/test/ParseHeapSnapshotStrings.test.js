import * as ParseHeapSnapshotStrings from '../src/parts/ParseHeapSnapshotStrings/ParseHeapSnapshotStrings.js'
import { test, expect } from '@jest/globals'

test('invalid heapsnapshot', () => {
  const heapsnapshot = {
    strings: 123,
  }
  expect(() => ParseHeapSnapshotStrings.parseHeapSnapshotStrings(heapsnapshot)).toThrow(new Error('no strings found'))
})

test('extract strings', () => {
  const heapsnapshot = {
    strings: ['a'],
  }
  expect(ParseHeapSnapshotStrings.parseHeapSnapshotStrings(heapsnapshot)).toEqual(['a'])
})
