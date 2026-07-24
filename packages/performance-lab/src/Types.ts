export type MetricName = 'cycles' | 'instructions' | 'latencyMs' | 'paintedLatencyMs'

export type ExperimentTier = 'confirmation' | 'quick'

export type ExperimentArm = 'baseline' | 'candidate'

export interface Goal {
  readonly metric: MetricName
  readonly targetRelativeChange: number
}

export interface CodeMark {
  readonly name: string
  readonly startTime: number
}

export interface ScoreSample {
  readonly blockIndex: number
  readonly blockPosition: number
  readonly clock: 'renderer' | 'test-worker'
  readonly codeMarks: readonly CodeMark[]
  readonly contextSwitches: number
  readonly cycles: number
  readonly domReadyLatencyMs: number
  readonly instructions: number
  readonly instructionsPerCycle: number
  readonly latencyMs: number
  readonly mode: 'cold' | 'warm'
  readonly orderIndex: number
  readonly pageFaults: number
  readonly paintedLatencyMs: number
  readonly pattern: 'ABBA' | 'BAAB'
  readonly pid: number
  readonly processManifest?: readonly {
    readonly args: string
    readonly pid: number
    readonly ppid: number
  }[]
  readonly rawCounterOutput: string
  readonly taskClockMs: number
  readonly workerLatencyMs: number
  readonly work: {
    readonly allocations: Readonly<Record<string, number>>
    readonly functions: Readonly<Record<string, number>>
  }
}

export interface MetricStatistics {
  readonly count: number
  readonly mad: number
  readonly median: number
  readonly p90: number
  readonly p95: number
  readonly relativeMad: number
}

export interface ConfidenceInterval {
  readonly lower: number
  readonly upper: number
}

export interface MetricComparison {
  readonly baseline: MetricStatistics
  readonly candidate: MetricStatistics
  readonly confidenceInterval: ConfidenceInterval
  readonly relativeChange: number
}

export interface ExperimentVerdict {
  readonly guardrailFailures: readonly string[]
  readonly invalidReasons: readonly string[]
  readonly objectiveMet: boolean
  readonly status: 'inconclusive' | 'invalid' | 'proxy-win' | 'rejected' | 'ux-confirmed'
  readonly workEvidence: {
    readonly available: boolean
    readonly baselineMedian: number
    readonly candidateMedian: number
    readonly improved: boolean
    readonly improvedMetrics: readonly string[]
    readonly regressedMetrics: readonly string[]
    readonly relativeChange: number
  }
}

export interface SamplePosition {
  readonly blockIndex: number
  readonly blockPosition: number
  readonly orderIndex: number
  readonly pattern: 'ABBA' | 'BAAB'
}
