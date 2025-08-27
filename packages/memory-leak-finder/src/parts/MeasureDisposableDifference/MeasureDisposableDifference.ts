import * as CompareDisposablesWithLocationDifference from '../CompareDisposablesWithLocationDifference/CompareDisposablesWithLocationDifference.ts'
import * as GetDisposablesWithLocation from '../GetDisposablesWithLocation/GetDisposablesWithLocation.ts'
import * as IsLeakDisposables from '../IsLeakDisposables/IsLeakDisposables.ts'
import * as MeasureId from '../MeasureId/MeasureId.ts'
import * as ObjectGroupId from '../ObjectGroupId/ObjectGroupId.ts'
import * as ReleaseObjectGroup from '../ReleaseObjectGroup/ReleaseObjectGroup.ts'
import * as ScriptHandler from '../ScriptHandler/ScriptHandler.ts'
import * as TargetId from '../TargetId/TargetId.ts'

export const id = MeasureId.DisposableDifference

export const targets = [TargetId.Browser, TargetId.Node, TargetId.Worker]

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
  return {
    result,
    scriptMap: scriptHandler.scriptMap,
  }
}

export const releaseResources = async (session, objectGroup) => {
  await ReleaseObjectGroup.releaseObjectGroup(session, objectGroup)
}

export const compare = CompareDisposablesWithLocationDifference.compareDisposablesWithLocationDifference

export const isLeak = IsLeakDisposables.isLeakDisposables

export const summary = (leaked) => {
  return {
    disposableDifference: leaked.length,
  }
}
