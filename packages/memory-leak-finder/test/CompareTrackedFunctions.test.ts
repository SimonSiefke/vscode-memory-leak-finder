import { expect, test } from '@jest/globals'
import * as CompareTrackedFunctions from '../src/parts/CompareTrackedFunctions/CompareTrackedFunctions.ts'

test('compareTrackedFunctions returns positive deltas sorted descending', async () => {
  const before = {
    '1:2:3': 2,
    '1:4:5': 10,
  }
  const after = {
    trackedFunctions: {
      '1:2:3': 7,
      '1:4:5': 11,
    },
  }

  const result = await CompareTrackedFunctions.compareTrackedFunctions(before, after, {} as any)

  expect(result).toEqual([
    expect.objectContaining({
      delta: 5,
      functionName: 'anonymous (1:2:3)',
      totalCount: 7,
    }),
    expect.objectContaining({
      delta: 1,
      functionName: 'anonymous (1:4:5)',
      totalCount: 11,
    }),
  ])
})
