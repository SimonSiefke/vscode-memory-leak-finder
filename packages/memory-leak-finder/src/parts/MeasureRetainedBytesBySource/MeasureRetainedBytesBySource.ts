import { randomUUID } from 'node:crypto'
import { rmSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import type { IScriptHandler } from '../IScriptHandler/IScriptHandler.ts'
import type { Session } from '../Session/Session.ts'
import type { Dynamic, MeasureContext } from '../Types/Types.ts'
import { DevtoolsProtocolHeapProfiler } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as ForceGarbageCollection from '../ForceGarbageCollection/ForceGarbageCollection.ts'
import * as HeapSnapshot from '../HeapSnapshot/HeapSnapshot.ts'
import { launchHeapSnapshotWorker } from '../LaunchHeapSnapshotWorker/LaunchHeapSnapshotWorker.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as Root from '../Root/Root.ts'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.ts'
import * as TargetId from '../TargetId/TargetId.ts'

interface RetainedBytesBySourceState {
  captured: boolean
  readonly heapSnapshotPath: string
  readonly scriptHandler: IScriptHandler
}

interface RetainedBytesBySourceAfter {
  readonly heapSnapshotPath: string
  readonly scriptMap: IScriptHandler['scriptMap']
}

export const id = MeasureId.RetainedBytesBySource
export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]

export const create = (session: Session) => {
  const heapSnapshotPath = join(Root.root, '.vscode-heapsnapshots', `retained-bytes-by-source-${randomUUID()}.json`)
  process.once('exit', () => rmSync(heapSnapshotPath, { force: true }))
  return [
    session,
    { captured: false, heapSnapshotPath, scriptHandler: ScriptHandler.create() } satisfies RetainedBytesBySourceState,
  ] as const
}

export const start = async (session: Session, state: RetainedBytesBySourceState): Promise<{ started: true }> => {
  await state.scriptHandler.start(session)
  await DevtoolsProtocolHeapProfiler.enable(session)
  await DevtoolsProtocolHeapProfiler.startTrackingHeapObjects(session, { trackAllocations: true })
  return { started: true }
}

export const stop = async (session: Session, state: RetainedBytesBySourceState): Promise<RetainedBytesBySourceAfter> => {
  await ForceGarbageCollection.forceGarbageCollection(session)
  await HeapSnapshot.takeTrackingHeapSnapshot(session, state.heapSnapshotPath)
  await state.scriptHandler.stop(session)
  state.captured = true
  return { heapSnapshotPath: state.heapSnapshotPath, scriptMap: state.scriptHandler.scriptMap }
}

export const compare = async (_before: unknown, after: RetainedBytesBySourceAfter, context: MeasureContext): Promise<Dynamic> => {
  const minimumCount = typeof context.runs === 'number' && Number.isFinite(context.runs) ? Math.max(1, context.runs) : 1
  try {
    await using rpc = await launchHeapSnapshotWorker()
    return await rpc.invoke('HeapSnapshot.createRetainedBytesBySource', after.heapSnapshotPath, after.scriptMap, minimumCount)
  } finally {
    await rm(after.heapSnapshotPath, { force: true })
  }
}

export const isLeak = (result: Dynamic): boolean => result?.isLeak === true

export const releaseResources = async (session: Session, state: RetainedBytesBySourceState): Promise<void> => {
  try {
    await DevtoolsProtocolHeapProfiler.disable(session, {})
  } catch {
    // The inspected process may already be gone.
  }
  try {
    await state.scriptHandler.stop(session)
  } catch {
    // Debugger may already be disabled or disconnected.
  }
  if (!state.captured) {
    await rm(state.heapSnapshotPath, { force: true })
  }
}
