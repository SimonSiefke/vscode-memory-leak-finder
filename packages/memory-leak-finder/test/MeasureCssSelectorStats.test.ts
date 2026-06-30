import { expect, test } from '@jest/globals'
import * as GetMeasure from '../src/parts/GetMeasure/GetMeasure.ts'
import * as MeasureCssSelectorStats from '../src/parts/MeasureCssSelectorStats/MeasureCssSelectorStats.ts'

test('css selector stats measure lifecycle starts tracing and parses selector stats', async () => {
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
                    name: 'SelectorStats',
                    args: {
                      selector_stats: {
                        selector_timings: [
                          {
                            'elapsed (us)': 1200,
                            invalidation_count: 1,
                            match_attempts: 4,
                            match_count: 2,
                            selector: '.monaco-workbench',
                            style_sheet_id: 'sheet-1',
                          },
                        ],
                      },
                    },
                  },
                ],
              },
            })
            listeners['Tracing.tracingComplete']?.({ params: {} })
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

  const args = MeasureCssSelectorStats.create(session) as [any, any]
  const before = await MeasureCssSelectorStats.start(...args)
  const after = await MeasureCssSelectorStats.stop(...args)
  await MeasureCssSelectorStats.releaseResources(...args)

  expect(before.metrics.styleRecalculationCount).toBe(0)
  expect(after).toEqual({
    metrics: {
      invalidationCount: 1,
      matchAttempts: 4,
      matchCount: 2,
      styleRecalculationCount: 1,
      totalElapsedMs: 1.2,
    },
    topSelectors: [
      {
        elapsedMs: 1.2,
        invalidationCount: 1,
        matchAttempts: 4,
        matchCount: 2,
        selector: '.monaco-workbench',
        styleSheetId: 'sheet-1',
      },
    ],
  })
  expect(calls).toEqual([
    [
      'Tracing.start',
      {
        transferMode: 'ReportEvents',
        traceConfig: {
          includedCategories: [
            '-*',
            'devtools.timeline',
            'disabled-by-default-devtools.timeline',
            'disabled-by-default-blink.debug',
            'disabled-by-default-devtools.timeline.invalidationTracking',
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

test('css selector stats measure compares as informational only', () => {
  const result = MeasureCssSelectorStats.compare(
    {
      metrics: {
        invalidationCount: 0,
        matchAttempts: 0,
        matchCount: 0,
        styleRecalculationCount: 0,
        totalElapsedMs: 0,
      },
      topSelectors: [],
    },
    {
      metrics: {
        invalidationCount: 1,
        matchAttempts: 4,
        matchCount: 2,
        styleRecalculationCount: 1,
        totalElapsedMs: 1.2,
      },
      topSelectors: [],
    },
  )

  expect(result.isLeak).toBe(false)
  expect(MeasureCssSelectorStats.isLeak()).toBe(false)
  expect(result.metrics.styleRecalculationCount).toBe(1)
})

test('css-selector-stats resolves through measure lookup', () => {
  const MemoryLeakFinder = {
    Measures: {
      MeasureCssSelectorStats,
    },
  }
  const measure = GetMeasure.getMeasure(MemoryLeakFinder, 'css-selector-stats')

  expect(measure.id).toBe('cssSelectorStats')
})
