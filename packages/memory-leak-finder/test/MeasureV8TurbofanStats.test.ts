import { expect, test } from '@jest/globals'
import * as GetMeasure from '../src/parts/GetMeasure/GetMeasure.ts'
import * as MeasureV8TurbofanStats from '../src/parts/MeasureV8TurbofanStats/MeasureV8TurbofanStats.ts'

test('v8 turbofan stats measure lifecycle starts tracing and parses events', async () => {
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
                      stats:
                        '{"function_name":"activate","total_allocated_bytes":10,"max_allocated_bytes":4,"absolute_max_allocated_bytes":6}',
                    },
                    cat: 'disabled-by-default-v8.turbofan',
                    dur: 1500,
                    name: 'BytecodeGraphBuilder',
                  },
                  {
                    args: {
                      functionName: 'activate',
                      reason: 'wrong map',
                    },
                    cat: 'v8',
                    name: 'V8.DeoptimizeCode',
                  },
                ],
              },
            })
            listeners['Tracing.tracingComplete']?.({ params: { dataLossOccurred: true } })
          })
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

  const args = MeasureV8TurbofanStats.create(session) as [any, any]
  const before = await MeasureV8TurbofanStats.start(...args)
  const after = await MeasureV8TurbofanStats.stop(...args)
  await MeasureV8TurbofanStats.releaseResources(...args)

  expect(before.metrics.optimizationCount).toBe(0)
  expect(after.metrics).toEqual({
    dataLossOccurred: true,
    deoptimizationCount: 1,
    optimizationCount: 1,
    phaseEventCount: 1,
    rawEventCount: 2,
    totalAllocatedBytes: 10,
    totalPhaseDurationMs: 1.5,
  })
  expect(after.topOptimizedFunctions).toEqual([
    {
      functionName: 'activate',
      optimizationCount: 1,
      totalAllocatedBytes: 10,
      totalPhaseDurationMs: 1.5,
    },
  ])
  expect(calls).toEqual([
    [
      'Tracing.start',
      {
        transferMode: 'ReportEvents',
        traceConfig: {
          includedCategories: [
            '-*',
            'v8',
            'disabled-by-default-v8.compile',
            'disabled-by-default-v8.turbofan',
            'disabled-by-default-v8.wasm.turbofan',
            'disabled-by-default-v8.turbofan_stats',
            'disabled-by-default-v8.turbofan_statistics',
          ],
          recordMode: 'recordUntilFull',
        },
      },
    ],
    ['Tracing.end', {}],
  ])
  expect(listeners['Tracing.dataCollected']).toBeUndefined()
  expect(listeners['Tracing.tracingComplete']).toBeUndefined()
})

test('v8 turbofan stats measure compares as informational only', () => {
  const result = MeasureV8TurbofanStats.compare(
    {
      metrics: {
        dataLossOccurred: false,
        deoptimizationCount: 0,
        optimizationCount: 0,
        phaseEventCount: 0,
        rawEventCount: 0,
        totalAllocatedBytes: 0,
        totalPhaseDurationMs: 0,
      },
      rawEvents: [],
      topDeoptimizedFunctions: [],
      topOptimizedFunctions: [],
      topPhases: [],
    },
    {
      metrics: {
        dataLossOccurred: false,
        deoptimizationCount: 1,
        optimizationCount: 1,
        phaseEventCount: 1,
        rawEventCount: 2,
        totalAllocatedBytes: 10,
        totalPhaseDurationMs: 1.5,
      },
      rawEvents: [{ name: 'V8.DeoptimizeCode' }],
      topDeoptimizedFunctions: [],
      topOptimizedFunctions: [],
      topPhases: [],
    },
  )

  expect(result.isLeak).toBe(false)
  expect(MeasureV8TurbofanStats.isLeak()).toBe(false)
  expect(result.metrics.optimizationCount).toBe(1)
})

test('v8-turbofan-stats resolves through measure lookup', () => {
  const MemoryLeakFinder = {
    Measures: {
      MeasureV8TurbofanStats,
    },
  }
  const measure = GetMeasure.getMeasure(MemoryLeakFinder, 'v8-turbofan-stats')

  expect(measure.id).toBe('v8TurbofanStats')
})
