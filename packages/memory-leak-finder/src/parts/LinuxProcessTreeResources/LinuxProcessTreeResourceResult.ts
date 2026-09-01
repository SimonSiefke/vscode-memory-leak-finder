import type { ProcessTreeSample, ProcessTreeSamplerResult } from './LinuxProcessTreeResources.ts'
import { parsePerfStatOutput, PssSampleIntervalMs } from './LinuxProcessTreeResources.ts'

interface MetricRow {
  readonly name: string
  readonly unit: string
  readonly value: number
}

interface MemoryResult {
  readonly deltaPssMiB: number
  readonly endingPssMiB: number
  readonly sampledPeakPssMiB: number
  readonly startingPssMiB: number
}

interface ProcessResult {
  readonly endingProcessCount: number
  readonly peakProcessCount: number
  readonly startingProcessCount: number
}

const round = (value: number): number => {
  return Math.round((value + Number.EPSILON) * 1000) / 1000
}

const toMiB = (value: number): number => {
  return round(value / 1024)
}

const getPeakSample = (samples: readonly ProcessTreeSample[], getValue: (sample: ProcessTreeSample) => number): ProcessTreeSample => {
  let peak = samples[0]
  for (const sample of samples.slice(1)) {
    if (getValue(sample) > getValue(peak)) {
      peak = sample
    }
  }
  return peak
}

const toMetrics = (
  cpu: ReturnType<typeof parsePerfStatOutput>,
  memory: MemoryResult,
  processes: ProcessResult,
  sampling: { readonly droppedSampleCount: number; readonly intervalMs: number; readonly validSampleCount: number },
): readonly MetricRow[] => {
  return [
    { name: 'durationSeconds', unit: 'seconds', value: cpu.durationSeconds },
    { name: 'userTimeSeconds', unit: 'seconds', value: cpu.userTimeSeconds },
    { name: 'systemTimeSeconds', unit: 'seconds', value: cpu.systemTimeSeconds },
    { name: 'taskClockSeconds', unit: 'seconds', value: cpu.taskClockSeconds },
    { name: 'averageCpuCores', unit: 'cores', value: cpu.averageCpuCores },
    { name: 'instructions', unit: 'count', value: cpu.instructions },
    { name: 'cycles', unit: 'count', value: cpu.cycles },
    { name: 'instructionsPerCycle', unit: 'ratio', value: cpu.instructionsPerCycle },
    { name: 'contextSwitches', unit: 'count', value: cpu.contextSwitches },
    { name: 'cpuMigrations', unit: 'count', value: cpu.cpuMigrations },
    { name: 'pageFaults', unit: 'count', value: cpu.pageFaults },
    { name: 'minorPageFaults', unit: 'count', value: cpu.minorPageFaults },
    { name: 'majorPageFaults', unit: 'count', value: cpu.majorPageFaults },
    { name: 'startingPssMiB', unit: 'MiB', value: memory.startingPssMiB },
    { name: 'endingPssMiB', unit: 'MiB', value: memory.endingPssMiB },
    { name: 'deltaPssMiB', unit: 'MiB', value: memory.deltaPssMiB },
    { name: 'sampledPeakPssMiB', unit: 'MiB', value: memory.sampledPeakPssMiB },
    { name: 'startingProcessCount', unit: 'count', value: processes.startingProcessCount },
    { name: 'endingProcessCount', unit: 'count', value: processes.endingProcessCount },
    { name: 'peakProcessCount', unit: 'count', value: processes.peakProcessCount },
    { name: 'validSampleCount', unit: 'count', value: sampling.validSampleCount },
    { name: 'droppedSampleCount', unit: 'count', value: sampling.droppedSampleCount },
    { name: 'samplingIntervalMs', unit: 'milliseconds', value: sampling.intervalMs },
  ].map((metric) => ({ ...metric, value: round(metric.value) }))
}

export const createResult = ({
  droppedSampleCount,
  perfRawOutput,
  samples,
  window,
}: {
  readonly droppedSampleCount: number
  readonly perfRawOutput: string
  readonly samples: readonly ProcessTreeSample[]
  readonly window: 'fromStart' | 'scenario'
}) => {
  if (samples.length === 0) {
    throw new Error('No valid process-tree PSS samples were recorded')
  }
  const cpu = parsePerfStatOutput(perfRawOutput)
  const starting = samples[0]
  const ending = samples[samples.length - 1]
  const peakPss = getPeakSample(samples, (sample) => sample.pssKiB)
  const peakProcesses = getPeakSample(samples, (sample) => sample.processCount)
  const memory = {
    deltaPssMiB: toMiB(ending.pssKiB - starting.pssKiB),
    endingPssMiB: toMiB(ending.pssKiB),
    sampledPeakPssMiB: toMiB(peakPss.pssKiB),
    startingPssMiB: toMiB(starting.pssKiB),
  }
  const processes = {
    endingProcessCount: ending.processCount,
    peakProcessCount: peakProcesses.processCount,
    startingProcessCount: starting.processCount,
  }
  const sampling = {
    droppedSampleCount,
    intervalMs: PssSampleIntervalMs,
    validSampleCount: samples.length,
  }
  return {
    cpu,
    isLeak: false,
    memory,
    metrics: toMetrics(cpu, memory, processes, sampling),
    processes,
    sampling,
    window,
  }
}

export const createResultFromSampler = (
  perfRawOutput: string,
  samplerResult: ProcessTreeSamplerResult,
  window: 'fromStart' | 'scenario',
) => {
  return createResult({
    droppedSampleCount: samplerResult.droppedSampleCount,
    perfRawOutput,
    samples: samplerResult.samples,
    window,
  })
}

export const formatSummary = (result: ReturnType<typeof createResult>): string => {
  return [
    `Linux process-tree resources (${result.window}):`,
    'metric | value | unit',
    ...result.metrics.map((metric) => `${metric.name} | ${metric.value} | ${metric.unit}`),
  ].join('\n')
}
