import { expect, test } from '@jest/globals'
import * as GetMeasure from '../src/parts/GetMeasure/GetMeasure.ts'
import * as LoadMemoryLeakFinder from '../src/parts/LoadMemoryLeakFinder/LoadMemoryLeakFinder.ts'
import * as MeasureLayoutEvents from '../src/parts/MeasureLayoutEvents/MeasureLayoutEvents.ts'

test('layout events measure lifecycle starts tracing and parses layout events', async () => {
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
                  { name: 'EventDispatch', ts: 1_000 },
                  { dur: 2_500, name: 'Layout', ts: 2_000 },
                  { dur: 1_000, name: 'Layout', ts: 5_000 },
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

  const args = MeasureLayoutEvents.create(session) as [any, any]
  const before = await MeasureLayoutEvents.start(...args)
  const after = await MeasureLayoutEvents.stop(...args)
  await MeasureLayoutEvents.releaseResources(...args)

  expect(before.metrics.layoutCount).toBe(0)
  expect(after).toEqual({
    events: [
      {
        durationMs: 2.5,
        index: 1,
        startMs: 1,
        timestampUs: 2_000,
      },
      {
        durationMs: 1,
        index: 2,
        startMs: 4,
        timestampUs: 5_000,
      },
    ],
    metrics: {
      averageDurationMs: 1.75,
      dataLossOccurred: true,
      layoutCount: 2,
      maxDurationMs: 2.5,
      totalDurationMs: 3.5,
    },
    rawEvents: [
      { dur: 2_500, name: 'Layout', ts: 2_000 },
      { dur: 1_000, name: 'Layout', ts: 5_000 },
    ],
  })
  expect(calls).toEqual([
    [
      'Tracing.start',
      {
        transferMode: 'ReportEvents',
        traceConfig: {
          includedCategories: ['-*', 'devtools.timeline', 'disabled-by-default-devtools.timeline'],
          recordMode: 'recordUntilFull',
        },
      },
    ],
    ['Tracing.end', {}],
  ])
  expect(listeners['Tracing.dataCollected']).toBeUndefined()
  expect(listeners['Tracing.tracingComplete']).toBeUndefined()
})

test('layout events measure compares as informational only', () => {
  const result = MeasureLayoutEvents.compare(
    {
      events: [],
      metrics: {
        averageDurationMs: 0,
        dataLossOccurred: false,
        layoutCount: 0,
        maxDurationMs: 0,
        totalDurationMs: 0,
      },
      rawEvents: [],
    },
    {
      events: [
        {
          durationMs: 2.5,
          index: 1,
          startMs: 1,
          timestampUs: 2_000,
        },
      ],
      metrics: {
        averageDurationMs: 2.5,
        dataLossOccurred: false,
        layoutCount: 1,
        maxDurationMs: 2.5,
        totalDurationMs: 2.5,
      },
      rawEvents: [{ dur: 2_500, name: 'Layout', ts: 2_000 }],
    },
  )

  expect(result.isLeak).toBe(false)
  expect(MeasureLayoutEvents.isLeak()).toBe(false)
  expect(result.metrics.layoutCount).toBe(1)
  expect(result.raw.after).toEqual([{ dur: 2_500, name: 'Layout', ts: 2_000 }])
})

test('layout-events resolves through measure lookup', () => {
  const MemoryLeakFinder = LoadMemoryLeakFinder.loadMemoryLeakFinder()
  const measure = GetMeasure.getMeasure(MemoryLeakFinder, 'layout-events')

  expect(measure.id).toBe('layoutEvents')
})
