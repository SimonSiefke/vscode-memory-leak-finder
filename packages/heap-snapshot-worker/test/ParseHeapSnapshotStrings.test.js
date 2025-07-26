import * as ParseHeapSnapshotStrings from '../src/parts/ParseHeapSnapshotStrings/ParseHeapSnapshotStrings.js'
import { test, expect } from '@jest/globals'
import * as HeapSnapshotState from '../src/parts/HeapSnapshotState/HeapSnapshotState.js'

const id = '/test/file.heapsnapshot'

test('invalid heapsnapshot', () => {
  const heapsnapshot = {
    strings: 123,
  }
  HeapSnapshotState.set(id, heapsnapshot)
  expect(() => ParseHeapSnapshotStrings.parseHeapSnapshotStrings(id)).toThrow(new Error('no strings found'))
})

test('extract strings', () => {
  const heapsnapshot = {
    strings: ['a'],
  }
  HeapSnapshotState.set(id, heapsnapshot)
  expect(ParseHeapSnapshotStrings.parseHeapSnapshotStrings(id)).toEqual(['a'])
})
