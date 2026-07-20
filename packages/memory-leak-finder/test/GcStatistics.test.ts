import { expect, test } from '@jest/globals'
import { formatGcStatisticsSummary, getGcStatistics, toGcStatisticsRows } from '../src/parts/GcStatistics/GcStatistics.ts'

test('getGcStatistics counts gc events and computes heap metrics', () => {
  const metrics = getGcStatistics(
    [
      {
        args: {
          usedHeapSizeAfter: 2 * 1024 * 1024,
          usedHeapSizeBefore: 5 * 1024 * 1024,
        },
        name: 'MinorGC',
      },
      {
        args: {
          usedHeapSizeAfter: 6 * 1024 * 1024,
          usedHeapSizeBefore: 10 * 1024 * 1024,
        },
        name: 'MajorGC',
      },
      {
        dur: 1_500,
        name: 'V8.GCScavenger',
      },
      {
        dur: 2_250,
        name: 'V8.GCFinalizeMC',
      },
    ],
    12 * 1024 * 1024,
    7 * 1024 * 1024,
  )

  expect(metrics).toEqual({
    garbageMB: 14,
    gcDurationMs: 3.75,
    majorGCs: 1,
    minorGCs: 1,
    usedHeapMB: 12,
  })
})

test('getGcStatistics ignores missing heap size fields', () => {
  const metrics = getGcStatistics(
    [
      {
        args: {
          usedHeapSizeBefore: 5 * 1024 * 1024,
        },
        name: 'MinorGC',
      },
      {
        args: {
          usedHeapSizeAfter: 1 * 1024 * 1024,
        },
        name: 'MajorGC',
      },
    ],
    3 * 1024 * 1024,
    2 * 1024 * 1024,
  )

  expect(metrics).toEqual({
    garbageMB: 2,
    gcDurationMs: 0,
    majorGCs: 1,
    minorGCs: 1,
    usedHeapMB: 3,
  })
})

test('toGcStatisticsRows returns stable row order', () => {
  const rows = toGcStatisticsRows({
    garbageMB: 2,
    gcDurationMs: 4,
    majorGCs: 1,
    minorGCs: 3,
    usedHeapMB: 10,
  })

  expect(rows).toEqual([
    { name: 'usedHeapMB', unit: 'MB', value: 10 },
    { name: 'garbageMB', unit: 'MB', value: 2 },
    { name: 'majorGCs', unit: 'count', value: 1 },
    { name: 'minorGCs', unit: 'count', value: 3 },
    { name: 'gcDurationMs', unit: 'ms', value: 4 },
  ])
})

test('formatGcStatisticsSummary returns compact text', () => {
  const summary = formatGcStatisticsSummary([
    { name: 'usedHeapMB', unit: 'MB', value: 10 },
    { name: 'gcDurationMs', unit: 'ms', value: 4 },
  ])

  expect(summary).toBe('GC statistics:\nmetric | value | unit\nusedHeapMB | 10 | MB\ngcDurationMs | 4 | ms')
})
