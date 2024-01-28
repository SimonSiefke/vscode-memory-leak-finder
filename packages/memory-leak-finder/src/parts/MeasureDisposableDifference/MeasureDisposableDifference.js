import * as CompareDisposablesWithLocationDifference from '../CompareDisposablesWithLocationDifference/CompareDisposablesWithLocationDifference.js'
import * as GetDisposablesWithLocation from '../GetDisposablesWithLocation/GetDisposablesWithLocation.js'
import * as IsLeakDisposables from '../IsLeakDisposables/IsLeakDisposables.js'
import * as MeasureId from '../MeasureId/MeasureId.js'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.js'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.js'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.js'

export const id = MeasureId.DisposableDifference

export const create = (session) => {
  const objectGroup = ObjectGroupId.create()
  const scriptHandler = ScriptHandler.create()
  return [session, objectGroup, scriptHandler]
}

export const start = async (session, objectGroup, scriptHandler) => {
  await scriptHandler.start(session)
  return GetDisposablesWithLocation.getDisposablesWithLocation(session, objectGroup, scriptHandler.scriptMap)
}

export const stop = async (session, objectGroup, scriptHandler) => {
  await scriptHandler.stop(session)
  const result = await GetDisposablesWithLocation.getDisposablesWithLocation(session, objectGroup, scriptHandler.scriptMap)
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
  return {
    result,
    scriptMap: scriptHandler.scriptMap,
  }
}

export const compare = CompareDisposablesWithLocationDifference.compareDisposablesWithLocationDifference

export const isLeak = IsLeakDisposables.isLeakDisposables
