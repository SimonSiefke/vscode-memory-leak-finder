import { randomUUID } from 'node:crypto'
import { rmSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import type { Session } from '../Session/Session.ts'
import type { Dynamic } from '../Types/Types.ts'
import * as HeapSnapshot from '../HeapSnapshot/HeapSnapshot.ts'
import { launchHeapSnapshotWorker } from '../LaunchHeapSnapshotWorker/LaunchHeapSnapshotWorker.ts'
import * as Root from '../Root/Root.ts'

export type PerformanceMarkMetric = 'bytes' | 'count'

export interface PerformanceMarkMeasureState {
  readonly afterPath: string
  readonly beforePath: string
  captured: boolean
}

export const create = (session: Session, measureId: string) => {
  const captureId = randomUUID()
  const beforePath = join(Root.root, '.vscode-heapsnapshots', `${measureId}-${captureId}-before.json`)
  const afterPath = join(Root.root, '.vscode-heapsnapshots', `${measureId}-${captureId}-after.json`)
  process.once('exit', () => {
    rmSync(beforePath, { force: true })
    rmSync(afterPath, { force: true })
  })
  return [session, { afterPath, beforePath, captured: false } satisfies PerformanceMarkMeasureState] as const
}

export const start = async (session: Session, state: PerformanceMarkMeasureState): Promise<string> => {
  await HeapSnapshot.takeHeapSnapshot(session, state.beforePath)
  return state.beforePath
}

export const stop = async (session: Session, state: PerformanceMarkMeasureState): Promise<string> => {
  await HeapSnapshot.takeHeapSnapshot(session, state.afterPath)
  state.captured = true
  return state.afterPath
}

export const compare = async (beforePath: string, afterPath: string, metric: PerformanceMarkMetric): Promise<Dynamic> => {
  try {
    await using rpc = await launchHeapSnapshotWorker()
    const result = await rpc.invoke('HeapSnapshot.comparePerformanceMarks', beforePath, afterPath)
    return {
      after: result.after[metric],
      before: result.before[metric],
    }
  } finally {
    await Promise.all([rm(beforePath, { force: true }), rm(afterPath, { force: true })])
  }
}

export const releaseResources = async (_session: Session, state: PerformanceMarkMeasureState): Promise<void> => {
  if (!state.captured) {
    await Promise.all([rm(state.beforePath, { force: true }), rm(state.afterPath, { force: true })])
  }
}
