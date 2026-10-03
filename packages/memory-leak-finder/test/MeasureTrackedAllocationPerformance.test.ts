import { expect, jest, test } from '@jest/globals'

const calls: string[] = []
const mockForceGarbageCollection = jest.fn(async () => {
  calls.push('gc')
})
const mockGetTrackedAllocations = jest.fn(async () => {
  calls.push('allocations')
  return {
    allocation: {
      aliveCount: 1,
      collectedCount: 2,
      createdCount: 3,
      location: '1:2:3',
      type: 'Object',
    },
  }
})
const mockResetTrackedAllocations = jest.fn(async () => {
  calls.push('reset')
})

jest.unstable_mockModule('../src/parts/ForceGarbageCollection/ForceGarbageCollection.ts', () => ({
  forceGarbageCollection: mockForceGarbageCollection,
}))

jest.unstable_mockModule('../src/parts/GetTrackedAllocations/GetTrackedAllocations.ts', () => ({
  getTrackedAllocations: mockGetTrackedAllocations,
  resetTrackedAllocations: mockResetTrackedAllocations,
}))

test('tracked allocation performance profiles the scenario and excludes final GC from the CPU profile', async () => {
  calls.length = 0
  const MeasureTrackedAllocationPerformance =
    await import('../src/parts/MeasureTrackedAllocationPerformance/MeasureTrackedAllocationPerformance.ts')
  const profile = {
    nodes: [],
    samples: [],
  }
  const session = {
    invoke(method: string) {
      calls.push(method)
      if (method === 'Profiler.stop') {
        return Promise.resolve({ profile })
      }
      return Promise.resolve({})
    },
  } as any
  const state = {
    profilerEnabled: false,
    profilerStarted: false,
    scriptHandler: {
      scriptMap: {
        1: {
          url: 'file:///workbench.js',
        },
      },
      async start() {
        calls.push('script-start')
      },
      async stop() {
        calls.push('script-stop')
      },
    },
  }

  const before = await MeasureTrackedAllocationPerformance.start(session, state)
  const after = await MeasureTrackedAllocationPerformance.stop(session, state)
  await MeasureTrackedAllocationPerformance.releaseResources(session, state)

  expect(before).toEqual({})
  expect(after).toEqual({
    cpuProfile: profile,
    scriptMap: state.scriptHandler.scriptMap,
    trackedAllocations: {
      allocation: {
        aliveCount: 1,
        collectedCount: 2,
        createdCount: 3,
        location: '1:2:3',
        type: 'Object',
      },
    },
  })
  expect(calls).toEqual([
    'script-start',
    'gc',
    'reset',
    'Profiler.enable',
    'Profiler.start',
    'Profiler.stop',
    'gc',
    'allocations',
    'script-stop',
    'Profiler.disable',
    'script-stop',
  ])
  expect(MeasureTrackedAllocationPerformance.id).toBe('trackedAllocationPerformance')
  expect(MeasureTrackedAllocationPerformance.isLeak()).toBe(false)
})

test('tracked allocation performance release stops an active profiler before disabling it', async () => {
  calls.length = 0
  const MeasureTrackedAllocationPerformance =
    await import('../src/parts/MeasureTrackedAllocationPerformance/MeasureTrackedAllocationPerformance.ts')
  const session = {
    invoke(method: string) {
      calls.push(method)
      return Promise.resolve({})
    },
  } as any
  const state = {
    profilerEnabled: true,
    profilerStarted: true,
    scriptHandler: {
      scriptMap: {},
      async start() {},
      async stop() {
        calls.push('script-stop')
      },
    },
  }

  await MeasureTrackedAllocationPerformance.releaseResources(session, state)

  expect(calls).toEqual(['Profiler.stop', 'Profiler.disable', 'script-stop'])
  expect(state).toMatchObject({
    profilerEnabled: false,
    profilerStarted: false,
  })
})

test('tracked allocation performance stops source capture before reporting missing instrumentation', async () => {
  calls.length = 0
  const MeasureTrackedAllocationPerformance =
    await import('../src/parts/MeasureTrackedAllocationPerformance/MeasureTrackedAllocationPerformance.ts')
  mockGetTrackedAllocations.mockResolvedValueOnce({} as any)
  const session = {
    invoke(method: string) {
      calls.push(method)
      if (method === 'Profiler.stop') {
        return Promise.resolve({
          profile: {
            nodes: [],
            samples: [],
          },
        })
      }
      return Promise.resolve({})
    },
  } as any
  const state = {
    profilerEnabled: true,
    profilerStarted: true,
    scriptHandler: {
      scriptMap: {},
      async start() {},
      async stop() {
        calls.push('script-stop')
      },
    },
  }

  await expect(MeasureTrackedAllocationPerformance.stop(session, state)).rejects.toThrow('Tracked allocation performance produced no data')
  expect(calls).toEqual(['Profiler.stop', 'gc', 'script-stop'])
  expect(state.profilerStarted).toBe(false)
})

test('tracked allocation performance summary labels CPU time as source correlation', async () => {
  const MeasureTrackedAllocationPerformance =
    await import('../src/parts/MeasureTrackedAllocationPerformance/MeasureTrackedAllocationPerformance.ts')
  const summary = MeasureTrackedAllocationPerformance.summary({
    cpuProfile: {},
    files: [
      {
        collectedCount: 8,
        createdCount: 10,
        retainedCount: 2,
        source: 'src/a.ts',
        sourceSelfTimeMs: 4,
        sourceSelfTimePercent: 40,
      },
    ],
    metrics: {
      javascriptSelfTimeMs: 10,
      profileTotalTimeMs: 12,
      sampleCount: 5,
    },
    sites: [],
  })

  expect(summary).toContain('src/a.ts | 10 | 8 | 2 | 4 | 40')
  expect(summary).toContain('not allocation-attributed time')
})
