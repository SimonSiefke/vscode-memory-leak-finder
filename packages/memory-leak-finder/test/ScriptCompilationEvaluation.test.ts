import { expect, test } from '@jest/globals'
import { analyze } from '../src/parts/ScriptCompilationEvaluation/ScriptCompilationEvaluation.ts'
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
  const result = analyze(capture([event('V8.CompileScript', 10, 100), event('V8.CompileCode', 20, 30), event('EvaluateScript', 200, 100)]))
  expect(result.metrics).toMatchObject({ compileEventCount: 2, compileDurationMs: 0.1, evaluationDurationMs: 0.1 })
})
test('missing markers are unavailable rather than a zero result', () => {
  expect(analyze({ events: [] }).available).toBe(false)
})
test('preserves incomplete capture status', () => {
  expect(analyze({ ...capture([]), incomplete: true }).incomplete).toBe(true)
})
