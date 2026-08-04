import { beforeEach, expect, jest, test } from '@jest/globals'

const mockForceGarbageCollection = jest.fn<() => Promise<void>>()
const mockGetTrackedAllocations = jest.fn<() => Promise<any>>()
const mockGetTrackedAllocationStacks = jest.fn<() => Promise<any>>()
const mockResetTrackedAllocations = jest.fn<() => Promise<void>>()
const mockSetTrackedAllocationStackTrackingEnabled =
  jest.fn<(_session: unknown, _enabled: boolean, _locations?: readonly string[]) => Promise<void>>()

jest.unstable_mockModule('../src/parts/ForceGarbageCollection/ForceGarbageCollection.ts', () => ({
  forceGarbageCollection: mockForceGarbageCollection,
}))

jest.unstable_mockModule('../src/parts/GetTrackedAllocations/GetTrackedAllocations.ts', () => ({
  getTrackedAllocations: mockGetTrackedAllocations,
  getTrackedAllocationStacks: mockGetTrackedAllocationStacks,
  resetTrackedAllocations: mockResetTrackedAllocations,
  setTrackedAllocationStackTrackingEnabled: mockSetTrackedAllocationStackTrackingEnabled,
}))

beforeEach(() => {
  jest.resetModules()
  jest.resetAllMocks()
  mockForceGarbageCollection.mockResolvedValue()
  mockGetTrackedAllocations.mockResolvedValue({
    'first:Object': {
      aliveCount: 0,
      collectedCount: 20,
      createdCount: 20,
      location: '/tmp/workbench.js:1:1',
      type: 'Object',
    },
    'second:Array': {
      aliveCount: 0,
      collectedCount: 10,
      createdCount: 10,
      location: '/tmp/workbench.js:2:2',
      type: 'Array',
    },
  })
  mockGetTrackedAllocationStacks.mockResolvedValue([
    {
      createdCount: 1,
      location: '/tmp/workbench.js:1:1',
      stack: 'at deepClone (/tmp/workbench.js:1:1)',
      type: 'Object',
    },
  ])
  mockResetTrackedAllocations.mockResolvedValue()
  mockSetTrackedAllocationStackTrackingEnabled.mockResolvedValue()
})

test('tracked allocation stack measure profiles one run then traces the hottest sites', async () => {
  const measure = await import('../src/parts/MeasureTrackedAllocationsWithStackTraces/MeasureTrackedAllocationsWithStackTraces.ts')
  const scriptHandler = {
    scriptMap: { '1': { url: 'file:///tmp/workbench.js' } },
    start: jest.fn<() => Promise<void>>().mockResolvedValue(),
    stop: jest.fn<() => Promise<void>>().mockResolvedValue(),
  }

  const state = {
    runCompletions: 0,
    scriptHandler,
    selectedLocations: [],
    stackTrackingEnabled: false,
  }

  expect(await measure.start({} as any, state)).toEqual([])
  await measure.runCompletion({} as any, state)
  await measure.runCompletion({} as any, state)
  const after = await measure.stop({} as any, state)

  expect(mockResetTrackedAllocations).toHaveBeenCalledTimes(2)
  expect(mockSetTrackedAllocationStackTrackingEnabled).toHaveBeenNthCalledWith(1, {}, false)
  expect(mockSetTrackedAllocationStackTrackingEnabled).toHaveBeenNthCalledWith(2, {}, true, [
    '/tmp/workbench.js:1:1',
    '/tmp/workbench.js:2:2',
  ])
  expect(after).toEqual({
    profiledRuns: 1,
    scriptMap: scriptHandler.scriptMap,
    selectedAllocationSites: ['/tmp/workbench.js:1:1', '/tmp/workbench.js:2:2'],
    trackedAllocationStacks: await mockGetTrackedAllocationStacks.mock.results[0].value,
    tracedRuns: 1,
  })
  expect(scriptHandler.start).toHaveBeenCalledTimes(1)
  expect(scriptHandler.stop).toHaveBeenCalledTimes(1)
})

test('tracked allocation stack measure disables capture when reading results fails', async () => {
  mockGetTrackedAllocationStacks.mockRejectedValue(new Error('boom'))
  const measure = await import('../src/parts/MeasureTrackedAllocationsWithStackTraces/MeasureTrackedAllocationsWithStackTraces.ts')
  const scriptHandler = {
    scriptMap: {},
    start: jest.fn<() => Promise<void>>().mockResolvedValue(),
    stop: jest.fn<() => Promise<void>>().mockResolvedValue(),
  }
  const state = {
    runCompletions: 2,
    scriptHandler,
    selectedLocations: ['/tmp/workbench.js:1:1'],
    stackTrackingEnabled: true,
  }

  await expect(measure.stop({} as any, state)).rejects.toThrow('boom')
  expect(mockSetTrackedAllocationStackTrackingEnabled).toHaveBeenCalledWith({}, false)
  expect(scriptHandler.stop).toHaveBeenCalledTimes(1)
})
