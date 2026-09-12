import { expect, test } from '@jest/globals'
import * as StartupMeasure from '../src/parts/StartupMeasure/StartupMeasure.ts'

test('recognizes both Linux process-tree from-start measure spellings', () => {
  expect(StartupMeasure.getStartupMeasureInfo('linux-process-tree-resources-from-start')).toEqual({
    label: 'Linux process-tree resources from start',
    resultId: 'linuxProcessTreeResourcesFromStart',
  })
  expect(StartupMeasure.getStartupMeasureInfo('linuxProcessTreeResourcesFromStart')).toBeDefined()
})

test('aggregates every numeric metric row', () => {
  const info = StartupMeasure.getStartupMeasureInfo('linux-process-tree-resources-from-start')!
  const result = StartupMeasure.getStartupMeasureAggregate(
    [
      {
        metrics: [
          { name: 'durationSeconds', unit: 'seconds', value: 2 },
          { name: 'sampledPeakPssMiB', unit: 'MiB', value: 100 },
        ],
      },
      {
        metrics: [
          { name: 'durationSeconds', unit: 'seconds', value: 4 },
          { name: 'sampledPeakPssMiB', unit: 'MiB', value: 120 },
        ],
      },
    ],
    info,
  )
  const aggregate = result[info.resultId] as { readonly metrics: readonly unknown[] }
  expect(aggregate.metrics).toEqual([
    { count: 2, max: 4, mean: 3, median: 3, min: 2, name: 'durationSeconds', unit: 'seconds' },
    { count: 2, max: 120, mean: 110, median: 110, min: 100, name: 'sampledPeakPssMiB', unit: 'MiB' },
  ])
})

test('preserves aggregation for legacy CPU from-start samples', () => {
  const info = StartupMeasure.getStartupMeasureInfo('cpu-performance-counters-from-start')!
  const result = StartupMeasure.getStartupMeasureAggregate(
    [
      { cycles: 20, instructions: 10, instructionsPerCycle: 0.5 },
      { cycles: 40, instructions: 30, instructionsPerCycle: 0.75 },
    ],
    info,
  )
  const aggregate = result[info.resultId] as { readonly metrics: readonly unknown[] }
  expect(aggregate.metrics).toEqual([
    { count: 2, max: 30, mean: 20, median: 20, min: 10, name: 'instructions', unit: 'count' },
    { count: 2, max: 40, mean: 30, median: 30, min: 20, name: 'cycles', unit: 'count' },
    { count: 2, max: 0.75, mean: 0.625, median: 0.625, min: 0.5, name: 'instructionsPerCycle', unit: 'ratio' },
  ])
})
