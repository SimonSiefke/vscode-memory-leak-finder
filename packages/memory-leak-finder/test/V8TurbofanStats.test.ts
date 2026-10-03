import { expect, test } from '@jest/globals'
import * as V8TurbofanStats from '../src/parts/V8TurbofanStats/V8TurbofanStats.ts'

test('v8 turbofan stats parses phase stats and deoptimization events', () => {
  const result = V8TurbofanStats.getV8TurbofanStats(
    [
      {
        args: {
          stats: '{"function_name":"activate","total_allocated_bytes":10,"max_allocated_bytes":4,"absolute_max_allocated_bytes":6}',
        },
        cat: 'disabled-by-default-v8.turbofan',
        dur: 1500,
        name: 'BytecodeGraphBuilder',
      },
      {
        args: {
          stats: {
            function_name: 'activate',
            total_allocated_bytes: 20,
            max_allocated_bytes: 8,
            absolute_max_allocated_bytes: 12,
          },
        },
        cat: 'disabled-by-default-v8.turbofan',
        dur: 500,
        name: 'V8.TFBytecodeGraphBuilder',
      },
      {
        args: {
          stats: '{"function_name":"render","total_allocated_bytes":40,"max_allocated_bytes":16,"absolute_max_allocated_bytes":18}',
        },
        cat: 'disabled-by-default-v8.turbofan',
        dur: 2500,
        name: 'LoadElimination',
      },
      {
        args: {
          functionName: 'activate',
          reason: 'wrong map',
        },
        cat: 'v8',
        name: 'V8.DeoptimizeCode',
      },
      {
        args: {
          data: {
            function_name: 'activate',
            deopt_reason: 'dependency change',
          },
        },
        cat: 'v8',
        name: 'V8.DeoptimizeCode',
      },
      {
        args: {},
        cat: 'v8',
        name: 'V8.DeoptimizeCode',
      },
      {
        args: {
          stats: '{',
        },
        cat: 'disabled-by-default-v8.turbofan',
        dur: 1000,
        name: 'BytecodeGraphBuilder',
      },
      {
        args: {
          stats: '{"function_name":"ignored","total_allocated_bytes":100}',
        },
        cat: 'devtools.timeline',
        dur: 1000,
        name: 'BytecodeGraphBuilder',
      },
    ],
    true,
  )

  expect(result.metrics).toEqual({
    dataLossOccurred: true,
    deoptimizationCount: 3,
    optimizationCount: 2,
    phaseEventCount: 3,
    rawEventCount: 6,
    totalAllocatedBytes: 70,
    totalPhaseDurationMs: 4.5,
  })
  expect(result.topOptimizedFunctions).toEqual([
    {
      functionName: 'activate',
      optimizationCount: 2,
      totalAllocatedBytes: 30,
      totalPhaseDurationMs: 2,
    },
  ])
  expect(result.topDeoptimizedFunctions).toEqual([
    {
      count: 2,
      functionName: 'activate',
      reasons: ['dependency change', 'wrong map'],
    },
    {
      count: 1,
      functionName: '(unknown)',
      reasons: ['(unknown)'],
    },
  ])
  expect(result.topPhases).toEqual([
    {
      count: 1,
      maxAllocatedBytes: 18,
      name: 'LoadElimination',
      totalAllocatedBytes: 40,
      totalDurationMs: 2.5,
    },
    {
      count: 1,
      maxAllocatedBytes: 6,
      name: 'BytecodeGraphBuilder',
      totalAllocatedBytes: 10,
      totalDurationMs: 1.5,
    },
    {
      count: 1,
      maxAllocatedBytes: 12,
      name: 'V8.TFBytecodeGraphBuilder',
      totalAllocatedBytes: 20,
      totalDurationMs: 0.5,
    },
  ])
})

test('v8 turbofan stats limits and sorts top rows', () => {
  const events = Array.from({ length: 25 }, (_, index) => {
    const paddedIndex = index.toString().padStart(2, '0')
    return {
      args: {
        stats: {
          function_name: `fn-${paddedIndex}`,
          total_allocated_bytes: 1,
        },
      },
      cat: 'disabled-by-default-v8.turbofan',
      dur: 1000,
      name: 'BytecodeGraphBuilder',
    }
  })

  const result = V8TurbofanStats.getV8TurbofanStats(events)

  expect(result.topOptimizedFunctions).toHaveLength(20)
  expect(result.topOptimizedFunctions[0].functionName).toBe('fn-00')
  expect(result.topOptimizedFunctions.at(-1)?.functionName).toBe('fn-19')
})

test('v8 turbofan stats formats a readable summary', () => {
  const result = V8TurbofanStats.getV8TurbofanStats([
    {
      args: {
        stats: '{"function_name":"activate","total_allocated_bytes":10}',
      },
      cat: 'disabled-by-default-v8.turbofan',
      dur: 1500,
      name: 'BytecodeGraphBuilder',
    },
  ])

  expect(V8TurbofanStats.formatV8TurbofanStatsSummary(result)).toContain('optimizationCount | 1')
})
