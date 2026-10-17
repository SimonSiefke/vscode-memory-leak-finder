import type { Session } from '../Session/Session.ts'
import * as HeapSnapshot from '../HeapSnapshot/HeapSnapshot.ts'
import * as IsLeakCount from '../IsLeakCount/IsLeakCount.ts'
import { launchHeapSnapshotWorker } from '../LaunchHeapSnapshotWorker/LaunchHeapSnapshotWorker.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as TargetId from '../TargetId/TargetId.ts'
import { rm } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import * as Root from '../Root/Root.ts'

export const id = MeasureId.DeadClosureVariables
export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]
export interface DeadClosureVariablesState {
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
    } satisfies DeadClosureVariablesState,
  ] as const
}

export const start = async (session: Session, state: DeadClosureVariablesState): Promise<string> => {
  await HeapSnapshot.takeHeapSnapshot(session, state.beforePath, { exposeInternals: true, captureNumericValues: true })
  return state.beforePath
}

export const stop = async (session: Session, state: DeadClosureVariablesState): Promise<string> => {
  await HeapSnapshot.takeHeapSnapshot(session, state.afterPath, { exposeInternals: true, captureNumericValues: true })
  state.captured = true
  return state.afterPath
}

export const compare = async (beforePath: string, afterPath: string) => {
  try {
    await using rpc = await launchHeapSnapshotWorker()
    return await rpc.invoke('HeapSnapshot.compareDeadClosureVariables', beforePath, afterPath)
  } finally {
    await Promise.all([rm(beforePath, { force: true }), rm(afterPath, { force: true })])
  }
}

export const isLeak = IsLeakCount.isLeakCount
export const releaseResources = async (_session: Session, state: DeadClosureVariablesState): Promise<void> => {
  // stop() releases protocol resources before compare() consumes the snapshots.
  if (!state.captured) {
    await Promise.all([rm(state.beforePath, { force: true }), rm(state.afterPath, { force: true })])
  }
}
