import * as CompareDisposablesWithLocation from '../CompareDisposablesWithLocation/CompareDisposablesWithLocation.ts'
import * as GetDisposedDisposablesWithLocation from '../GetDisposedDisposablesWithLocation/GetDisposedDisposablesWithLocation.ts'
import type { IScriptHandler } from '../IScriptHandler/IScriptHandler.ts'
import * as IsLeakDisposables from '../IsLeakDisposables/IsLeakDisposables.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.ts'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.DisposedDisposables

export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  const scriptHandler = ScriptHandler.create()
  return [session, objectGroup, scriptHandler]
}

export const start = async (session, objectGroup, scriptHandler: IScriptHandler) => {
  await scriptHandler.start(session)
  return GetDisposedDisposablesWithLocation.getDisposedDisposablesWithLocation(session, objectGroup, scriptHandler.scriptMap)
}

export const stop = async (session, objectGroup, scriptHandler: IScriptHandler) => {
  await scriptHandler.stop(session)
  const result = await GetDisposedDisposablesWithLocation.getDisposedDisposablesWithLocation(session, objectGroup, scriptHandler.scriptMap)
  return {
    result,
    scriptMap: scriptHandler.scriptMap,
  }
}

export const releaseResources = async (session, objectGroup) => {
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
}

export const compare = CompareDisposablesWithLocation.compareDisposablesWithLocation

export const isLeak = IsLeakDisposables.isLeakDisposables
