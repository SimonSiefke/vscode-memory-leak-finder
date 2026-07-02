import { expect, test } from '@jest/globals'
import * as GetMeasure from '../src/parts/GetMeasure/GetMeasure.ts'
import * as LoadMemoryLeakFinder from '../src/parts/LoadMemoryLeakFinder/LoadMemoryLeakFinder.ts'
import * as MeasureCpuPerformanceCounters from '../src/parts/MeasureCpuPerformanceCounters/MeasureCpuPerformanceCounters.ts'

test('cpu performance counters measure compares as informational only', () => {
  const result = MeasureCpuPerformanceCounters.compare(
    {
      command: ['perf', 'stat'],
      perfPid: 456,
      pid: 123,
    },
    {
      command: ['perf', 'stat'],
      cycles: 20,
      instructions: 10,
      perfPid: 456,
      pid: 123,
      rawOutput: '10,,instructions:u,100.00,,\n20,,cycles:u,100.00,,',
    },
  )

  expect(result.isLeak).toBe(false)
  expect(MeasureCpuPerformanceCounters.isLeak()).toBe(false)
  expect(result.metrics).toEqual([
    {
      available: true,
      event: 'instructions:u',
      name: 'instructions',
      unit: 'count',
      value: 10,
    },
    {
      available: true,
      event: 'cycles:u',
      name: 'cycles',
      unit: 'count',
      value: 20,
    },
  ])
})

test('cpu-performance-counters resolves through measure lookup', () => {
  const MemoryLeakFinder = LoadMemoryLeakFinder.loadMemoryLeakFinder()
  const measure = GetMeasure.getMeasure(MemoryLeakFinder, 'cpu-performance-counters')

  expect(measure.id).toBe('cpuPerformanceCounters')
})
