import { randomUUID } from 'node:crypto'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import type { Session } from '../Session/Session.ts'
import * as HeapSnapshot from '../HeapSnapshot/HeapSnapshot.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import { launchHeapSnapshotWorker } from '../LaunchHeapSnapshotWorker/LaunchHeapSnapshotWorker.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as Root from '../Root/Root.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.DuplicateObjectGraphs
export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]

export interface DuplicateObjectGraphsState {
  captured: boolean
  readonly beforePath: string
  readonly afterPath: string
}

export const create = (session: Session) => {
  const captureId = randomUUID()
  return [
    session,
    {
      captured: false,
      beforePath: join(Root.root, '.vscode-heapsnapshots', `${id}-${captureId}-before.json`),
      afterPath: join(Root.root, '.vscode-heapsnapshots', `${id}-${captureId}-after.json`),
    } satisfies DuplicateObjectGraphsState,
  ] as const
}

export const start = async (session: Session, state: DuplicateObjectGraphsState): Promise<string> => {
  await HeapSnapshot.takeHeapSnapshot(session, state.beforePath, { captureNumericValues: true })
  return state.beforePath
}

export const stop = async (session: Session, state: DuplicateObjectGraphsState): Promise<string> => {
  await HeapSnapshot.takeHeapSnapshot(session, state.afterPath, { captureNumericValues: true })
  state.captured = true
  return state.afterPath
}

export const compare = async (beforePath: string, afterPath: string) => {
  try {
    await using rpc = await launchHeapSnapshotWorker()
    return await rpc.invoke('HeapSnapshot.compareDuplicateObjectGraphs', beforePath, afterPath)
  } finally {
    await Promise.all([rm(beforePath, { force: true }), rm(afterPath, { force: true })])
  }
}

export const isLeak = IsLeakCount.isLeakCount
export const releaseResources = async (_session: Session, state: DuplicateObjectGraphsState): Promise<void> => {
  if (!state.captured) await Promise.all([rm(state.beforePath, { force: true }), rm(state.afterPath, { force: true })])
}
