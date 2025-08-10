import { expect, test } from '@jest/globals'
import { compareHeapSnapshotFunctionsInternal } from '../src/parts/CompareHeapSnapshotsFunctionsInternal/CompareHeapSnapshotsFunctionsInternal.js'

test('compareHeapSnapshots - no leaks', () => {
  const result1 = {
    map: {
      '0:0:0': {
        count: 1,
        index: 0,
      },
    },
    locations: new Uint32Array([1, 0, 0, 0]),
  }
  const result2 = {
    map: {
      '0:0:0': {
        count: 1,
        index: 0,
      },
    },
    locations: new Uint32Array([1, 0, 0, 0]),
  }
  const locationFields = ['object_index', 'script_id', 'line', 'column']

  const result = compareHeapSnapshotFunctionsInternal(result1, result2, locationFields)
  expect(result).toEqual([])
})

test('compareHeapSnapshots - one function count increased', () => {
  const result1 = {
    map: {
      '0:0:0': {
        count: 1,
        index: 0,
      },
    },
    locations: new Uint32Array([1, 0, 0, 0]),
  }
  const result2 = {
    map: {
      '0:0:0': {
        count: 2,
        index: 0,
      },
    },
    locations: new Uint32Array([1, 0, 0, 0]),
  }
  const locationFields = ['object_index', 'script_id', 'line', 'column']
  const result = compareHeapSnapshotFunctionsInternal(result1, result2, locationFields)
  expect(result).toEqual([
    {
      count: 2,
      delta: 1,
      scriptId: 0,
      line: 0,
      column: 0,
    },
  ])
})
