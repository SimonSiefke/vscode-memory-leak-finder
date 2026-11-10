import { randomUUID } from 'node:crypto'
import { rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Session } from '../Session/Session.ts'
import type { Metric } from '../PerformanceMetric/PerformanceMetric.ts'
import { heapSnapshot } from '../PerformanceCapture/PerformanceCapture.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as TargetId from '../TargetId/TargetId.ts'

interface HeapSnapshotBytesState {
  readonly path: string
  readonly samples: Metric[][]
}

export const id = MeasureId.HeapSnapshotBytes
export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]
export const create = (session: Session) =>
  [session, { path: join(tmpdir(), `heap-bytes-${randomUUID()}.heapsnapshot`), samples: [] } satisfies HeapSnapshotBytesState] as const
export const start = async (session: Session, state: HeapSnapshotBytesState) => {
  state.samples.length = 0
  const metrics = await heapSnapshot(session, state.path)
  state.samples.push(metrics)
  return metrics
}
export const runCompletion = async (session: Session, state: HeapSnapshotBytesState) => {
  state.samples.push(await heapSnapshot(session, state.path))
}
export const stop = (_session: Session, state: HeapSnapshotBytesState) => state.samples.at(-1) ?? []
export const releaseResources = (_session: Session, state: HeapSnapshotBytesState) => rm(state.path, { force: true })
export const compare = (before: Metric[], after: Metric[], _context: unknown, _session: Session, _state: HeapSnapshotBytesState) => ({
  isLeak: false,
  metrics: after.map((metric) => ({ ...metric, before: before.find((entry) => entry.name === metric.name)?.value })),
  samples: _state.samples.map((metrics, runIndex) => ({
    runIndex,
    metrics: Object.fromEntries(metrics.map((metric) => [metric.name, metric.value])),
  })),
})
export const isLeak = () => false
export const summary = ({ metrics }: { metrics: Metric[] }) => JSON.stringify(metrics)
