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
    contextSwitches: null,
    cycles: 789012,
    instructions: 123456,
    pageFaults: null,
    taskClockMs: null,
  })
})

test('parsePerfStatOutput parses human perf output', () => {
  const result = parsePerfStatOutput(`          107,379,466      instructions:u
          134,745,265      cycles:u
`)

  expect(result).toEqual({
    contextSwitches: null,
    cycles: 134745265,
    instructions: 107379466,
    pageFaults: null,
    taskClockMs: null,
  })
})

test('parsePerfStatOutput parses interval csv output', () => {
  const result = parsePerfStatOutput(`0.100162207,100,,instructions:u,4854994,100.00,,
0.100162207,200,,cycles:u,4854994,100.00,,
0.200467945,<not counted>,,instructions:u,0,100.00,,
0.200467945,<not counted>,,cycles:u,0,100.00,,
0.300689033,300,,instructions:u,213671,100.00,,
0.300689033,400,,cycles:u,213671,100.00,,
`)

  expect(result).toEqual({
    contextSwitches: null,
    cycles: 600,
    instructions: 400,
    pageFaults: null,
    taskClockMs: null,
  })
})

test('parsePerfStatOutput parses software counters with units', () => {
  const result = parsePerfStatOutput(`12.5,msec,task-clock,12000000,100.00,,
4,,context-switches,12000000,100.00,,
7,,page-faults,12000000,100.00,,
`)

  expect(result).toEqual({
    contextSwitches: 4,
    cycles: null,
    instructions: null,
    pageFaults: 7,
    taskClockMs: 12.5,
  })
})

test('toCpuPerformanceCounterRows marks unavailable counters', () => {
  const rows = toCpuPerformanceCounterRows({
    command: ['perf', 'stat'],
    contextSwitches: null,
    cycles: null,
    instructions: 10,
    pageFaults: null,
    pid: 123,
    rawOutput: '',
    taskClockMs: null,
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
    {
      available: false,
      event: 'task-clock',
      name: 'taskClockMs',
      unit: 'ms',
      value: null,
    },
    {
      available: false,
      event: 'context-switches',
      name: 'contextSwitches',
      unit: 'count',
      value: null,
    },
    {
      available: false,
      event: 'page-faults',
      name: 'pageFaults',
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
