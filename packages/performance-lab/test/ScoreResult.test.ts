import { expect, test } from '@jest/globals'
import { parseScoreResult } from '../src/ScoreResult.ts'

const createResult = (percentage = '100.00') => ({
  cpuPerformanceCounters: {
    metrics: [
      { available: true, name: 'instructions', value: 100 },
      { available: true, name: 'cycles', value: 200 },
      { available: true, name: 'taskClockMs', value: 3 },
      { available: true, name: 'contextSwitches', value: 4 },
      { available: true, name: 'pageFaults', value: 5 },
    ],
    performanceSamples: [
      {
        clock: 'renderer',
        codeMarks: [],
        domReadyLatencyMs: 6,
        latencyMs: 6,
        mode: 'warm',
        paintedLatencyMs: 20,
        processManifest: [
          {
            args: 'code-oss --type=renderer',
            pid: 123,
            ppid: 1,
          },
        ],
        workerLatencyMs: 30,
        work: {
          allocations: {},
          functions: {},
        },
      },
    ],
    raw: {
      after: {
        pid: 123,
        rawOutput: `100,,instructions:u,1000000,${percentage},,\n`,
      },
    },
  },
})

test('parseScoreResult returns one unprofiled action sample', () => {
  expect(parseScoreResult(createResult())).toMatchObject({
    cycles: 200,
    domReadyLatencyMs: 6,
    instructions: 100,
    latencyMs: 6,
    mode: 'warm',
    paintedLatencyMs: 20,
    pid: 123,
    processManifest: [
      {
        args: 'code-oss --type=renderer',
        pid: 123,
        ppid: 1,
      },
    ],
    taskClockMs: 3,
  })
})

test('parseScoreResult rejects multiplexed counters', () => {
  expect(() => parseScoreResult(createResult('90.00'))).toThrow('multiplexed')
})

test('parseScoreResult rejects profiler-enabled measurements', () => {
  expect(() =>
    parseScoreResult({
      ...createResult(),
      cpuProfile: {},
    }),
  ).toThrow('cannot enter the scoring dataset')
})
