import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { setTimeout } from 'node:timers/promises'
import type { Dynamic } from '../Types/Types.ts'
import { parsePerfStatOutput } from '../CpuPerformanceCounters/CpuPerformanceCounters.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as Root from '../Root/Root.ts'

interface CpuPerformanceCountersFromStartState {
  readonly connectionId: number
  command?: readonly string[]
  perfPid?: number
  readonly pid: number
}

interface CpuPerformanceCountersFromStartSample {
  readonly command: readonly string[]
  readonly cycles: number | null
  readonly instructions: number | null
  readonly instructionsPerCycle: number | null
  readonly outputPath: string
  readonly perfPid?: number
  readonly pid: number
  readonly rawOutput: string
}

const PollInterval = 100
const StopTimeout = 5000

export const id = MeasureId.CpuPerformanceCountersFromStart

export const targets: readonly Dynamic[] = []

const getOutputPath = (connectionId: number): string => {
  return join(Root.root, '.vscode-memory-leak-finder-cpu-performance-counters', `${connectionId}.txt`)
}

const getParentPid = async (pid: number): Promise<number | undefined> => {
  try {
    const status = await readFile(`/proc/${pid}/status`, 'utf8')
    const match = /^PPid:\s*(\d+)$/m.exec(status)
    if (!match) {
      return undefined
    }
    const parentPid = Number(match[1])
    return Number.isFinite(parentPid) && parentPid > 0 ? parentPid : undefined
  } catch {
    return undefined
  }
}

const getCommand = async (pid: number | undefined): Promise<readonly string[]> => {
  if (!pid) {
    return ['perf', 'stat']
  }
  try {
    const commandLine = await readFile(`/proc/${pid}/cmdline`, 'utf8')
    const command = commandLine.split('\0').filter(Boolean)
    return command.length > 0 ? command : ['perf', 'stat']
  } catch {
    return ['perf', 'stat']
  }
}

const isProcessAlive = (pid: number): boolean => {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

const killProcess = (pid: number, signal: NodeJS.Signals): void => {
  try {
    process.kill(pid, signal)
  } catch {
    // The process may already have exited by the time the measure stops.
  }
}

const readPerfOutput = async (outputPath: string): Promise<string> => {
  const start = Date.now()
  while (true) {
    try {
      const rawOutput = await readFile(outputPath, 'utf8')
      if (rawOutput.trim()) {
        return rawOutput
      }
    } catch {
      // Perf writes the file only after the measured process exits.
    }
    if (Date.now() - start > StopTimeout) {
      throw new Error(`Timed out waiting for perf stat output at ${outputPath}`)
    }
    await setTimeout(PollInterval)
  }
}

const getInstructionsPerCycle = (instructions: number | null, cycles: number | null): number | null => {
  if (instructions === null || cycles === null || cycles === 0) {
    return null
  }
  return instructions / cycles
}

export const create = ({ connectionId, pid }: { connectionId: number; pid: number }) => {
  return [
    {
      connectionId,
      pid,
    },
  ]
}

export const start = async (state: CpuPerformanceCountersFromStartState) => {
  const perfPid = await getParentPid(state.pid)
  const command = await getCommand(perfPid)
  state.perfPid = perfPid
  state.command = command
  return {
    command,
    outputPath: getOutputPath(state.connectionId),
    perfPid,
    pid: state.pid,
  }
}

export const stop = async (state: CpuPerformanceCountersFromStartState): Promise<CpuPerformanceCountersFromStartSample> => {
  const outputPath = getOutputPath(state.connectionId)
  if (isProcessAlive(state.pid)) {
    killProcess(state.pid, 'SIGTERM')
  }
  const start = Date.now()
  while (isProcessAlive(state.pid) && Date.now() - start <= StopTimeout) {
    await setTimeout(PollInterval)
  }
  if (isProcessAlive(state.pid)) {
    killProcess(state.pid, 'SIGKILL')
  }
  const rawOutput = await readPerfOutput(outputPath)
  const counters = parsePerfStatOutput(rawOutput)
  return {
    command: state.command ?? ['perf', 'stat'],
    instructionsPerCycle: getInstructionsPerCycle(counters.instructions, counters.cycles),
    outputPath,
    perfPid: state.perfPid,
    pid: state.pid,
    rawOutput,
    ...counters,
  }
}

export const releaseResources = async () => {}

const toMetricRows = (sample: CpuPerformanceCountersFromStartSample) => {
  return [
    {
      available: typeof sample.instructions === 'number',
      event: 'instructions:u',
      name: 'instructions',
      unit: 'count',
      value: sample.instructions,
    },
    {
      available: typeof sample.cycles === 'number',
      event: 'cycles:u',
      name: 'cycles',
      unit: 'count',
      value: sample.cycles,
    },
    {
      available: typeof sample.instructionsPerCycle === 'number',
      event: 'instructions:u/cycles:u',
      name: 'instructionsPerCycle',
      unit: 'ratio',
      value: sample.instructionsPerCycle,
    },
  ]
}

export const compare = (_before: Dynamic, after: CpuPerformanceCountersFromStartSample) => {
  return {
    command: after.command,
    cycles: after.cycles,
    instructions: after.instructions,
    instructionsPerCycle: after.instructionsPerCycle,
    isLeak: false,
    metrics: toMetricRows(after),
    outputPath: after.outputPath,
    perfPid: after.perfPid,
    pid: after.pid,
    rawOutput: after.rawOutput,
    raw: {
      after,
      before: _before,
    },
  }
}

export const isLeak = () => {
  return false
}

export const summary = ({ metrics }: Dynamic) => {
  const availableMetrics = Array.isArray(metrics) ? metrics.filter((metric) => metric.available) : []
  if (availableMetrics.length === 0) {
    return 'No CPU performance counters from start were available'
  }
  const lines = ['CPU performance counters from start:', 'metric | value | unit']
  for (const metric of availableMetrics) {
    lines.push(`${metric.name} | ${metric.value} | ${metric.unit}`)
  }
  return lines.join('\n')
}
