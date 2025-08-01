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
  }
  const result2 = {
    map: {
      '0:0:0': {
        count: 1,
        index: 0,
      },
    },
  }

  const result = compareHeapSnapshotFunctionsInternal(result1, result2)
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
  }
  const result2 = {
    map: {
      '0:0:0': {
        count: 2,
        index: 0,
      },
    },
  }
  const result = compareHeapSnapshotFunctionsInternal(result1, result2)
  expect(result).toEqual([
    {
      count: 2,
      delta: 1,
      index: 0,
    },
  ])
})
