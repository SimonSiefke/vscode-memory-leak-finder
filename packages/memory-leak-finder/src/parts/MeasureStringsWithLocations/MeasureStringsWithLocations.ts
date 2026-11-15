import { rm } from 'node:fs/promises'
import type { IScriptHandler } from '../IScriptHandler/IScriptHandler.ts'
import type { Session } from '../Session/Session.ts'
import type { ScriptMap } from '../Types/Types.ts'
import { launchHeapSnapshotWorker } from '../LaunchHeapSnapshotWorker/LaunchHeapSnapshotWorker.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import { resolveStringsWithLocations, type LeakedStringWithLocation } from '../ResolveStringsWithLocations/ResolveStringsWithLocations.ts'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.ts'
import * as StringObjectMeasure from '../StringObjectMeasure/StringObjectMeasure.ts'
import * as TargetId from '../TargetId/TargetId.ts'

interface StringsWithLocationsState extends StringObjectMeasure.StringObjectMeasureState {
  readonly scriptHandler: IScriptHandler
  scriptStarted: boolean
}

interface Capture {
  readonly heapSnapshotPath: string
  readonly scriptMap: ScriptMap
}

export const id = MeasureId.StringsWithLocations
export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]

export const create = (session: Session) => {
  const [, state] = StringObjectMeasure.create(session, id)
  return [session, { ...state, scriptHandler: ScriptHandler.create(), scriptStarted: false } satisfies StringsWithLocationsState] as const
}

export const releaseResources = async (session: Session, state: StringsWithLocationsState): Promise<void> => {
  try {
    if (state.scriptStarted) {
      state.scriptStarted = false
      await state.scriptHandler.stop(session)
    }
  } catch (error) {
    state.captured = false
    throw error
  } finally {
    await StringObjectMeasure.releaseResources(session, state)
  }
}

export const start = async (session: Session, state: StringsWithLocationsState): Promise<Capture> => {
  try {
    state.scriptStarted = true
    await state.scriptHandler.start(session)
    const heapSnapshotPath = await StringObjectMeasure.start(session, state)
    return { heapSnapshotPath, scriptMap: { ...state.scriptHandler.scriptMap } }
  } catch (error) {
    await releaseResources(session, state)
    throw error
  }
}

export const stop = async (session: Session, state: StringsWithLocationsState): Promise<Capture> => {
  const heapSnapshotPath = await StringObjectMeasure.stop(session, state)
  return { heapSnapshotPath, scriptMap: { ...state.scriptHandler.scriptMap } }
}

export const compare = async (before: Capture, after: Capture): Promise<readonly LeakedStringWithLocation[]> => {
  try {
    await using rpc = await launchHeapSnapshotWorker()
    const result = await rpc.invoke(
      'HeapSnapshot.compareStringsWithLocations',
      before.heapSnapshotPath,
      after.heapSnapshotPath,
      before.scriptMap,
      after.scriptMap,
    )
    return await resolveStringsWithLocations(result.before, result.after, before.scriptMap, after.scriptMap)
  } finally {
    await Promise.all([rm(before.heapSnapshotPath, { force: true }), rm(after.heapSnapshotPath, { force: true })])
  }
}

export const isLeak = (result: readonly LeakedStringWithLocation[]): boolean => result.length > 0
