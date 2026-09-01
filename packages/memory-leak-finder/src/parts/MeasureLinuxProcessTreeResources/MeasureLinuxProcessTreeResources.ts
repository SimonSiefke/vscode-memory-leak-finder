import type { Dynamic } from '../Types/Types.ts'
import { setTimeout } from 'node:timers/promises'
import {
  createProcessTreeSampler,
  getProcessTable,
  updateTrackedProcesses,
} from '../LinuxProcessTreeResources/LinuxProcessTreeResources.ts'
import * as LinuxProcessTreeResourceResult from '../LinuxProcessTreeResources/LinuxProcessTreeResourceResult.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as PerfStat from '../PerfStat/PerfStat.ts'

interface State {
  readonly pid: number
  perfSession?: PerfStat.LinuxProcessTreePerfStatSession
  sampler?: ReturnType<typeof createProcessTreeSampler>
}

export const id = MeasureId.LinuxProcessTreeResources

export const targets: readonly Dynamic[] = []

export const create = ({ pid }: { pid: number }) => {
  return [
    {
      pid,
    } satisfies State,
  ]
}

const getInitialPids = async (pid: number): Promise<readonly number[]> => {
  const table = await getProcessTable()
  return [...updateTrackedProcesses(pid, new Map(), table).keys()].sort((a, b) => a - b)
}

const startPerfForStableProcessTree = async (pid: number) => {
  let lastResult: PerfStat.PerfStatResult | undefined
  for (let attempt = 0; attempt < 2; attempt++) {
    const pids = await getInitialPids(pid)
    if (pids.length === 0) {
      throw new Error(`No live processes found for Electron PID ${pid}`)
    }
    const session = await PerfStat.startLinuxProcessTreePerfStat(pids)
    const earlyResult = await Promise.race([session.resultPromise, setTimeout(25).then(() => undefined)])
    if (!earlyResult) {
      return { perfSession: session, pids }
    }
    lastResult = earlyResult
  }
  throw new Error(`perf stat could not attach to the Electron process tree: ${lastResult?.stderr.trim() || 'unknown error'}`)
}

export const start = async (state: State) => {
  if (process.platform !== 'linux') {
    throw new Error('linux-process-tree-resources is only supported on Linux')
  }
  const { perfSession, pids } = await startPerfForStableProcessTree(state.pid)
  state.perfSession = perfSession
  try {
    const sampler = createProcessTreeSampler(state.pid)
    state.sampler = sampler
    const firstSample = await sampler.start()
    return {
      firstSample,
      perfCommand: ['perf', ...perfSession.args],
      perfPid: perfSession.process.pid,
      pids,
      rootPid: state.pid,
    }
  } catch (error) {
    await PerfStat.stopLinuxProcessTreePerfStat(perfSession)
    throw error
  }
}

export const stop = async (state: State) => {
  if (!state.perfSession || !state.sampler) {
    throw new Error('Linux process-tree resource measurement was not started')
  }
  const [perfResult, samplerResult] = await Promise.all([PerfStat.stopLinuxProcessTreePerfStat(state.perfSession), state.sampler.stop()])
  if (perfResult.code !== 0 && perfResult.code !== 130 && perfResult.signal !== 'SIGINT') {
    throw new Error(`perf stat failed with exit code ${perfResult.code}: ${perfResult.stderr.trim()}`)
  }
  return LinuxProcessTreeResourceResult.createResultFromSampler(perfResult.stderr, samplerResult, 'scenario')
}

export const releaseResources = async (state: State) => {
  if (state.perfSession && state.perfSession.process.exitCode === null && !state.perfSession.process.killed) {
    await PerfStat.stopLinuxProcessTreePerfStat(state.perfSession)
  }
  if (state.sampler) {
    await state.sampler.stop()
  }
}

export const compare = (_before: Dynamic, after: Dynamic) => {
  return after
}

export const isLeak = () => {
  return false
}

export const summary = LinuxProcessTreeResourceResult.formatSummary
