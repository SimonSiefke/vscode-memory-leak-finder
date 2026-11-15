import { randomUUID } from 'node:crypto'
import { mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { PerfSession, hardwareEvents } from '../ControlledPerfStat/ControlledPerfStat.ts'
import { processTree } from '../MeasureProcessTreePss/MeasureProcessTreePss.ts'
import type { Metric } from '../PerformanceMetric/PerformanceMetric.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'

interface State {
  pid: number
  directory: string
  session?: PerfSession
}
export const id = MeasureId.ProcessTreeCpuCounters
export const targets = []
export const create = ({ pid }: { pid: number }) => [{ pid, directory: join(tmpdir(), `process-tree-cpu-${randomUUID()}`) } satisfies State]
export const start = async (state: State) => {
  await mkdir(state.directory, { recursive: true })
  state.session = await PerfSession.create(state.directory, hardwareEvents)
  await state.session.attach((await processTree(state.pid)).map((entry) => entry.pid))
  return []
}
export const stop = async (state: State) => {
  if (!state.session) throw new Error('Process-tree counters were not started')
  await state.session.freeze()
  return state.session.stop()
}
export const releaseResources = async (state: State) => {
  await state.session?.dispose()
  await rm(state.directory, { recursive: true, force: true })
}
export const compare = (_before: unknown, after: Metric[]) => ({ isLeak: false, metrics: after })
export const isLeak = () => false
export const summary = ({ metrics }: { metrics: Metric[] }) => JSON.stringify(metrics)
