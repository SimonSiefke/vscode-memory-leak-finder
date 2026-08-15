import { randomUUID } from 'node:crypto'
import { rmSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import type { Session } from '../Session/Session.ts'
import type { Dynamic, MeasureContext } from '../Types/Types.ts'
import { DevtoolsProtocolHeapProfiler } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as ForceGarbageCollection from '../ForceGarbageCollection/ForceGarbageCollection.ts'
import * as GetPendingPromiseHeapIds from '../GetPendingPromiseHeapIds/GetPendingPromiseHeapIds.ts'
import * as HeapSnapshot from '../HeapSnapshot/HeapSnapshot.ts'
import { launchHeapSnapshotWorker } from '../LaunchHeapSnapshotWorker/LaunchHeapSnapshotWorker.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as Root from '../Root/Root.ts'
import * as TargetId from '../TargetId/TargetId.ts'

interface PendingPromiseState {
  captured: boolean
  readonly heapSnapshotPath: string
}

interface PendingPromiseAfter {
  readonly heapObjectIds: readonly string[]
  readonly heapSnapshotPath: string
}

export const id = MeasureId.PendingPromisesWithRetainers
export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]

export const create = (session: Session) => {
  const heapSnapshotPath = join(Root.root, '.vscode-heapsnapshots', `pending-promises-with-retainers-${randomUUID()}.json`)
  process.once('exit', () => rmSync(heapSnapshotPath, { force: true }))
  return [session, { captured: false, heapSnapshotPath } satisfies PendingPromiseState] as const
}

const getPendingIds = async (session: Session): Promise<readonly string[]> => {
  await ForceGarbageCollection.forceGarbageCollection(session)
  return GetPendingPromiseHeapIds.getPendingPromiseHeapIds(session, ObjectGroupId.create())
}

export const start = async (session: Session): Promise<readonly string[]> => {
  await DevtoolsProtocolHeapProfiler.enable(session)
  return getPendingIds(session)
}

export const stop = async (session: Session, state: PendingPromiseState): Promise<PendingPromiseAfter> => {
  const heapObjectIds = await getPendingIds(session)
  await ForceGarbageCollection.forceGarbageCollection(session)
  await HeapSnapshot.takeHeapSnapshot(session, state.heapSnapshotPath)
  state.captured = true
  return { heapObjectIds, heapSnapshotPath: state.heapSnapshotPath }
}

export const compare = async (beforeIds: readonly string[], after: PendingPromiseAfter, context: MeasureContext): Promise<Dynamic> => {
  const minimumCount = typeof context.runs === 'number' && Number.isFinite(context.runs) ? Math.max(1, context.runs) : 1
  try {
    await using rpc = await launchHeapSnapshotWorker()
    return await rpc.invoke(
      'HeapSnapshot.createPendingPromiseRetainers',
      after.heapSnapshotPath,
      beforeIds,
      after.heapObjectIds,
      minimumCount,
    )
  } finally {
    await rm(after.heapSnapshotPath, { force: true })
  }
}

export const isLeak = (result: Dynamic): boolean => result?.isLeak === true

export const releaseResources = async (session: Session, state: PendingPromiseState): Promise<void> => {
  try {
    await DevtoolsProtocolHeapProfiler.disable(session, {})
  } catch {
    // The inspected process may already be gone.
  }
  if (!state.captured) {
    await rm(state.heapSnapshotPath, { force: true })
  }
}
