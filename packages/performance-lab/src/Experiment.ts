import { compareMetric } from './Statistics.ts'
import type { ExperimentVerdict, Goal, MetricComparison, MetricName, ScoreSample } from './Types.ts'

const getValues = (samples: readonly ScoreSample[], metric: MetricName): readonly number[] => {
  return samples.map((sample) => sample[metric])
}

const getMedianGuardrailFailure = (
  name: string,
  baseline: readonly number[],
  candidate: readonly number[],
  maximumRegression: number,
): string | undefined => {
  const comparison = compareMetric(baseline, candidate)
  if (comparison.relativeChange > maximumRegression) {
    return `${name} regressed by ${(comparison.relativeChange * 100).toFixed(2)}%`
  }
  return undefined
}

const getP95GuardrailFailure = (
  name: string,
  baseline: readonly number[],
  candidate: readonly number[],
  maximumRegression: number,
): string | undefined => {
  const comparison = compareMetric(baseline, candidate)
  const relativeChange = comparison.baseline.p95 === 0 ? 0 : comparison.candidate.p95 / comparison.baseline.p95 - 1
  if (relativeChange > maximumRegression) {
    return `${name} regressed by ${(relativeChange * 100).toFixed(2)}%`
  }
  return undefined
}

export const getExperimentVerdict = (
  baseline: readonly ScoreSample[],
  candidate: readonly ScoreSample[],
  goal: Goal,
): {
  readonly comparisons: Readonly<Record<MetricName, MetricComparison>>
  readonly verdict: ExperimentVerdict
} => {
  const invalidReasons: string[] = []
  if (baseline.length === 0 || candidate.length === 0) {
    invalidReasons.push(`Baseline and candidate must both contain samples`)
  }
  if (baseline.length !== candidate.length) {
    invalidReasons.push(`Baseline and candidate sample counts differ`)
  }
  const baselineModes = new Set(baseline.map(({ mode }) => mode))
  const candidateModes = new Set(candidate.map(({ mode }) => mode))
  if (baselineModes.size !== 1 || candidateModes.size !== 1 || [...baselineModes][0] !== [...candidateModes][0]) {
    invalidReasons.push(`Baseline and candidate scenario modes differ`)
  }

  const comparisons = {
    cycles: compareMetric(getValues(baseline, 'cycles'), getValues(candidate, 'cycles')),
    instructions: compareMetric(getValues(baseline, 'instructions'), getValues(candidate, 'instructions')),
    latencyMs: compareMetric(getValues(baseline, 'latencyMs'), getValues(candidate, 'latencyMs')),
  }
  const noisyMetrics = (Object.entries(comparisons) as readonly [MetricName, MetricComparison][])
    .filter(([, comparison]) => comparison.baseline.relativeMad > 0.1 || comparison.candidate.relativeMad > 0.1)
    .map(([name]) => name)
  if (noisyMetrics.length > 0) {
    invalidReasons.push(`Excessive noise in ${noisyMetrics.join(', ')} (relative MAD above 10%)`)
  }

  const guardrailFailures = [
    getP95GuardrailFailure(
      'p95 latency',
      baseline.map(({ latencyMs }) => latencyMs),
      candidate.map(({ latencyMs }) => latencyMs),
      0.05,
    ),
    goal.metric === 'latencyMs'
      ? getMedianGuardrailFailure(
          'instructions',
          baseline.map(({ instructions }) => instructions),
          candidate.map(({ instructions }) => instructions),
          0.05,
        )
      : getMedianGuardrailFailure(
          'latency',
          baseline.map(({ latencyMs }) => latencyMs),
          candidate.map(({ latencyMs }) => latencyMs),
          0.05,
        ),
  ].filter((value): value is string => Boolean(value))

  const primary = comparisons[goal.metric]
  const objectiveMet =
    invalidReasons.length === 0 &&
    guardrailFailures.length === 0 &&
    primary.relativeChange <= goal.targetRelativeChange &&
    primary.confidenceInterval.upper <= goal.targetRelativeChange + 0.05

  let status: ExperimentVerdict['status']
  if (invalidReasons.length > 0) {
    status = 'invalid'
  } else if (objectiveMet) {
    status = 'met'
  } else if (guardrailFailures.length > 0 || primary.confidenceInterval.lower > 0) {
    status = 'rejected'
  } else {
    status = 'inconclusive'
  }

  return {
    comparisons,
    verdict: {
      guardrailFailures,
      invalidReasons,
      objectiveMet,
      status,
    },
  }
}

interface MarkPair {
  readonly end: string
  readonly name: string
  readonly start: string
}

const markPairs: readonly MarkPair[] = [
  {
    end: 'code/didResolveTextFileEditorModel',
    name: 'resolveTextFileEditorModel',
    start: 'code/willResolveTextFileEditorModel',
  },
  {
    end: 'code/didCreateTextFileEditorControl',
    name: 'createTextFileEditorControl',
    start: 'code/willCreateTextFileEditorControl',
  },
  {
    end: 'code/didSetInputToTextFileEditor',
    name: 'setInputToTextFileEditor',
    start: 'code/willSetInputToTextFileEditor',
  },
]

export const getPhaseBreakdown = (
  samples: readonly ScoreSample[],
): Readonly<Record<string, ReturnType<typeof compareMetric>['baseline']>> => {
  const durations: Record<string, number[]> = Object.create(null)
  for (const sample of samples) {
    for (const pair of markPairs) {
      const starts = sample.codeMarks.filter(({ name }) => name === pair.start)
      const ends = sample.codeMarks.filter(({ name }) => name === pair.end)
      const count = Math.min(starts.length, ends.length)
      for (let index = 0; index < count; index++) {
        const duration = ends[index].startTime - starts[index].startTime
        if (duration >= 0) {
          ;(durations[pair.name] ||= []).push(duration)
        }
      }
    }
  }
  return Object.fromEntries(Object.entries(durations).map(([name, values]) => [name, compareMetric(values, values).baseline]))
}
