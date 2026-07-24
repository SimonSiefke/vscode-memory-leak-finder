import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { getBlockLogEffects, getMetricStatistics, hierarchicalBootstrapRelativeChange, median } from './Statistics.ts'
import type { ExperimentTier, Goal, MetricName, ScoreSample } from './Types.ts'

interface ReplicaExperiment {
  readonly baseline: {
    readonly metadata?: {
      readonly build?: {
        readonly commit?: string
        readonly executableSha256?: string
        readonly sourceMapSha256?: string
        readonly workbenchSha256?: string
      }
    }
    readonly samples: readonly ScoreSample[]
  }
  readonly candidate: {
    readonly metadata?: {
      readonly build?: {
        readonly commit?: string
        readonly executableSha256?: string
        readonly sourceMapSha256?: string
        readonly workbenchSha256?: string
      }
    }
    readonly samples: readonly ScoreSample[]
  }
  readonly command: 'compare'
  readonly goal: Goal
  readonly replicaId: string
  readonly scenario: {
    readonly hash: string
    readonly name: string
  }
  readonly schemaVersion: number
  readonly tier: ExperimentTier
  readonly verdict?: {
    readonly invalidReasons?: readonly string[]
    readonly workEvidence?: {
      readonly available?: boolean
      readonly improved?: boolean
      readonly regressedMetrics?: readonly string[]
    }
  }
}

interface CalibrationHistoryEntry {
  readonly createdAt: string
  readonly falsePositive: boolean
  readonly minimumDetectableEffect: number
}

const findExperimentPaths = async (path: string): Promise<readonly string[]> => {
  const entries = await readdir(path, { withFileTypes: true })
  const paths: string[] = []
  for (const entry of entries) {
    const entryPath = join(path, entry.name)
    if (entry.isDirectory()) {
      paths.push(...(await findExperimentPaths(entryPath)))
    } else if (entry.isFile() && entry.name === 'experiment.json') {
      paths.push(entryPath)
    }
  }
  return paths
}

const isReplicaExperiment = (value: any): value is ReplicaExperiment => {
  return (
    value?.command === 'compare' &&
    value?.schemaVersion === 2 &&
    Array.isArray(value?.baseline?.samples) &&
    Array.isArray(value?.candidate?.samples) &&
    typeof value?.scenario?.hash === 'string' &&
    typeof value?.replicaId === 'string'
  )
}

const getEffects = (experiment: ReplicaExperiment, metric: MetricName): readonly number[] => {
  return getBlockLogEffects(
    experiment.baseline.samples.map((sample) => ({
      blockIndex: sample.blockIndex,
      value: sample[metric],
    })),
    experiment.candidate.samples.map((sample) => ({
      blockIndex: sample.blockIndex,
      value: sample[metric],
    })),
  )
}

const getP95RelativeChange = (experiment: ReplicaExperiment, metric: MetricName): number => {
  const baseline = getMetricStatistics(experiment.baseline.samples.map((sample) => sample[metric])).p95
  const candidate = getMetricStatistics(experiment.candidate.samples.map((sample) => sample[metric])).p95
  return baseline === 0 ? 0 : candidate / baseline - 1
}

