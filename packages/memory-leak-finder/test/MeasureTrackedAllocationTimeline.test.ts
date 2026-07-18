import { beforeEach, expect, jest, test } from '@jest/globals'

const mockForceGarbageCollection = jest.fn<() => Promise<void>>()
const mockGetTrackedAllocationRuns = jest.fn<() => Promise<any>>()
const mockMarkTrackedAllocationRun = jest.fn<() => Promise<void>>()
const mockResetTrackedAllocations = jest.fn<() => Promise<void>>()

jest.unstable_mockModule('../src/parts/ForceGarbageCollection/ForceGarbageCollection.ts', () => ({
  forceGarbageCollection: mockForceGarbageCollection,
}))

jest.unstable_mockModule('../src/parts/GetTrackedAllocations/GetTrackedAllocations.ts', () => ({
  getTrackedAllocationRuns: mockGetTrackedAllocationRuns,
  markTrackedAllocationRun: mockMarkTrackedAllocationRun,
  resetTrackedAllocations: mockResetTrackedAllocations,
}))

beforeEach(() => {
  jest.resetModules()
  jest.resetAllMocks()
  mockForceGarbageCollection.mockResolvedValue()
  mockGetTrackedAllocationRuns.mockResolvedValue([
    {
      allocations: [
        {
          createdCount: 2,
          location: '1:2:3',
          type: 'Array',
        },
      ],
      runIndex: 0,
    },
  ])
  mockMarkTrackedAllocationRun.mockResolvedValue()
  mockResetTrackedAllocations.mockResolvedValue()
})

test('MeasureTrackedAllocationTimeline.start resets allocations and starts script tracking', async () => {
  const MeasureTrackedAllocationTimeline = await import('../src/parts/MeasureTrackedAllocationTimeline/MeasureTrackedAllocationTimeline.ts')
  const scriptHandler = {
    scriptMap: {},
    start: jest.fn<() => Promise<void>>().mockResolvedValue(),
    stop: jest.fn<() => Promise<void>>().mockResolvedValue(),
  }

  const result = await MeasureTrackedAllocationTimeline.start({} as any, scriptHandler)

  expect(result).toEqual({})
  expect(mockForceGarbageCollection).toHaveBeenCalledTimes(1)
  expect(mockResetTrackedAllocations).toHaveBeenCalledTimes(1)
  expect(scriptHandler.start).toHaveBeenCalledTimes(1)
})

test('MeasureTrackedAllocationTimeline.runCompletion marks an allocation run', async () => {
  const MeasureTrackedAllocationTimeline = await import('../src/parts/MeasureTrackedAllocationTimeline/MeasureTrackedAllocationTimeline.ts')

  await MeasureTrackedAllocationTimeline.runCompletion({} as any)

  expect(mockMarkTrackedAllocationRun).toHaveBeenCalledTimes(1)
})

test('MeasureTrackedAllocationTimeline.stop returns timeline runs with script map', async () => {
  const MeasureTrackedAllocationTimeline = await import('../src/parts/MeasureTrackedAllocationTimeline/MeasureTrackedAllocationTimeline.ts')
  const scriptHandler = {
    scriptMap: {
      '1': {
        url: 'file:///tmp/workbench.js',
      },
    },
    start: jest.fn<() => Promise<void>>().mockResolvedValue(),
    stop: jest.fn<() => Promise<void>>().mockResolvedValue(),
  }

  const result = await MeasureTrackedAllocationTimeline.stop({} as any, scriptHandler)

  expect(result).toEqual({
    runs: [
      {
        allocations: [
          {
            createdCount: 2,
            location: '1:2:3',
            type: 'Array',
          },
        ],
        runIndex: 0,
      },
    ],
    scriptMap: scriptHandler.scriptMap,
  })
  expect(mockForceGarbageCollection).toHaveBeenCalledTimes(1)
  expect(scriptHandler.stop).toHaveBeenCalledTimes(1)
})

test('MeasureTrackedAllocationTimeline.compare enriches timeline rows', async () => {
  const MeasureTrackedAllocationTimeline = await import('../src/parts/MeasureTrackedAllocationTimeline/MeasureTrackedAllocationTimeline.ts')

  const result = await MeasureTrackedAllocationTimeline.compare(
    {},
    {
      runs: [
        {
          allocations: [
            {
              createdCount: 2,
              location: '1:2:3',
              type: 'Array',
            },
          ],
          runIndex: 0,
        },
      ],
    },
    {} as any,
  )

  expect(result).toEqual([
    {
      allocations: [
        {
          createdCount: 2,
          location: '1:2:3',
          originalColumn: null,
          originalLine: null,
          originalLocation: null,
          originalSource: null,
          originalType: 'Array',
          type: 'Array',
        },
      ],
      runIndex: 0,
    },
  ])
})
