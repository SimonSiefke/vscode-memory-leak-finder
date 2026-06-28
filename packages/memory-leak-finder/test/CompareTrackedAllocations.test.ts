import { expect, test } from '@jest/globals'
import * as CompareTrackedAllocations from '../src/parts/CompareTrackedAllocations/CompareTrackedAllocations.ts'

test('compareTrackedAllocations returns sorted allocation churn rows', async () => {
  const before = {}
  const after = {
    trackedAllocations: {
      '1:2:3:Array': {
        aliveCount: 1,
        collectedCount: 4,
        createdCount: 5,
        location: '1:2:3',
        type: 'Array',
      },
      '1:4:5:Object': {
        aliveCount: 1,
        collectedCount: 8,
        createdCount: 9,
        location: '1:4:5',
        type: 'Object',
      },
    },
  }

  const result = await CompareTrackedAllocations.compareTrackedAllocations(before, after, {} as any)

  expect(result).toEqual([
    {
      aliveCount: 1,
      collectedCount: 8,
      createdCount: 9,
      location: '1:4:5',
      originalColumn: null,
      originalLine: null,
      originalLocation: null,
      originalSource: null,
      type: 'Object',
    },
    {
      aliveCount: 1,
      collectedCount: 4,
      createdCount: 5,
      location: '1:2:3',
      originalColumn: null,
      originalLine: null,
      originalLocation: null,
      originalSource: null,
      type: 'Array',
    },
  ])
})

test('compareTrackedAllocations subtracts before counts', async () => {
  const before = {
    '1:2:3:Array': {
      aliveCount: 1,
      collectedCount: 1,
      createdCount: 2,
      location: '1:2:3',
      type: 'Array',
    },
  }
  const after = {
    trackedAllocations: {
      '1:2:3:Array': {
        aliveCount: 2,
        collectedCount: 5,
        createdCount: 7,
        location: '1:2:3',
        type: 'Array',
      },
    },
  }

  const result = await CompareTrackedAllocations.compareTrackedAllocations(before, after, {} as any)

  expect(result).toEqual([
    expect.objectContaining({
      aliveCount: 1,
      collectedCount: 4,
      createdCount: 5,
      location: '1:2:3',
      type: 'Array',
    }),
  ])
})
