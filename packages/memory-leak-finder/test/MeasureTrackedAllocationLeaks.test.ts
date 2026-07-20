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
  mockForceGarbageCollection.mockReset()
  mockForceGarbageCollection.mockResolvedValue()
  mockGetTrackedAllocations.mockReset()
  mockGetTrackedAllocations.mockResolvedValue({
    allocation: {
      aliveCount: 1,
      collectedCount: 2,
      createdCount: 3,
      location: '1:2:3',
      type: 'Object',
    },
  })
  mockResetTrackedAllocations.mockReset()
  mockResetTrackedAllocations.mockResolvedValue()
})

test('tracked allocation leak measure resets after source-map capture and forced GC', async () => {
  const MeasureTrackedAllocationLeaks = await import('../src/parts/MeasureTrackedAllocationLeaks/MeasureTrackedAllocationLeaks.ts')
  const calls: string[] = []
  const scriptHandler = {
    scriptMap: {},
    start: jest.fn(async () => {
      calls.push('script-start')
    }),
    stop: jest.fn(async () => {
      calls.push('script-stop')
    }),
  }
  mockForceGarbageCollection.mockImplementation(async () => {
    calls.push('gc')
  })
  mockResetTrackedAllocations.mockImplementation(async () => {
    calls.push('reset')
  })

  const before = await MeasureTrackedAllocationLeaks.start({} as any, scriptHandler)
  const after = await MeasureTrackedAllocationLeaks.stop({} as any, scriptHandler)

  expect(before).toEqual({})
  expect(after.trackedAllocations).toEqual(await mockGetTrackedAllocations.mock.results[0].value)
  expect(calls).toEqual(['script-start', 'gc', 'reset', 'gc', 'script-stop'])
  expect(MeasureTrackedAllocationLeaks.id).toBe('trackedAllocationLeaks')
  expect(MeasureTrackedAllocationLeaks.isLeak()).toBe(false)
})

test('tracked allocation leak summary is informational and compact', async () => {
  const MeasureTrackedAllocationLeaks = await import('../src/parts/MeasureTrackedAllocationLeaks/MeasureTrackedAllocationLeaks.ts')
  expect(MeasureTrackedAllocationLeaks.summary([])).toBe('Tracked allocation leak candidates: none')
  expect(
    MeasureTrackedAllocationLeaks.summary([
      {
        aliveCount: 2,
        collectedCount: 3,
        createdCount: 5,
        location: '1:2:3',
        originalColumn: 2,
        originalLine: 10,
        originalLocation: 'src/a.ts:10:2',
        originalSource: 'src/a.ts',
        originalType: 'Array',
        type: 'Array',
      },
    ]),
  ).toContain('2 | 5 | 3 | Array | src/a.ts:10:2')
})
