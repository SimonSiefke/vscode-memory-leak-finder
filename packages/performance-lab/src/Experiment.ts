import { compareBlockedMetric, compareMetric, median } from './Statistics.ts'
import type { ExperimentTier, ExperimentVerdict, Goal, MetricComparison, MetricName, ScoreSample } from './Types.ts'

export interface WorkCounters {
  readonly allocations: Readonly<Record<string, number>>
  readonly functions: Readonly<Record<string, number>>
}

export interface WorkComparison {
  readonly baseline: readonly WorkCounters[]
  readonly candidate: readonly WorkCounters[]
}

const getValues = (samples: readonly ScoreSample[], metric: MetricName): readonly number[] => {
  return samples.map((sample) => sample[metric])
}

const compareSamples = (
  baseline: readonly ScoreSample[],
  candidate: readonly ScoreSample[],
  metric: MetricName,
  invalidReasons: string[],
): MetricComparison => {
  try {
    return compareBlockedMetric(
      baseline.map((sample) => ({
        blockIndex: sample.blockIndex,
        value: sample[metric],
      })),
      candidate.map((sample) => ({
        blockIndex: sample.blockIndex,
        value: sample[metric],
      })),
    )
  } catch (error) {
    invalidReasons.push(error instanceof Error ? error.message : String(error))
    return compareMetric(getValues(baseline, metric), getValues(candidate, metric))
  }
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
  tier: ExperimentTier = 'quick',
  workComparison?: WorkComparison,
  identicalBuildCalibration = false,
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
    cycles: compareSamples(baseline, candidate, 'cycles', invalidReasons),
    instructions: compareSamples(baseline, candidate, 'instructions', invalidReasons),
    latencyMs: compareSamples(baseline, candidate, 'latencyMs', invalidReasons),
    paintedLatencyMs: compareSamples(baseline, candidate, 'paintedLatencyMs', invalidReasons),
  }

  if ([...baseline, ...candidate].some(({ codeMarks }) => codeMarks.length === 0)) {
    invalidReasons.push(`Performance sample is missing semantic code/* marks`)
  }
  if ([...baseline, ...candidate].some(({ processManifest }) => !processManifest || processManifest.length === 0)) {
    invalidReasons.push(`Performance sample is missing its process manifest`)
  }
  if (
    [...baseline, ...candidate].some(({ processManifest }) =>
      processManifest?.some(({ args }) => /@github\/copilot-[^/\s]+\/index\.js/.test(args)),
    )
  ) {
    invalidReasons.push(`Core performance workload launched bundled Copilot`)
  }

  const expectedSamplesPerArm = new Set([...baseline, ...candidate].map(({ blockIndex }) => blockIndex)).size * 2
  if (baseline.length !== expectedSamplesPerArm || candidate.length !== expectedSamplesPerArm) {
    invalidReasons.push(`Every ABBA block must contain two samples per revision`)
  }

  const guardrailFailures = [
    tier === 'confirmation'
      ? getP95GuardrailFailure(
          'p95 painted latency',
          baseline.map(({ paintedLatencyMs }) => paintedLatencyMs),
          candidate.map(({ paintedLatencyMs }) => paintedLatencyMs),
          0.05,
        )
      : undefined,
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
  if (identicalBuildCalibration) {
    const minimumDetectableEffect = (primary.confidenceInterval.upper - primary.confidenceInterval.lower) / 2
    const requiredDetectableEffect = Math.abs(goal.targetRelativeChange)
    if (primary.confidenceInterval.lower > 0 || primary.confidenceInterval.upper < 0) {
      invalidReasons.push(`Identical-build A/A confidence interval excludes zero`)
    }
    if (minimumDetectableEffect > requiredDetectableEffect) {
      invalidReasons.push(
        `Identical-build A/A minimum detectable effect ${(minimumDetectableEffect * 100).toFixed(2)}% exceeds ${(requiredDetectableEffect * 100).toFixed(2)}%`,
      )
    }
  }
  const getWorkTotal = (work: WorkCounters): number => {
    return [...Object.values(work.allocations), ...Object.values(work.functions)].reduce((sum, value) => sum + value, 0)
  }
  const baselineWorkCounters = workComparison?.baseline || baseline.map(({ work }) => work)
  const candidateWorkCounters = workComparison?.candidate || candidate.map(({ work }) => work)
  const baselineWork = baselineWorkCounters.map(getWorkTotal)
  const candidateWork = candidateWorkCounters.map(getWorkTotal)
  const baselineWorkMedian = median(baselineWork)
  const candidateWorkMedian = median(candidateWork)
  const workAvailable = [...baselineWork, ...candidateWork].some((value) => value > 0)
  const getMetricMedians = (samples: readonly WorkCounters[]) => {
    const keys = new Set<string>()
    for (const sample of samples) {
      for (const key of Object.keys(sample.allocations)) {
        keys.add(`allocations:${key}`)
      }
      for (const key of Object.keys(sample.functions)) {
        keys.add(`functions:${key}`)
      }
    }
    return Object.fromEntries(
      [...keys].map((key) => {
        const separator = key.indexOf(':')
        const kind = key.slice(0, separator) as keyof WorkCounters
        const metric = key.slice(separator + 1)
        return [key, median(samples.map((sample) => sample[kind][metric] || 0))]
      }),
    )
  }
  const hasUnstableMetric = (samples: readonly WorkCounters[]): boolean => {
    const medians = getMetricMedians(samples)
    return Object.entries(medians).some(([key, medianValue]) => {
      const separator = key.indexOf(':')
      const kind = key.slice(0, separator) as keyof WorkCounters
      const metric = key.slice(separator + 1)
      const values = samples.map((sample) => sample[kind][metric] || 0)
      const maximumRelativeDeviation =
        medianValue === 0 ? 0 : Math.max(...values.map((value) => Math.abs(value - medianValue) / medianValue))
      return maximumRelativeDeviation > 0.02
    })
  }
  if (workAvailable && (hasUnstableMetric(baselineWorkCounters) || hasUnstableMetric(candidateWorkCounters))) {
    invalidReasons.push(`Deterministic work counters vary by more than 2% within a revision`)
  }
  const baselineMetricMedians = getMetricMedians(baselineWorkCounters)
  const candidateMetricMedians = getMetricMedians(candidateWorkCounters)
  const workMetricKeys = new Set([...Object.keys(baselineMetricMedians), ...Object.keys(candidateMetricMedians)])
  const improvedMetrics = [...workMetricKeys].filter((key) => (candidateMetricMedians[key] || 0) < (baselineMetricMedians[key] || 0))
  const regressedMetrics = [...workMetricKeys].filter((key) => (candidateMetricMedians[key] || 0) > (baselineMetricMedians[key] || 0))
  const workRelativeChange =
    baselineWorkMedian === 0 ? (candidateWorkMedian === 0 ? 0 : Number.POSITIVE_INFINITY) : candidateWorkMedian / baselineWorkMedian - 1
  const workEvidence = {
    available: workAvailable,
    baselineMedian: baselineWorkMedian,
    candidateMedian: candidateWorkMedian,
    improved: workAvailable && improvedMetrics.length > 0 && regressedMetrics.length === 0,
    improvedMetrics,
    regressedMetrics,
    relativeChange: workRelativeChange,
  }
  if (regressedMetrics.length > 0) {
    guardrailFailures.push(`deterministic work increased in ${regressedMetrics.join(', ')}`)
  }

  const targetReached =
    primary.relativeChange <= goal.targetRelativeChange && primary.confidenceInterval.upper <= goal.targetRelativeChange + 0.05
  const uxConfirmed =
    invalidReasons.length === 0 &&
    guardrailFailures.length === 0 &&
    workEvidence.improved &&
    targetReached &&
    primary.confidenceInterval.upper < 0
  const proxyWin =
    invalidReasons.length === 0 && guardrailFailures.length === 0 && workEvidence.improved && primary.confidenceInterval.upper <= 0.02

  let status: ExperimentVerdict['status']
  if (invalidReasons.length > 0) {
    status = 'invalid'
  } else if (uxConfirmed) {
    status = 'ux-confirmed'
  } else if (guardrailFailures.length > 0 || primary.confidenceInterval.lower > 0.02) {
    status = 'rejected'
  } else if (proxyWin) {
    status = 'proxy-win'
  } else {
    status = 'inconclusive'
  }

  return {
    comparisons,
    verdict: {
      guardrailFailures,
      invalidReasons: [...new Set(invalidReasons)],
      objectiveMet: uxConfirmed,
      status,
      workEvidence,
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
