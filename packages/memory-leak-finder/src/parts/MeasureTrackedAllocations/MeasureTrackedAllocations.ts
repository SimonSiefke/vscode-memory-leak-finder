import type { IScriptHandler } from '../IScriptHandler/IScriptHandler.ts'
import type { Session } from '../Session/Session.ts'
import * as CompareTrackedAllocations from '../CompareTrackedAllocations/CompareTrackedAllocations.ts'
import * as ForceGarbageCollection from '../ForceGarbageCollection/ForceGarbageCollection.ts'
import * as GetTrackedAllocations from '../GetTrackedAllocations/GetTrackedAllocations.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.TrackedAllocations

export const targets = [TargetId.Browser]

export const create = (session: Session) => {
  const scriptHandler = ScriptHandler.create()
  return [session, scriptHandler]
}

export const start = async (session: Session, scriptHandler: IScriptHandler) => {
  await ForceGarbageCollection.forceGarbageCollection(session)
  await GetTrackedAllocations.resetTrackedAllocations(session)
  await scriptHandler.start(session)
  return GetTrackedAllocations.getTrackedAllocations(session)
}

export const stop = async (session: Session, scriptHandler: IScriptHandler) => {
  await ForceGarbageCollection.forceGarbageCollection(session)
  const trackedAllocations = await GetTrackedAllocations.getTrackedAllocations(session)
  await scriptHandler.stop(session)
  return {
    scriptMap: scriptHandler.scriptMap,
    trackedAllocations,
  }
}

export const compare = CompareTrackedAllocations.compareTrackedAllocations
