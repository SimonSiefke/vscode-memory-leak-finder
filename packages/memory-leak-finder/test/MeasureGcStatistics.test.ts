import { expect, test } from '@jest/globals'
import * as GetMeasure from '../src/parts/GetMeasure/GetMeasure.ts'
import * as LoadMemoryLeakFinder from '../src/parts/LoadMemoryLeakFinder/LoadMemoryLeakFinder.ts'
import * as MeasureGcStatistics from '../src/parts/MeasureGcStatistics/MeasureGcStatistics.ts'

test('gc statistics measure lifecycle traces events and forces final gc', async () => {
  const calls: unknown[] = []
  const listeners = Object.create(null)
  const session = {
    listeners,
    dispose() {},
    invoke(method: string, params: unknown) {
      calls.push([method, params])
      switch (method) {
        case 'Tracing.start':
          return Promise.resolve({ result: {} })
        case 'Tracing.end':
          queueMicrotask(() => {
            listeners['Tracing.dataCollected']?.({
              params: {
                value: [
                  {
                    args: {
                      usedHeapSizeAfter: 4 * 1024 * 1024,
                      usedHeapSizeBefore: 8 * 1024 * 1024,
                    },
                    name: 'MinorGC',
                  },
                  {
                    args: {
                      usedHeapSizeAfter: 3 * 1024 * 1024,
                      usedHeapSizeBefore: 6 * 1024 * 1024,
                    },
                    name: 'MajorGC',
                  },
                  {
                    dur: 2_000,
                    name: 'V8.GCScavenger',
                  },
                ],
              },
            })
            listeners['Tracing.tracingComplete']?.({ params: { dataLossOccurred: true } })
          })
          return Promise.resolve({ result: {} })
        case 'Runtime.getHeapUsage':
          if (calls.filter((call) => Array.isArray(call) && call[0] === 'Runtime.getHeapUsage').length === 1) {
            return Promise.resolve({
              result: {
                totalSize: 20 * 1024 * 1024,
                usedSize: 10 * 1024 * 1024,
              },
            })
          }
          return Promise.resolve({
            result: {
              totalSize: 20 * 1024 * 1024,
              usedSize: 7 * 1024 * 1024,
            },
          })
        case 'HeapProfiler.collectGarbage':
          return Promise.resolve({ result: {} })
        default:
          throw new Error(`unexpected method ${method}`)
      }
    },
    off(event: string, listener: unknown) {
      if (listeners[event] === listener) {
        delete listeners[event]
      }
    },
    on(event: string, listener: unknown) {
      listeners[event] = listener
    },
  } as any

  const args = MeasureGcStatistics.create(session) as [any, any]
  const before = await MeasureGcStatistics.start(...args)
  const after = await MeasureGcStatistics.stop(...args)
  await MeasureGcStatistics.releaseResources(...args)

  expect(before.metrics).toEqual({
    garbageMB: 0,
    gcDurationMs: 0,
    majorGCs: 0,
    minorGCs: 0,
    usedHeapMB: 0,
  })
  expect(after).toEqual({
    dataLossOccurred: true,
    metrics: {
      garbageMB: 10,
      gcDurationMs: 2,
      majorGCs: 1,
      minorGCs: 1,
      usedHeapMB: 7,
    },
    rawEvents: [
      {
        args: {
          usedHeapSizeAfter: 4 * 1024 * 1024,
          usedHeapSizeBefore: 8 * 1024 * 1024,
        },
        name: 'MinorGC',
      },
      {
        args: {
          usedHeapSizeAfter: 3 * 1024 * 1024,
          usedHeapSizeBefore: 6 * 1024 * 1024,
        },
        name: 'MajorGC',
      },
      {
        dur: 2_000,
        name: 'V8.GCScavenger',
      },
    ],
  })
  expect(calls).toEqual([
    [
      'Tracing.start',
      {
        transferMode: 'ReportEvents',
        traceConfig: {
          includedCategories: ['v8'],
          recordMode: 'recordUntilFull',
        },
      },
    ],
    ['Tracing.end', {}],
    ['Runtime.getHeapUsage', {}],
    ['HeapProfiler.collectGarbage', {}],
    ['Runtime.getHeapUsage', {}],
  ])
  expect(listeners['Tracing.dataCollected']).toBeUndefined()
  expect(listeners['Tracing.tracingComplete']).toBeUndefined()
})

test('gc statistics measure compares as informational only', () => {
  const result = MeasureGcStatistics.compare(
    {
      dataLossOccurred: false,
      metrics: {
        garbageMB: 0,
        gcDurationMs: 0,
        majorGCs: 0,
        minorGCs: 0,
        usedHeapMB: 0,
      },
      rawEvents: [],
    },
    {
      dataLossOccurred: false,
      metrics: {
        garbageMB: 5,
        gcDurationMs: 7,
        majorGCs: 1,
        minorGCs: 2,
        usedHeapMB: 40,
      },
      rawEvents: [{ name: 'MajorGC' }],
    },
  )

  expect(result.isLeak).toBe(false)
  expect(MeasureGcStatistics.isLeak()).toBe(false)
  expect(result.rows).toEqual([
    { name: 'usedHeapMB', unit: 'MB', value: 40 },
    { name: 'garbageMB', unit: 'MB', value: 5 },
    { name: 'majorGCs', unit: 'count', value: 1 },
    { name: 'minorGCs', unit: 'count', value: 2 },
    { name: 'gcDurationMs', unit: 'ms', value: 7 },
  ])
})

test('gc-statistics resolves through measure lookup', () => {
  const MemoryLeakFinder = LoadMemoryLeakFinder.loadMemoryLeakFinder()
  const measure = GetMeasure.getMeasure(MemoryLeakFinder, 'gc-statistics')

  expect(measure.id).toBe('gcStatistics')
})