export const aggregateExperiments = (
  experiments: readonly ReplicaExperiment[],
  expectedReplicas: number,
  calibrationHistory: readonly CalibrationHistoryEntry[] = [],
) => {
  const invalidReasons: string[] = []
  if (experiments.length !== expectedReplicas) {
    invalidReasons.push(`Expected ${expectedReplicas} replicas, found ${experiments.length}`)
  }
  const scenarioHashes = new Set(experiments.map((experiment) => experiment.scenario.hash))
  const scenarioNames = new Set(experiments.map((experiment) => experiment.scenario.name))
  const tiers = new Set(experiments.map((experiment) => experiment.tier))
  const goals = new Set(experiments.map((experiment) => JSON.stringify(experiment.goal)))
  if (scenarioHashes.size !== 1 || scenarioNames.size !== 1) {
    invalidReasons.push(`Replica scenario hashes or names differ`)
  }
  if (tiers.size !== 1) {
    invalidReasons.push(`Replica tiers differ`)
  }
  if (goals.size !== 1) {
    invalidReasons.push(`Replica goals differ`)
  }
  for (const experiment of experiments) {
    for (const reason of experiment.verdict?.invalidReasons || []) {
      invalidReasons.push(`${experiment.replicaId}: ${reason}`)
    }
  }

  const goal = experiments[0]?.goal || {
    metric: 'latencyMs',
    targetRelativeChange: -0.05,
  }
  const metrics: readonly MetricName[] = ['latencyMs', 'paintedLatencyMs', 'instructions', 'cycles']
  const comparisons = Object.fromEntries(
    metrics.map((metric) => {
      try {
        const replicaEffects = experiments.map((experiment) => getEffects(experiment, metric))
        const allEffects = replicaEffects.flat()
        return [
          metric,
          {
            confidenceInterval: hierarchicalBootstrapRelativeChange(replicaEffects),
            relativeChange: allEffects.length === 0 ? 0 : Math.exp(median(allEffects)) - 1,
          },
        ]
      } catch (error) {
        invalidReasons.push(error instanceof Error ? error.message : String(error))
        return [
          metric,
          {
            confidenceInterval: {
              lower: 0,
              upper: 0,
            },
            relativeChange: 0,
          },
        ]
      }
    }),
  ) as Record<
    MetricName,
    {
      readonly confidenceInterval: {
        readonly lower: number
        readonly upper: number
      }
      readonly relativeChange: number
    }
  >

  const workAvailable = experiments.length > 0 && experiments.every((experiment) => experiment.verdict?.workEvidence?.available === true)
  const workImproved = workAvailable && experiments.every((experiment) => experiment.verdict?.workEvidence?.improved === true)
  const workRegressed = experiments.some((experiment) => (experiment.verdict?.workEvidence?.regressedMetrics?.length || 0) > 0)
  const primary = comparisons[goal.metric]
  const tier = experiments[0]?.tier || 'quick'
  const guardrailFailures: string[] = []
  if (workRegressed) {
    guardrailFailures.push(`deterministic work regressed in at least one replica`)
  }
  if (comparisons.instructions.confidenceInterval.upper > 0.05) {
    guardrailFailures.push(`instructions may regress by more than 5%`)
  }
  const paintedP95RelativeChange =
    experiments.length === 0 ? 0 : median(experiments.map((experiment) => getP95RelativeChange(experiment, 'paintedLatencyMs')))
  if (tier === 'confirmation' && paintedP95RelativeChange > 0.05) {
    guardrailFailures.push(`median replica p95 painted latency regressed by more than 5%`)
  }
  const targetReached =
    primary.relativeChange <= goal.targetRelativeChange && primary.confidenceInterval.upper <= goal.targetRelativeChange + 0.05
  const uxConfirmed =
    invalidReasons.length === 0 && guardrailFailures.length === 0 && workImproved && targetReached && primary.confidenceInterval.upper < 0
  const proxyWin = invalidReasons.length === 0 && guardrailFailures.length === 0 && workImproved && primary.confidenceInterval.upper <= 0.02
  const candidateStatus =
    invalidReasons.length > 0
      ? 'invalid'
      : uxConfirmed
        ? 'ux-confirmed'
        : guardrailFailures.length > 0 || primary.confidenceInterval.lower > 0.02
          ? 'rejected'
          : proxyWin
            ? 'proxy-win'
            : 'inconclusive'
  const buildPairs = experiments.map((experiment) => {
    const baseline = experiment.baseline.metadata?.build
    const candidate = experiment.candidate.metadata?.build
    return {
      baselineCommit: baseline?.commit || '',
      candidateCommit: candidate?.commit || '',
      fingerprintsAvailable: Boolean(
        baseline?.executableSha256 &&
        baseline.workbenchSha256 &&
        baseline.sourceMapSha256 &&
        candidate?.executableSha256 &&
        candidate.workbenchSha256 &&
        candidate.sourceMapSha256,
      ),
      fingerprintsMatch:
        baseline?.executableSha256 === candidate?.executableSha256 &&
        baseline?.workbenchSha256 === candidate?.workbenchSha256 &&
        baseline?.sourceMapSha256 === candidate?.sourceMapSha256,
    }
  })
  const isIdenticalBuild =
    buildPairs.length > 0 &&
    buildPairs.every(({ baselineCommit, candidateCommit, fingerprintsAvailable, fingerprintsMatch }) =>
      fingerprintsAvailable ? fingerprintsMatch : baselineCommit.length > 0 && baselineCommit === candidateCommit,
    )
  const falsePositive = isIdenticalBuild && (primary.confidenceInterval.lower > 0 || primary.confidenceInterval.upper < 0)
  if (falsePositive) {
    invalidReasons.push(`Identical-build A/A calibration produced a false-positive winner`)
  }
  const minimumDetectableEffect = (primary.confidenceInterval.upper - primary.confidenceInterval.lower) / 2
  if (isIdenticalBuild && minimumDetectableEffect > Math.abs(goal.targetRelativeChange)) {
    invalidReasons.push(
      `Identical-build A/A minimum detectable effect ${(minimumDetectableEffect * 100).toFixed(2)}% exceeds ${(Math.abs(goal.targetRelativeChange) * 100).toFixed(2)}%`,
    )
  }
  const updatedCalibrationHistory = [
    ...calibrationHistory,
    ...(isIdenticalBuild
      ? [
          {
            createdAt: new Date().toISOString(),
            falsePositive,
            minimumDetectableEffect,
          },
        ]
      : []),
  ].slice(-20)
  const recentCalibrations = updatedCalibrationHistory.slice(-2)
  const repeatedFalsePositives = recentCalibrations.length === 2 && recentCalibrations.every((entry) => entry.falsePositive)
  if (repeatedFalsePositives) {
    invalidReasons.push(`The two most recent A/A calibrations produced false-positive winners`)
  }
  const status =
    falsePositive || repeatedFalsePositives || (isIdenticalBuild && minimumDetectableEffect > Math.abs(goal.targetRelativeChange))
      ? 'invalid'
      : candidateStatus
  const falsePositiveCount = updatedCalibrationHistory.filter((entry) => entry.falsePositive).length

  return {
    calibration: {
      falsePositive,
      falsePositiveRate: updatedCalibrationHistory.length === 0 ? 0 : falsePositiveCount / updatedCalibrationHistory.length,
      history: updatedCalibrationHistory,
      isIdenticalBuild,
      systemValid: !repeatedFalsePositives,
    },
    comparisons,
    expectedReplicas,
    goal,
    guardrailFailures,
    invalidReasons: [...new Set(invalidReasons)],
    minimumDetectableEffect,
    paintedP95RelativeChange,
    replicas: experiments.map((experiment) => ({
      baselineCommit: experiment.baseline.metadata?.build?.commit || '',
      candidateCommit: experiment.candidate.metadata?.build?.commit || '',
      id: experiment.replicaId,
    })),
    scenario: experiments[0]?.scenario,
    schemaVersion: 2,
    status,
    tier,
    workEvidence: {
      available: workAvailable,
      improvedInEveryReplica: workImproved,
    },
  }
}

