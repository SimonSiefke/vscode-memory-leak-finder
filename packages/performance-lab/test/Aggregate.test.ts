import { expect, test } from '@jest/globals'
import { aggregateExperiments } from '../src/Aggregate.ts'

const sample = (blockIndex: number, value: number, work: number) => ({
  blockIndex,
  blockPosition: 0,
  clock: 'renderer' as const,
  codeMarks: [],
  contextSwitches: 1,
  cycles: value * 10,
  domReadyLatencyMs: value,
  instructions: value * 10,
  instructionsPerCycle: 1,
  latencyMs: value,
  mode: 'warm' as const,
  orderIndex: blockIndex,
  pageFaults: 1,
  paintedLatencyMs: value + 16,
  pattern: 'ABBA' as const,
  pid: 1,
  rawCounterOutput: '',
  taskClockMs: value,
  workerLatencyMs: value + 20,
  work: {
    allocations: {
      tracked: work,
    },
    functions: {},
  },
})

const replica = (id: string, candidateFactor = 0.8, baselineCommit = 'baseline', candidateCommit = 'candidate') => ({
  baseline: {
    metadata: {
      build: {
        commit: baselineCommit,
      },
    },
    samples: [sample(0, 100, 10), sample(0, 101, 10), sample(1, 99, 10), sample(1, 100, 10)],
  },
  candidate: {
    metadata: {
      build: {
        commit: candidateCommit,
      },
    },
    samples: [
      sample(0, 100 * candidateFactor, 5),
      sample(0, 101 * candidateFactor, 5),
      sample(1, 99 * candidateFactor, 5),
      sample(1, 100 * candidateFactor, 5),
    ],
  },
  command: 'compare' as const,
  goal: {
    metric: 'latencyMs' as const,
    targetRelativeChange: -0.1,
  },
  replicaId: id,
  scenario: {
    hash: 'scenario',
    name: 'editor-open',
  },
  schemaVersion: 2,
  tier: 'quick' as const,
  verdict: {
    workEvidence: {
      available: true,
      improved: true,
    },
  },
})

test('aggregate uses replicated within-runner effects', () => {
  const result = aggregateExperiments([replica('0'), replica('1'), replica('2')], 3)
  expect(result.status).toBe('ux-confirmed')
  expect(result.comparisons.latencyMs.relativeChange).toBeCloseTo(-0.2)
})

test('aggregate rejects missing replicas', () => {
  const result = aggregateExperiments([replica('0')], 3)
  expect(result.status).toBe('invalid')
  expect(result.invalidReasons).toContain('Expected 3 replicas, found 1')
})

test('aggregate rejects changed scenario hashes', () => {
  const changed = {
    ...replica('2'),
    scenario: {
      hash: 'changed',
      name: 'editor-open',
    },
  }
  const result = aggregateExperiments([replica('0'), replica('1'), changed], 3)
  expect(result.status).toBe('invalid')
  expect(result.invalidReasons).toContain('Replica scenario hashes or names differ')
})

test('aggregate records an identical-build A/A calibration as inconclusive', () => {
  const replicas = [replica('0', 1, 'same', 'same'), replica('1', 1, 'same', 'same'), replica('2', 1, 'same', 'same')]
  for (const item of replicas) {
    item.verdict.workEvidence.improved = false
  }

  const result = aggregateExperiments(replicas, 3)

  expect(result.status).toBe('inconclusive')
  expect(result.calibration).toEqual({
    falsePositive: false,
    falsePositiveRate: 0,
    history: expect.any(Array),
    isIdenticalBuild: true,
    systemValid: true,
  })
})

test('aggregate invalidates an identical-build false-positive winner', () => {
  const result = aggregateExperiments(
    [replica('0', 0.8, 'same', 'same'), replica('1', 0.8, 'same', 'same'), replica('2', 0.8, 'same', 'same')],
    3,
  )

  expect(result.status).toBe('invalid')
  expect(result.calibration.falsePositive).toBe(true)
  expect(result.invalidReasons).toContain('Identical-build A/A calibration produced a false-positive winner')
})

test('aggregate invalidates the system after repeated A/A false positives', () => {
  const result = aggregateExperiments(
    [replica('0', 1, 'baseline', 'candidate'), replica('1', 1, 'baseline', 'candidate'), replica('2', 1, 'baseline', 'candidate')],
    3,
    [
      {
        createdAt: '2026-01-01T00:00:00.000Z',
        falsePositive: true,
        minimumDetectableEffect: 0.05,
      },
      {
        createdAt: '2026-01-08T00:00:00.000Z',
        falsePositive: true,
        minimumDetectableEffect: 0.05,
      },
    ],
  )

  expect(result.status).toBe('invalid')
  expect(result.calibration.systemValid).toBe(false)
  expect(result.invalidReasons).toContain('The two most recent A/A calibrations produced false-positive winners')
})
