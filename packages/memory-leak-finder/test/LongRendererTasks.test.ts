import { expect, test } from '@jest/globals'
import { analyze } from '../src/parts/LongRendererTasks/LongRendererTasks.ts'
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
  const result = analyze(capture([event('RunTask', 10, 50000), event('RunTask', 60000, 80000), event('RunTask', 70000, 60000)]))
  expect(result.metrics).toMatchObject({ taskCount: 2, longTaskCount: 1, blockingDurationMs: 30, maxTaskDurationMs: 80 })
})
test('missing markers are unavailable rather than a zero result', () => {
  expect(analyze({ events: [] }).available).toBe(false)
})
test('preserves incomplete capture status', () => {
  expect(analyze({ ...capture([]), incomplete: true }).incomplete).toBe(true)
})
