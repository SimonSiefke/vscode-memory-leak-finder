import { expect, test } from '@jest/globals'
import * as GetMeasure from '../src/parts/GetMeasure/GetMeasure.ts'
import * as LoadMemoryLeakFinder from '../src/parts/LoadMemoryLeakFinder/LoadMemoryLeakFinder.ts'
import * as MeasureCpuProfile from '../src/parts/MeasureCpuProfile/MeasureCpuProfile.ts'

test('cpu profile measure lifecycle starts and stops the profiler', async () => {
  const calls: unknown[] = []
  const profile = {
    endTime: 3000,
    nodes: [
      {
        callFrame: {
          columnNumber: 1,
          functionName: 'work',
          lineNumber: 2,
          url: 'file:///work.js',
        },
        id: 1,
      },
    ],
    samples: [1, 1],
    startTime: 0,
    timeDeltas: [1000, 2000],
  }
  const session = {
    dispose() {},
    invoke(method: string, params: unknown) {
      calls.push([method, params])
      if (method === 'Profiler.stop') {
        return Promise.resolve({ profile })
      }
      return Promise.resolve({})
    },
  } as any

  const args = MeasureCpuProfile.create(session) as [any]
  const before = await MeasureCpuProfile.start(...args)
  const after = await MeasureCpuProfile.stop(...args)
  const result = MeasureCpuProfile.compare(before, after)
  await MeasureCpuProfile.releaseResources(...args)

  expect(before.metrics.sampleCount).toBe(0)
  expect(after).toBe(profile)
  expect(result.isLeak).toBe(false)
  expect(result.metrics.totalTimeMs).toBe(3)
  expect(result.topSelfTime[0]).toMatchObject({
    functionName: 'work',
    hitCount: 2,
    selfTimeMs: 3,
  })
  expect(calls).toEqual([
    ['Profiler.enable', {}],
    ['Profiler.start', {}],
    ['Profiler.stop', {}],
    ['Profiler.disable', {}],
  ])
})

test('cpu profile measure compares as informational only', () => {
  const result = MeasureCpuProfile.compare(
    {
      metrics: {
        nodeCount: 0,
        sampleCount: 0,
        totalTimeMs: 0,
      },
      topSelfTime: [],
      topTotalTime: [],
    },
    {
      nodes: [],
      samples: [],
    },
  )

  expect(result.isLeak).toBe(false)
  expect(MeasureCpuProfile.isLeak()).toBe(false)
  expect(result.metrics.sampleCount).toBe(0)
})

test('cpu-profile resolves through measure lookup', () => {
  const MemoryLeakFinder = LoadMemoryLeakFinder.loadMemoryLeakFinder()
  const measure = GetMeasure.getMeasure(MemoryLeakFinder, 'cpu-profile')

  expect(measure.id).toBe('cpuProfile')
})
