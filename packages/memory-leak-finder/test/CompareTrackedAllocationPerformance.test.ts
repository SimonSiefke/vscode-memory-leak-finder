import { beforeEach, expect, jest, test } from '@jest/globals'

const mockGetCpuProfileSourceSummary = jest.fn<any>()

jest.unstable_mockModule('../src/parts/CpuProfileSourceSummary/CpuProfileSourceSummary.ts', () => ({
  getCpuProfileSourceSummary: mockGetCpuProfileSourceSummary,
}))

beforeEach(() => {
  mockGetCpuProfileSourceSummary.mockReset()
  mockGetCpuProfileSourceSummary.mockResolvedValue({
    metrics: {
      javascriptSelfTimeMs: 8,
      profileTotalTimeMs: 10,
      sampleCount: 5,
    },
    sourceSelfTime: {
      'file:///a.js': 2,
      'file:///b.js': 6,
    },
  })
})

test('compareTrackedAllocationPerformance correlates allocation churn and JavaScript self time by source', async () => {
  const CompareTrackedAllocationPerformance =
    await import('../src/parts/CompareTrackedAllocationPerformance/CompareTrackedAllocationPerformance.ts')
  const cpuProfile = {
    nodes: [],
    samples: [],
  }
  const result = await CompareTrackedAllocationPerformance.compareTrackedAllocationPerformance(
    {},
    {
      cpuProfile,
      scriptMap: {},
      trackedAllocations: {
        a1: {
          aliveCount: 2,
          collectedCount: 8,
          createdCount: 10,
          location: 'file:///a.js:1:1',
          type: 'Array',
        },
        a2: {
          aliveCount: 1,
          collectedCount: 4,
          createdCount: 5,
          location: 'file:///a.js:2:1',
          type: 'Object',
        },
        b: {
          aliveCount: 0,
          collectedCount: 3,
          createdCount: 3,
          location: 'file:///b.js:1:1',
          type: 'Map',
        },
      },
    },
    {} as any,
  )

  expect(result.cpuProfile).toBe(cpuProfile)
  expect(result.metrics).toEqual({
    javascriptSelfTimeMs: 8,
    profileTotalTimeMs: 10,
    sampleCount: 5,
  })
  expect(result.files).toEqual([
    {
      collectedCount: 12,
      createdCount: 15,
      retainedCount: 3,
      source: 'file:///a.js',
      sourceSelfTimeMs: 2,
      sourceSelfTimePercent: 25,
    },
    {
      collectedCount: 3,
      createdCount: 3,
      retainedCount: 0,
      source: 'file:///b.js',
      sourceSelfTimeMs: 6,
      sourceSelfTimePercent: 75,
    },
  ])
  expect(result.sites).toHaveLength(3)
})

test('compareTrackedAllocationPerformance reports zero percent when there is no sampled JavaScript time', async () => {
  const CompareTrackedAllocationPerformance =
    await import('../src/parts/CompareTrackedAllocationPerformance/CompareTrackedAllocationPerformance.ts')
  mockGetCpuProfileSourceSummary.mockResolvedValue({
    metrics: {
      javascriptSelfTimeMs: 0,
      profileTotalTimeMs: 3,
      sampleCount: 1,
    },
    sourceSelfTime: {},
  })
  const result = await CompareTrackedAllocationPerformance.compareTrackedAllocationPerformance(
    {},
    {
      cpuProfile: {},
      scriptMap: {},
      trackedAllocations: {
        allocation: {
          aliveCount: 0,
          collectedCount: 2,
          createdCount: 2,
          location: '1:2:3',
          type: 'Object',
        },
      },
    },
    {} as any,
  )

  expect(result.files[0]).toMatchObject({
    source: '1',
    sourceSelfTimeMs: 0,
    sourceSelfTimePercent: 0,
  })
})
