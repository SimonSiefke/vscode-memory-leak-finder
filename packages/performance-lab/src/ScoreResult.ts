import type { CodeMark, ScoreSample } from './Types.ts'

interface CounterMetric {
  readonly available?: boolean
  readonly name?: string
  readonly value?: number | null
}

const getMetric = (metrics: readonly CounterMetric[], name: string): number => {
  const metric = metrics.find((item) => item.name === name)
  if (!metric?.available || typeof metric.value !== 'number' || !Number.isFinite(metric.value)) {
    throw new Error(`Required performance counter "${name}" is unavailable`)
  }
  return metric.value
}

const hasCounterMultiplexing = (rawOutput: string): boolean => {
  for (const line of rawOutput.split('\n')) {
    const fields = line.split(',')
    const percentage = fields.at(-3)
    if (percentage && Number(percentage) < 99.5) {
      return true
    }
  }
  return false
}

const getCodeMarks = (value: unknown): readonly CodeMark[] => {
  if (!Array.isArray(value)) {
    return []
  }
  return value.filter(
    (mark): mark is CodeMark =>
      typeof mark === 'object' &&
      mark !== null &&
      typeof (mark as CodeMark).name === 'string' &&
      typeof (mark as CodeMark).startTime === 'number',
  )
}

export const parseScoreResult = (result: any): ScoreSample => {
  if (result?.cpuProfile || result?.trace || result?.timeline) {
    throw new Error(`Profiler-enabled results cannot enter the scoring dataset`)
  }
  const comparison = result?.cpuPerformanceCounters
  if (!comparison) {
    throw new Error(`Result does not contain cpuPerformanceCounters`)
  }
  const performanceSamples = comparison.performanceSamples
  if (!Array.isArray(performanceSamples) || performanceSamples.length !== 1) {
    throw new Error(`Expected exactly one performance scenario sample, got ${performanceSamples?.length || 0}`)
  }
  const performanceSample = performanceSamples[0]
  if (
    (performanceSample.mode !== 'cold' && performanceSample.mode !== 'warm') ||
    typeof performanceSample.latencyMs !== 'number' ||
    !Number.isFinite(performanceSample.latencyMs) ||
    performanceSample.latencyMs < 0
  ) {
    throw new Error(`Performance scenario sample has invalid mode or latency`)
  }
  const metrics = Array.isArray(comparison.metrics) ? comparison.metrics : []
  const rawAfter = comparison.raw?.after || {}
  const rawCounterOutput = typeof rawAfter.rawOutput === 'string' ? rawAfter.rawOutput : ''
  if (hasCounterMultiplexing(rawCounterOutput)) {
    throw new Error(`Performance counters were multiplexed below 99.5%`)
  }
  const pid = rawAfter.pid
  if (typeof pid !== 'number' || pid <= 0) {
    throw new Error(`Performance counter target process is missing`)
  }
  const cycles = getMetric(metrics, 'cycles')
  const instructions = getMetric(metrics, 'instructions')
  return {
    codeMarks: getCodeMarks(performanceSample.codeMarks),
    contextSwitches: getMetric(metrics, 'contextSwitches'),
    cycles,
    instructions,
    instructionsPerCycle: cycles === 0 ? 0 : instructions / cycles,
    latencyMs: performanceSample.latencyMs,
    mode: performanceSample.mode,
    pageFaults: getMetric(metrics, 'pageFaults'),
    pid,
    rawCounterOutput,
    taskClockMs: getMetric(metrics, 'taskClockMs'),
  }
}
