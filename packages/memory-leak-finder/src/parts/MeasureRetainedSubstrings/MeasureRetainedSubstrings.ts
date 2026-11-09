import { randomUUID } from 'node:crypto'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import type { Session } from '../Session/Session.ts'
import type { Dynamic } from '../Types/Types.ts'
import * as HeapSnapshot from '../HeapSnapshot/HeapSnapshot.ts'
import { launchHeapSnapshotWorker } from '../LaunchHeapSnapshotWorker/LaunchHeapSnapshotWorker.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as Root from '../Root/Root.ts'
import * as TargetId from '../TargetId/TargetId.ts'

interface RetainedSubstringsState {
  readonly afterPath: string
  readonly beforePath: string
  captured: boolean
}

export const id = MeasureId.RetainedSubstrings
export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]

export const create = (session: Session) => {
  const captureId = randomUUID()
  const beforePath = join(Root.root, '.vscode-heapsnapshots', `retained-substrings-${captureId}-before.json`)
  const afterPath = join(Root.root, '.vscode-heapsnapshots', `retained-substrings-${captureId}-after.json`)
  return [session, { afterPath, beforePath, captured: false } satisfies RetainedSubstringsState] as const
}

export const start = async (session: Session, state: RetainedSubstringsState): Promise<string> => {
  await HeapSnapshot.takeHeapSnapshot(session, state.beforePath)
  return state.beforePath
}

export const stop = async (session: Session, state: RetainedSubstringsState): Promise<string> => {
  await HeapSnapshot.takeHeapSnapshot(session, state.afterPath)
  state.captured = true
  return state.afterPath
}

export const compare = async (beforePath: string, afterPath: string): Promise<Dynamic> => {
  try {
    await using rpc = await launchHeapSnapshotWorker()
    return await rpc.invoke('HeapSnapshot.compareRetainedSubstrings', beforePath, afterPath)
  } finally {
    await Promise.all([rm(beforePath, { force: true }), rm(afterPath, { force: true })])
  }
}

export const isLeak = (result: Dynamic): boolean => result?.isLeak === true

export const releaseResources = async (_session: Session, state: RetainedSubstringsState): Promise<void> => {
  if (!state.captured) {
    await Promise.all([rm(state.beforePath, { force: true }), rm(state.afterPath, { force: true })])
  }
}