export const aggregateExperimentDirectory = async (
  inputPath: string,
  outputPath: string,
  expectedReplicas: number,
  calibrationHistoryPath?: string,
): Promise<string> => {
  const paths = await findExperimentPaths(inputPath)
  const experiments: ReplicaExperiment[] = []
  for (const path of paths) {
    const value = JSON.parse(await readFile(path, 'utf8'))
    if (isReplicaExperiment(value)) {
      experiments.push(value)
    }
  }
  let calibrationHistory: readonly CalibrationHistoryEntry[] = []
  if (calibrationHistoryPath) {
    try {
      const value = JSON.parse(await readFile(calibrationHistoryPath, 'utf8'))
      calibrationHistory = Array.isArray(value) ? value : []
    } catch {
      // A missing or invalid cache starts a new calibration history.
    }
  }
  const result = aggregateExperiments(experiments, expectedReplicas, calibrationHistory)
  const resultPath = join(outputPath, 'experiment.json')
  await mkdir(dirname(resultPath), { recursive: true })
  await writeFile(resultPath, JSON.stringify(result, null, 2) + '\n')
  if (calibrationHistoryPath) {
    await mkdir(dirname(calibrationHistoryPath), { recursive: true })
    await writeFile(calibrationHistoryPath, JSON.stringify(result.calibration.history, null, 2) + '\n')
  }
  return resultPath
}
