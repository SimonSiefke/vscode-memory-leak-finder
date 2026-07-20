import type { Dynamic } from '../Types/Types.ts'
import {
  formatCpuPerformanceCountersSummary,
  parsePerfStatOutput,
  toCpuPerformanceCounterRows,
} from '../CpuPerformanceCounters/CpuPerformanceCounters.ts'
import * as GetElectronWindowProcessId from '../GetElectronWindowProcessId/GetElectronWindowProcessId.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as PerfStat from '../PerfStat/PerfStat.ts'

interface CpuPerformanceCountersState {
  readonly electronWebSocketUrl: string
  readonly launchPid: number
  readonly targetId: string
  perfSession?: PerfStat.PerfStatSession
}

export const id = MeasureId.CpuPerformanceCounters

export const targets: readonly Dynamic[] = []

export const create = ({
  electronWebSocketUrl = '',
  pid,
  targetId = '',
}: {
  electronWebSocketUrl?: string
  pid: number
  targetId?: string
}) => {
  return [
    {
      electronWebSocketUrl,
      launchPid: pid,
      targetId,
    },
  ]
}

const getPerfPid = async (state: CpuPerformanceCountersState): Promise<number> => {
  const windowPid = await GetElectronWindowProcessId.getElectronWindowProcessId(state.electronWebSocketUrl, state.targetId)
  return windowPid ?? state.launchPid
}

export const start = async (state: CpuPerformanceCountersState) => {
  const pid = await getPerfPid(state)
  const perfSession = await PerfStat.startPerfStat(pid)
  state.perfSession = perfSession
  return {
    command: ['perf', ...perfSession.args],
    perfPid: perfSession.process.pid,
    pid,
  }
}

export const stop = async (state: CpuPerformanceCountersState) => {
  if (!state.perfSession) {
    throw new Error('perf stat was not started')
  }
  const result = await PerfStat.stopPerfStat(state.perfSession)
  const counters = parsePerfStatOutput(result.stderr)
  return {
    code: result.code,
    command: ['perf', ...state.perfSession.args],
    perfPid: state.perfSession.process.pid,
    pid: state.perfSession.pid,
    rawOutput: result.stderr,
    signal: result.signal,
    ...counters,
  }
}

export const releaseResources = async (state: CpuPerformanceCountersState) => {
  if (state.perfSession && state.perfSession.process.exitCode === null && !state.perfSession.process.killed) {
    await PerfStat.stopPerfStat(state.perfSession)
  }
}

export const compare = (_before: Dynamic, after: Dynamic) => {
  const metrics = toCpuPerformanceCounterRows(after)
  return {
    isLeak: false,
    metrics,
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
  return formatCpuPerformanceCountersSummary(metrics)
}
