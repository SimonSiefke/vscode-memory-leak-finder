import type { IScriptHandler } from '../IScriptHandler/IScriptHandler.ts'
import type { Session } from '../Session/Session.ts'
import * as CompareTrackedFunctions from '../CompareTrackedFunctions/CompareTrackedFunctions.ts'
import * as GetTrackedFunctions from '../GetTrackedFunctions/GetTrackedFunctions.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.TrackedFunctions

export const targets = [TargetId.Browser]

export const create = (session: Session) => {
  const scriptHandler = ScriptHandler.create()
  return [session, scriptHandler]
}

export const start = async (session: Session, scriptHandler: IScriptHandler) => {
  await scriptHandler.start(session)
  return GetTrackedFunctions.getTrackedFunctions(session)
}

export const stop = async (session: Session, scriptHandler: IScriptHandler) => {
  const trackedFunctions = await GetTrackedFunctions.getTrackedFunctions(session)
  await scriptHandler.stop(session)
  return {
    trackedFunctions,
    scriptMap: scriptHandler.scriptMap,
  }
}

export const compare = CompareTrackedFunctions.compareTrackedFunctions
