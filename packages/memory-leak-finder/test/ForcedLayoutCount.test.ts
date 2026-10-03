import { expect, test } from '@jest/globals'
import { analyze } from '../src/parts/ForcedLayoutCount/ForcedLayoutCount.ts'
const event = (name: string, ts: number, dur: number, args = {}) => ({ name, ts, dur, args, pid: 1, tid: 2, ph: 'X' })
const capture = (events: any[]) => ({
  marker: 'test',
  events: [
    { ...event('TimeStamp', 0, 0, { data: { message: 'test:start' } }), ph: 'I' },
    ...events,
    { ...event('TimeStamp', 200000, 0, { data: { message: 'test:end' } }), ph: 'I' },
  ],
})
test('classifies selected renderer work and avoids nested duration inflation', () => {
  const result = analyze(
    capture([
      event('Layout', 10, 3),
      event('FunctionCall', 100, 100, { data: { url: 'work.js' } }),
      event('Layout', 110, 20),
      event('UpdateLayoutTree', 140, 10),
      { ...event('Layout', 110, 20), tid: 8 },
    ]),
  )
  expect(result.metrics).toMatchObject({ forcedLayoutCount: 1, forcedLayoutDurationMs: 0.02, forcedStyleCount: 1 })
  expect(result.rows[0].name).toContain('work.js')
})
test('missing markers are unavailable rather than a zero result', () => {
  expect(analyze({ events: [] }).available).toBe(false)
})
test('preserves incomplete capture status', () => {
  expect(analyze({ ...capture([]), incomplete: true }).incomplete).toBe(true)
})
