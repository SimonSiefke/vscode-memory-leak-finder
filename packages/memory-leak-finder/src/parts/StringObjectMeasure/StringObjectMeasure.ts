import { randomUUID } from 'node:crypto'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import type { Session } from '../Session/Session.ts'
import * as HeapSnapshot from '../HeapSnapshot/HeapSnapshot.ts'
import { launchHeapSnapshotWorker } from '../LaunchHeapSnapshotWorker/LaunchHeapSnapshotWorker.ts'
import * as Root from '../Root/Root.ts'

export interface StringObjectMeasureState {
  readonly afterPath: string
  readonly beforePath: string
  captured: boolean
}

export type StringObjectMetric = 'bytes' | 'count'

export const create = (session: Session, measureId: string) => {
  const captureId = randomUUID()
  const beforePath = join(Root.root, '.vscode-heapsnapshots', `${measureId}-${captureId}-before.json`)
  const afterPath = join(Root.root, '.vscode-heapsnapshots', `${measureId}-${captureId}-after.json`)
  return [session, { afterPath, beforePath, captured: false } satisfies StringObjectMeasureState] as const
}

const removeSnapshots = async (beforePath: string, afterPath: string): Promise<void> => {
  await Promise.all([rm(beforePath, { force: true }), rm(afterPath, { force: true })])
}

const capture = async (session: Session, state: StringObjectMeasureState, path: string): Promise<string> => {
  try {
    await HeapSnapshot.takeHeapSnapshot(session, path)
    return path
  } catch (error) {
    await removeSnapshots(state.beforePath, state.afterPath)
    throw error
  }
}

export const start = (session: Session, state: StringObjectMeasureState): Promise<string> => capture(session, state, state.beforePath)
export const stop = async (session: Session, state: StringObjectMeasureState): Promise<string> => {
  await capture(session, state, state.afterPath)
  state.captured = true
  return state.afterPath
}

export const compare = async (
  beforePath: string,
  afterPath: string,
  metric: StringObjectMetric,
): Promise<{ after: number; before: number }> => {
  try {
    await using rpc = await launchHeapSnapshotWorker()
    const result = await rpc.invoke('HeapSnapshot.compareStringObjects', beforePath, afterPath)
    return {
      after: result.after[metric],
      before: result.before[metric],
    }
  } finally {
    await removeSnapshots(beforePath, afterPath)
  }
}

export const releaseResources = async (_session: Session, state: StringObjectMeasureState): Promise<void> => {
  // The runner releases the session after stop, before comparing the snapshots.
  if (!state.captured) {
    await removeSnapshots(state.beforePath, state.afterPath)
  }
}
