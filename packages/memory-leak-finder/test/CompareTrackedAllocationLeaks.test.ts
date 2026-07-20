import { beforeEach, expect, jest, test } from '@jest/globals'

const mockResolveTrackedLocationSourceMaps = jest.fn<any>()

jest.unstable_mockModule('../src/parts/ResolveTrackedLocationSourceMaps/ResolveTrackedLocationSourceMaps.ts', () => ({
  resolveTrackedLocationSourceMaps: mockResolveTrackedLocationSourceMaps,
}))

beforeEach(() => {
  mockResolveTrackedLocationSourceMaps.mockReset()
  mockResolveTrackedLocationSourceMaps.mockResolvedValue({
    '1:2:3': {
      originalColumn: 9,
      originalLine: 245,
      originalLocation: 'src/prefixSumComputer.ts:245:9',
      originalSource: 'src/prefixSumComputer.ts',
    },
    '1:4:5': {
      originalColumn: 1,
      originalLine: 10,
      originalLocation: 'src/collected.ts:10:1',
      originalSource: 'src/collected.ts',
    },
    '1:6:7': {
      originalColumn: null,
      originalLine: null,
      originalLocation: null,
      originalSource: null,
    },
  })
})

test('compareTrackedAllocationLeaks returns only retained allocation sites in retained-count order', async () => {
  const CompareTrackedAllocationLeaks = await import('../src/parts/CompareTrackedAllocationLeaks/CompareTrackedAllocationLeaks.ts')
  const result = await CompareTrackedAllocationLeaks.compareTrackedAllocationLeaks(
    {},
    {
      scriptMap: {},
      trackedAllocations: {
        collected: {
          aliveCount: 0,
          collectedCount: 8,
          createdCount: 8,
          location: '1:4:5',
          type: 'Array',
        },
        retainedLess: {
          aliveCount: 2,
          collectedCount: 8,
          createdCount: 10,
          location: '1:6:7',
          type: 'Object',
        },
        retainedMore: {
          aliveCount: 4,
          collectedCount: 2,
          createdCount: 6,
          location: '1:2:3',
          type: 'PrefixSumComputer',
        },
      },
    },
    {} as any,
  )

  expect(result).toEqual([
    {
      aliveCount: 4,
      collectedCount: 2,
      createdCount: 6,
      location: '1:2:3',
      originalColumn: 9,
      originalLine: 245,
      originalLocation: 'src/prefixSumComputer.ts:245:9',
      originalSource: 'src/prefixSumComputer.ts',
      originalType: 'PrefixSumComputer',
      type: 'PrefixSumComputer',
    },
    {
      aliveCount: 2,
      collectedCount: 8,
      createdCount: 10,
      location: '1:6:7',
      originalColumn: null,
      originalLine: null,
      originalLocation: null,
      originalSource: null,
      originalType: 'Object',
      type: 'Object',
    },
  ])
})

test('compareTrackedAllocationLeaks excludes collected-over-created deltas defensively', async () => {
  const CompareTrackedAllocationLeaks = await import('../src/parts/CompareTrackedAllocationLeaks/CompareTrackedAllocationLeaks.ts')
  const result = await CompareTrackedAllocationLeaks.compareTrackedAllocationLeaks(
    {},
    {
      trackedAllocations: {
        allocation: {
          aliveCount: 0,
          collectedCount: 7,
          createdCount: 4,
          location: '1:4:5',
          type: 'Array',
        },
      },
    },
    {} as any,
  )

  expect(result).toEqual([])
})
