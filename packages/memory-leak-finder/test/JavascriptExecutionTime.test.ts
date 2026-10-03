import { expect, test } from '@jest/globals'
import {
  formatJavascriptExecutionTimeSummary,
  normalizeJavascriptExecutionTime,
} from '../src/parts/JavascriptExecutionTime/JavascriptExecutionTime.ts'

test('normalizeJavascriptExecutionTime computes script and task duration deltas', () => {
  const rows = normalizeJavascriptExecutionTime(
    {
      metrics: [
        { name: 'ScriptDuration', value: 0.03 },
        { name: 'TaskDuration', value: 0.04 },
      ],
    },
    {
      metrics: [
        { name: 'ScriptDuration', value: 0.13 },
        { name: 'TaskDuration', value: 0.24 },
      ],
    },
  )

  expect(rows).toEqual([
    { after: 130, available: true, before: 30, cdpName: 'ScriptDuration', delta: 100, name: 'scriptDurationMs', unit: 'ms' },
    { after: 240, available: true, before: 40, cdpName: 'TaskDuration', delta: 200, name: 'taskDurationMs', unit: 'ms' },
  ])
})

test('normalizeJavascriptExecutionTime preserves missing metrics as unavailable', () => {
  const rows = normalizeJavascriptExecutionTime(
    {
      metrics: [{ name: 'ScriptDuration', value: 0.03 }],
    },
    {
      metrics: [{ name: 'TaskDuration', value: 0.24 }],
    },
  )

  expect(rows).toEqual([
    {
      after: null,
      available: false,
      before: null,
      cdpName: 'ScriptDuration',
      delta: null,
      name: 'scriptDurationMs',
      unit: 'ms',
    },
    {
      after: null,
      available: false,
      before: null,
      cdpName: 'TaskDuration',
      delta: null,
      name: 'taskDurationMs',
      unit: 'ms',
    },
  ])
})

test('formatJavascriptExecutionTimeSummary returns compact text for available rows', () => {
  const summary = formatJavascriptExecutionTimeSummary([
    {
      after: 130,
      available: true,
      before: 30,
      cdpName: 'ScriptDuration',
      delta: 100,
      name: 'scriptDurationMs',
      unit: 'ms',
    },
    {
      after: null,
      available: false,
      before: null,
      cdpName: 'TaskDuration',
      delta: null,
      name: 'taskDurationMs',
      unit: 'ms',
    },
  ])

  expect(summary).toBe('JavaScript execution time:\nmetric | before | after | delta | unit\nscriptDurationMs | 30 | 130 | 100 | ms')
})
