import { expect, test } from '@jest/globals'
import * as GetMeasure from '../src/parts/GetMeasure/GetMeasure.ts'
import * as LoadMemoryLeakFinder from '../src/parts/LoadMemoryLeakFinder/LoadMemoryLeakFinder.ts'
import * as MeasureCpuPerformanceCountersFromStart from '../src/parts/MeasureCpuPerformanceCountersFromStart/MeasureCpuPerformanceCountersFromStart.ts'

test('cpu performance counters from start compares as informational only', () => {
  const result = MeasureCpuPerformanceCountersFromStart.compare(
    {
      command: ['perf', 'stat'],
      outputPath: '/tmp/perf.txt',
      perfPid: 456,
      pid: 123,
    },
    {
      command: ['perf', 'stat'],
      cycles: 20,
      instructions: 10,
      instructionsPerCycle: 0.5,
      outputPath: '/tmp/perf.txt',
      perfPid: 456,
      pid: 123,
      rawOutput: '10,,instructions:u,100.00,,\n20,,cycles:u,100.00,,',
    },
  )

  expect(result.isLeak).toBe(false)
  expect(MeasureCpuPerformanceCountersFromStart.isLeak()).toBe(false)
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
      event: 'instructions:u/cycles:u',
      name: 'instructionsPerCycle',
      unit: 'ratio',
      value: 0.5,
    },
  ])
})

test('cpu performance counters from start marks ipc unavailable when counters are missing', () => {
  const result = MeasureCpuPerformanceCountersFromStart.compare(
    {},
    {
      command: ['perf', 'stat'],
      cycles: null,
      instructions: 10,
      instructionsPerCycle: null,
      outputPath: '/tmp/perf.txt',
      pid: 123,
      rawOutput: '10,,instructions:u,100.00,,\n<not supported>,,cycles:u,100.00,,',
    },
  )

  expect(result.metrics[2]).toEqual({
    available: false,
    event: 'instructions:u/cycles:u',
    name: 'instructionsPerCycle',
    unit: 'ratio',
    value: null,
  })
})

test('cpu-performance-counters-from-start resolves through measure lookup', () => {
  const MemoryLeakFinder = LoadMemoryLeakFinder.loadMemoryLeakFinder()
  const measure = GetMeasure.getMeasure(MemoryLeakFinder, 'cpu-performance-counters-from-start')

  expect(measure.id).toBe('cpuPerformanceCountersFromStart')
})
