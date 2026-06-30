import { expect, test } from '@jest/globals'
import { formatLayoutEventsSummary, getLayoutEvents } from '../src/parts/LayoutEvents/LayoutEvents.ts'

test('getLayoutEvents aggregates layout trace events', () => {
  const result = getLayoutEvents(
    [
      { name: 'EventDispatch', ts: 9000 },
      { dur: 2500, name: 'Layout', ts: 10_000 },
      { dur: 1000, name: 'Paint', ts: 11_000 },
      { dur: 1500, name: 'Layout', ts: 15_000 },
    ],
    true,
  )

  expect(result.metrics).toEqual({
    averageDurationMs: 2,
    dataLossOccurred: true,
    layoutCount: 2,
    maxDurationMs: 2.5,
    totalDurationMs: 4,
  })
  expect(result.events).toEqual([
    {
      durationMs: 2.5,
      index: 1,
      startMs: 1,
      timestampUs: 10_000,
    },
    {
      durationMs: 1.5,
      index: 2,
      startMs: 6,
      timestampUs: 15_000,
    },
  ])
  expect(result.rawEvents).toEqual([
    { dur: 2500, name: 'Layout', ts: 10_000 },
    { dur: 1500, name: 'Layout', ts: 15_000 },
  ])
})

test('getLayoutEvents ignores non-layout events and tolerates missing duration', () => {
  const result = getLayoutEvents([
    { name: 'Paint', ts: 1_000 },
    { name: 'Layout', ts: 2_000 },
    { dur: Number.NaN, name: 'Layout', ts: 3_000 },
  ])

  expect(result.metrics).toEqual({
    averageDurationMs: 0,
    dataLossOccurred: false,
    layoutCount: 2,
    maxDurationMs: 0,
    totalDurationMs: 0,
  })
  expect(result.events).toEqual([
    {
      durationMs: 0,
      index: 1,
      startMs: 1,
      timestampUs: 2_000,
    },
    {
      durationMs: 0,
      index: 2,
      startMs: 2,
      timestampUs: 3_000,
    },
  ])
})

test('formatLayoutEventsSummary returns compact text with slowest events', () => {
  const summary = formatLayoutEventsSummary(
    getLayoutEvents([
      { dur: 1000, name: 'Layout', ts: 1_000 },
      { dur: 3000, name: 'Layout', ts: 2_000 },
    ]),
  )

  expect(summary).toContain('Layout events:')
  expect(summary).toContain('layoutCount | 2')
  expect(summary).toContain('index | startMs | durationMs')
  expect(summary).toContain('2 | 1 | 3')
})
