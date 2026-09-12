import { expect, test } from '@jest/globals'
import * as CompareTrackedAllocationStacks from '../src/parts/CompareTrackedAllocationStacks/CompareTrackedAllocationStacks.ts'

test('compareTrackedAllocationStacks sorts and formats allocation call paths', async () => {
  const after = {
    profiledRuns: 1,
    scriptMap: {},
    selectedAllocationSites: ['/tmp/workbench.js:1:10'],
    trackedAllocationStacks: [
      {
        createdCount: 5,
        location: '/tmp/workbench.js:1:10',
        stack: '    at deepClone (/tmp/workbench.js:1:10)\n    at caller (/tmp/workbench.js:2:20)',
        type: 'Object',
      },
      {
        createdCount: 2,
        location: '/tmp/workbench.js:3:30',
        stack: '    at other (/tmp/workbench.js:3:30)',
        type: 'Array',
      },
    ],
    tracedRuns: 16,
  }

  const result = await CompareTrackedAllocationStacks.compareTrackedAllocationStacks([], after, {} as any)

  expect(result.isLeak).toBe(false)
  expect(result.profiledRuns).toBe(1)
  expect(result.tracedRuns).toBe(16)
  expect(result.traces).toEqual([
    expect.objectContaining({
      createdCount: 5,
      location: '/tmp/workbench.js:1:10',
      stack: [
        expect.objectContaining({ functionName: 'deepClone', location: '/tmp/workbench.js:1:10' }),
        expect.objectContaining({ functionName: 'caller', location: '/tmp/workbench.js:2:20' }),
      ],
      type: 'Object',
    }),
    expect.objectContaining({
      createdCount: 2,
      type: 'Array',
    }),
  ])
  expect(result.sites).toEqual([
    expect.objectContaining({
      createdCount: 5,
      location: '/tmp/workbench.js:1:10',
      topCallers: [{ callPath: 'deepClone <- caller', createdCount: 5 }],
    }),
    expect.objectContaining({ createdCount: 2, location: '/tmp/workbench.js:3:30' }),
  ])
  expect(result.summary).toContain('5 | Object | /tmp/workbench.js:1:10')
  expect(result.summary).toContain('1 profiling run, 16 traced runs')
  expect(result.summary).toContain('deepClone <- caller')
})

test('compareTrackedAllocationStacks subtracts the baseline for an identical trace', async () => {
  const stack = '    at deepClone (/tmp/workbench.js:1:10)'
  const before = [
    {
      createdCount: 2,
      location: '/tmp/workbench.js:1:10',
      stack,
      type: 'Object',
    },
  ]
  const after = {
    trackedAllocationStacks: [
      {
        createdCount: 6,
        location: '/tmp/workbench.js:1:10',
        stack,
        type: 'Object',
      },
    ],
  }

  const result = await CompareTrackedAllocationStacks.compareTrackedAllocationStacks(before, after, {} as any)

  expect(result.traces).toEqual([
    expect.objectContaining({
      createdCount: 4,
    }),
  ])
})
