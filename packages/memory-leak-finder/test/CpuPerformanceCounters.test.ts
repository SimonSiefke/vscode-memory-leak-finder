import { expect, test } from '@jest/globals'
import {
  formatCpuPerformanceCountersSummary,
  parsePerfStatOutput,
  toCpuPerformanceCounterRows,
} from '../src/parts/CpuPerformanceCounters/CpuPerformanceCounters.ts'

test('parsePerfStatOutput parses perf csv output', () => {
  const result = parsePerfStatOutput(`123456,,instructions:u,100.00,,
789012,,cycles:u,100.00,,
`)

  expect(result).toEqual({
    cycles: 789012,
    instructions: 123456,
  })
})

test('parsePerfStatOutput parses human perf output', () => {
  const result = parsePerfStatOutput(`          107,379,466      instructions:u
          134,745,265      cycles:u
`)

  expect(result).toEqual({
    cycles: 134745265,
    instructions: 107379466,
  })
})

test('toCpuPerformanceCounterRows marks unavailable counters', () => {
  const rows = toCpuPerformanceCounterRows({
    command: ['perf', 'stat'],
    cycles: null,
    instructions: 10,
    pid: 123,
    rawOutput: '',
  })

  expect(rows).toEqual([
    {
      available: true,
      event: 'instructions:u',
      name: 'instructions',
      unit: 'count',
      value: 10,
    },
    {
      available: false,
      event: 'cycles:u',
      name: 'cycles',
      unit: 'count',
      value: null,
    },
  ])
})

test('formatCpuPerformanceCountersSummary returns compact text for available counters', () => {
  const summary = formatCpuPerformanceCountersSummary([
    {
      available: true,
      event: 'instructions:u',
      name: 'instructions',
      unit: 'count',
      value: 10,
    },
    {
      available: false,
      event: 'cycles:u',
      name: 'cycles',
      unit: 'count',
      value: null,
    },
  ])

  expect(summary).toBe('CPU performance counters:\nmetric | value | unit\ninstructions | 10 | count')
})
