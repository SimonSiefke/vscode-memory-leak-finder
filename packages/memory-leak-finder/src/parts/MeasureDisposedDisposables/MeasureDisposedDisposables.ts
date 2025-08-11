import * as CompareDisposablesWithLocation from '../CompareDisposablesWithLocation/CompareDisposablesWithLocation.js'
import * as GetDisposedDisposablesWithLocation from '../GetDisposedDisposablesWithLocation/GetDisposedDisposablesWithLocation.js'
import * as IsLeakDisposables from '../IsLeakDisposables/IsLeakDisposables.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.js'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.js'

export const id = MeasureId.DisposedDisposables

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  const scriptHandler = ScriptHandler.create()
  return [session, objectGroup, scriptHandler]
}

export const start = async (session, objectGroup, scriptHandler) => {
  await scriptHandler.start(session)
  return GetDisposedDisposablesWithLocation.getDisposedDisposablesWithLocation(session, objectGroup, scriptHandler.scriptMap)
}

export const stop = async (session, objectGroup, scriptHandler) => {
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
