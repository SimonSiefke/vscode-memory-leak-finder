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
      contextSwitches: 4,
      cycles: 20,
      instructions: 10,
      pageFaults: 7,
      perfPid: 456,
      pid: 123,
      rawOutput: '10,,instructions:u,100.00,,\n20,,cycles:u,100.00,,',
      taskClockMs: 12.5,
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
    {
      available: true,
      event: 'task-clock',
      name: 'taskClockMs',
      unit: 'ms',
      value: 12.5,
    },
    {
      available: true,
      event: 'context-switches',
      name: 'contextSwitches',
      unit: 'count',
      value: 4,
    },
    {
      available: true,
      event: 'page-faults',
      name: 'pageFaults',
      unit: 'count',
      value: 7,
    },
  ])
})

test('cpu performance counters include performance scenario results', () => {
  const result = MeasureCpuPerformanceCounters.compare(
    {},
    {
      contextSwitches: 1,
      cycles: 2,
      instructions: 3,
      pageFaults: 4,
      taskClockMs: 5,
    },
    {
      testRunResults: [
        {
          performanceScenario: {
            codeMarks: [],
            latencyMs: 12,
            mode: 'warm',
          },
        },
      ],
    },
  )

  expect(result.performanceSamples).toEqual([
    {
      codeMarks: [],
      latencyMs: 12,
      mode: 'warm',
    },
  ])
})

test('cpu-performance-counters resolves through measure lookup', () => {
  const MemoryLeakFinder = LoadMemoryLeakFinder.loadMemoryLeakFinder()
  const measure = GetMeasure.getMeasure(MemoryLeakFinder, 'cpu-performance-counters')

  expect(measure.id).toBe('cpuPerformanceCounters')
})
