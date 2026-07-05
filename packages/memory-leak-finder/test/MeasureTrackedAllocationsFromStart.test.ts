import { beforeEach, expect, jest, test } from '@jest/globals'

const mockForceGarbageCollection = jest.fn<() => Promise<void>>()
const mockGetTrackedAllocations = jest.fn<() => Promise<any>>()
const mockResetTrackedAllocations = jest.fn<() => Promise<void>>()

jest.unstable_mockModule('../src/parts/ForceGarbageCollection/ForceGarbageCollection.ts', () => ({
  forceGarbageCollection: mockForceGarbageCollection,
}))

jest.unstable_mockModule('../src/parts/GetTrackedAllocations/GetTrackedAllocations.ts', () => ({
  getTrackedAllocations: mockGetTrackedAllocations,
  resetTrackedAllocations: mockResetTrackedAllocations,
}))

beforeEach(() => {
  jest.resetModules()
  jest.resetAllMocks()
  mockForceGarbageCollection.mockResolvedValue()
  mockGetTrackedAllocations.mockResolvedValue({
    '/tmp/workbench.js:1:1:Array': {
      aliveCount: 1,
      collectedCount: 2,
      createdCount: 3,
      location: '/tmp/workbench.js:1:1',
      type: 'Array',
    },
  })
  mockResetTrackedAllocations.mockResolvedValue()
})

test('MeasureTrackedAllocationsFromStart.start uses an empty baseline and does not reset allocations', async () => {
  const MeasureTrackedAllocationsFromStart = await import(
    '../src/parts/MeasureTrackedAllocationsFromStart/MeasureTrackedAllocationsFromStart.ts'
  )
  const scriptHandler = {
    scriptMap: {},
    start: jest.fn<() => Promise<void>>().mockResolvedValue(),
    stop: jest.fn<() => Promise<void>>().mockResolvedValue(),
  }

  const result = await MeasureTrackedAllocationsFromStart.start({} as any, scriptHandler)

  expect(result).toEqual({})
  expect(scriptHandler.start).toHaveBeenCalledTimes(1)
  expect(mockResetTrackedAllocations).not.toHaveBeenCalled()
  expect(mockGetTrackedAllocations).not.toHaveBeenCalled()
  expect(mockForceGarbageCollection).not.toHaveBeenCalled()
})

test('MeasureTrackedAllocationsFromStart.stop returns tracked allocations with script map', async () => {
  const MeasureTrackedAllocationsFromStart = await import(
    '../src/parts/MeasureTrackedAllocationsFromStart/MeasureTrackedAllocationsFromStart.ts'
  )
  const scriptHandler = {
    scriptMap: {
      '1': {
        url: 'file:///tmp/workbench.js',
      },
    },
    start: jest.fn<() => Promise<void>>().mockResolvedValue(),
    stop: jest.fn<() => Promise<void>>().mockResolvedValue(),
  }

  const result = await MeasureTrackedAllocationsFromStart.stop({} as any, scriptHandler)

  expect(result).toEqual({
    scriptMap: scriptHandler.scriptMap,
    trackedAllocations: {
      '/tmp/workbench.js:1:1:Array': {
        aliveCount: 1,
        collectedCount: 2,
        createdCount: 3,
        location: '/tmp/workbench.js:1:1',
        type: 'Array',
      },
    },
  })
  expect(mockForceGarbageCollection).toHaveBeenCalledTimes(1)
  expect(scriptHandler.stop).toHaveBeenCalledTimes(1)
})

test('MeasureTrackedAllocationsFromStart.stop throws when instrumentation produced no data', async () => {
  mockGetTrackedAllocations.mockResolvedValue({})
  const MeasureTrackedAllocationsFromStart = await import(
    '../src/parts/MeasureTrackedAllocationsFromStart/MeasureTrackedAllocationsFromStart.ts'
  )
  const scriptHandler = {
    scriptMap: {},
    start: jest.fn<() => Promise<void>>().mockResolvedValue(),
    stop: jest.fn<() => Promise<void>>().mockResolvedValue(),
  }

  await expect(MeasureTrackedAllocationsFromStart.stop({} as any, scriptHandler)).rejects.toThrow(
    'Tracked allocations produced no data. The VS Code workbench was not instrumented, or no instrumented modules were loaded.',
  )
})
