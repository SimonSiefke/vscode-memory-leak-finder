import { expect, test } from '@jest/globals'
import { getExperimentVerdict, getPhaseBreakdown } from '../src/Experiment.ts'
import type { ScoreSample } from '../src/Types.ts'

const sample = (latencyMs: number, instructions: number, blockIndex: number, blockPosition: number, work: number): ScoreSample => ({
  blockIndex,
  blockPosition,
  clock: 'renderer',
  codeMarks: [
    { name: 'code/willSetInputToTextFileEditor', startTime: 10 },
    { name: 'code/didSetInputToTextFileEditor', startTime: 15 },
  ],
  contextSwitches: 1,
  cycles: instructions,
  domReadyLatencyMs: latencyMs,
  instructions,
  instructionsPerCycle: 1,
  latencyMs,
  mode: 'warm',
  orderIndex: blockIndex * 4 + blockPosition,
  pageFaults: 1,
  paintedLatencyMs: latencyMs + 16,
  pattern: 'ABBA',
  pid: 123,
  processManifest: [
    {
      args: 'code-oss --type=renderer',
      pid: 123,
      ppid: 1,
    },
  ],
  rawCounterOutput: '',
  taskClockMs: latencyMs,
  workerLatencyMs: latencyMs + 20,
  work: {
    allocations: {
      tracked: work,
    },
    functions: {},
  },
})

test('verdict accepts a statistically clear objective without guardrail regressions', () => {
  const baseline = [
    sample(100, 1000, 0, 0, 10),
    sample(101, 1010, 0, 3, 10),
    sample(99, 990, 1, 0, 10),
    sample(100, 1000, 1, 3, 10),
    sample(102, 1020, 2, 0, 10),
    sample(101, 1010, 2, 3, 10),
  ]
  const candidate = [
    sample(50, 500, 0, 1, 5),
    sample(51, 510, 0, 2, 5),
    sample(49, 490, 1, 1, 5),
    sample(50, 500, 1, 2, 5),
    sample(50, 500, 2, 1, 5),
    sample(49, 490, 2, 2, 5),
  ]
  const result = getExperimentVerdict(baseline, candidate, {
    metric: 'latencyMs',
    targetRelativeChange: -0.5,
  })

  expect(result.verdict.status).toBe('ux-confirmed')
  expect(result.verdict.objectiveMet).toBe(true)
})

test('identical samples are inconclusive', () => {
  const samples = [sample(100, 1000, 0, 0, 10), sample(101, 1010, 0, 3, 10), sample(99, 990, 1, 0, 10), sample(100, 1000, 1, 3, 10)]
  expect(
    getExperimentVerdict(samples, samples, {
      metric: 'latencyMs',
      targetRelativeChange: -0.1,
    }).verdict.status,
  ).toBe('inconclusive')
})

test('identical-build calibration is invalid when it cannot detect the requested effect', () => {
  const baseline = [sample(100, 1000, 0, 0, 10), sample(100, 1000, 0, 3, 10), sample(100, 1000, 1, 0, 10), sample(100, 1000, 1, 3, 10)]
  const candidate = [sample(80, 1000, 0, 1, 10), sample(80, 1000, 0, 2, 10), sample(120, 1000, 1, 1, 10), sample(120, 1000, 1, 2, 10)]

  const result = getExperimentVerdict(
    baseline,
    candidate,
    {
      metric: 'latencyMs',
      targetRelativeChange: -0.05,
    },
    'quick',
    undefined,
    true,
  )

  expect(result.verdict.status).toBe('invalid')
  expect(result.verdict.invalidReasons).toContainEqual(expect.stringContaining('minimum detectable effect'))
})

test('phase breakdown pairs VS Code semantic marks', () => {
  expect(getPhaseBreakdown([sample(100, 1000, 0, 0, 10)]).setInputToTextFileEditor.median).toBe(5)
})

test('quick tier does not gate a single painted-latency tail sample', () => {
  const baseline = [sample(100, 1000, 0, 0, 10), sample(100, 1000, 0, 3, 10), sample(100, 1000, 1, 0, 10), sample(100, 1000, 1, 3, 10)]
  const candidate = baseline.map((value, index) => ({
    ...value,
    latencyMs: 98,
    domReadyLatencyMs: 98,
    paintedLatencyMs: index === 0 ? 500 : 114,
    work: {
      allocations: {
        tracked: 5,
      },
      functions: {},
    },
  }))
  const quick = getExperimentVerdict(
    baseline,
    candidate,
    {
      metric: 'latencyMs',
      targetRelativeChange: -0.01,
    },
    'quick',
  )
  const confirmation = getExperimentVerdict(
    baseline,
    candidate,
    {
      metric: 'latencyMs',
      targetRelativeChange: -0.01,
    },
    'confirmation',
  )

  expect(quick.verdict.guardrailFailures).toEqual([])
  expect(confirmation.verdict.guardrailFailures).toContainEqual(expect.stringContaining('p95 painted latency'))
})

test('unstable deterministic work counters invalidate a comparison', () => {
  const baseline = [sample(100, 1000, 0, 0, 10), sample(100, 1000, 0, 3, 20), sample(100, 1000, 1, 0, 10), sample(100, 1000, 1, 3, 20)]
  const candidate = baseline.map((value) => ({
    ...value,
    work: {
      allocations: {
        tracked: 5,
      },
      functions: {},
    },
  }))

  const result = getExperimentVerdict(baseline, candidate, {
    metric: 'latencyMs',
    targetRelativeChange: -0.01,
  })
  expect(result.verdict.status).toBe('invalid')
  expect(result.verdict.invalidReasons).toContainEqual(expect.stringContaining('work counters vary'))
})

test('work stability detects variation hidden by a three-sample median absolute deviation', () => {
  const baseline = [sample(100, 1000, 0, 0, 49), sample(100, 1000, 0, 3, 51), sample(100, 1000, 1, 0, 51), sample(100, 1000, 1, 3, 51)]

  const result = getExperimentVerdict(baseline, baseline, {
    metric: 'latencyMs',
    targetRelativeChange: -0.01,
  })

  expect(result.verdict.status).toBe('invalid')
  expect(result.verdict.invalidReasons).toContainEqual(expect.stringContaining('work counters vary'))
})

test('bundled Copilot invalidates the core performance workload', () => {
  const value = {
    ...sample(100, 1000, 0, 0, 10),
    processManifest: [
      {
        args: '/resources/app/node_modules.asar.unpacked/@github/copilot-linux-x64/index.js --headless',
        pid: 124,
        ppid: 123,
      },
    ],
  }

  const result = getExperimentVerdict([value, value], [value, value], {
    metric: 'latencyMs',
    targetRelativeChange: -0.01,
  })

  expect(result.verdict.status).toBe('invalid')
  expect(result.verdict.invalidReasons).toContain('Core performance workload launched bundled Copilot')
})
