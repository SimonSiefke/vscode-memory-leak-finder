import { expect, test } from '@jest/globals'
import {
  formatBrowserPerformanceMetricsSummary,
  normalizeBrowserPerformanceMetrics,
} from '../src/parts/BrowserPerformanceMetrics/BrowserPerformanceMetrics.ts'

test('normalizeBrowserPerformanceMetrics computes count and duration deltas', () => {
  const rows = normalizeBrowserPerformanceMetrics(
    {
      metrics: [
        { name: 'PaintCount', value: 1 },
        { name: 'LayoutCount', value: 2 },
        { name: 'RecalcStyleCount', value: 3 },
        { name: 'MajorGCDuration', value: 0.004 },
        { name: 'MinorGCDuration', value: 0.001 },
        { name: 'LayoutDuration', value: 0.01 },
        { name: 'RecalcStyleDuration', value: 0.02 },
        { name: 'ScriptDuration', value: 0.03 },
        { name: 'TaskDuration', value: 0.04 },
      ],
    },
    {
      metrics: [
        { name: 'PaintCount', value: 4 },
        { name: 'LayoutCount', value: 7 },
        { name: 'RecalcStyleCount', value: 10 },
        { name: 'MajorGCDuration', value: 0.01 },
        { name: 'MinorGCDuration', value: 0.003 },
        { name: 'LayoutDuration', value: 0.05 },
        { name: 'RecalcStyleDuration', value: 0.08 },
        { name: 'ScriptDuration', value: 0.13 },
        { name: 'TaskDuration', value: 0.24 },
      ],
    },
  )

  expect(rows).toEqual([
    { after: 4, available: true, before: 1, cdpNames: ['PaintCount'], delta: 3, name: 'paintCount', unit: 'count' },
    { after: 7, available: true, before: 2, cdpNames: ['LayoutCount'], delta: 5, name: 'layoutCount', unit: 'count' },
    {
      after: 10,
      available: true,
      before: 3,
      cdpNames: ['RecalcStyleCount'],
      delta: 7,
      name: 'recalcStyleCount',
      unit: 'count',
    },
    {
      after: 13,
      available: true,
      before: 5,
      cdpNames: ['MajorGCDuration', 'MinorGCDuration'],
      delta: 8,
      name: 'gcDurationMs',
      unit: 'ms',
    },
    { after: 50, available: true, before: 10, cdpNames: ['LayoutDuration'], delta: 40, name: 'layoutDurationMs', unit: 'ms' },
    {
      after: 80,
      available: true,
      before: 20,
      cdpNames: ['RecalcStyleDuration'],
      delta: 60,
      name: 'recalcStyleDurationMs',
      unit: 'ms',
    },
    { after: 130, available: true, before: 30, cdpNames: ['ScriptDuration'], delta: 100, name: 'scriptDurationMs', unit: 'ms' },
    { after: 240, available: true, before: 40, cdpNames: ['TaskDuration'], delta: 200, name: 'taskDurationMs', unit: 'ms' },
  ])
})

test('normalizeBrowserPerformanceMetrics preserves missing metrics as unavailable', () => {
  const rows = normalizeBrowserPerformanceMetrics(
    {
      metrics: [{ name: 'PaintCount', value: 1 }],
    },
    {
      metrics: [{ name: 'LayoutCount', value: 1 }],
    },
  )

  expect(rows.find((row) => row.name === 'paintCount')).toEqual({
    after: null,
    available: false,
    before: null,
    cdpNames: ['PaintCount'],
    delta: null,
    name: 'paintCount',
    unit: 'count',
  })
  expect(rows.find((row) => row.name === 'gcDurationMs')).toEqual({
    after: null,
    available: false,
    before: null,
    cdpNames: ['MajorGCDuration', 'MinorGCDuration'],
    delta: null,
    name: 'gcDurationMs',
    unit: 'ms',
  })
})

test('formatBrowserPerformanceMetricsSummary returns compact text for available rows', () => {
  const summary = formatBrowserPerformanceMetricsSummary([
    { after: 3, available: true, before: 1, cdpNames: ['LayoutCount'], delta: 2, name: 'layoutCount', unit: 'count' },
    { after: null, available: false, before: null, cdpNames: ['PaintCount'], delta: null, name: 'paintCount', unit: 'count' },
  ])

  expect(summary).toBe('Browser performance counters:\nmetric | before | after | delta | unit\nlayoutCount | 1 | 3 | 2 | count')
})
