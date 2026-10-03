import { randomUUID } from 'node:crypto'
import { rm } from 'node:fs/promises'
import { rmSync } from 'node:fs'
import { join } from 'node:path'
import type { IScriptHandler } from '../IScriptHandler/IScriptHandler.ts'
import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolHeapProfiler } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import * as ForceGarbageCollection from '../ForceGarbageCollection/ForceGarbageCollection.ts'
import * as HeapSnapshot from '../HeapSnapshot/HeapSnapshot.ts'
import { launchHeapSnapshotWorker } from '../LaunchHeapSnapshotWorker/LaunchHeapSnapshotWorker.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as Root from '../Root/Root.ts'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.ts'
import * as TargetId from '../TargetId/TargetId.ts'

interface MemoryCityState {
  captured: boolean
  readonly heapSnapshotPath: string
  readonly scriptHandler: IScriptHandler
  tracking: boolean
}

interface MemoryCityAfter {
  readonly heapSnapshotPath: string
  readonly scriptMap: Readonly<Record<string, { readonly sourceMapUrl?: string; readonly url?: string }>>
}

export const id = MeasureId.MemoryCity
export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]

export const create = (session: Session) => {
  const heapSnapshotPath = join(Root.root, '.vscode-heapsnapshots', `memory-city-${randomUUID()}.json`)
  process.once('exit', () => rmSync(heapSnapshotPath, { force: true }))
  const state: MemoryCityState = {
    captured: false,
    heapSnapshotPath,
    scriptHandler: ScriptHandler.create(),
    tracking: false,
  }
  return [session, state]
}

export const start = async (session: Session, state: MemoryCityState) => {
  await state.scriptHandler.start(session)
  await DevtoolsProtocolHeapProfiler.enable(session)
  await DevtoolsProtocolHeapProfiler.startTrackingHeapObjects(session, { trackAllocations: true })
  state.tracking = true
  return { started: true }
}

export const stop = async (session: Session, state: MemoryCityState): Promise<MemoryCityAfter> => {
  await ForceGarbageCollection.forceGarbageCollection(session)
  await HeapSnapshot.takeTrackingHeapSnapshot(session, state.heapSnapshotPath)
  state.tracking = false
  await state.scriptHandler.stop(session)
  state.captured = true
  return {
    heapSnapshotPath: state.heapSnapshotPath,
    scriptMap: state.scriptHandler.scriptMap,
  }
}

export const compare = async (_before: unknown, after: MemoryCityAfter) => {
  try {
    await using rpc = await launchHeapSnapshotWorker()
    return await rpc.invoke('HeapSnapshot.createMemoryCitySnapshot', after.heapSnapshotPath, after.scriptMap)
  } finally {
    await rm(after.heapSnapshotPath, { force: true })
  }
}

export const isLeak = () => false

export const releaseResources = async (session: Session, state: MemoryCityState): Promise<void> => {
  state.tracking = false
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
