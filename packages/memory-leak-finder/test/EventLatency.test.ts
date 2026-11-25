import { runInNewContext } from 'node:vm'
import { expect, test } from '@jest/globals'
import { install } from '../src/parts/EventLatencyTracker/EventLatencyTracker.ts'
import * as GetMeasure from '../src/parts/GetMeasure/GetMeasure.ts'
import * as Measure from '../src/parts/MeasureEventLatency/MeasureEventLatency.ts'
import * as Measures from '../src/parts/Measures/Measures.ts'

const entry = (name: string, startTime: number, duration: number, processingStart: number, processingEnd: number, interactionId = 0) => ({
  name,
  startTime,
  duration,
  processingStart,
  processingEnd,
  interactionId,
})

const createRealm = ({ now = 100, eventCounts }: { now?: number; eventCounts?: Map<string, number> } = {}) => {
  const state = { callback: undefined as any, options: undefined as any, pending: [] as any[], disconnected: false }
  class PerformanceObserver {
    static supportedEntryTypes = ['event', 'first-input']
    constructor(callback: any) {
      state.callback = callback
    }
    observe(options: any) {
      state.options = options
    }
    takeRecords() {
      return state.pending.splice(0)
    }
    disconnect() {
      state.disconnected = true
    }
  }
  const deliver = (...entries: any[]) => state.callback({ getEntries: () => entries })
  const performance: any = { now: () => now }
  if (eventCounts) performance.eventCounts = eventCounts
  const tracker = runInNewContext(`(${install.toString()})()`, { PerformanceObserver, performance })
  return { tracker, state, deliver }
}

test('public measure resolves', () => {
  expect(GetMeasure.getMeasure({ Measures }, 'event-latency')).toBe(Measure)
  expect(GetMeasure.getMeasure({ Measures }, 'eventLatency')).toBe(Measure)
})

test('observes only new slow events without buffering', () => {
  const { state } = createRealm()
  expect({ ...state.options }).toEqual({ type: 'event', durationThreshold: 16 })
})

test('ignores entries that started before the measurement window', () => {
  const { tracker, deliver } = createRealm({ now: 100 })
  deliver(entry('keydown', 99.9, 96, 100, 110), entry('keydown', 100, 24, 102, 110))
  const result = tracker.snapshot()
  expect(result.metrics.slowEventCount).toBe(1)
  expect(result.rows[0].startMs).toBe(0)
})

test('splits input delay, processing and presentation delay and clamps rounding', () => {
  const { tracker, deliver } = createRealm({ now: 0 })
  deliver(entry('keydown', 10, 48, 15, 35, 7), entry('keyup', 100, 16, 100, 120, 7))
  const [keydown, keyup] = tracker.snapshot().rows
  expect(keydown).toEqual({
    name: 'keydown',
    durationMs: 48,
    inputDelayMs: 5,
    processingMs: 20,
    presentationDelayMs: 23,
    interactionId: 7,
    startMs: 10,
  })
  // duration is rounded to 8 ms and can end before processingEnd.
  expect(keyup).toMatchObject({ inputDelayMs: 0, processingMs: 20, presentationDelayMs: 0 })
})

test('groups by event name and interaction and includes records not yet delivered', () => {
  const { tracker, deliver, state } = createRealm({ now: 0 })
  deliver(entry('keydown', 1, 40, 1, 2, 1), entry('keyup', 2, 96, 2, 3, 1), entry('pointermove', 3, 24, 3, 4))
  state.pending.push(entry('keydown', 4, 16, 4, 5, 2))
  const result = tracker.snapshot()
  expect(result.events.keydown).toEqual({ count: 2, p50DurationMs: 16, p95DurationMs: 40, maxDurationMs: 40 })
  expect(result.events.keyup.count).toBe(1)
  expect(result.metrics).toMatchObject({
    slowEventCount: 4,
    interactionCount: 2,
    maxDurationMs: 96,
    p95InteractionDurationMs: 96,
    maxInteractionDurationMs: 96,
  })
  expect(result.metrics).not.toHaveProperty('eventCount')
  expect(result).not.toHaveProperty('eventCounts')
  expect(result.rows.map((row: any) => row.durationMs)).toEqual([96, 40, 24, 16])
  const summary = Measure.summary(result)
  expect(summary).toContain('keydown | slow 2 | p95 ms 40')
  expect(summary).toContain('keyup | ms 96 | input 0 | processing 1 | presentation 95')
  expect(summary).not.toContain('count -')
})

test('caps stored entries and the reported rows', () => {
  const { tracker, deliver } = createRealm({ now: 0 })
  deliver(...Array.from({ length: 5003 }, (_, index) => entry('click', index, 16 + (index % 100), index, index)))
  const result = tracker.snapshot()
  expect(result.metrics).toMatchObject({ slowEventCount: 5003, droppedEventCount: 3 })
  expect(result.incomplete).toBe(true)
  expect(result.rows).toHaveLength(20)
  expect(result.events.click.count).toBe(5000)
})

test('reports per-type event count deltas as denominators', () => {
  const eventCounts = new Map([
    ['keydown', 3],
    ['click', 1],
  ])
  const { tracker } = createRealm({ eventCounts })
  eventCounts.set('keydown', 8)
  eventCounts.set('keyup', 5)
  const result = tracker.snapshot()
  expect({ ...result.eventCounts }).toEqual({ keydown: 5, keyup: 5 })
  expect(result.metrics).toMatchObject({ eventCount: 10, slowEventCount: 0, p95DurationMs: null })
  expect(Measure.summary(result)).toContain('No events reached 16 ms (10 events dispatched)')
})

test('targets without Event Timing are unavailable', () => {
  for (const context of [
    {},
    {
      PerformanceObserver: class {
        static supportedEntryTypes = ['mark', 'measure']
      },
      performance: { now: () => 0 },
    },
  ]) {
    const tracker = runInNewContext(`(${install.toString()})()`, context)
    expect(tracker.available).toBe(false)
    expect(tracker.snapshot()).toMatchObject({ available: false, metrics: {}, rows: [] })
    expect(Measure.summary(tracker.snapshot())).toContain('Unavailable: Event Timing')
  }
})

test('dispose disconnects the observer', () => {
  const { tracker, state } = createRealm()
  tracker.dispose()
  expect(state.disconnected).toBe(true)
})

test('stop waits for paint before taking the snapshot', async () => {
  const expressions: string[] = []
  const session = {
    invoke: async (_method: string, options: any) => {
      expressions.push(options.expression)
      return { result: { result: { value: { metrics: {} } } } }
    },
  } as any
  await Measure.stop(session)
  expect(expressions).toHaveLength(2)
  expect(expressions[0]).toContain('requestAnimationFrame')
  expect(expressions[1]).toContain('tracker.snapshot()')
})
