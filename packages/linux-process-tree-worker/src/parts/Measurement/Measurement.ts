import { readFile } from 'node:fs/promises'
import { setTimeout } from 'node:timers/promises'
import {
  createProcessTreeSampler,
  getProcessTable,
  updateTrackedProcesses,
} from '../LinuxProcessTreeResources/LinuxProcessTreeResources.ts'
import * as LinuxProcessTreeResourceResult from '../LinuxProcessTreeResources/LinuxProcessTreeResourceResult.ts'
import * as PerfStat from '../PerfStat/PerfStat.ts'

export interface Measurement {
  dispose(): Promise<void>
  stop(): Promise<LinuxProcessTreeResourceResult.Result>
}

const getInitialPids = async (pid: number): Promise<readonly number[]> => {
  const table = await getProcessTable()
  return [...updateTrackedProcesses(pid, new Map(), table).keys()].sort((a, b) => a - b)
}

const waitForDescendant = async (pid: number): Promise<void> => {
  const start = Date.now()
  while (true) {
    const pids = await getInitialPids(pid)
    if (pids.some((currentPid) => currentPid !== pid)) {
      return
    }
    if (Date.now() - start > 10_000) {
      throw new Error(`Timed out waiting for a workload below perf PID ${pid}`)
    }
    await setTimeout(25)
  }
}

const startPerfForStableProcessTree = async (pid: number): Promise<PerfStat.PerfStatSession> => {
  let lastResult: PerfStat.PerfStatResult | undefined
  for (let attempt = 0; attempt < 2; attempt++) {
    const pids = await getInitialPids(pid)
    if (pids.length === 0) {
      throw new Error(`No live processes found for Electron PID ${pid}`)
    }
    const session = await PerfStat.start(pids)
    const earlyResult = await Promise.race([session.resultPromise, setTimeout(25).then(() => undefined)])
    if (!earlyResult) {
      return session
    }
    lastResult = earlyResult
  }
  throw new Error(`perf stat could not attach to the Electron process tree: ${lastResult?.stderr.trim() || 'unknown error'}`)
}

export const start = async ({
  perfOutputPath,
  pid,
  window,
}: {
  readonly perfOutputPath?: string
  readonly pid: number
  readonly window: 'fromStart' | 'scenario'
}): Promise<Measurement> => {
  const fromStart = window === 'fromStart'
  if (fromStart && !perfOutputPath) {
    throw new Error('A perf interval output path is required for a from-start measurement')
  }
  if (fromStart) {
    await waitForDescendant(pid)
  }
  const perfSession = fromStart ? undefined : await startPerfForStableProcessTree(pid)
  const sampler = createProcessTreeSampler(pid, {}, { excludeRoot: fromStart })
  try {
    await sampler.start()
  } catch (error) {
    if (perfSession) {
      await PerfStat.stop(perfSession)
    }
    throw error
  }
  let stopPromise: Promise<LinuxProcessTreeResourceResult.Result> | undefined
  return {
    async dispose() {
      await sampler.stop().catch(() => undefined)
      if (perfSession) {
        await PerfStat.stop(perfSession).catch(() => undefined)
      }
    },
    async stop() {
      stopPromise ||= (async () => {
        const [perfRawOutput, samplerResult] = await Promise.all([
          perfSession
            ? PerfStat.stop(perfSession).then((perfResult) => {
                if (perfResult.code !== 0 && perfResult.code !== 130 && perfResult.signal !== 'SIGINT') {
                  throw new Error(`perf stat failed with exit code ${perfResult.code}: ${perfResult.stderr.trim()}`)
                }
                return perfResult.stderr
              })
            : readFile(perfOutputPath!, 'utf8'),
          sampler.stop(),
        ])
        return LinuxProcessTreeResourceResult.createResultFromSampler(perfRawOutput, samplerResult, window)
      })()
      return stopPromise
    },
  }
}
