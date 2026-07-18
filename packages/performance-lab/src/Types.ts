export type MetricName = 'cycles' | 'instructions' | 'latencyMs'

export interface Goal {
  readonly metric: MetricName
  readonly targetRelativeChange: number
}

export interface CodeMark {
  readonly name: string
  readonly startTime: number
}

export interface ScoreSample {
  readonly codeMarks: readonly CodeMark[]
  readonly contextSwitches: number
  readonly cycles: number
  readonly instructions: number
  readonly instructionsPerCycle: number
  readonly latencyMs: number
  readonly mode: 'cold' | 'warm'
  readonly pageFaults: number
  readonly pid: number
  readonly rawCounterOutput: string
  readonly taskClockMs: number
}

export interface MetricStatistics {
  readonly count: number
  readonly mad: number
  readonly median: number
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
  readonly status: 'inconclusive' | 'invalid' | 'met' | 'rejected'
}
