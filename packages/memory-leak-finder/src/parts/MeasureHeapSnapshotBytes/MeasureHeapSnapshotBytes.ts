import { randomUUID } from 'node:crypto'
import { rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Session } from '../Session/Session.ts'
import type { Metric } from '../PerformanceMetric/PerformanceMetric.ts'
import { heapSnapshot } from '../PerformanceCapture/PerformanceCapture.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.HeapSnapshotBytes
export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]
export const create = (session: Session) => [session, join(tmpdir(), `heap-bytes-${randomUUID()}.heapsnapshot`)] as const
export const start = (session: Session, path: string) => heapSnapshot(session, path)
export const stop = start
export const releaseResources = (_session: Session, path: string) => rm(path, { force: true })
export const compare = (before: Metric[], after: Metric[]) => ({
  isLeak: false,
  metrics: after.map((metric) => ({ ...metric, before: before.find((entry) => entry.name === metric.name)?.value })),
})
export const isLeak = () => false
export const summary = ({ metrics }: { metrics: Metric[] }) => JSON.stringify(metrics)
