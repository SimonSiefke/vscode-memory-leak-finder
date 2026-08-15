import { randomUUID } from 'node:crypto'
import { rmSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import type { Session } from '../Session/Session.ts'
import type { Dynamic, MeasureContext } from '../Types/Types.ts'
import * as HeapSnapshot from '../HeapSnapshot/HeapSnapshot.ts'
import { launchHeapSnapshotWorker } from '../LaunchHeapSnapshotWorker/LaunchHeapSnapshotWorker.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as Root from '../Root/Root.ts'
import * as TargetId from '../TargetId/TargetId.ts'

interface ObjectShapeDifferenceState {
  readonly afterPath: string
  readonly beforePath: string
  captured: boolean
}

export const id = MeasureId.ObjectShapeDifference
export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]

export const create = (session: Session) => {
  const captureId = randomUUID()
  const beforePath = join(Root.root, '.vscode-heapsnapshots', `object-shape-difference-${captureId}-before.json`)
  const afterPath = join(Root.root, '.vscode-heapsnapshots', `object-shape-difference-${captureId}-after.json`)
  process.once('exit', () => {
    rmSync(beforePath, { force: true })
    rmSync(afterPath, { force: true })
  })
  return [session, { afterPath, beforePath, captured: false } satisfies ObjectShapeDifferenceState] as const
}

export const start = async (session: Session, state: ObjectShapeDifferenceState): Promise<string> => {
  await HeapSnapshot.takeHeapSnapshot(session, state.beforePath)
  return state.beforePath
}

export const stop = async (session: Session, state: ObjectShapeDifferenceState): Promise<string> => {
  await HeapSnapshot.takeHeapSnapshot(session, state.afterPath)
  state.captured = true
  return state.afterPath
}

export const compare = async (beforePath: string, afterPath: string, context: MeasureContext): Promise<Dynamic> => {
  const minimumCount = typeof context.runs === 'number' && Number.isFinite(context.runs) ? Math.max(1, context.runs) : 1
  try {
    await using rpc = await launchHeapSnapshotWorker()
    return await rpc.invoke('HeapSnapshot.compareObjectShapeDifference', beforePath, afterPath, minimumCount)
  } finally {
    await Promise.all([rm(beforePath, { force: true }), rm(afterPath, { force: true })])
  }
}

export const isLeak = (result: Dynamic): boolean => result?.isLeak === true

export const releaseResources = async (_session: Session, state: ObjectShapeDifferenceState): Promise<void> => {
  if (!state.captured) {
    await Promise.all([rm(state.beforePath, { force: true }), rm(state.afterPath, { force: true })])
  }
}
