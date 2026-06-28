import { expect, test } from '@jest/globals'
import * as GetMeasure from '../src/parts/GetMeasure/GetMeasure.ts'
import * as LoadMemoryLeakFinder from '../src/parts/LoadMemoryLeakFinder/LoadMemoryLeakFinder.ts'
import * as MeasureBrowserPerformanceCounters from '../src/parts/MeasureBrowserPerformanceCounters/MeasureBrowserPerformanceCounters.ts'

test('browser performance counters measure lifecycle enables, samples, and disables performance metrics', async () => {
  const calls: unknown[] = []
  const session = {
    dispose() {},
    invoke(method: string, params: unknown) {
      calls.push([method, params])
      switch (method) {
        case 'Performance.enable':
        case 'Performance.disable':
          return Promise.resolve({ result: {} })
        case 'Performance.getMetrics':
          return Promise.resolve({
            result: {
              metrics: [{ name: 'LayoutCount', value: calls.length }],
            },
          })
        default:
          throw new Error(`unexpected method ${method}`)
      }
    },
  } as any

  const args = MeasureBrowserPerformanceCounters.create(session) as [any]
  const before = await MeasureBrowserPerformanceCounters.start(...args)
  const after = await MeasureBrowserPerformanceCounters.stop(...args)
  await MeasureBrowserPerformanceCounters.releaseResources(...args)

  expect(before).toEqual({
    metrics: [{ name: 'LayoutCount', value: 2 }],
  })
  expect(after).toEqual({
    metrics: [{ name: 'LayoutCount', value: 3 }],
  })
  expect(calls).toEqual([
    ['Performance.enable', {}],
    ['Performance.getMetrics', {}],
    ['Performance.getMetrics', {}],
    ['Performance.disable', {}],
  ])
})

test('browser performance counters measure compares as informational only', () => {
  const result = MeasureBrowserPerformanceCounters.compare(
    {
      metrics: [{ name: 'LayoutCount', value: 1 }],
    },
    {
      metrics: [{ name: 'LayoutCount', value: 4 }],
    },
  )

  expect(result.isLeak).toBe(false)
  expect(MeasureBrowserPerformanceCounters.isLeak()).toBe(false)
  expect(result.metrics.find((row) => row.name === 'layoutCount')).toEqual({
    after: 4,
    available: true,
    before: 1,
    cdpNames: ['LayoutCount'],
    delta: 3,
    name: 'layoutCount',
    unit: 'count',
  })
})

test('browser-performance-counters resolves through measure lookup', () => {
  const MemoryLeakFinder = LoadMemoryLeakFinder.loadMemoryLeakFinder()
  const measure = GetMeasure.getMeasure(MemoryLeakFinder, 'browser-performance-counters')

  expect(measure.id).toBe('browserPerformanceCounters')
})
