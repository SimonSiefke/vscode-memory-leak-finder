import { expect, test } from '@jest/globals'
import { getExperimentVerdict, getPhaseBreakdown } from '../src/Experiment.ts'
import type { ScoreSample } from '../src/Types.ts'

const sample = (latencyMs: number, instructions: number): ScoreSample => ({
  codeMarks: [
    { name: 'code/willSetInputToTextFileEditor', startTime: 10 },
    { name: 'code/didSetInputToTextFileEditor', startTime: 15 },
  ],
  contextSwitches: 1,
  cycles: instructions,
  instructions,
  instructionsPerCycle: 1,
  latencyMs,
  mode: 'warm',
  pageFaults: 1,
  pid: 123,
  rawCounterOutput: '',
  taskClockMs: latencyMs,
})

test('verdict accepts a statistically clear objective without guardrail regressions', () => {
  const baseline = [sample(100, 1000), sample(101, 1010), sample(99, 990), sample(100, 1000), sample(102, 1020)]
  const candidate = [sample(50, 500), sample(51, 510), sample(49, 490), sample(50, 500), sample(50, 500)]
  const result = getExperimentVerdict(baseline, candidate, {
    metric: 'latencyMs',
    targetRelativeChange: -0.5,
  })

  expect(result.verdict.status).toBe('met')
  expect(result.verdict.objectiveMet).toBe(true)
})

test('identical samples are inconclusive', () => {
  const samples = [sample(100, 1000), sample(101, 1010), sample(99, 990)]
  expect(
    getExperimentVerdict(samples, samples, {
      metric: 'latencyMs',
      targetRelativeChange: -0.1,
    }).verdict.status,
  ).toBe('inconclusive')
})

test('phase breakdown pairs VS Code semantic marks', () => {
  expect(getPhaseBreakdown([sample(100, 1000)]).setInputToTextFileEditor.median).toBe(5)
})
